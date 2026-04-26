"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type QuickAction = {
  title: string
  description: string
  href: string
}

const ACTIONS: QuickAction[] = [
  {
    title: "My Bugs",
    description: "Review and manage your reported bugs.",
    href: "/dashboard/mybugs",
  },
  {
    title: "Notifications",
    description: "Check mentions, invites, and updates.",
    href: "/dashboard/notifications",
  },
  {
    title: "Activity Feed",
    description: "See your recent actions across BugHive.",
    href: "/dashboard/activity",
  },
  {
    title: "Workspaces",
    description: "Open and continue your saved graphs.",
    href: "/dashboard/workspaces",
  },
]

export function DashboardQuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIONS.map((action) => (
        <Link key={action.title} href={action.href}>
          <Card className="h-full border-border/60 transition-colors hover:bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{action.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-xs text-muted-foreground">
              {action.description}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
