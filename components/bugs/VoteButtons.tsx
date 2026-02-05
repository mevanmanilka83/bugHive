"use client"

import * as React from "react"
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface VoteButtonsProps {
  bugId: string
  initialUpvotes?: number
  initialDownvotes?: number
  initialUserVote?: "upvote" | "downvote" | null
  userId?: string
  compact?: boolean
}

export function VoteButtons({
  bugId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  initialUserVote = null,
  userId,
  compact = false,
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = React.useState(initialUpvotes)
  const [downvotes, setDownvotes] = React.useState(initialDownvotes)
  const [userVote, setUserVote] = React.useState<"upvote" | "downvote" | null>(initialUserVote)
  const [isVoting, setIsVoting] = React.useState(false)
  const [isLoadingVote, setIsLoadingVote] = React.useState(false)

  // Fetch user's vote status on mount
  React.useEffect(() => {
    if (userId && !initialUserVote) {
      setIsLoadingVote(true)
      fetch(`/api/bugs/${bugId}/vote`, {
        method: "GET",
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.vote_type) {
            setUserVote(data.data.vote_type)
          }
        })
        .catch(() => {
          // Silently fail - user might not have voted
        })
        .finally(() => setIsLoadingVote(false))
    }
  }, [bugId, userId, initialUserVote])

  const score = upvotes - downvotes

  const handleVote = async (voteType: "upvote" | "downvote") => {
    if (!userId) {
      toast.error("Please sign in to vote")
      return
    }

    if (isVoting) return

    // If user already voted with different type, show message
    if (userVote && userVote !== voteType) {
      toast.info(`You already ${userVote === "upvote" ? "upvoted" : "downvoted"} this bug. Click the same button to remove your vote.`)
      return
    }

    try {
      setIsVoting(true)

      const response = await fetch(`/api/bugs/${bugId}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vote_type: voteType }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to vote" }))
        throw new Error(error.error || "Failed to vote")
      }

      const result = await response.json()

      if (result.success) {
        setUpvotes(result.data.upvotes_count || 0)
        setDownvotes(result.data.downvotes_count || 0)
        setUserVote(result.data.vote_type)
      } else {
        throw new Error(result.error || "Failed to vote")
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to vote")
    } finally {
      setIsVoting(false)
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            userVote === "upvote" && "text-orange-500 hover:text-orange-600",
            userVote === "downvote" && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleVote("upvote")}
          disabled={isVoting || !userId || userVote === "downvote"}
          title={userVote === "downvote" ? "You already downvoted. Remove your downvote first." : "Upvote"}
        >
          <IconArrowUp className="size-4" />
        </Button>
        <span className="text-xs font-medium min-w-[2ch] text-center">
          {score > 0 ? `+${score}` : score}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 w-6 p-0",
            userVote === "downvote" && "text-blue-500 hover:text-blue-600",
            userVote === "upvote" && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => handleVote("downvote")}
          disabled={isVoting || !userId || userVote === "upvote"}
          title={userVote === "upvote" ? "You already upvoted. Remove your upvote first." : "Downvote"}
        >
          <IconArrowDown className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 hover:bg-orange-50 dark:hover:bg-orange-950",
          userVote === "upvote" && "text-orange-500 bg-orange-50 dark:bg-orange-950",
          userVote === "downvote" && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => handleVote("upvote")}
        disabled={isVoting || !userId || userVote === "downvote"}
        title={userVote === "downvote" ? "You already downvoted. Remove your downvote first." : "Upvote"}
      >
        <IconArrowUp className="size-5" />
      </Button>
      <span
        className={cn(
          "text-sm font-semibold min-w-[3ch] text-center",
          score > 0 && "text-orange-500",
          score < 0 && "text-blue-500"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950",
          userVote === "downvote" && "text-blue-500 bg-blue-50 dark:bg-blue-950",
          userVote === "upvote" && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => handleVote("downvote")}
        disabled={isVoting || !userId || userVote === "upvote"}
        title={userVote === "upvote" ? "You already upvoted. Remove your upvote first." : "Downvote"}
      >
        <IconArrowDown className="size-5" />
      </Button>
    </div>
  )
}

