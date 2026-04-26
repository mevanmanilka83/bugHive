import { NextRequest, NextResponse } from "next/server"
import { generateChatCompletion } from "@/lib"

export const runtime = "nodejs"

type SuggestBody = {
  bugTitle: string
  bugDescription?: string
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      )
    }
    const body = (await req.json()) as Partial<SuggestBody>
    const bugTitle = (body.bugTitle ?? "").toString().trim()
    const bugDescription = (body.bugDescription ?? "").toString().trim()

    if (!bugTitle) {
      return NextResponse.json(
        { error: "Bug title is required" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a technical support assistant for BugHive, a bug tracking platform.
Given a bug report (title and optionally description), suggest 1-2 concise solution ideas.
Return a JSON object with this exact structure:
{
  "suggestions": [
    { "title": "Brief solution title (5-10 words)", "description": "2-4 sentences with implementation steps or approach" },
    ...
  ]
}
Be practical and specific. Focus on actionable fixes, workarounds, or root-cause solutions.
Do not add greetings, explanations, or markdown. Only return valid JSON.`

    const userPrompt = bugDescription
      ? `Bug: ${bugTitle}\n\nDescription:\n${bugDescription}\n\nSuggest solution ideas.`
      : `Bug: ${bugTitle}\n\nSuggest solution ideas.`

    const { text: raw } = await generateChatCompletion({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 600,
      temperature: 0.5,
    })
    if (!raw) {
      return NextResponse.json(
        { error: "No suggestions returned from AI" },
        { status: 500 }
      )
    }

    let parsed: { suggestions?: Array<{ title?: string; description?: string }> }
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    try {
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
    } catch {
      return NextResponse.json(
        { error: "Invalid AI response format" },
        { status: 500 }
      )
    }

    const suggestions = (parsed.suggestions ?? [])
      .filter((s) => s.title && s.description)
      .map((s) => ({
        title: String(s.title).trim(),
        description: String(s.description).trim(),
      }))
      .slice(0, 2)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error("AI suggest solutions error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
