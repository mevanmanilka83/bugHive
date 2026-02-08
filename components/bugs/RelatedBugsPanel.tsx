"use client"

import * as React from "react"
import { IconExternalLink } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils-client"

/** Normalized shape from API; extend source union when adding Reddit/Stack Overflow */
export type RelatedBugSource = "github_issue"

export type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
}

const sourceLabels: Record<RelatedBugSource, string> = {
  github_issue: "GitHub Issue",
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
      setItems(list.filter((item: RelatedBugItem) => item.source === "github_issue"))
      setLastChecked(new Date())
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setItems([])
        setError("Unable to load related bugs right now.")
      }
    } finally {
      setLoading(false)
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
        <div className="space-y-3" role="status" aria-label="Loading related bugs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-md border bg-background p-3 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="space-y-2 text-sm text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <p>No related GitHub issues found yet.</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs">Use Retry to search again or refine the bug details</p>
        </div>
      ) : (
        <ul className="space-y-3" role="list" aria-label="Related GitHub issues">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border bg-background p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-800 line-clamp-2 inline-flex items-start gap-1 break-words"
                  title={`Open ${sourceLabels[item.source] ?? "link"} in new tab`}
                >
                  <span className="min-w-0 flex-1">{item.title}</span>
                  <IconExternalLink className="size-3.5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
                </a>
                <Badge variant="outline" className="text-[10px] shrink-0">
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
