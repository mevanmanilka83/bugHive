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
          const voteType = data.data?.vote_type ?? data.vote_type
          if (voteType) setUserVote(voteType)
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
      const data = result.data ?? result

      if (result.success && data) {
        setUpvotes(data.upvotes_count ?? 0)
        setDownvotes(data.downvotes_count ?? 0)
        setUserVote(data.vote_type ?? null)
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
            userVote === "upvote" && "text-primary hover:text-primary/80"
          )}
          onClick={() => handleVote("upvote")}
          disabled={isVoting || !userId}
          title="Upvote (click again to remove)"
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
            userVote === "downvote" && "text-brand-blue hover:text-brand-blue/80 transition-all font-bold"
          )}
          onClick={() => handleVote("downvote")}
          disabled={isVoting || !userId}
          title="Downvote (click again to remove)"
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
          "h-8 w-8 p-0 hover:bg-muted dark:hover:bg-muted/50",
          userVote === "upvote" && "text-primary bg-muted dark:bg-muted/50"
        )}
        onClick={() => handleVote("upvote")}
        disabled={isVoting || !userId}
        title="Upvote (click again to remove)"
      >
        <IconArrowUp className="size-5" />
      </Button>
      <span
        className={cn(
          "text-sm font-semibold min-w-[3ch] text-center",
          score > 0 && "text-primary",
          score < 0 && "text-brand-blue"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 hover:bg-brand-blue/10 transition-all",
          userVote === "downvote" && "text-brand-blue bg-brand-blue/10 font-bold"
        )}
        onClick={() => handleVote("downvote")}
        disabled={isVoting || !userId}
        title="Downvote (click again to remove)"
      >
        <IconArrowDown className="size-5" />
      </Button>
    </div>
  )
}

