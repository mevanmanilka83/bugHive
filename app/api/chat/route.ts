import { NextRequest, NextResponse } from "next/server"
import { generateChatCompletion } from "@/lib"

export const runtime = "nodejs"

const SYSTEM_PROMPT =
  "You are a helpful AI assistant for BugHive, a collaborative bug tracking platform. You help users understand how to report bugs, use clusters, and view related bugs from GitHub and Stack Overflow. Be friendly, concise, and helpful. When users ask about errors or bugs in their code, you can give general debugging tips but remind them they can create a bug report in BugHive."

export async function POST(req: NextRequest) {
  let messages: Array<{ role: "user" | "assistant"; content: string }> = []

  try {
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY." },
        { status: 500 }
      )
    }

    const body = await req.json()
    const rawMessages = body.messages || []

    if (!rawMessages || !Array.isArray(rawMessages)) {
      return NextResponse.json(
        { error: "Messages are required and must be an array" },
        { status: 400 }
      )
    }

    messages = rawMessages
      .filter((m: { role?: string; content?: string }) => m?.role && m?.content)
      .map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content),
      }))

    const { text: response } = await generateChatCompletion({
      systemPrompt: SYSTEM_PROMPT,
      messages,
      maxTokens: 500,
      temperature: 0.7,
    })

    return NextResponse.json({ response })
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("429") ||
        error.message.includes("quota")
      ) {
        const lastUserMessage = messages?.findLast(
          (msg) => msg.role === "user"
        )?.content
        const messageContent =
          typeof lastUserMessage === "string" ? lastUserMessage : ""

        let fallbackResponse =
          "I'm currently experiencing technical difficulties with my AI service. Here are some ways to get help with BugHive:\n\n"

        if (
          /bug|report|issue|error|crash/i.test(messageContent) &&
          !/related|github|stack/i.test(messageContent)
        ) {
          fallbackResponse =
            "In BugHive you can create and manage bug reports. Each bug has a title, description, steps to reproduce, expected vs actual behavior, and optional attachments. You can make bugs public or private, and group them into clusters. Use the bug detail page to see related issues from GitHub and Stack Overflow."
        } else if (
          /cluster|group|team/i.test(messageContent)
        ) {
          fallbackResponse =
            "Clusters in BugHive let you group related bugs and collaborate with others. You can create a cluster, invite members, and manage join requests. Cluster bugs appear together and you can see related bugs from external sources such as GitHub and Stack Overflow on each bug's page."
        } else if (
          /related|github|stack|external/i.test(messageContent)
        ) {
          fallbackResponse =
            "Related bugs are shown on each bug's detail page. BugHive fetches similar issues from GitHub Issues and Stack Overflow (when configured). The Related Bugs panel on the right shows these in sections. Use the Refresh button to reload them."
        } else if (
          /report|submit|create|add/i.test(messageContent)
        ) {
          fallbackResponse =
            "To report a bug in BugHive: go to the home page or your dashboard, click Create Bug or similar, fill in title, description, steps to reproduce, expected and actual behavior, and optionally add attachments. You can set visibility (public/private) and add tags."
        } else if (
          /vote|solution|answer/i.test(messageContent)
        ) {
          fallbackResponse =
            "BugHive supports solutions and voting. On a bug page you can propose solutions and vote on others' solutions. This helps surface the best fixes and workarounds for each bug."
        } else if (
          /profile|account|settings|notification/i.test(messageContent)
        ) {
          fallbackResponse =
            "Your profile and account settings let you manage your BugHive identity, notifications, and preferences. Check the header or sidebar for your profile and settings links."
        } else if (
          /search|find|browse/i.test(messageContent)
        ) {
          fallbackResponse =
            "You can browse public bugs on the home page and use filters or search if available. From a bug page you can see related bugs from GitHub and Stack Overflow in the Related Bugs panel."
        } else {
          fallbackResponse =
            "I'm here to help with BugHive! Ask me about reporting bugs, clusters, related bugs (GitHub, Stack Overflow), solutions, voting, or how to get started."
        }

        return NextResponse.json({ response: fallbackResponse })
      }

      if (error.message.includes("401") || error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
