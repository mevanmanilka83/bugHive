"use client"

import * as React from "react"
import Link from "next/link"
import { Radar, ThumbsUp, MessageSquare } from "lucide-react"
import { cn } from "@/lib"

export type PotentialDuplicateItem = {
  id: string
  title: string
  url: string
  snippet: string
  relevanceScore: number
  relevanceReasons: string[]
}

const DEBOUNCE_MS = 450
const MIN_TEXT_LENGTH = 4

type Props = {
  title: string
  description: string
  tags?: string[]
  className?: string
}

export function DuplicateRadar({ title, description, tags = [], className }: Props) {
  const [duplicates, setDuplicates] = React.useState<PotentialDuplicateItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const plainDescription =
    typeof description === "string"
      ? description.replace(/<[^>]*>/g, "").trim()
      : ""

  const hasEnoughText =
    title.trim().length >= MIN_TEXT_LENGTH ||
    plainDescription.length >= MIN_TEXT_LENGTH

  React.useEffect(() => {
    if (!hasEnoughText) {
      setDuplicates([])
      return
    }

    debounceRef.current = setTimeout(() => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      fetch("/api/bugs/potential-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: plainDescription,
          tags: Array.isArray(tags) ? tags : [],
        }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) return { duplicates: [] }
          return res.json()
        })
        .then((data) => {
          const list = Array.isArray(data?.duplicates) ? data.duplicates : []
          setDuplicates(list)
        })
        .catch(() => setDuplicates([]))
        .finally(() => {
          setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [title, plainDescription, hasEnoughText, tags])

  if (!hasEnoughText) return null

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 min-w-0",
        className
      )}
      aria-label="Potential duplicates"
    >
      <div className="flex items-center gap-2 border-b border-amber-500/20 px-3 py-2">
        <span
          className="flex size-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400"
          aria-hidden
        >
          <Radar
            className="size-4 animate-pulse"
            style={{ animationDuration: "2s" }}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Duplicate radar
          </p>
          <p className="text-[11px] text-muted-foreground">
            Potential duplicates as you type
          </p>
        </div>
      </div>

      <div className="max-h-[280px] min-h-0 overflow-y-auto p-2">
        {loading && duplicates.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
            Scanning…
          </div>
        ) : duplicates.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No similar reports found yet. Keep typing to check.
          </p>
        ) : (
          <ul className="space-y-2">
            {duplicates.map((item) => {
              const pct = Math.round(item.relevanceScore * 100)
              return (
                <li key={item.id} className="rounded-md border border-border/60 bg-card/50 p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      {pct}% match
                    </span>
                    <Link
                      href={item.url}
                      className="text-xs font-medium text-primary underline-offset-2 hover:underline truncate max-w-[70%]"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.title || "Untitled"}
                    </Link>
                  </div>
                  {item.snippet && (
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {item.snippet}
                    </p>
                  )}
                  <Link
                    href={item.url}
                    className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ThumbsUp className="size-3" />
                    <MessageSquare className="size-3" />
                    Add a &quot;Me Too&quot; upvote and comment there →
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
