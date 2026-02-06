"use client"

import * as React from "react"
import Link from "next/link"
import { BugDetailsForm } from "@/components/bugs/BugDetailsForm"
import { BugDescriptionContent } from "@/components/bugs/BugDescriptionContent"
import { SolutionDialog } from "@/components/bugs/solutions/BugReportSolutionDialog"
import { SolutionVoteButtons } from "@/components/bugs/solutions/SolutionVoteButtons"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { IconBulb, IconChevronDown, IconEye, IconShare3 } from "@tabler/icons-react"
import { stripHtml } from "@/lib/utils-client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu"

export interface BugDetailsViewProps {
  bug: {
    id: string
    title?: string
    description?: string
    status?: string
    priority?: string
    visibility?: string
    environment?: string
    expected_behavior?: string
    actual_behavior?: string
    steps_to_reproduce?: string
    tags?: string[] | null
    sources?: unknown
    attachments?: unknown
    created_by?: string
    [key: string]: unknown
  }
  userId?: string | null
}

type SolutionItem = {
  id: string
  title?: string | null
  description?: string | null
  created_at: string
  links?: string[] | null
  user?: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
}

type SolutionSortOption = "newest" | "active" | "votes" | "unanswered" | "most_viewed"

export function BugDetailsView({ bug, userId = null }: BugDetailsViewProps) {
  const isLoggedIn = Boolean(userId)
  const [currentBug, setCurrentBug] = React.useState(bug)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<SolutionItem[]>([])
  const [solutionsLoading, setSolutionsLoading] = React.useState(true)
  const [solutionSortBy, setSolutionSortBy] = React.useState<SolutionSortOption>("newest")

  const formatSolutionTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "answered just now"
    if (diffMins < 60) return `answered ${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `answered ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    if (diffDays < 7) return `answered ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    return `answered ${date.toLocaleDateString()}`
  }

  const fetchSolutions = React.useCallback(async () => {
    try {
      setSolutionsLoading(true)
      const res = await fetch(`/api/bugs/${currentBug.id}/solutions`)
      if (!res.ok) {
        setSolutions([])
        return
      }
      const data = await res.json()
      const list = Array.isArray(data?.solutions) ? data.solutions : []
      setSolutions(list)
    } finally {
      setSolutionsLoading(false)
    }
  }, [currentBug.id])

  React.useEffect(() => {
    fetchSolutions()
  }, [fetchSolutions])

  React.useEffect(() => {
    const onCreated = (e: Event) => {
      const ev = e as CustomEvent<{ bugId?: string }>
      if (ev.detail?.bugId === currentBug.id) fetchSolutions()
    }
    window.addEventListener("solution:created", onCreated)
    return () => window.removeEventListener("solution:created", onCreated)
  }, [currentBug.id, fetchSolutions])

  async function handleStatusChange(bugId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/bugs/${bugId}/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || err?.message || "Failed to update status")
      }
      setCurrentBug((prev) => ({ ...prev, status: newStatus }))
      toast.success("Status updated")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bug:updated", { detail: { bugId, status: newStatus } }))
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status")
    }
  }

  const isBugClosedOrResolved =
    String(currentBug.status || "").toLowerCase() === "closed" ||
    String(currentBug.status || "").toLowerCase() === "resolved"

  const solutionsForDialog = solutions.map((s) => ({
    id: s.id,
    title: s.title ?? null,
    content: s.description ?? "",
    links: s.links ?? null,
    created_at: s.created_at,
  }))

  const sortedSolutions = React.useMemo(() => {
    let working = [...solutions]

    if (solutionSortBy === "unanswered") {
      working = working.filter((solution) => {
        const upvotes = (solution as any).upvotes_count || 0
        const downvotes = (solution as any).downvotes_count || 0
        return upvotes + downvotes === 0
      })
    }

    switch (solutionSortBy) {
      case "newest":
      case "active":
        return working.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime()
          const dateB = new Date(b.created_at || 0).getTime()
          return dateB - dateA
        })
      case "votes":
        return working.sort((a, b) => {
          const scoreA = ((a as any).upvotes_count || 0) - ((a as any).downvotes_count || 0)
          const scoreB = ((b as any).upvotes_count || 0) - ((b as any).downvotes_count || 0)
          return scoreB - scoreA
        })
      case "most_viewed":
        return working.sort((a, b) => {
          const viewsA = (a as any).views || 0
          const viewsB = (b as any).views || 0
          return viewsB - viewsA
        })
      default:
        return working
    }
  }, [solutions, solutionSortBy])

  return (
    <>
      <div className="mt-2 mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {currentBug.title || "Bug details"}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Full report details and activity
        </p>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto text-sm rounded-lg border bg-card p-4 md:p-6 mb-6">
        <BugDetailsForm
          bug={currentBug}
          userId={userId ?? undefined}
          onStatusChange={handleStatusChange}
        />
      </div>

      <div className="mt-16 rounded-lg border bg-card">
        <div className="border-b px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <IconBulb className="size-5 text-muted-foreground" />
              Solutions
              {!solutionsLoading && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({solutions.length})
                </span>
              )}
            </h2>
            {!isBugClosedOrResolved &&
              (isLoggedIn ? (
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => setSolutionOpen(true)}
                >
                  Add solution
                </Button>
              ) : (
                <Button asChild className="rounded-full">
                  <Link href="/auth/signin">Add solution</Link>
                </Button>
              ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {solutions.length} solution{solutions.length === 1 ? "" : "s"}
            </p>
            <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1 py-1">
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  solutionSortBy === "newest"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSolutionSortBy("newest")}
              >
                Newest
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  solutionSortBy === "active"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSolutionSortBy("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  solutionSortBy === "votes"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSolutionSortBy("votes")}
              >
                Most voted
              </button>
              <button
                type="button"
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  solutionSortBy === "unanswered"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSolutionSortBy("unanswered")}
              >
                Unanswered
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer inline-flex items-center gap-1",
                      solutionSortBy === "most_viewed"
                        ? "bg-muted font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    More
                    <IconChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSolutionSortBy("most_viewed")}>
                    Most viewed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {solutionsLoading ? (
            <p className="text-sm text-muted-foreground">Loading solutions…</p>
          ) : solutions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No solutions yet. {isLoggedIn ? "Be the first to suggest a fix or workaround." : "Sign in to add a solution."}
            </p>
          ) : (
            <ul className="space-y-0">
              {sortedSolutions.map((solution) => {
                const upvotes = (solution as any).upvotes_count || 0
                const downvotes = (solution as any).downvotes_count || 0
                const score = upvotes - downvotes
                const views = (solution as any).views || 0 // Dynamic view count
                const tags = Array.isArray(currentBug.tags) ? currentBug.tags : []
                const plainDescription = stripHtml(solution.description || "")
                const descriptionSnippet =
                  plainDescription.length > 200
                    ? `${plainDescription.substring(0, 200)}...`
                    : plainDescription

                const authorName =
                  solution.user?.name ||
                  solution.user?.email?.split("@")[0] ||
                  "Anonymous"
                const authorImage = solution.user?.image || undefined
                const createdAt = solution.created_at ? new Date(solution.created_at) : new Date()

                return (
                  <li key={solution.id} id={`solution-${solution.id}`}>
                    <div className="flex gap-3 py-3 px-3 border-b hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center gap-1 min-w-[70px] flex-shrink-0">
                        <SolutionVoteButtons
                          solutionId={solution.id}
                          initialUpvotes={upvotes}
                          initialDownvotes={downvotes}
                          userId={userId || undefined}
                          compact
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/bugs/${currentBug.id}/solutions/${solution.id}`}
                          className="text-base font-semibold text-blue-600 hover:text-blue-800 mb-1.5 cursor-pointer line-clamp-2"
                        >
                          {solution.title || "Untitled solution"}
                        </Link>
                        {descriptionSnippet && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {descriptionSnippet}
                          </p>
                        )}

                        {tags.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 cursor-pointer border-0"
                              >
                                {tag}
                              </span>
                            ))}
                            {tags.length > 5 && (
                              <span className="text-xs text-muted-foreground">
                                +{tags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {Array.isArray(solution.links) && solution.links.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground break-all">
                            {solution.links.map((link, i) => (
                              <div key={i}>
                                <a
                                  href={String(link)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-primary hover:underline break-all"
                                >
                                  {String(link)}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {score > 0 ? `+${score}` : score}
                            </span>
                            <span>{score === 1 ? "vote" : "votes"}</span>
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                            <IconEye className="size-3" />
                            <span className="font-medium text-foreground">
                              {views}
                            </span>
                            <span>{views === 1 ? "view" : "views"}</span>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground hover:bg-muted/80"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (typeof window !== "undefined") {
                                const url = `${window.location.origin}/bugs/${currentBug.id}#solution-${solution.id}`
                                navigator.clipboard.writeText(url).then(
                                  () => toast("Solution link copied to clipboard"),
                                  () => toast.error("Failed to copy link")
                                )
                              }
                            }}
                          >
                            <IconShare3 className="size-3" />
                            <span className="font-medium text-foreground">Share</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-0.5 min-w-[120px] flex-shrink-0 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-5">
                            <AvatarImage src={authorImage} alt={authorName} />
                            <AvatarFallback className="text-[10px]">
                              {authorName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col items-start">
                            <span className="text-blue-600 text-xs">
                              {authorName}
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto text-muted-foreground text-right text-xs">
                          {formatSolutionTimeAgo(createdAt)}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <SolutionDialog
          open={solutionOpen}
          onOpenChange={setSolutionOpen}
          solutions={solutionsForDialog}
          solutionsLoading={solutionsLoading}
          isSubmitting={false}
          errors={{}}
          bugData={{
            id: currentBug.id,
            title: String(currentBug.title || "Untitled Bug"),
            description: currentBug.description as string | undefined,
            priority: currentBug.priority as string | undefined,
            status: currentBug.status as string | undefined,
          }}
        />
      )}
    </>
  )
}
