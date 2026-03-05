import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

type RefineBody = {
  /** Plain text or HTML to refine */
  text: string
  /** Optional extra instructions for how to rewrite */
  instructions?: string
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 500,
      temperature: 0.4,
    })

    const refined = completion.choices[0]?.message?.content?.trim()

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

