"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils-client"
import { RelatedBugsPanelSkeleton } from "@/components/skeletons/RelatedBugsPanelSkeleton"

/** Normalized shape from API */
export type RelatedBugSource =
  | "github_issue"
  | "github_repo"
  | "bugzilla_bug"
  | "bughive_public"
  | "bughive_cluster"
  | "stack_overflow_question"

export type RelatedBugItem = {
  id: string
  title: string
  url: string
  source: RelatedBugSource
  snippet: string
}

const GITHUB_SOURCES: RelatedBugSource[] = ["github_issue", "github_repo"]
const STACK_SOURCES: RelatedBugSource[] = ["stack_overflow_question"]
const BUGZILLA_SOURCES: RelatedBugSource[] = ["bugzilla_bug"]
const BUGHIVE_SOURCES: RelatedBugSource[] = ["bughive_public", "bughive_cluster"]

function isGitHub(item: RelatedBugItem) {
  return GITHUB_SOURCES.includes(item.source)
}

function isStackOverflow(item: RelatedBugItem) {
  return STACK_SOURCES.includes(item.source)
}

function isBugzilla(item: RelatedBugItem) {
  return BUGZILLA_SOURCES.includes(item.source)
}

function isBugHive(item: RelatedBugItem) {
  return BUGHIVE_SOURCES.includes(item.source)
}

interface RelatedBugsPanelProps {
  bugId: string
  className?: string
  context?: "public" | "cluster"
}

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
  const stackItems = React.useMemo(() => items.filter(isStackOverflow), [items])
  const bugzillaItems = React.useMemo(() => items.filter(isBugzilla), [items])
  const bughiveItems = React.useMemo(() => items.filter(isBugHive), [items])

  const linkBaseClass = cn(
    "block w-full min-w-0 rounded-md px-3 py-2 text-left text-sm leading-normal",
    "transition-colors duration-150",
    "hover:bg-muted/60 hover:text-primary",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "break-words whitespace-normal"
  )

  return (
    <div className={cn("flex flex-col min-h-0", className)}>
      <div className="rounded-xl border border-border/60 bg-card shadow-sm flex flex-col w-full overflow-hidden min-h-0 h-[360px]">
        {/* Header with clear refresh affordance */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border/50 shrink-0 bg-muted/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Related bugs
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchRelated}
            disabled={loading}
            className="h-7 gap-1.5 px-2 text-muted-foreground hover:text-primary hover:bg-muted/60 rounded-md transition-colors"
            title="Refresh related bugs"
            aria-label="Refresh related bugs"
          >
            <RotateCw
              className={cn("size-3.5 shrink-0", loading && "animate-spin")}
            />
            <span className="text-[11px] font-medium hidden sm:inline">
              Refresh
            </span>
          </Button>
        </div>

        {/* Scrollable content with restrained max height */}
        <div
          className="flex-1 min-h-0 overflow-y-scroll overscroll-contain px-5 pt-4 pb-6 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent"
          style={{ scrollbarGutter: "stable" }}
        >
          {loading ? (
            <RelatedBugsPanelSkeleton count={5} />
          ) : error ? (
            <p className="text-sm text-muted-foreground py-2 text-center italic">
              {error}
            </p>
          ) : githubItems.length === 0 &&
            stackItems.length === 0 &&
            bugzillaItems.length === 0 &&
            bughiveItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
              <p className="text-sm font-medium text-foreground/80">No related bugs found</p>
              <p className="text-xs text-muted-foreground mt-1.5">We couldn&apos;t find similar issues in your linked sources.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* GitHub issues */}
              {githubItems.length > 0 && (
                <section aria-label="GitHub issues">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 pb-2 mb-2 border-b border-border/40 flex items-center gap-2">
                    GitHub issues
                  </h4>
                  <ul className="space-y-2" role="list">
                    {githubItems.map((item) => (
                      <li key={`gh-${item.id}`}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={linkBaseClass}
                          title={item.title}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Stack Overflow questions */}
              {stackItems.length > 0 && (
                <section aria-label="Stack Overflow questions">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 pb-2 mb-2 border-b border-border/40 flex items-center gap-2">
                    Stack Overflow questions
                  </h4>
                  <ul className="space-y-2" role="list">
                    {stackItems.map((item) => (
                      <li key={`so-${item.id}`}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={linkBaseClass}
                          title={item.title}
                        >
                          <span className="mr-1.5 inline-block size-1.5 rounded-full bg-orange-400/80 align-middle mb-0.5 shrink-0" aria-hidden="true" />
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Bugzilla bugs */}
              {bugzillaItems.length > 0 && (
                <section aria-label="Bugzilla bugs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 pb-2 mb-2 border-b border-border/40 flex items-center gap-2">
                    Bugzilla bugs
                  </h4>
                  <ul className="space-y-2" role="list">
                    {bugzillaItems.map((item) => (
                      <li key={`bz-${item.id}`}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={linkBaseClass}
                          title={item.title}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* BugHive bugs */}
              {bughiveItems.length > 0 && (
                <section aria-label="BugHive bugs">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/90 pb-2 mb-2 border-b border-border/40 flex items-center gap-2">
                    BugHive bugs
                  </h4>
                  <ul className="space-y-2" role="list">
                    {bughiveItems.map((item) => (
                      <li key={`bh-${item.id}`}>
                        <Link
                          href={`/bugs/${item.id}`}
                          className={linkBaseClass}
                          title={item.title}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.title}
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
