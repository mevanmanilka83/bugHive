"use client"

import { isHtmlContent } from "@/lib"

type Props = {
  content: string
  className?: string
  fallback?: string
}

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
