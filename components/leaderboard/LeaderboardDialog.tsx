"use client"

import * as React from "react"
import { IconTrophy } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Leaderboard } from "@/components/leaderboard/Leaderboard"
import { cn } from "@/lib"

interface LeaderboardDialogProps {
  period?: "week" | "all"
  limit?: number
  className?: string
  headerStyle?: boolean
}

export function LeaderboardDialog({ period = "week", limit = 10, className, headerStyle }: LeaderboardDialogProps) {
  const [open, setOpen] = React.useState(false)

  const trigger = headerStyle ? (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md",
        "border border-border/60 bg-background text-[var(--icon-orange)]",
        "hover:bg-muted/40 hover:text-[var(--icon-orange)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--icon-orange)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-colors",
        className
      )}
      aria-label="Top hunters leaderboard"
    >
      <IconTrophy className="size-4" />
    </button>
  ) : (
    <Button
      variant="outline"
      size="icon"
      className={cn("shrink-0", className)}
      aria-label="View leaderboard"
    >
      <IconTrophy className="size-5 text-[var(--icon-orange)]" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogTitle className="sr-only">Top Hunters Leaderboard</DialogTitle>
        <Leaderboard
          period={period}
          limit={limit}
          className="border-0 shadow-none bg-transparent pt-0"
        />
      </DialogContent>
    </Dialog>
  )
}
