"use client"

import * as React from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Flame,
  MessageCircle,
  ArrowUp,
  HelpCircle,
  Eye,
} from "lucide-react"
import type { OverviewResponse } from "@/app/api/overview/route"
import { cn } from "@/lib/utils-client"

const CARD_CLASS =
  "rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
const SECTION_TITLE_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3"

export function HomeHeaderStatsDialog() {
  const [data, setData] = React.useState<OverviewResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((overview) => overview && setData(overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Community stats and quick links"
        >
          <Flame className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl lg:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Community overview</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading…</p>
          ) : data ? (
            <div className="lg:grid lg:grid-cols-2 lg:gap-5 lg:gap-y-4 flex flex-col gap-4">
              {/* Left column (desktop): Community stats + Teams & clusters */}
              <div className="lg:flex lg:flex-col lg:gap-4 flex flex-col gap-4">
                <div className={CARD_CLASS}>
                  <h3 className={SECTION_TITLE_CLASS}>Community stats</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <HelpCircle className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {data.stats.questions} questions
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {data.stats.answers} answers
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {data.stats.comments} comments
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowUp className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">
                        {data.stats.upvotes} upvotes
                      </span>
                    </li>
                  </ul>
                </div>

                <div className={CARD_CLASS}>
                  <h3 className={SECTION_TITLE_CLASS}>Teams & clusters</h3>
                  {data.clusters.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No clusters yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {data.clusters.slice(0, 5).map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/clusters/${c.id}`}
                            className="text-sm text-foreground hover:underline"
                            onClick={() => setOpen(false)}
                          >
                            {c.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/clusters"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    View all →
                  </Link>
                </div>
              </div>

              {/* Right column (desktop): Popular Unanswered + Recently viewed */}
              <div className="lg:flex lg:flex-col lg:gap-4 flex flex-col gap-4">
                <div className={CARD_CLASS}>
                  <h3 className={SECTION_TITLE_CLASS}>Popular Unanswered</h3>
                  {data.unansweredBugs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No unanswered bugs.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.unansweredBugs.slice(0, 5).map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/bugs/${b.id}`}
                            className="text-sm text-foreground hover:underline block min-w-0 break-words line-clamp-3"
                            onClick={() => setOpen(false)}
                            title={b.title}
                          >
                            {b.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/?sort=unanswered"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    View all →
                  </Link>
                </div>

                <div className={CARD_CLASS}>
                  <h3 className={cn(SECTION_TITLE_CLASS, "flex items-center gap-1.5")}>
                    <Eye className="size-3.5" />
                    Recently viewed
                  </h3>
                  {data.recentBugs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent bugs.</p>
                  ) : (
                    <ul className="space-y-2">
                      {data.recentBugs.slice(0, 5).map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/bugs/${b.id}`}
                            className="text-sm text-foreground hover:underline block min-w-0 break-words line-clamp-3"
                            onClick={() => setOpen(false)}
                            title={b.title}
                          >
                            {b.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/"
                    className="mt-2 inline-block text-sm text-primary hover:underline"
                    onClick={() => setOpen(false)}
                  >
                    View all →
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Unable to load overview.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
