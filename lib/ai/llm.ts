
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

export function getLlmErrorHttpStatus(error: unknown): number | undefined {
  if (error && typeof error === "object") {
    const e = error as Record<string, unknown>
    const s = e.status ?? e.statusCode
    if (typeof s === "number" && s >= 400) return s
    if (typeof s === "string" && /^\d+$/.test(s)) {
      const n = Number(s)
      if (n >= 400) return n
    }
    const cause = e.cause
    if (cause && typeof cause === "object") {
      const cs = (cause as Record<string, unknown>).status
      if (typeof cs === "number" && cs >= 400) return cs
    }
  }
  return undefined
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

const GEMINI_429_MAX_RETRIES = 3
const GEMINI_429_BASE_DELAY_MS = 1500

function isRateLimitError(err: unknown): boolean {
  const status = getLlmErrorHttpStatus(err)
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase()
  return (
    status === 429 ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests")
  )
}

async function generateWithGemini(
  options: GenerateOptions,
  failFast = false
): Promise<GenerateResult> {
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

  const maxAttempts = failFast ? 1 : GEMINI_429_MAX_RETRIES

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents,
        config,
      })

      const text = response.text?.trim()
      if (!text) throw new Error("No response from Gemini")
      return { text }
    } catch (err) {
      if (isRateLimitError(err) && attempt < maxAttempts - 1) {
        const delay = GEMINI_429_BASE_DELAY_MS * 2 ** attempt
        await sleep(delay)
        continue
      }
      throw err
    }
  }

  throw new Error("Gemini request failed")
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
    model: "gpt-4o-mini",
    messages: openaiMessages,
    max_tokens: maxTokens,
    temperature,
  })

  const text = completion.choices[0]?.message?.content?.trim()
  if (!text) throw new Error("No response from OpenAI")
  return { text }
}

export async function generateChatCompletion(options: GenerateOptions): Promise<GenerateResult> {
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  if (useGemini()) {
    try {
      // Fail fast if OpenAI can take over — no point retrying Gemini for seconds
      return await generateWithGemini(options, hasOpenAI)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      const status = getLlmErrorHttpStatus(error)

      const looksLikeQuotaError =
        status === 429 ||
        status === 503 ||
        message.toLowerCase().includes("quota") ||
        message.toLowerCase().includes("rate limit") ||
        message.toLowerCase().includes("resource_exhausted") ||
        message.toLowerCase().includes("too many requests")

      if (looksLikeQuotaError && hasOpenAI) {
        console.error("Gemini quota exceeded, falling back to OpenAI")
        return generateWithOpenAI(options)
      }

      if (looksLikeQuotaError && !hasOpenAI) {
        throw new Error(
          "429 quota: Gemini API rate limit or quota exceeded. Try again in a minute."
        )
      }

      throw error
    }
  }

  if (hasOpenAI) {
    return generateWithOpenAI(options)
  }

  throw new Error("No AI provider configured. Set GEMINI_API_KEY or OPENAI_API_KEY.")
}
