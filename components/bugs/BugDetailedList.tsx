"use client"

import * as React from "react"
import { IconFilter } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { VoteButtons } from "@/components/bugs/VoteButtons"
import { BugReportDialog } from "@/components/bugs/reports/BugReportDialog"
import { cn } from "@/lib/utils"

interface BugDetailedListProps {
  userId: string
  bugs: any[]
  onBugClick?: (bugId: string) => void
  totalCount?: number
}

export function BugDetailedList({ userId, bugs, onBugClick, totalCount }: BugDetailedListProps) {
  const [sortBy, setSortBy] = React.useState<"newest" | "active" | "votes" | "unanswered">("newest")

  const [solutionCounts, setSolutionCounts] = React.useState<Record<string, number>>({})
  const [userInfo, setUserInfo] = React.useState<Record<string, { name?: string; image?: string; reputation?: number }>>({})

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
    let sorted = [...bugs]
    
    // Filter unanswered first if needed
    if (sortBy === "unanswered") {
      sorted = sorted.filter(bug => (solutionCounts[bug.id] ?? 0) === 0)
    }
    
    // Then sort
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
          return dateB - dateA
        })
      case "active":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.updated_at || a.updatedAt || a.created_at || 0).getTime()
          const dateB = new Date(b.updated_at || b.updatedAt || b.created_at || 0).getTime()
          return dateB - dateA
        })
      case "votes":
        return sorted.sort((a, b) => {
          const scoreA = (a.upvotes_count || 0) - (a.downvotes_count || 0)
          const scoreB = (b.upvotes_count || 0) - (b.downvotes_count || 0)
          return scoreB - scoreA
        })
      case "unanswered":
        // Already filtered, sort by newest
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime()
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime()
          return dateB - dateA
        })
      default:
        return sorted
    }
  }, [bugs, sortBy, solutionCounts])

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

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          {/* Left: Title and Count */}
          <div>
            <h1 className="text-3xl font-bold mb-1">All Bugs</h1>
            <p className="text-sm text-muted-foreground">
              {displayCount.toLocaleString()} bugs
            </p>
          </div>
          {/* Right: Report Bug Button */}
          <div>
            <BugReportDialog />
          </div>
        </div>

        {/* Filter and Sort Bar */}
        <div className="flex items-center justify-between bg-muted/30 rounded-lg px-2 py-1.5">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1 flex-1">
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                sortBy === "newest"
                  ? "bg-white text-black border border-border shadow-sm"
                  : "text-black hover:text-black/80"
              )}
              onClick={() => setSortBy("newest")}
            >
              Newest
            </button>
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                sortBy === "active"
                  ? "bg-white text-black border border-border shadow-sm"
                  : "text-black hover:text-black/80"
              )}
              onClick={() => setSortBy("active")}
            >
              Active
            </button>
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                sortBy === "votes"
                  ? "bg-white text-black border border-border shadow-sm"
                  : "text-black hover:text-black/80"
              )}
              onClick={() => setSortBy("votes")}
            >
              Votes
            </button>
            <button
              className={cn(
                "px-3 py-1.5 text-sm font-normal rounded-md transition-colors cursor-pointer",
                sortBy === "unanswered"
                  ? "bg-white text-black border border-border shadow-sm"
                  : "text-black hover:text-black/80"
              )}
              onClick={() => setSortBy("unanswered")}
            >
              Unanswered
            </button>
          </div>

          {/* Filter Button */}
          <div className="ml-2">
            <button
              className="h-8 px-3 text-sm bg-white text-black border border-black rounded-md hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <IconFilter className="size-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Bug List */}
      <div className="space-y-0 border-t">
        {sortedBugs.map((bug) => {
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
                {/* Engagement Metrics (small gray text, stacked vertically) */}
                <div className="flex flex-col gap-0.5 text-xs text-muted-foreground text-center mt-1">
                  <div className="font-semibold text-foreground">{score} {score === 1 ? 'vote' : 'votes'}</div>
                  <div>{solutionCount ?? 0} {solutionCount === 1 ? 'answer' : 'answers'}</div>
                  <div>{views} {views === 1 ? 'view' : 'views'}</div>
                </div>
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
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.slice(0, 5).map((tag: string) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {tags.length > 5 && (
                    <span className="text-xs text-muted-foreground">+{tags.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Right Column - User Metadata (aligned vertically) */}
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
                <div className="text-muted-foreground text-right text-xs">
                  {formatTimeAgo(created)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sortedBugs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No bugs found
        </div>
      )}
    </div>
  )
}

