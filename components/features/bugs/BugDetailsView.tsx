"use client"

import * as React from "react"
import Link from "next/link"
import { BugDetailsForm } from "@/components/features/bugs/BugDetailsForm"
import { BugDescriptionContent } from "@/components/features/bugs/BugDescriptionContent"
import { BugCommentForm } from "@/components/features/bugs/BugCommentForm"
import { SolutionDialog } from "@/components/features/bugs/solutions/BugReportSolutionDialog"
import { VoteButtons } from "@/components/features/bugs/VoteButtons"
import { SolutionVoteButtons } from "@/components/features/bugs/solutions/SolutionVoteButtons"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { IconBulb, IconChevronDown, IconEye, IconShare3, IconCheck, IconMessageCircle, IconTrash } from "@tabler/icons-react"
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog"
import { stripHtml, stripMarkdownBold, cn } from "@/lib"
import { getSupabaseBrowser } from "@/lib/realtime/supabaseBrowser"
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
    assigned_to?: string | null
    [key: string]: unknown
  }
  userId?: string | null
}

type SolutionItem = {
  id: string
  title?: string | null
  description?: string | null
  created_at: string
  updated_at?: string | null
  links?: string[] | null
  views?: number | null
  upvotes_count?: number | null
  downvotes_count?: number | null
  created_by?: string | null
  verified_at?: string | null
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
  const [assigneeDisplayName, setAssigneeDisplayName] = React.useState<string | null>(null)
  const [solutionOpen, setSolutionOpen] = React.useState(false)
  const [solutions, setSolutions] = React.useState<SolutionItem[]>([])
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null)
  const [solutionsLoading, setSolutionsLoading] = React.useState(true)
  const [solutionSortBy, setSolutionSortBy] = React.useState<SolutionSortOption>("newest")
  const [comments, setComments] = React.useState<Array<{
    id: string
    content: string
    created_at: string
    user_id?: string | null
    author_name?: string | null
    author_image?: string | null
    reactions?: Array<{ emoji: string; count: number }>
    my_reactions?: string[]
  }>>([])
  const [commentsLoading, setCommentsLoading] = React.useState(true)
  const [commentToDelete, setCommentToDelete] = React.useState<string | null>(null)
  const [isDeletingComment, setIsDeletingComment] = React.useState(false)

  const REACTION_EMOJIS = ["👍", "🎉", "👀", "❤️"] as const

  const formatCommentBody = React.useCallback((raw: string): string => {
    let text = stripMarkdownBold(stripHtml(raw))
    const meTooPrefix = "Me too – same issue."
    if (text.startsWith(meTooPrefix) && text.includes("Title:") && text.includes("Details:")) {
      const detailsIdx = text.indexOf("Details:")
      const afterDetails = text.slice(detailsIdx + "Details:".length).trim()
      text = afterDetails ? `${meTooPrefix} ${afterDetails}` : meTooPrefix
    }
    return text
  }, [])

  const copyToClipboard = React.useCallback(async (text: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
    } catch {
      // Fall back to legacy copy method below.
    }

    try {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.setAttribute("readonly", "")
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand("copy")
      document.body.removeChild(textarea)
      return success
    } catch {
      return false
    }
  }, [])

  const formatCommentDate = (iso: string): string => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ""
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

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

  const fetchComments = React.useCallback(async () => {
    try {
      setCommentsLoading(true)
      const res = await fetch(`/api/bugs/${currentBug.id}/comments`)
      if (!res.ok) {
        setComments([])
        return
      }
      const data = await res.json()
      setComments(Array.isArray(data?.comments) ? data.comments : [])
    } finally {
      setCommentsLoading(false)
    }
  }, [currentBug.id])

  React.useEffect(() => {
    fetchComments()
  }, [fetchComments])

  React.useEffect(() => {
    const onComment = (e: Event) => {
      const ev = e as CustomEvent<{ bugId?: string }>
      if (ev.detail?.bugId === currentBug.id) fetchComments()
    }
    window.addEventListener("bug:comment-added", onComment)
    return () => window.removeEventListener("bug:comment-added", onComment)
  }, [currentBug.id, fetchComments])

  // Realtime: live comments + reactions (war room)
  React.useEffect(() => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    const commentsChannel = supabase
      .channel(`bug-comments:${currentBug.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bug_comments", filter: `bug_id=eq.${currentBug.id}` },
        () => {
          // refresh to include reaction aggregates + my_reactions
          fetchComments()
        }
      )
      .subscribe()

    const reactionsChannel = supabase
      .channel(`comment-reactions:${currentBug.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_reactions" },
        () => {
          fetchComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(commentsChannel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [currentBug.id, fetchComments])

  const toggleReaction = React.useCallback(
    async (commentId: string, emoji: (typeof REACTION_EMOJIS)[number]) => {
      // Optimistic update: enforce 1 reaction per user per comment
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c
          const currentMine = new Set(c.my_reactions ?? [])
          const reactions = new Map((c.reactions ?? []).map((r) => [r.emoji, r.count]))

          const hadEmoji = currentMine.has(emoji)
          // Remove all my previous reactions from counts
          for (const e of currentMine) {
            const count = reactions.get(e) ?? 0
            if (count <= 1) reactions.delete(e)
            else reactions.set(e, count - 1)
          }

          if (hadEmoji) {
            // Toggled off: no reactions left for this user
            return {
              ...c,
              reactions: Array.from(reactions, ([e, count]) => ({ emoji: e, count })),
              my_reactions: [],
            }
          }

          // Toggled on: only this emoji remains for this user
          const nextCount = (reactions.get(emoji) ?? 0) + 1
          reactions.set(emoji, nextCount)
          return {
            ...c,
            reactions: Array.from(reactions, ([e, count]) => ({ emoji: e, count })),
            my_reactions: [emoji],
          }
        })
      )

      try {
        const res = await fetch(`/api/comments/${commentId}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body?.error || "Failed to react")
        }
      } catch (e) {
        // Roll back on failure by refetching
        fetchComments()
        toast.error(e instanceof Error ? e.message : "Failed to react")
      }
    },
    [fetchComments]
  )

  const handleDeleteComment = React.useCallback(async (commentId: string) => {
    setCommentToDelete(commentId)
  }, [])

  const confirmDeleteComment = React.useCallback(async () => {
    if (!commentToDelete) return

    setIsDeletingComment(true)
    try {
      const res = await fetch(`/api/comments/${commentToDelete}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete comment")
      }
      toast.success("Comment deleted")
      setCommentToDelete(null)
      fetchComments()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete comment")
    } finally {
      setIsDeletingComment(false)
    }
  }, [commentToDelete, fetchComments])

  React.useEffect(() => {
    const onCreated = (e: Event) => {
      const ev = e as CustomEvent<{ bugId?: string }>
      if (ev.detail?.bugId === currentBug.id) fetchSolutions()
    }
    window.addEventListener("solution:created", onCreated)
    return () => window.removeEventListener("solution:created", onCreated)
  }, [currentBug.id, fetchSolutions])

  React.useEffect(() => {
    const assigneeId = currentBug.assigned_to
    if (!assigneeId) {
      setAssigneeDisplayName(null)
      return
    }
    let cancelled = false
    fetch(`/api/users/batch?ids=${encodeURIComponent(assigneeId)}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (cancelled) return
        const users = Array.isArray(data?.users) ? data.users : []
        const u = users.find((x: { id?: string }) => x.id === assigneeId)
        setAssigneeDisplayName(u?.name || u?.email || null)
      })
      .catch(() => setAssigneeDisplayName(null))
    return () => {
      cancelled = true
    }
  }, [currentBug.assigned_to])

  async function handleAssigneeChange(bugId: string, assignedTo: string | null) {
    try {
      const res = await fetch(`/api/bugs/${bugId}/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: assignedTo || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to update assignee")
      }
      setCurrentBug((prev) => ({ ...prev, assigned_to: assignedTo || undefined }))
      if (!assignedTo) setAssigneeDisplayName(null)
      toast.success(assignedTo ? "Bug assigned" : "Assignee cleared")
      if (data.xpEarned) {
        toast.success(`+${data.xpEarned} BugXP – Triage complete!`, { duration: 4000 })
        window.dispatchEvent(new CustomEvent("hunter:xp", { detail: { xp: data.xpEarned } }))
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bug:updated", { detail: { bugId, assigned_to: assignedTo } }))
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update assignee")
    }
  }

  async function handleStatusChange(bugId: string, newStatus: string) {
    try {
      const res = await fetch(`/api/bugs/${bugId}/reports`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.message || "Failed to update status")
      }
      setCurrentBug((prev) => ({ ...prev, status: newStatus }))
      toast.success("Status updated")
      if (data.xpEarned) {
        toast.success(`+${data.xpEarned} BugXP – Triage complete!`, { duration: 4000 })
        window.dispatchEvent(new CustomEvent("hunter:xp", { detail: { xp: data.xpEarned } }))
      }
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

    const getTime = (value?: string | null) => (value ? new Date(value).getTime() : 0)
    const getActiveTime = (solution: SolutionItem) =>
      getTime(solution.updated_at || solution.created_at)

    if (solutionSortBy === "unanswered") {
      working = working.filter((solution) => {
        const upvotes = solution.upvotes_count || 0
        const downvotes = solution.downvotes_count || 0
        return upvotes + downvotes === 0
      })
    }

    switch (solutionSortBy) {
      case "newest":
        return working.sort((a, b) => {
          const dateA = getTime(a.created_at)
          const dateB = getTime(b.created_at)
          return dateB - dateA
        })
      case "active":
        return working.sort((a, b) => {
          const dateA = getActiveTime(a)
          const dateB = getActiveTime(b)
          if (dateB !== dateA) return dateB - dateA
          return getTime(b.created_at) - getTime(a.created_at)
        })
      case "votes":
        return working.sort((a, b) => {
          const scoreA = (a.upvotes_count || 0) - (a.downvotes_count || 0)
          const scoreB = (b.upvotes_count || 0) - (b.downvotes_count || 0)
          if (scoreB !== scoreA) return scoreB - scoreA
          return getActiveTime(b) - getActiveTime(a)
        })
      case "most_viewed":
        return working.sort((a, b) => {
          const viewsA = a.views || 0
          const viewsB = b.views || 0
          if (viewsB !== viewsA) return viewsB - viewsA
          return getActiveTime(b) - getActiveTime(a)
        })
      default:
        return working
    }
  }, [solutions, solutionSortBy])

  const bugUpvotes = (currentBug as { upvotes_count?: number }).upvotes_count ?? 0
  const bugDownvotes = (currentBug as { downvotes_count?: number }).downvotes_count ?? 0

  return (
    <>
      {/* Title row only: votes left, title + subtitle right */}
      <div className="mt-2 flex flex-row gap-2 sm:gap-3 items-start flex-nowrap mb-4">
        <div className="flex flex-col items-center gap-1 min-w-[56px] flex-shrink-0 sm:min-w-[70px]">
          <VoteButtons
            bugId={currentBug.id}
            initialUpvotes={bugUpvotes}
            initialDownvotes={bugDownvotes}
            userId={userId ?? undefined}
            compact
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {currentBug.title || "Bug details"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full report details and activity
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto text-sm rounded-lg border bg-card p-4 md:p-6 mb-6">
        <BugDetailsForm
          bug={currentBug}
          userId={userId ?? undefined}
          assigneeDisplayName={assigneeDisplayName}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
        />
      </div>

      <div className="mt-6 rounded-lg border bg-card">
        <div className="border-b px-4 py-3 md:px-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <IconMessageCircle className="size-5 text-muted-foreground" />
            Comments
            {!commentsLoading && <span className="text-sm font-normal text-muted-foreground">({comments.length})</span>}
          </h2>
        </div>
        {commentsLoading ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading comments…</div>
        ) : comments.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">No comments yet.</div>
        ) : (
          <div className="divide-y">
            {comments.map((c) => (
              <div key={c.id} className="px-4 py-3 md:px-6">
                <div className="flex items-start gap-3">
                  <Avatar className="size-7">
                    {c.author_image ? (
                      <AvatarImage src={c.author_image} alt={c.author_name ?? "User"} />
                    ) : (
                      <AvatarFallback className="text-[11px]">
                        {(c.author_name || "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {c.author_name && (
                          <span className="text-sm font-medium text-[var(--brand-blue)]">
                            {c.author_name}
                          </span>
                        )}
                      </div>
                      {userId && c.user_id === userId && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete comment"
                        >
                          <IconTrash className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                      {formatCommentBody(c.content)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCommentDate(c.created_at)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {REACTION_EMOJIS.map((emoji) => {
                        const count = (c.reactions ?? []).find((r) => r.emoji === emoji)?.count ?? 0
                        const mine = (c.my_reactions ?? []).includes(emoji)
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(c.id, emoji)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
                              mine ? "bg-primary text-primary-foreground border-primary/50" : "bg-background hover:bg-muted"
                            )}
                            aria-label={`React ${emoji}`}
                          >
                            <span>{emoji}</span>
                            {count > 0 ? (
                              <span
                                className={cn(
                                  "tabular-nums",
                                  mine ? "text-primary-foreground/90" : "text-muted-foreground"
                                )}
                              >
                                {count}
                              </span>
                            ) : null}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 py-4 md:px-6 border-t bg-muted/5">
          <BugCommentForm
            bugId={currentBug.id}
            userId={userId ?? undefined}
            onCommentAdded={fetchComments}
          />
        </div>
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
            {!isBugClosedOrResolved && isLoggedIn && (
              <Button
                type="button"
                className=""
                onClick={() => setSolutionOpen(true)}
              >
                Add solution
              </Button>
            )}
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
                          className="text-base font-semibold text-brand-blue hover:underline mb-1.5 cursor-pointer line-clamp-2 transition-all"
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
                                className="inline-flex items-center  bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 cursor-pointer border-0"
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
                                  className="text-xs text-brand-blue hover:underline break-all"
                                >
                                  {String(link)}
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                          <div className="inline-flex items-center gap-2  bg-muted px-3 py-1 text-muted-foreground">
                            <span className="font-semibold text-foreground">
                              {score > 0 ? `+${score}` : score}
                            </span>
                            <span>{score === 1 ? "vote" : "votes"}</span>
                          </div>
                          <div className="inline-flex items-center gap-2  bg-muted px-3 py-1 text-muted-foreground">
                            <IconEye className="size-3" />
                            <span className="font-medium text-foreground">
                              {views}
                            </span>
                            <span>{views === 1 ? "view" : "views"}</span>
                          </div>
                          <button
                            type="button"
                            className="inline-flex items-center gap-2  bg-muted px-3 py-1 text-muted-foreground hover:bg-muted/80"
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (typeof window !== "undefined") {
                                const url = `${window.location.origin}/bugs/${currentBug.id}#solution-${solution.id}`
                                const copied = await copyToClipboard(url)
                                if (copied) {
                                  toast("Solution link copied to clipboard")
                                } else {
                                  toast.error("Failed to copy link")
                                }
                              }
                            }}
                          >
                            <IconShare3 className="size-3" />
                            <span className="font-medium text-foreground">Share</span>
                          </button>
                          {(solution as SolutionItem).verified_at ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 px-2 py-1 rounded text-[11px] font-medium">
                              <IconCheck className="size-3" />
                              Verified
                            </span>
                          ) : isLoggedIn && userId && (solution as SolutionItem).created_by !== userId ? (
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900 px-2 py-1 rounded text-[11px] font-medium transition-colors disabled:opacity-50"
                              disabled={verifyingId === solution.id}
                              onClick={async (e) => {
                                e.stopPropagation()
                                setVerifyingId(solution.id)
                                try {
                                  const res = await fetch(`/api/solutions/${solution.id}/verify`, { method: "POST" })
                                  const data = await res.json().catch(() => ({}))
                                  if (!res.ok) throw new Error(data.error || "Failed to verify")
                                  setSolutions((prev) =>
                                    prev.map((s) =>
                                      s.id === solution.id ? { ...s, verified_at: new Date().toISOString() } : s
                                    )
                                  )
                                  toast.success("Solution verified! Creator earned +150 BugXP.")
                                } catch (err) {
                                  toast.error(err instanceof Error ? err.message : "Failed to verify")
                                } finally {
                                  setVerifyingId(null)
                                }
                              }}
                            >
                              <IconCheck className="size-3" />
                              {verifyingId === solution.id ? "Verifying…" : "Verify"}
                            </button>
                          ) : null}
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
                            <span className="text-blue-600 text-xs text-right">
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

      <ConfirmationDialog
        open={!!commentToDelete}
        onOpenChange={(open) => !open && setCommentToDelete(null)}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        loading={isDeletingComment}
      />
    </>
  )
}
