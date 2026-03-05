"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  IconBug,
  IconLogin,
} from "@tabler/icons-react"
import { ActivityIcon } from "@/components/ui/activity"
import { BellIcon } from "@/components/ui/bell"
import { BookmarkIcon } from "@/components/ui/bookmark"
import { HomeIcon } from "@/components/ui/home"
import { SettingsIcon } from "@/components/ui/settings"
import { UsersIcon } from "@/components/ui/users"

type NavKey =
  | "home"
  | "public"
  | "mybugs"
  | "tags"
  | "clusters"
  | "notifications"
  | "saved"
  | "workspaces"
  | "activity"
  | "settings"
  | "faq"

type NavItem = {
  key: NavKey
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresAuth?: boolean
}

type MobileBottomNavProps = {
  active: NavKey
  isAuthenticated: boolean
  useAuthFallback?: boolean
}

function resolveHref(
  href: string,
  requiresAuth: boolean | undefined,
  isAuthenticated: boolean,
  useAuthFallback: boolean,
  authFallbackHref: string,
) {
  if (requiresAuth && useAuthFallback && !isAuthenticated) {
    return authFallbackHref
  }
  return href
}

export function MobileBottomNav({
  active,
  isAuthenticated,
  useAuthFallback = false,
}: MobileBottomNavProps) {
  const BellNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <BellIcon size={20} className={className} />
    ),
    []
  )
  const BookmarkNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <BookmarkIcon size={20} className={className} />
    ),
    []
  )
  const HomeNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <HomeIcon size={20} className={className} />
    ),
    []
  )
  const SettingsNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <SettingsIcon size={20} className={className} />
    ),
    []
  )
  const ActivityNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <ActivityIcon size={20} className={className} />
    ),
    []
  )
  const ClustersNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <UsersIcon size={20} className={className} />
    ),
    []
  )

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const returnTo = React.useMemo(() => {
    const qs = searchParams?.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, searchParams])
  const authFallbackHref = `/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`

  const items: NavItem[] = [
    { key: "home", title: "Home", href: "/", icon: HomeNavIcon },
    {
      key: "mybugs",
      title: "My Bugs",
      href: "/mybugs",
      icon: IconBug,
      requiresAuth: true,
    },
    {
      key: "clusters",
      title: "Clusters",
      href: "/clusters",
      icon: ClustersNavIcon,
    },
    {
      key: "notifications",
      title: "Alerts",
      href: "/notifications",
      icon: BellNavIcon,
      requiresAuth: true,
    },
    {
      key: "saved",
      title: "Saved",
      href: "/saved",
      icon: BookmarkNavIcon,
      requiresAuth: true,
    },
    {
      key: "workspaces",
      title: "Workspaces",
      href: "/workspaces",
      icon: BookmarkNavIcon,
      requiresAuth: true,
    },
    {
      key: "activity",
      title: "Activity",
      href: "/activity",
      icon: ActivityNavIcon,
      requiresAuth: true,
    },
    {
      key: "settings",
      title: "Settings",
      href: "/settings",
      icon: SettingsNavIcon,
      requiresAuth: true,
    },
  ]

  const visibleItems = items.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {visibleItems.map((item) => {
        const href = resolveHref(
          item.href,
          item.requiresAuth,
          isAuthenticated,
          useAuthFallback,
          authFallbackHref,
        )
        const isActive =
          item.key === active ||
          (item.key === "home" && (pathname === "/" || active === "public")) ||
          (item.key === "mybugs" && pathname.startsWith("/mybugs")) ||
          (item.key === "clusters" && pathname.startsWith("/clusters")) ||
          (item.key === "notifications" && pathname.startsWith("/notifications")) ||
          (item.key === "saved" && pathname.startsWith("/saved")) ||
          (item.key === "workspaces" && pathname.startsWith("/workspaces")) ||
          (item.key === "activity" && pathname.startsWith("/activity")) ||
          (item.key === "settings" && pathname.startsWith("/settings"))

        return (
          <Link
            key={item.key}
            href={href}
            className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-center"
          >
            <item.icon
              className={`size-5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
            />
            <span
              className={`text-[10px] truncate w-full ${isActive ? "font-medium text-primary" : "text-muted-foreground"}`}
            >
              {item.title}
            </span>
          </Link>
        )
      })}
      {!isAuthenticated && (
        <Link
          href={authFallbackHref}
          className="flex flex-col items-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-center text-muted-foreground"
        >
          <IconLogin className="size-5 shrink-0" />
          <span className="text-[10px] truncate w-full">Sign in</span>
        </Link>
      )}
    </nav>
  )
}

