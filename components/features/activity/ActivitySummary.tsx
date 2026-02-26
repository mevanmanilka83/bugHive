"use client"

import Link from "next/link"
import { cn } from "@/lib/utils-client"
import type { ActivitySummaryData, RecentActivityItem } from "@/app/actions/activity"

const CARD_CLASS =
  "rounded-lg border border-border/60 bg-background px-4 py-4 text-center"

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

function typeLabel(type: RecentActivityItem["type"]) {
  switch (type) {
    case "bug_report":
      return "Bug report"
    case "solution":
      return "Solution"
    case "bug_vote":
      return "Vote"
    case "solution_vote":
      return "Vote"
    default:
      return "Activity"
  }
}

export function ActivitySummary({
  data,
  error,
}: {
  data: ActivitySummaryData | null
  error: string | null
}) {
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Summary</h2>
          <p className="mt-1 text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const counts = data
    ? {
        bugReports: data.bugReportsCount,
        solutions: data.solutionsCount,
        votes: data.votesCount,
        clusters: data.clustersCount,
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Summary</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your contributions and activity on BugHive.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className={cn(CARD_CLASS)}>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {counts?.bugReports ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Bug reports</p>
        </div>
        <div className={cn(CARD_CLASS)}>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {counts?.solutions ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Solutions</p>
        </div>
        <div className={cn(CARD_CLASS)}>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {counts?.votes ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Votes</p>
        </div>
        <div className={cn(CARD_CLASS)}>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {counts?.clusters ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Clusters</p>
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background px-4 py-4">
        <h3 className="text-sm font-medium text-foreground">Recent activity</h3>
        {data?.recentActivity && data.recentActivity.length > 0 ? (
          <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
            {data.recentActivity.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-2 rounded-md py-1.5 pr-2 text-sm hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {item.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {typeLabel(item.type)} · {formatDate(item.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Your recent bug reports, solutions, and votes will appear here.
          </p>
        )}
      </div>
    </div>
  )
}
