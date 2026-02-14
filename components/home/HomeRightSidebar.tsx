"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconUsersGroup,
  IconMessageCircle,
  IconArrowUp,
  IconBug,
  IconEye,
  IconMessageCircle2,
} from "@tabler/icons-react"
import { getRecentlyViewedBugs } from "@/lib/utils-client"
import { cn } from "@/lib/utils-client"

const CARD_PRIMARY =
  "rounded-md border border-primary/25 bg-primary/5 p-2 shadow-[0_1px_2px_rgba(0,0,0,.06)]"
const CARD_SECONDARY =
  "rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 shadow-none"
const HEADER_PRIMARY = "text-[10px] font-semibold uppercase tracking-wider text-foreground"
const HEADER_SECONDARY = "text-[10px] font-semibold uppercase tracking-wider text-foreground/80"

type Stats = {
  usersOnline: number
  questions: number
  answers: number
  comments: number
  upvotes: number
  unansweredBugs: { id: string; title: string }[]
  clusters: { id: string; name: string }[]
}

const defaultStats: Stats = {
  usersOnline: 0,
  questions: 0,
  answers: 0,
  comments: 0,
  upvotes: 0,
  unansweredBugs: [],
  clusters: [],
}

export function HomeRightSidebar() {
  const [stats, setStats] = React.useState<Stats>(defaultStats)
  const [recentlyViewed, setRecentlyViewed] = React.useState<{ id: string; title: string }[]>([])

  React.useEffect(() => {
    let cancelled = false
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : defaultStats))
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  React.useEffect(() => {
    setRecentlyViewed(getRecentlyViewedBugs())
    const onChanged = () => setRecentlyViewed(getRecentlyViewedBugs())
    window.addEventListener("recentlyViewed:changed", onChanged)
    return () => window.removeEventListener("recentlyViewed:changed", onChanged)
  }, [])

  return (
    <aside
      className="hidden md:block md:w-[152px] lg:w-[164px] xl:w-[176px] shrink-0 bg-muted/20 pl-3"
      style={{ minHeight: "1px" }}
    >
      <div className="sticky top-6 flex flex-col gap-1.5">
        {/* Online activity – primary, high-visibility */}
        <div className={CARD_PRIMARY}>
          <h3 className={HEADER_PRIMARY + " mb-0.5"}>Clusters · Online</h3>
          <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
            {typeof stats.usersOnline === "number" ? stats.usersOnline.toLocaleString() : "0"}
          </p>
          <p className="text-[10px] text-muted-foreground">users online</p>
        </div>

        {/* Community stats – secondary */}
        <div className={CARD_SECONDARY}>
          <h3 className={HEADER_SECONDARY + " mb-0.5"}>Community stats</h3>
          <ul className="space-y-0.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1">
              <IconBug className="size-2.5 shrink-0 text-muted-foreground" />
              <span>{stats.questions} questions</span>
            </li>
            <li className="flex items-center gap-1">
              <IconMessageCircle className="size-2.5 shrink-0 text-muted-foreground" />
              <span>{stats.answers} answers</span>
            </li>
            <li className="flex items-center gap-1">
              <IconMessageCircle2 className="size-2.5 shrink-0 text-muted-foreground" />
              <span>{stats.comments} comments</span>
            </li>
            <li className="flex items-center gap-1">
              <IconArrowUp className="size-2.5 shrink-0 text-muted-foreground" />
              <span>{stats.upvotes} upvotes</span>
            </li>
          </ul>
        </div>

        {/* Clusters list – secondary */}
        {stats.clusters && stats.clusters.length > 0 && (
          <div className={CARD_SECONDARY}>
            <h3 className={HEADER_SECONDARY + " mb-0.5"}>Teams & clusters</h3>
            <ul className="space-y-0.5">
              {stats.clusters.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/clusters/${c.id}`}
                    className="text-[11px] text-foreground hover:text-primary hover:underline line-clamp-1"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/clusters" className="text-[10px] font-medium text-primary hover:underline mt-0.5 inline-block">
              View all →
            </Link>
          </div>
        )}

        {/* Popular unanswered – secondary */}
        <div className={CARD_SECONDARY}>
          <h3 className={HEADER_SECONDARY + " mb-0.5"}>Popular unanswered</h3>
          {stats.unansweredBugs && stats.unansweredBugs.length > 0 ? (
            <ul className="space-y-0.5 mb-0.5">
              {stats.unansweredBugs.slice(0, 3).map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/bugs/${b.id}`}
                    className={cn("text-[11px] text-foreground hover:text-primary hover:underline line-clamp-1 block")}
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[11px] text-muted-foreground mb-0.5">No unanswered yet.</p>
          )}
          <Link href="/" className="text-[10px] font-medium text-primary hover:underline">
            View all →
          </Link>
        </div>

        {/* Recently viewed – secondary */}
        <div className={CARD_SECONDARY}>
          <h3 className={HEADER_SECONDARY + " mb-0.5 flex items-center gap-1"}>
            <IconEye className="size-2.5" />
            Recently viewed
          </h3>
          {recentlyViewed.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">None yet.</p>
          ) : (
            <ul className="space-y-0.5">
              {recentlyViewed.slice(0, 3).map((bug) => (
                <li key={bug.id}>
                  <Link
                    href={`/bugs/${bug.id}`}
                    className={cn("text-[11px] text-foreground hover:text-primary hover:underline line-clamp-1 block")}
                  >
                    {bug.title || "Untitled bug"}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  )
}
