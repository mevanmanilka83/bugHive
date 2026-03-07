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

const headerButtonBrackets = (
  <>
    <div className="absolute -left-[1px] -top-[1px] z-10">
      <div className="relative">
        <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute top-0" />
        <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute left-0" />
      </div>
    </div>
    <div className="absolute -right-[0px] -top-[1px] z-10">
      <div className="relative">
        <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute top-0" />
        <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute -left-[3.5px]" />
      </div>
    </div>
    <div className="absolute -left-[1px] -bottom-[0px] z-10">
      <div className="relative">
        <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute -top-[3.5px]" />
        <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute left-0" />
      </div>
    </div>
    <div className="absolute -right-[0px] -bottom-[0px] z-10">
      <div className="relative">
        <div className="bg-[#8B5E3C] w-[1px] h-[4px] absolute -top-[3.5px]" />
        <div className="bg-[#8B5E3C] w-[4px] h-[1px] absolute -left-[3.5px]" />
      </div>
    </div>
  </>
)

interface LeaderboardDialogProps {
  period?: "week" | "all"
  limit?: number
  className?: string
  /** Use header style (orange border, brackets) to match Community stats / Account buttons */
  headerStyle?: boolean
}

export function LeaderboardDialog({ period = "week", limit = 10, className, headerStyle }: LeaderboardDialogProps) {
  const [open, setOpen] = React.useState(false)

  const trigger = headerStyle ? (
    <button
      type="button"
      className={cn(
        "border-2 border-icon-orange p-1.5 text-icon-orange hover:bg-icon-orange/10 hover:text-icon-orange/90",
        "focus:outline-none focus:ring-2 focus:ring-icon-orange focus:ring-offset-2 transition-colors relative group/btn",
        className
      )}
      aria-label="Top hunters leaderboard"
    >
      {headerButtonBrackets}
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
