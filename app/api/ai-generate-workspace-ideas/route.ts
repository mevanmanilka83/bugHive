import { NextRequest, NextResponse } from "next/server"
import {
  getSupabaseAdmin,
  getAuthenticatedUserId,
  generateChatCompletion,
  WORKSPACE_VIEW_TYPE_CATALOG,
  normalizeWorkspaceViewType,
  type WorkspaceViewType,
} from "@/lib"

export const runtime = "nodejs"

type Body = { bugIds: string[] }

type WorkspaceIdeaSuggestion = {
  kind: "idea" | "solution" | "fix"
  title: string
  content: string
  viewType: WorkspaceViewType
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as Partial<Body>
    const bugIds = Array.isArray(body.bugIds) ? body.bugIds.filter((id) => typeof id === "string") : []

    if (bugIds.length === 0) {
      return NextResponse.json(
        { error: "At least one bug ID is required" },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseAdmin()
    const { data: bugs } = await (supabase as any)
      .from("bugs")
      .select(
        "id, title, description, steps_to_reproduce, expected_behavior, actual_behavior, priority, status, created_at, visibility, cluster_id, upvotes_count"
      )
      .in("id", bugIds)

    if (!bugs?.length) {
      return NextResponse.json(
        { error: "No bugs found" },
        { status: 404 }
      )
    }

    const bugSummaries = bugs.map(
      (b: {
        title: string
        description?: string
        steps_to_reproduce?: string
        expected_behavior?: string
        actual_behavior?: string
        priority?: string
        status?: string
        created_at?: string
        visibility?: string
        cluster_id?: string | null
        upvotes_count?: number
      }) => {
        const parts = [
          `Title: ${b.title}`,
          b.description && `Description: ${b.description}`,
          b.steps_to_reproduce && `Steps: ${b.steps_to_reproduce}`,
          b.expected_behavior && `Expected: ${b.expected_behavior}`,
          b.actual_behavior && `Actual: ${b.actual_behavior}`,
          b.priority && `Priority: ${b.priority}`,
          b.status && `Status: ${b.status}`,
          b.created_at && `Created: ${b.created_at}`,
          b.visibility && `Visibility: ${b.visibility}`,
          b.cluster_id && `Cluster: ${b.cluster_id}`,
          typeof b.upvotes_count === "number" && `Upvotes: ${b.upvotes_count}`,
        ].filter(Boolean)
        return parts.join("\n")
      }
    )

    const supportedViewsText = WORKSPACE_VIEW_TYPE_CATALOG.map((view) => {
      const notes = view.notes?.length ? ` Notes: ${view.notes.join(" ")}` : ""
      return [
        `- ${view.value} (${view.label})`,
        `  Show: ${view.whatToShow.join("; ")}`,
        `  Data: ${view.dataSources.join("; ")}`,
        `  Usage: ${view.usage}`,
        notes && `  ${notes.trim()}`,
      ]
        .filter(Boolean)
        .join("\n")
    }).join("\n")

    const systemPrompt = `You are a technical support assistant for BugHive. Given one or more bug reports from a relationship graph, suggest 2-4 potential ideas, solutions, or fixes that could address these bugs.
Every suggestion must also recommend the best supported BugHive view type for exploring or presenting the idea.
Return a JSON object with this exact structure:
{
  "suggestions": [
    { "kind": "idea" | "solution" | "fix", "title": "Brief title (5-12 words)", "content": "2-5 sentences with actionable details, implementation hints, or approach", "viewType": "timeline" | "bar" | "line" | "stacked-area" | "heatmap" | "network" | "scatter" | "donut" | "kanban" | "hierarchy" },
    ...
  ]
}
- "idea": exploratory notes, hypotheses, or investigation directions
- "solution": concrete fix or workaround
- "fix": implementation-focused solution
Choose a view type that matches the suggestion and BugHive's current data model. If a suggestion depends on lifecycle timestamps not explicitly present, prefer views that work with available data today unless the suggestion is specifically about adding that missing tracking.

Supported BugHive workspace views:
${supportedViewsText}

Be practical and specific. Only return valid JSON.`

    const userPrompt = `Analyze these bug(s) and suggest ideas/solutions:\n\n${bugSummaries.join("\n\n---\n\n")}`

    const { text: raw } = await generateChatCompletion({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 800,
      temperature: 0.6,
    })
    if (!raw) {
      return NextResponse.json(
        { error: "No suggestions returned from AI" },
        { status: 500 }
      )
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    const jsonStr = jsonMatch ? jsonMatch[0] : raw
    let parsed: { suggestions?: Array<{ kind?: string; title?: string; content?: string; viewType?: string }> }
    try {
      parsed = JSON.parse(jsonStr)
    } catch (parseErr) {
      console.error("AI JSON parse error:", parseErr, "Raw:", raw.slice(0, 500))
      return NextResponse.json(
        { error: "Invalid AI response format", details: "Could not parse AI response as JSON" },
        { status: 500 }
      )
    }

    const validKinds = ["idea", "solution", "fix"]
    const suggestions: WorkspaceIdeaSuggestion[] = (parsed.suggestions ?? [])
      .filter((s) => s.title && s.content)
      .map((s) => ({
        kind: (validKinds.includes(s.kind ?? "") ? s.kind : "idea") as WorkspaceIdeaSuggestion["kind"],
        title: String(s.title).trim(),
        content: String(s.content).trim(),
        viewType: normalizeWorkspaceViewType(s.viewType),
      }))
      .slice(0, 4)

    return NextResponse.json({
      suggestions,
      supportedViewTypes: WORKSPACE_VIEW_TYPE_CATALOG,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    console.error("AI generate workspace ideas error:", msg, error)

    const isQuotaExceeded =
      msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("exceeded")

    if (isQuotaExceeded) {
      return NextResponse.json(
        {
          error: "AI service quota exceeded",
          details:
            "You've exceeded your current API quota. Please check your plan and billing details, or try again later.",
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      {
        error: "Failed to generate ideas",
        details: msg,
      },
      { status: 500 }
    )
  }
}
