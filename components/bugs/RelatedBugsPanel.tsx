"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils-client"

/** Normalized shape from API */
export type RelatedBugSource =
  | "github_issue"
  | "github_repo"
  | "bughive_public"
  | "bughive_cluster"

export type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
}

const GITHUB_SOURCES: RelatedBugSource[] = ["github_issue", "github_repo"]
const BUGHIVE_SOURCES: RelatedBugSource[] = ["bughive_public", "bughive_cluster"]

function isGitHub(item: RelatedBugItem) {
  return GITHUB_SOURCES.includes(item.source)
}

function isBugHive(item: RelatedBugItem) {
  return BUGHIVE_SOURCES.includes(item.source)
}

/** Truncate long URL-like titles for display; full text remains in title attribute */
function displayTitle(title: string, maxChars: number = 72) {
  const t = title.trim()
  if (t.length <= maxChars) return t
  return `${t.slice(0, maxChars).trim()}\u2026`
}

interface RelatedBugsPanelProps {
  bugId: string
  className?: string
  context?: "public" | "cluster"
}

const CARD_MAX_H = "max-h-[min(24rem,60vh)]"

export function RelatedBugsPanel({
  bugId,
  className,
  context = "public",
}: RelatedBugsPanelProps) {
  const [items, setItems] = React.useState<RelatedBugItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const controllerRef = React.useRef<AbortController | null>(null)

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
        setError("Unable to load related bugs.")
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.results) ? data.results : []
      setItems(list)
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setItems([])
        setError("Unable to load related bugs.")
      }
    } finally {
      setLoading(false)
    }
  }, [bugId])

  React.useEffect(() => {
    fetchRelated()
    return () => controllerRef.current?.abort()
  }, [fetchRelated])

  const githubItems = React.useMemo(() => items.filter(isGitHub), [items])
  const bughiveItems = React.useMemo(() => items.filter(isBugHive), [items])

  const linkBaseClass = cn(
    "block w-full min-w-0 rounded-md px-2.5 py-2.5 text-left text-sm leading-snug",
    "transition-colors duration-150",
    "hover:bg-muted/60 hover:text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "line-clamp-2 break-words"
  )

  return (
    <div className={cn("flex flex-col", className)}>
      <div className={cn("rounded-lg border border-border/50 bg-card shadow-sm flex flex-col min-h-0 w-full", CARD_MAX_H)}>
        {/* Header with clear refresh affordance */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 shrink-0">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/90">
            Related bugs
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchRelated}
            disabled={loading}
            className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md"
            title="Refresh related bugs"
            aria-label="Refresh related bugs"
          >
            <RotateCw
              className={cn("size-4 shrink-0", loading && "animate-spin")}
            />
            <span className="text-xs font-medium hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading related bugs">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-muted-foreground py-2">{error}</p>
          ) : githubItems.length === 0 && bughiveItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">No related bugs found.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {/* GitHub issues – strong section hierarchy */}
              {githubItems.length > 0 && (
                <section aria-label="GitHub issues" className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                    GitHub issues
                  </h4>
                  <ul className="space-y-1.5" role="list">
                    {githubItems.map((item) => (
                      <li key={`gh-${item.id}`}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={linkBaseClass}
                          title={item.title}
                        >
                          {displayTitle(item.title)}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* BugHive bugs – strong section hierarchy */}
              {bughiveItems.length > 0 && (
                <section aria-label="BugHive bugs" className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60">
                    BugHive bugs
                  </h4>
                  <ul className="space-y-1.5" role="list">
                    {bughiveItems.map((item) => (
                      <li key={`bh-${item.id}`}>
                        <Link
                          href={`/bugs/${item.id}`}
                          className={linkBaseClass}
                          title={item.title}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {displayTitle(item.title)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
