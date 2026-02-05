"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"

interface SidebarDashboardActionsProps {
  isAuthenticated: boolean
}

export function SidebarDashboardActions({
  isAuthenticated,
}: SidebarDashboardActionsProps) {
  const handleLogout = () => {
    signOut({ callbackUrl: "/" })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button asChild className="w-full rounded-full">
        <Link href={isAuthenticated ? "/dashboard" : "/auth/signin"}>
          Dashboard
        </Link>
      </Button>
      {isAuthenticated && (
        <Button
          type="button"
          className="w-full rounded-full"
          onClick={handleLogout}
        >
          Log out
        </Button>
      )}
    </div>
  )
}

