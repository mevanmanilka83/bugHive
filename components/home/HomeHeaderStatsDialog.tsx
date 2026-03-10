"use client"

import * as React from "react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MessageCircle,
  ArrowUp,
  HelpCircle,
  Eye,
  XIcon,
  ChevronRight,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { FlameIcon } from "@/components/ui/flame"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { OverviewResponse } from "@/app/api/overview/route"
import { HomeHeaderStatsDialogSkeleton } from "@/components/features/skeletons/HomeHeaderStatsDialogSkeleton"
import { cn } from "@/lib"

const TEAMS_VISIBLE_INITIAL = 2

function formatTimeAgo(iso: string | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function BugRow({
  bug,
  href,
  onClose,
  variant,
}: {
  bug: { id: string; title: string; priority?: string; status?: string; created_at?: string }
  href: string
  onClose: () => void
  variant: "unanswered" | "recent"
}) {
  const title = bug.title || "Untitled"
  const isTruncated = title.length > 45

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-2 rounded-lg border border-transparent px-3 py-2.5 hover:bg-muted/60 hover:border-border/50 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
      onClick={onClose}
    >
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              variant === "unanswered" ? "bg-amber-500/80" : "bg-muted-foreground/50 group-hover:bg-primary/50"
            )}
          />
          {isTruncated ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "text-sm font-medium truncate leading-snug",
                    "text-foreground group-hover:text-primary transition-colors"
                  )}
                >
                  {title}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                sideOffset={6}
                className="max-w-[280px] border border-border/60 bg-popover text-popover-foreground shadow-md"
              >
                <p className="text-xs">{title}</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <span
              className={cn(
                "text-sm font-medium truncate leading-snug",
                "text-foreground group-hover:text-primary transition-colors"
              )}
            >
              {title}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 pl-3.5">
          {bug.priority && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal capitalize">
              {bug.priority}
            </Badge>
          )}
          {bug.status && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal capitalize">
              {bug.status}
            </Badge>
          )}
          {bug.created_at && (
            <span className="text-[10px] text-muted-foreground">
              {formatTimeAgo(bug.created_at)}
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
    </Link>
  )
}

function SectionCard({
  title,
  icon,
  children,
  footer,
  emptyMessage,
  isEmpty,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  emptyMessage: string
  isEmpty: boolean
}) {
  return (
    <section className="rounded-xl border border-border/50 bg-card/50 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-border/40 bg-muted/20">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/90 flex items-center gap-2">
          {icon ?? <div className="size-1.5 rounded-full bg-primary" />}
          {title}
        </h2>
      </div>
      <div className="p-3">
        {isEmpty ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
      {footer && <div className="px-3 pb-3">{footer}</div>}
    </section>
  )
}

export function HomeHeaderStatsDialog() {
  const [data, setData] = React.useState<OverviewResponse | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [teamsExpanded, setTeamsExpanded] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/overview")
      .then((res) => (res.ok ? res.json() : null))
      .then((overview) => overview && setData(overview))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [open])

  const clusters = data?.clusters ?? []
  const teamsVisible = teamsExpanded ? clusters.length : Math.min(TEAMS_VISIBLE_INITIAL, clusters.length)
  const hasMoreTeams = clusters.length > TEAMS_VISIBLE_INITIAL

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="border-2 border-icon-orange p-1.5 text-icon-orange hover:bg-icon-orange/10 hover:text-icon-orange/90 focus:outline-none focus:ring-2 focus:ring-icon-orange focus:ring-offset-2 transition-colors relative group/btn"
          aria-label="Community stats and quick links"
        >
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
          <FlameIcon className="size-4" size={16} />
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-2xl lg:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-xl shadow-2xl border-border/60"
      >
        {/* Sticky header with explicit close */}
        <div className="sticky top-0 z-20 border-b border-border/50 bg-background/95 backdrop-blur-md px-5 py-4 flex-shrink-0 flex items-center justify-between shadow-sm">
          <div>
            <DialogTitle className="text-lg font-bold leading-tight tracking-tight text-foreground">
              Community overview
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Activity snapshot and cluster highlights
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
            aria-label="Close dialog"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Main scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0">
          {loading ? (
            <HomeHeaderStatsDialogSkeleton />
          ) : data ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left column */}
              <div className="flex flex-col gap-5">
                <SectionCard
                  title="Community stats"
                  emptyMessage="No stats available."
                  isEmpty={false}
                >
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Questions", value: data.stats.questions, icon: HelpCircle },
                      { label: "Answers", value: data.stats.answers, icon: MessageCircle },
                      { label: "Comments", value: data.stats.comments, icon: MessageCircle },
                      { label: "Upvotes", value: data.stats.upvotes, icon: ArrowUp },
                    ].map(({ label, value, icon: Icon }) => (
                      <div
                        key={label}
                        className="flex flex-col gap-1 p-3 rounded-lg bg-muted/40 border border-border/40"
                      >
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="text-xs font-medium">{label}</span>
                          <Icon className="size-3.5 opacity-70" />
                        </div>
                        <p className="text-2xl font-bold text-foreground leading-tight tracking-tight">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Teams & clusters"
                  emptyMessage="No clusters active yet. Create one to collaborate."
                  isEmpty={clusters.length === 0}
                  footer={
                    clusters.length > 0 && (
                      <div className="flex items-center justify-between gap-2">
                        {hasMoreTeams && (
                          <button
                            type="button"
                            onClick={() => setTeamsExpanded(!teamsExpanded)}
                            className="text-xs font-medium text-primary hover:underline underline-offset-2"
                          >
                            {teamsExpanded ? (
                              <>Show less <ChevronUp className="inline size-3" /></>
                            ) : (
                              <>Show more ({clusters.length - TEAMS_VISIBLE_INITIAL}) <ChevronDown className="inline size-3" /></>
                            )}
                          </button>
                        )}
                        <Link
                          href="/clusters"
                          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                          onClick={() => setOpen(false)}
                        >
                          View all clusters <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    )
                  }
                >
                  <ul className="space-y-1">
                    {clusters.slice(0, teamsVisible).map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/clusters/${c.id}`}
                          className="group flex items-center justify-between rounded-lg border border-transparent px-3 py-2.5 hover:bg-muted/60 hover:border-border/50 transition-all"
                          onClick={() => setOpen(false)}
                        >
                          <span className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                            {c.name}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">
                              Open
                            </Badge>
                            <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary/60" />
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>

              {/* Right column */}
              <div className="flex flex-col gap-5">
                <SectionCard
                  title="Popular unanswered"
                  emptyMessage="No unanswered bugs yet. Great job!"
                  isEmpty={data.unansweredBugs.length === 0}
                  footer={
                    data.unansweredBugs.length > 0 && (
                      <Link
                        href="/?sort=unanswered"
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                        onClick={() => setOpen(false)}
                      >
                        View all unanswered <ArrowRight className="size-3" />
                      </Link>
                    )
                  }
                >
                  <ul className="space-y-1.5">
                    {data.unansweredBugs.slice(0, 5).map((b) => (
                      <li key={b.id}>
                        <BugRow
                          bug={b}
                          href={`/bugs/${b.id}`}
                          onClose={() => setOpen(false)}
                          variant="unanswered"
                        />
                      </li>
                    ))}
                  </ul>
                </SectionCard>

                <SectionCard
                  title="Recently viewed"
                  icon={<Eye className="size-3.5" />}
                  emptyMessage="No recent activity. Browse bugs to see them here."
                  isEmpty={data.recentBugs.length === 0}
                  footer={
                    data.recentBugs.length > 0 && (
                      <Link
                        href="/"
                        className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                        onClick={() => setOpen(false)}
                      >
                        Return to feed <ArrowRight className="size-3" />
                      </Link>
                    )
                  }
                >
                  <ul className="space-y-1.5">
                    {data.recentBugs.slice(0, 5).map((b) => (
                      <li key={b.id}>
                        <BugRow
                          bug={b}
                          href={`/bugs/${b.id}`}
                          onClose={() => setOpen(false)}
                          variant="recent"
                        />
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="size-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <HelpCircle className="size-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">Unable to load community overview</p>
              <p className="text-xs text-muted-foreground mt-1">Please try again later.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
