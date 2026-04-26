import { NextRequest, NextResponse } from "next/server"
import { generateChatCompletion } from "@/lib"

export const runtime = "nodejs"

type RefineBody = {
  text: string
  instructions?: string
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      )
    }

    const body = (await req.json()) as Partial<RefineBody>
    const text = (body.text ?? "").toString()
    const extra = (body.instructions ?? "").toString()

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      )
    }

    const systemPrompt =
      "You are a focused rewriting engine for a bug-tracking app. " +
      "Given user-provided text, you ONLY return a refined version of that text. " +
      "Do not add greetings, explanations, or references to BugHive. " +
      "Preserve the original meaning but improve clarity, conciseness, and structure."

    const userPrompt = extra
      ? `Instructions: ${extra}\n\nText:\n${text}`
      : `Rewrite this text to be clearer and more concise, preserving meaning:\n\n${text}`

    const { text: refined } = await generateChatCompletion({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 500,
      temperature: 0.4,
    })

    if (!refined) {
      return NextResponse.json(
        { error: "No refinement returned from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({ refined })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to refine text",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

