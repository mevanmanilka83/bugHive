"use client"

import * as React from "react"
import { IconExternalLink } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils-client"

/** Normalized shape from API; extend source union when adding Reddit/Stack Overflow */
export type RelatedBugSource = "github_issue" | "bughive_public" | "bughive_cluster"

export type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
}

const sourceLabels: Record<RelatedBugSource, string> = {
  github_issue: "GitHub Issue",
  bughive_public: "BugHive",
  bughive_cluster: "BugHive Cluster",
}

interface RelatedBugsPanelProps {
  bugId: string
  className?: string
  context?: "public" | "cluster"
}

function renderSnippet(snippet: string) {
  if (!snippet) return null
  return (
    <p className="text-xs text-muted-foreground line-clamp-3">
      {snippet}
    </p>
  )
}

export function RelatedBugsPanel({
  bugId,
  className,
  context = "public",
}: RelatedBugsPanelProps) {
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
    <div className="flex flex-col gap-1">
      <div className="rounded-md border border-border/30 bg-muted/20 px-1.5 py-1 shadow-none">
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <h3 className="text-xs font-medium uppercase tracking-wider text-foreground/70">
            Related Bugs
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchRelated}
            disabled={loading}
            className="h-5 w-5 p-0 hover:bg-muted -mt-0.5"
            title="Retry loading related bugs"
          >
            <span className="text-xs">↻</span>
          </Button>
        </div>

      {loading ? (
        <div className="space-y-1" role="status" aria-label="Loading related bugs">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-0.5">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-2 w-3/4" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground leading-tight">
          No related bugs found yet.
        </p>
      ) : (
        <ul className="space-y-0.5" role="list" aria-label="Related bugs">
          {items.slice(0, 5).map((item) => (
            <li key={item.id}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-foreground hover:text-primary hover:underline line-clamp-2 block leading-tight"
                title={item.title}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}
