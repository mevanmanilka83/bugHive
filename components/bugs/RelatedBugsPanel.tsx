"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils-client"

export type RelatedBugSource = "github_issue" | "github_repo"

export type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
}

const sourceLabels: Record<RelatedBugSource, string> = {
  github_issue: "GitHub Issue",
  github_repo: "GitHub Repository",
}

interface RelatedBugsPanelProps {
  bugId: string
  className?: string
}

function renderSnippet(snippet: string) {
  if (!snippet) return null
  return (
    <p className="text-xs text-muted-foreground line-clamp-3">
      {snippet}
    </p>
  )
}

export function RelatedBugsPanel({ bugId, className }: RelatedBugsPanelProps) {
  const [items, setItems] = React.useState<RelatedBugItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null)
  const controllerRef = React.useRef<AbortController | null>(null)

  const formatLastChecked = React.useCallback((timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }, [])

  const fetchRelated = React.useCallback(async () => {
    if (!bugId) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bugs/${bugId}/related`, {
        signal: controller.signal,
        cache: "no-store",
      })
      if (!res.ok) {
        setItems([])
        setError("Unable to load related bugs right now.")
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.results) ? data.results : []
      setItems(list)
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setItems([])
        setError("Unable to load related bugs right now.")
      }
    } finally {
      setLoading(false)
      setLastChecked(new Date())
    }
  }, [bugId])

  React.useEffect(() => {
    fetchRelated()
    return () => controllerRef.current?.abort()
  }, [fetchRelated])

  return (
    <aside
      className={cn(
        "md:sticky md:top-6 h-fit rounded-lg border bg-card p-4 md:p-5",
        className
      )}
      aria-live="polite"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Related Bugs</h2>
          <p className="text-xs text-muted-foreground">From GitHub community reports</p>
          {lastChecked && (
            <p className="text-[11px] text-muted-foreground">
              Last checked {formatLastChecked(lastChecked)}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchRelated}
          disabled={loading}
        >
          Retry
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
          <div className="h-4 w-full rounded bg-muted animate-pulse" />
          <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>No related GitHub issues or repositories found yet.</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs">Try again in a few minutes or refine the bug details.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border bg-background p-3">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 line-clamp-2"
                >
                  {item.title}
                </a>
                <Badge variant="outline" className="text-[10px]">
                  {sourceLabels[item.source] ?? "GitHub"}
                </Badge>
              </div>
              <div className="mt-2">{renderSnippet(item.snippet)}</div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
