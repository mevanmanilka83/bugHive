/**
 * Form Data Utilities
 *
 * Non-Zod helpers for form/data processing.
 * For Zod validation, use @/lib/schemas/zod.
 */

const EMPTY_RICH_TEXT_MARKUP = new Set([
  "",
  "<p></p>",
  "<p><br></p>",
  "<p> </p>",
])

function stripDangerousHtml(html: string): string {
  let sanitized = html

  sanitized = sanitized.replace(/<(script|style|iframe|object|embed|svg|math)[^>]*>[\s\S]*?<\/\1>/gi, "")
  sanitized = sanitized.replace(/<(link|meta|base|form|input|button|textarea|select)[^>]*>/gi, "")
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
  sanitized = sanitized.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*"\s*javascript:[^"]*"/gi, ' $1="#"')
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*'\s*javascript:[^']*'/gi, " $1='#'")
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*"\s*data:[^"]*"/gi, ' $1="#"')
  sanitized = sanitized.replace(/\s(href|src)\s*=\s*'\s*data:[^']*'/gi, " $1='#'")

  return sanitized.trim()
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

export function normalizeClusterDescription(
  value: unknown,
  maxTextLength: number = 2000
): { success: true; value: string | null } | { success: false; error: string } {
  if (value === null || value === undefined) {
    return { success: true, value: null }
  }

  const asString = String(value).trim()
  if (EMPTY_RICH_TEXT_MARKUP.has(asString)) {
    return { success: true, value: null }
  }

  const sanitized = stripDangerousHtml(asString)
  if (!sanitized) {
    return { success: true, value: null }
  }

  const text = stripHtmlTags(sanitized)
  if (text.length > maxTextLength) {
    return {
      success: false,
      error: `Description must be less than ${maxTextLength} characters`,
    }
  }

  return { success: true, value: sanitized }
}
