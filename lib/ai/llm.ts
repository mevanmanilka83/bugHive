/**
 * LLM provider abstraction.
 * Uses Gemini when GEMINI_API_KEY is set, otherwise OpenAI.
 */

import { GoogleGenAI } from "@google/genai"
import OpenAI from "openai"

export type ChatMessage = { role: "user" | "assistant"; content: string }

export type GenerateOptions = {
  systemPrompt?: string
  messages: ChatMessage[]
  maxTokens?: number
  temperature?: number
}

export type GenerateResult = { text: string }

function useGemini(): boolean {
  return !!process.env.GEMINI_API_KEY
}

async function generateWithGemini(options: GenerateOptions): Promise<GenerateResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
  const { systemPrompt, messages, maxTokens = 500, temperature = 0.7 } = options

  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []
  for (const msg of messages) {
    const role = msg.role === "assistant" ? "model" : "user"
    contents.push({ role, parts: [{ text: msg.content }] })
  }

  const config: Record<string, unknown> = {
    maxOutputTokens: maxTokens,
    temperature,
  }
  if (systemPrompt) config.systemInstruction = systemPrompt

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config,
  })

  const text = response.text?.trim()
  if (!text) throw new Error("No response from Gemini")
  return { text }
}

async function generateWithOpenAI(options: GenerateOptions): Promise<GenerateResult> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  const { systemPrompt, messages, maxTokens = 500, temperature = 0.7 } = options

  const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
  if (systemPrompt) {
    openaiMessages.push({ role: "system", content: systemPrompt })
  }
  for (const msg of messages) {
    openaiMessages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: openaiMessages,
    max_tokens: maxTokens,
    temperature,
  })

  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error("No response from OpenAI")
  return { text }
}

/**
 * Generate a chat completion using the configured provider (Gemini or OpenAI).
 */
export async function generateChatCompletion(options: GenerateOptions): Promise<GenerateResult> {
  if (useGemini()) {
    try {
      return await generateWithGemini(options)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const status = (error as any)?.status

      const looksLikeQuotaError =
        status === 429 ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("rate limit") ||
        message.toLowerCase().includes("resource_exhausted")

      if (looksLikeQuotaError && process.env.OPENAI_API_KEY) {
        console.error("Gemini quota exceeded, falling back to OpenAI:", error)
        return generateWithOpenAI(options)
      }

      throw error
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(options)
  }

  throw new Error("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.")
}
