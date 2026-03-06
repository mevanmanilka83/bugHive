import { NextRequest, NextResponse } from "next/server"

const GEMINI_MODEL = "gemini-1.5-flash"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

type ValidateTagsRequest = {
  title: string
  description: string
  tags: string[]
}

type TagValidation = {
  tag: string
  valid: boolean
  reason?: string
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as ValidateTagsRequest | null
    if (!body || !Array.isArray(body.tags)) {
      return NextResponse.json(
        { error: "title, description, and tags[] are required" },
        { status: 400 }
      )
    }

    const title = String(body.title || "").slice(0, 300)
    const description = String(body.description || "").slice(0, 1500)
    const tags = body.tags
      .map((t) => String(t || "").trim())
      .filter((t) => t.length > 0)
      .slice(0, 20)

    if (tags.length === 0) {
      return NextResponse.json({ tags: [] as TagValidation[] })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // If Gemini is not configured, treat all tags as valid so UX still works.
      return NextResponse.json({
        tags: tags.map((tag) => ({ tag, valid: true })),
      })
    }

    const prompt = [
      "You are validating bug report tags.",
      "Given the bug TITLE and DESCRIPTION and a list of TAGS, decide for each tag if it is relevant to this specific bug.",
      "",
      "Rules:",
      "- A tag is VALID when it clearly matches the language, framework, technology, error type, or core topic of the bug.",
      "- A tag is INVALID when it is unrelated noise, offensive, or misleading for this bug.",
      "- Do not invent new tags.",
      "- Return ONLY valid JSON that is an array named 'tags', where each entry has:",
      '  { "tag": string, "valid": boolean, "reason": string }',
      "- The 'reason' should be short (max 80 characters).",
      "",
      `TITLE: ${title || "(none)"}`,
      `DESCRIPTION: ${description || "(none)"}`,
      `TAGS: ${tags.join(", ")}`,
    ].join("\n")

    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.0,
            maxOutputTokens: 400,
          },
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: "Gemini request failed" },
        { status: 502 }
      )
    }

    const data = await response.json()
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Gemini returned no text" },
        { status: 502 }
      )
    }

    let parsed: { tags?: TagValidation[] } | null = null
    try {
      parsed = JSON.parse(text)
    } catch {
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")
      if (start >= 0 && end > start) {
        try {
          parsed = JSON.parse(text.slice(start, end + 1))
        } catch {
          parsed = null
        }
      }
    }

    if (!parsed || !Array.isArray(parsed.tags)) {
      return NextResponse.json(
        { error: "Gemini response was not in expected format" },
        { status: 502 }
      )
    }

    const result: TagValidation[] = parsed.tags.map((entry) => ({
      tag: String(entry.tag || "").trim(),
      valid: Boolean(entry.valid),
      reason: entry.reason ? String(entry.reason).slice(0, 120) : undefined,
    }))

    return NextResponse.json({ tags: result })
  } catch (error) {
    console.error("Tag validation error:", error)
    return NextResponse.json(
      { error: "Failed to validate tags" },
      { status: 500 }
    )
  }
}

