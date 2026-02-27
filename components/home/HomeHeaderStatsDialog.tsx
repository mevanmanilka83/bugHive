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
  XIcon,
  ChevronRight,
  ArrowRight,
} from "lucide-react"
import type { OverviewResponse } from "@/app/api/overview/route"
import { HomeHeaderStatsDialogSkeleton } from "@/components/features/skeletons/HomeHeaderStatsDialogSkeleton"

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
          className="rounded-full border-2 border-icon-orange p-1.5 text-icon-orange hover:bg-icon-orange/10 hover:text-icon-orange/90 focus:outline-none focus:ring-2 focus:ring-icon-orange focus:ring-offset-2 transition-colors"
          aria-label="Community stats and quick links"
        >
          <Flame className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl lg:max-w-4xl max-h-[70vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl shadow-2xl border-border/60"
      >
        {/* Sticky header with explicit close button */}
        <div className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md px-6 py-4 flex-shrink-0 flex items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-semibold leading-tight tracking-tight flex items-center gap-2">
              Community overview
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Activity snapshot and cluster highlights
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-muted-foreground/70 hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue"
            aria-label="Close dialog"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent">
          {loading ? (
            <HomeHeaderStatsDialogSkeleton />
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left column: Community stats + Teams & clusters */}
              <div className="flex flex-col gap-6">
                {/* Community Stats Section */}
                <section>
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-2.5 flex items-center gap-2">
                    <div className="size-1 rounded-full bg-brand-blue" />
                    Community stats
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Questions</span>
                        <HelpCircle className="size-3.5 opacity-70" />
                      </div>
                      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
                        {data.stats.questions}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Answers</span>
                        <MessageCircle className="size-3.5 opacity-70" />
                      </div>
                      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
                        {data.stats.answers}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Comments</span>
                        <MessageCircle className="size-3.5 opacity-70" />
                      </div>
                      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
                        {data.stats.comments}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-xs font-medium">Upvotes</span>
                        <ArrowUp className="size-3.5 opacity-70" />
                      </div>
                      <p className="text-2xl font-bold text-foreground leading-none tracking-tight">
                        {data.stats.upvotes}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Teams & Clusters Section */}
                <section>
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-2.5 flex items-center gap-2">
                    <div className="size-1 rounded-full bg-brand-blue" />
                    Teams & clusters
                  </h2>
                  {data.clusters.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 italic text-center bg-muted/20 rounded-md">No clusters active.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {data.clusters.slice(0, 5).map((c) => (
                        <li key={c.id}>
                          <Link
                            href={`/clusters/${c.id}`}
                            className="group flex items-center justify-between rounded-md border border-transparent px-2.5 py-1.5 hover:bg-muted/50 hover:border-border/40 transition-all"
                            onClick={() => setOpen(false)}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate text-sm text-foreground/90 group-hover:text-brand-blue transition-colors">{c.name}</span>
                              <span className="text-[10px] uppercase font-semibold text-brand-blue/70 bg-brand-blue/5 px-1.5 py-px rounded-sm opacity-70 group-hover:opacity-100 transition-opacity">Open</span>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-brand-blue/50 transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/clusters"
                    className="text-xs font-medium text-muted-foreground hover:text-brand-blue transition-colors mt-1.5 inline-flex items-center gap-1 px-1"
                    onClick={() => setOpen(false)}
                  >
                    View all clusters <ArrowRight className="size-3 text-brand-blue" />
                  </Link>
                </section>
              </div>

              {/* Right column: Popular Unanswered + Recently viewed */}
              <div className="flex flex-col gap-6">
                {/* Popular Unanswered Section */}
                <section>
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-2.5 flex items-center gap-2">
                    <div className="size-1 rounded-full bg-brand-blue" />
                    Popular unanswered
                  </h2>
                  {data.unansweredBugs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 italic text-center bg-muted/20 rounded-md">No unanswered bugs.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {data.unansweredBugs.slice(0, 5).map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/bugs/${b.id}`}
                            className="group flex items-center justify-between rounded-md border border-transparent px-2.5 py-1.5 hover:bg-muted/50 hover:border-border/40 transition-all"
                            onClick={() => setOpen(false)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-1.5 rounded-full bg-foreground/20 shrink-0" />
                              <span className="truncate text-sm text-foreground/90 group-hover:text-brand-blue transition-colors">{b.title}</span>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-brand-blue/50 transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/?sort=unanswered"
                    className="text-xs font-medium text-muted-foreground hover:text-brand-blue transition-colors mt-1.5 inline-flex items-center gap-1 px-1"
                    onClick={() => setOpen(false)}
                  >
                    View all unanswered <ArrowRight className="size-3 text-brand-blue" />
                  </Link>
                </section>

                {/* Recently Viewed Section */}
                <section>
                  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground/80 mb-2.5 flex items-center gap-2">
                    <Eye className="size-3.5" />
                    Recently viewed
                  </h2>
                  {data.recentBugs.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2 italic text-center bg-muted/20 rounded-md">No recent history.</p>
                  ) : (
                    <ul className="space-y-0.5">
                      {data.recentBugs.slice(0, 5).map((b) => (
                        <li key={b.id}>
                          <Link
                            href={`/bugs/${b.id}`}
                            className="group flex items-center justify-between rounded-md border border-transparent px-2.5 py-1.5 hover:bg-muted/50 hover:border-border/40 transition-all"
                            onClick={() => setOpen(false)}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0 group-hover:bg-brand-blue/50 transition-colors" />
                              <span className="truncate text-sm text-foreground/90 group-hover:text-brand-blue transition-colors">{b.title}</span>
                            </div>
                            <ChevronRight className="size-3.5 text-muted-foreground/30 group-hover:text-brand-blue/50 transition-colors" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link
                    href="/"
                    className="text-xs font-medium text-muted-foreground hover:text-brand-blue transition-colors mt-1.5 inline-flex items-center gap-1 px-1"
                    onClick={() => setOpen(false)}
                  >
                    Return to feed <ArrowRight className="size-3 text-brand-blue" />
                  </Link>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <HelpCircle className="size-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Unable to load community overview.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
