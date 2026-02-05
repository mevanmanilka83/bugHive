"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconEye,
  IconFilter,
  IconMessageCircle,
  IconShare3,
} from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { VoteButtons } from "@/components/bugs/VoteButtons"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { cn } from "@/lib/utils"
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
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

interface BugDetailedListProps {
  userId: string
  bugs: any[]
  onBugClick?: (bugId: string) => void
  totalCount?: number
  showTitle?: boolean
  onOpenFilters?: () => void
  filtersOpen?: boolean
  renderFiltersPanel?: () => React.ReactNode
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
  onOpenFilters,
  filtersOpen,
  renderFiltersPanel,
}: BugDetailedListProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>("newest")

  const [solutionCounts, setSolutionCounts] = React.useState<Record<string, number>>({})
  const [userInfo, setUserInfo] = React.useState<Record<string, { name?: string; image?: string; reputation?: number }>>({})
  const [pageSize, setPageSize] = React.useState(15)
  const [currentPage, setCurrentPage] = React.useState(1)

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
          const viewsA = a.views || 0
          const viewsB = b.views || 0
          return viewsB - viewsA
        })
      default:
        return working
    }
  }, [bugs, sortBy, solutionCounts, userId])

  const totalItems = sortedBugs.length
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0

  React.useEffect(() => {
    // Reset to first page when sort, filters, or page size change
    setCurrentPage(1)
  }, [sortBy, pageSize, totalItems])

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

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6 space-y-2">
        {/* Title and primary actions */}
        {showTitle && (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-1">All Bugs</h1>
            </div>
            <div>
              <BugReportDialog />
            </div>
          </div>
        )}

        {/* Count, tabs, and filter – styled similar to StackOverflow */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
              {displayCount.toLocaleString()} bugs
            </p>

            {/* Tabs group */}
            <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1 py-1">
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

          {/* Filter Button */}
          {onOpenFilters && (
            <div>
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
          const descriptionSnippet = description.length > 200 
            ? description.substring(0, 200) + "..." 
            : description
          const tags = Array.isArray(bug.tags) ? bug.tags : []
          const upvotes = bug.upvotes_count || 0
          const downvotes = bug.downvotes_count || 0
          const score = upvotes - downvotes
          const solutionCount = solutionCounts[bug.id] ?? null
          const views = bug.views || 0

          const user = bug.created_by ? userInfo[bug.created_by] : null
          const userName = user?.name || 'Unknown'
          const userImage = user?.image
          const userReputation = user?.reputation || 0

          return (
            <div
              key={bug.id}
              className="flex gap-3 py-3 px-3 border-b hover:bg-muted/50 transition-colors"
            >
              {/* Left Column - Vote Buttons and Engagement Metrics */}
              <div className="flex flex-col items-center gap-1 min-w-[70px] flex-shrink-0">
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
                    className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-muted-foreground hover:bg-muted/80"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: implement share behavior (e.g., copy link)
                    }}
                  >
                    <IconShare3 className="size-3" />
                    <span className="font-medium text-foreground">Share</span>
                  </button>
                </div>
              </div>

              {/* Right Column - User Metadata (aligned vertically, date at bottom-right) */}
              <div className="flex flex-col items-end gap-0.5 min-w-[120px] flex-shrink-0 text-xs">
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
                    <span className="text-muted-foreground font-medium text-xs">{userReputation}</span>
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
        <div className="border-t bg-background/60 px-3 py-4">
          <Pagination className="mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={currentPage === 1}
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                  }}
                />
              </PaginationItem>

              {pageNumbers.map((p, index) =>
                typeof p === "string" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === currentPage}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(p)
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={currentPage === totalPages}
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages) {
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  }}
                />
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

