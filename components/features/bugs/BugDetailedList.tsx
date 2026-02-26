"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconFilter,
  IconMessageCircle,
  IconShare3,
  IconBookmark,
  IconBookmarkFilled,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { VoteButtons } from "@/components/features/bugs/VoteButtons"
import { BugReportDialog } from "@/components/features/bugs/reports/BugReportDialog"
import { cn } from "@/lib/utils"
import { stripHtml } from "@/lib/utils-client"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdownMenu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"

interface BugDetailedListProps {
  userId: string
  bugs: any[]
  onBugClick?: (bugId: string) => void
  totalCount?: number
  showTitle?: boolean
  showReportButton?: boolean
  onOpenFilters?: () => void
  filtersOpen?: boolean
  renderFiltersPanel?: () => React.ReactNode
  /** When the bug creator is the current user, use this name if batch user fetch didn't return them */
  currentUserName?: string
  currentUserImage?: string
}

type SortOption =
  | "newest"
  | "active"
  | "votes"
  | "unanswered"
  | "most_viewed"
  | "my_bugs"

export function BugDetailedList({
  userId,
  bugs,
  onBugClick,
  totalCount,
  showTitle = true,
  showReportButton = true,
  onOpenFilters,
  filtersOpen,
  renderFiltersPanel,
  currentUserName,
  currentUserImage,
}: BugDetailedListProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>("newest")

  const [solutionCounts, setSolutionCounts] = React.useState<Record<string, number>>({})
  const [userInfo, setUserInfo] = React.useState<Record<string, { name?: string; image?: string; reputation?: number }>>({})
  const [pageSize, setPageSize] = React.useState(15)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [savedBugIds, setSavedBugIds] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetch("/api/saved")
      .then((res) => (res.ok ? res.json() : { savedBugIds: [] }))
      .then((data) => {
        if (cancelled) return
        const ids = Array.isArray(data?.savedBugIds) ? data.savedBugIds : []
        setSavedBugIds(new Set(ids))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  React.useEffect(() => {
    const onSavedChange = () => {
      if (!userId) return
      fetch("/api/saved")
        .then((res) => (res.ok ? res.json() : { savedBugIds: [] }))
        .then((data) => {
          const ids = Array.isArray(data?.savedBugIds) ? data.savedBugIds : []
          setSavedBugIds(new Set(ids))
        })
        .catch(() => {})
    }
    window.addEventListener("saved:changed", onSavedChange)
    return () => window.removeEventListener("saved:changed", onSavedChange)
  }, [userId])

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

  React.useEffect(() => {
    // Fetch solution counts and user info for all bugs
    const fetchData = async () => {
      const counts: Record<string, number> = {}
      const users: Record<string, { name?: string; image?: string; reputation?: number }> = {}
      const uniqueUserIds = new Set<string>()
      
      // Collect unique user IDs
      bugs.forEach(bug => {
        if (bug.created_by) {
          uniqueUserIds.add(bug.created_by)
        }
      })

      // Fetch solution counts
      await Promise.all(
        bugs.map(async (bug) => {
          try {
            const res = await fetch(`/api/bugs/${bug.id}/solutions`)
            if (res.ok) {
              const data = await res.json()
              counts[bug.id] = Array.isArray(data?.solutions) ? data.solutions.length : 0
            } else {
              counts[bug.id] = 0
            }
          } catch {
            counts[bug.id] = 0
          }
        })
      )

      // Fetch user info in batch
      if (uniqueUserIds.size > 0) {
        try {
          const idsParam = Array.from(uniqueUserIds).join(',')
          const res = await fetch(`/api/users/batch?ids=${idsParam}`)
          if (res.ok) {
            const data = await res.json()
            const fetchedUsers = data.users || []
            fetchedUsers.forEach((user: any) => {
              users[user.id] = {
                name: user.name || user.email?.split('@')[0] || 'Unknown',
                image: user.image || null,
                reputation: user.reputation || 0
              }
            })
          }
        } catch {
          // Silently fail
        }
      }

      setSolutionCounts(counts)
      setUserInfo(users)
    }
    fetchData()
  }, [bugs.map(b => b.id).join(',')])

  const sortedBugs = React.useMemo(() => {
    let working = [...bugs]

    // Filter-based modes
    if (sortBy === "unanswered") {
      working = working.filter(bug => (solutionCounts[bug.id] ?? 0) === 0)
    }

    if (sortBy === "my_bugs") {
      working = working.filter(bug => bug.created_by === userId)
    }

    // Then sort
    switch (sortBy) {
      case "newest":
      case "unanswered":
      case "my_bugs":
        return working.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
          return dateB - dateA
        })
      case "active":
        return working.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || 0).getTime()
          const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || 0).getTime()
          return dateB - dateA
        })
      case "votes":
        return working.sort((a, b) => {
          const scoreA = (a.upvotes_count || 0) - (a.downvotes_count || 0)
          const scoreB = (b.upvotes_count || 0) - (b.downvotes_count || 0)
          return scoreB - scoreA
        })
      case "most_viewed":
        return working.sort((a, b) => {
          const viewsA = a.views || 0 // Dynamic view count
          const viewsB = b.views || 0 // Dynamic view count
          return viewsB - viewsA
        })
      default:
        return working
    }
  }, [bugs, sortBy, solutionCounts, userId])

  const totalItems = sortedBugs.length
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  React.useEffect(() => {
    // Reset to first page when sort or page size change
    setCurrentPage(1)
  }, [sortBy, pageSize])

  React.useEffect(() => {
    // Clamp to valid page when total pages shrinks (e.g. after filter)
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const paginatedBugs = React.useMemo(() => {
    if (totalItems === 0) return []
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return sortedBugs.slice(start, end)
  }, [sortedBugs, currentPage, pageSize, totalItems])

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `asked ${diffMins} min${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `asked ${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    if (diffDays < 7) return `asked ${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    return `asked ${date.toLocaleDateString()}`
  }

  const displayCount = totalCount !== undefined ? totalCount : bugs.length

  const pageNumbers = React.useMemo(() => {
    if (totalPages === 0) return []

    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    // Always show first page
    pages.push(1)

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)

    if (start > 2) {
      pages.push("…")
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages - 1) {
      pages.push("…")
    }

    pages.push(totalPages)

    return pages
  }, [totalPages, currentPage])

  const toggleSaved = React.useCallback(
    async (bugId: string) => {
      if (!userId) {
        toast.error("Please sign in to save bugs")
        return
      }
      const isCurrentlySaved = savedBugIds.has(bugId)
      setSavedBugIds((prev) => {
        const next = new Set(prev)
        if (next.has(bugId)) next.delete(bugId)
        else next.add(bugId)
        return next
      })
      try {
        if (isCurrentlySaved) {
          const res = await fetch(`/api/saved?bug_id=${encodeURIComponent(bugId)}`, {
            method: "DELETE",
          })
          if (!res.ok) throw new Error("Failed to unsave")
        } else {
          const res = await fetch("/api/saved", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bug_id: bugId }),
          })
          if (!res.ok) throw new Error("Failed to save")
        }
        window.dispatchEvent(new Event("saved:changed"))
      } catch {
        setSavedBugIds((prev) => {
          const next = new Set(prev)
          if (isCurrentlySaved) next.add(bugId)
          else next.delete(bugId)
          return next
        })
        toast.error(isCurrentlySaved ? "Failed to unsave bug" : "Failed to save bug")
      }
    },
    [userId, savedBugIds]
  )

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 space-y-2">
        {/* Title and primary actions */}
        {(showTitle || showReportButton) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            {showTitle && (
              <div>
                <h1 className="text-xl font-bold mb-1 sm:text-3xl">All Bugs</h1>
              </div>
            )}
            {showReportButton && (
              <div className="flex w-full justify-end sm:w-auto">
                <BugReportDialog />
              </div>
            )}
          </div>
        )}

        {/* Count, tabs, and filter – styled similar to StackOverflow */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 sm:flex-1">
            <p className="shrink-0 text-sm text-muted-foreground">
              {displayCount.toLocaleString()} bugs
            </p>

            {/* Tabs group – horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
              <div className="inline-flex flex-nowrap items-center gap-1 rounded-md border bg-background px-1 py-1 min-w-0">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  sortBy === "newest"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSortBy("newest")}
              >
                Newest
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  sortBy === "active"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSortBy("active")}
              >
                Active
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  sortBy === "votes"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSortBy("votes")}
              >
                Most voted
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                  sortBy === "unanswered"
                    ? "bg-muted font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setSortBy("unanswered")}
              >
                Unanswered
              </button>

              {/* More dropdown for extra, project-specific modes */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer inline-flex items-center gap-1",
                      sortBy === "most_viewed" || sortBy === "my_bugs"
                        ? "bg-muted font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    More
                    <IconChevronDown className="size-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSortBy("most_viewed")}>
                    Most viewed
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("my_bugs")}>
                    My reported bugs
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Filter Button */}
          {onOpenFilters && (
            <div className="flex justify-end sm:justify-end">
              <Button
                type="button"
                size="sm"
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-4"
                onClick={onOpenFilters}
              >
                <IconFilter className="size-4" />
                Filter
              </Button>
            </div>
          )}
        </div>

        {/* Filters panel (rendered directly under tabs when open) */}
        {filtersOpen && renderFiltersPanel && (
          <div className="mt-3">
            {renderFiltersPanel()}
          </div>
        )}
      </div>

      {/* Bug List */}
      <div className="space-y-0 border-t">
        {paginatedBugs.map((bug) => {
          const createdAt = bug.created_at || bug.createdAt
          const created = createdAt ? new Date(createdAt) : new Date()
          const bugTitle: string = (bug.title || bug.header || bug.name || "").toString() || "(untitled bug)"
          const description = bug.description || ""
          const plainDescription = stripHtml(description)
          const descriptionSnippet = plainDescription.length > 200 
            ? plainDescription.substring(0, 200) + "..." 
            : plainDescription
          const tags = Array.isArray(bug.tags) ? bug.tags : []
          const clusterName = bug.cluster_name || bug.clusterName || bug.cluster?.name
          const upvotes = bug.upvotes_count || 0
          const downvotes = bug.downvotes_count || 0
          const score = upvotes - downvotes
          const solutionCount = solutionCounts[bug.id] ?? null
          const views = bug.views || 0

          const user = bug.created_by ? userInfo[bug.created_by] : null
          const isCurrentUserCreator = bug.created_by === userId
          const userName =
            user?.name ||
            (isCurrentUserCreator && currentUserName ? currentUserName : 'Unknown')
          const userImage = user?.image ?? (isCurrentUserCreator ? currentUserImage : undefined)
          const userReputation = user?.reputation ?? 0

          return (
            <div
              key={bug.id}
              className="flex gap-2 py-2 px-2 border-b hover:bg-muted/50 transition-colors sm:gap-3 sm:py-3 sm:px-3"
            >
              {/* Left Column - Vote Buttons and Engagement Metrics */}
              <div className="flex flex-col items-center gap-1 min-w-[56px] flex-shrink-0 sm:min-w-[70px]">
                {/* Vote Buttons */}
                <VoteButtons
                  bugId={bug.id}
                  initialUpvotes={upvotes}
                  initialDownvotes={downvotes}
                  userId={userId}
                  compact={true}
                />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                <h3 
                  className="text-base font-semibold text-blue-600 hover:text-blue-800 mb-1.5 cursor-pointer line-clamp-2"
                  onClick={() => onBugClick?.(bug.id)}
                >
                  {bugTitle}
                </h3>
                {descriptionSnippet && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {descriptionSnippet}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {clusterName && (
                    <Badge
                      variant="secondary"
                      className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 border border-blue-200"
                    >
                      {String(clusterName)}
                    </Badge>
                  )}
                  {tags.slice(0, 5).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 cursor-pointer border-0"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{tags.length - 5} more</span>
                  )}
                </div>

                {/* Engagement pills – votes, answers, views, share */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {score > 0 ? `+${score}` : score}
                    </span>
                    <span>{score === 1 ? "vote" : "votes"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground">
                    <IconMessageCircle className="size-3" />
                    <span className="font-medium text-foreground">
                      {solutionCount ?? 0}
                    </span>
                    <span>{solutionCount === 1 ? "answer" : "answers"}</span>
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
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1",
                      savedBugIds.has(bug.id)
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleSaved(bug.id)
                    }}
                    aria-pressed={savedBugIds.has(bug.id)}
                    aria-label={savedBugIds.has(bug.id) ? "Unsave bug" : "Save bug"}
                  >
                    {savedBugIds.has(bug.id) ? (
                      <IconBookmarkFilled className="size-3" />
                    ) : (
                      <IconBookmark className="size-3" />
                    )}
                    <span className="font-medium text-foreground">
                      {savedBugIds.has(bug.id) ? "Saved" : "Save"}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground hover:bg-muted/80"
                    onClick={async (e) => {
                      e.stopPropagation()
                      if (typeof window !== "undefined") {
                        const url = `${window.location.origin}/bugs/${bug.id}`
                        const copied = await copyToClipboard(url)
                        if (copied) {
                          toast("Bug link copied to clipboard")
                        } else {
                          toast.error("Failed to copy link")
                        }
                      }
                    }}
                  >
                    <IconShare3 className="size-3" />
                    <span className="font-medium text-foreground">Share</span>
                  </button>
                </div>
              </div>

              {/* Right Column - User Metadata (aligned vertically, date at bottom-right) */}
              <div className="flex flex-col items-end gap-0.5 min-w-[80px] flex-shrink-0 text-xs sm:min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <Avatar className="size-5">
                    <AvatarImage src={userImage || undefined} alt={userName} />
                    <AvatarFallback className="text-[10px]">
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <a 
                      href="#" 
                      className="text-blue-600 hover:text-blue-800 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Navigate to user profile if needed
                      }}
                    >
                      {userName}
                    </a>
                    {userReputation > 0 && (
                      <span className="text-muted-foreground font-medium text-xs">{userReputation}</span>
                    )}
                  </div>
                </div>
                <div className="mt-auto text-muted-foreground text-right text-xs">
                  {formatTimeAgo(created)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="border-t bg-background/60 px-3 py-2">
          <Pagination className="mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-2 sm:pl-2 text-xs h-8"
                  aria-label="Go to previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <IconChevronLeft className="size-3.5" />
                  <span className="hidden sm:block">Previous</span>
                </Button>
              </PaginationItem>

              {pageNumbers.map((p, index) =>
                typeof p === "string" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <Button
                      variant={p === currentPage ? "outline" : "ghost"}
                      size="sm"
                      className="min-w-7 text-xs h-8"
                      aria-current={p === currentPage ? "page" : undefined}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </Button>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 px-2 sm:pr-2 text-xs h-8"
                  aria-label="Go to next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span className="hidden sm:block">Next</span>
                  <IconChevronRight className="size-3.5" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {sortedBugs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No bugs found
        </div>
      )}
    </div>
  )
}

