"use client"

import Link from "next/link"
import { IconDashboard } from "@tabler/icons-react"

interface SidebarDashboardActionsProps {
  isAuthenticated: boolean
}

export function SidebarDashboardActions({
  isAuthenticated,
}: SidebarDashboardActionsProps) {
  const href = isAuthenticated ? "/dashboard" : "/auth/signin"
  return (
    <Link
      href={href}
      className={[
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "text-foreground/80 hover:text-foreground",
        "hover:bg-muted/60 focus-visible:bg-muted/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
        "transition-colors",
      ].join(" ")}
    >
      <IconDashboard className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span>Dashboard</span>
    </Link>
  )
}

