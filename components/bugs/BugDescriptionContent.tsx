"use client"

import { isHtmlContent } from "@/lib/utils-client"

type Props = {
  content: string
  className?: string
  fallback?: string
}

/**
 * Renders bug description as HTML (from rich editor) or plain text.
 * Use for detail view and review step.
 */
export function BugDescriptionContent({ content, className = "", fallback = "—" }: Props) {
  const text = (content || "").trim()
  if (!text) return <span className={className}>{fallback}</span>

  if (isHtmlContent(text)) {
    return (
      <div
        className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    )
  }

  return <div className={`whitespace-pre-wrap ${className}`}>{text}</div>
}
