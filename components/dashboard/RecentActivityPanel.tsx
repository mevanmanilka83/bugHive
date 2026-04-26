import Link from "next/link"
import type { RecentActivityItem } from "@/app/actions/activity"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
      return "Report"
    case "solution":
      return "Solution"
    case "bug_vote":
    case "solution_vote":
      return "Vote"
    case "comment":
      return "Comment"
    case "saved_bug":
      return "Saved"
    case "cluster_created":
      return "Cluster"
    case "cluster_joined":
      return "Joined"
    default:
      return "Activity"
  }
}

export function RecentActivityPanel({ items }: { items: RecentActivityItem[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.slice(0, 8).map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link
                  href={item.href}
                  className="flex items-start justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                >
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {typeLabel(item.type)} · {formatDate(item.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your latest reports, comments, votes, and saves will appear here.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
