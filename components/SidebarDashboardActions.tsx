"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface SidebarDashboardActionsProps {
  isAuthenticated: boolean
}

export function SidebarDashboardActions({
  isAuthenticated,
}: SidebarDashboardActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button asChild className="w-full rounded-full">
        <Link href={isAuthenticated ? "/dashboard" : "/auth/signin"}>
          Dashboard
        </Link>
      </Button>
    </div>
  )
}

