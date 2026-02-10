"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  IconBell,
  IconBookmark,
  IconBug,
  IconHome2,
  IconLogin,
  IconSettings,
  IconUsersGroup,
} from "@tabler/icons-react"

type NavKey = "home" | "public" | "mybugs" | "clusters" | "notifications" | "saved" | "settings"

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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const returnTo = React.useMemo(() => {
    const qs = searchParams?.toString()
    return qs ? `${pathname}?${qs}` : pathname
  }, [pathname, searchParams])
  const authFallbackHref = `/auth/signin?callbackUrl=${encodeURIComponent(returnTo)}`

  const items: NavItem[] = [
    { key: "home", title: "Home", href: "/", icon: IconHome2 },
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
      icon: IconUsersGroup,
    },
    {
      key: "notifications",
      title: "Alerts",
      href: "/notifications",
      icon: IconBell,
      requiresAuth: true,
    },
    {
      key: "saved",
      title: "Saved",
      href: "/saved",
      icon: IconBookmark,
      requiresAuth: true,
    },
    {
      key: "settings",
      title: "Settings",
      href: "/settings",
      icon: IconSettings,
      requiresAuth: true,
    },
  ]

  const visibleItems = items.filter(
    (item) => !item.requiresAuth || isAuthenticated
  )

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t bg-background/95 backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)] lg:hidden"
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
