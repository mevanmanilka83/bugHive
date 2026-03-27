"use client"

import * as React from "react"
import { IconTrophy } from "@tabler/icons-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getBadgeLabel, cn } from "@/lib"

type Hunter = {
  id: string
  name: string
  image: string | null
  points: number
  rank?: string
  badges: string[]
}

interface LeaderboardProps {
  period?: "week" | "all"
  limit?: number
  className?: string
}

const RANK_STYLES: Record<number, string> = {
  1: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  2: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  3: "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
}

export function Leaderboard({ period = "week", limit = 10, className }: LeaderboardProps) {
  const [hunters, setHunters] = React.useState<Hunter[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/leaderboard?period=${period}&limit=${limit}`)
      .then((res) => (res.ok ? res.json() : { hunters: [] }))
      .then((data) => {
        if (!cancelled) setHunters(data.hunters || [])
      })
      .catch(() => {
        if (!cancelled) setHunters([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, limit])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <IconTrophy className="size-5 text-[var(--icon-orange)]" />
          <CardTitle className="text-base">Top Hunters</CardTitle>
        </div>
        <CardDescription>
          Top BugXP earners this week. Report bugs, triage, and share solutions to climb the leaderboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-8 rounded-none bg-muted" />
                <div className="h-4 flex-1 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : hunters.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No hunters yet. Be the first to earn BugXP!
          </p>
        ) : (
          <ul className="space-y-1">
            {hunters.map((hunter, idx) => {
              const rank = idx + 1
              const rankStyle = RANK_STYLES[rank]
              const isTop3 = rank <= 3
              return (
                <li
                  key={hunter.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 transition-colors",
                    "border border-border/60 bg-background",
                    "hover:bg-muted/30",
                    "rounded-lg",
                    isTop3 && "bg-muted/10"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center text-xs font-semibold tabular-nums",
                      "rounded-md",
                      rankStyle ?? "bg-muted text-muted-foreground"
                    )}
                  >
                    {rank}
                  </span>
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={hunter.image ?? undefined} alt={hunter.name} />
                    <AvatarFallback className="text-xs bg-muted/60 text-foreground">
                      {hunter.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{hunter.name}</p>
                    {hunter.rank && (
                      <p className="text-[10px] text-muted-foreground capitalize">{hunter.rank}</p>
                    )}
                    {hunter.badges.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {hunter.badges.slice(0, 3).map((badgeId) => (
                          <span
                            key={badgeId}
                            className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            {getBadgeLabel(badgeId)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--brand-blue)]">
                    {hunter.points} XP
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
