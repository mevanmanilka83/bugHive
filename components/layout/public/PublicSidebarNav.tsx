"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  IconBug,
  IconTag,
} from "@tabler/icons-react"
import { ActivityIcon } from "@/components/ui/activity"
import { BellIcon } from "@/components/ui/bell"
import { BookmarkIcon } from "@/components/ui/bookmark"
import { CircleHelpIcon } from "@/components/ui/circle-help"
import { HomeIcon } from "@/components/ui/home"
import { SettingsIcon } from "@/components/ui/settings"
import { UsersIcon } from "@/components/ui/users"
import { SidebarDashboardActions } from "@/components/layout/app/SidebarDashboardActions"
import { NotificationBadge } from "@/components/dashboard/NotificationBadge"

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

type SidebarPublicNavProps = {
  active: NavKey
  isAuthenticated: boolean
  useAuthFallback?: boolean
  className?: string
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

function navLinkClass(isActive: boolean) {
  return [
    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    "text-foreground/80 hover:text-foreground",
    "hover:bg-muted/60 focus-visible:bg-muted/60",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
    isActive ? "bg-muted text-foreground" : "",
  ].join(" ")
}

export function PublicSidebarNav({
  active,
  isAuthenticated,
  useAuthFallback = false,
  className,
}: SidebarPublicNavProps) {
  const BellNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <BellIcon size={16} className={className} />
    ),
    []
  )
  const BookmarkNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <BookmarkIcon size={16} className={className} />
    ),
    []
  )
  const HomeNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <HomeIcon size={16} className={className} />
    ),
    []
  )
  const SettingsNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <SettingsIcon size={16} className={className} />
    ),
    []
  )
  const FaqNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <CircleHelpIcon size={16} className={className} />
    ),
    []
  )
  const ActivityNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <ActivityIcon size={16} className={className} />
    ),
    []
  )
  const ClustersNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <UsersIcon size={16} className={className} />
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

  const [notificationCount, setNotificationCount] = React.useState(0)

  React.useEffect(() => {
    if (!isAuthenticated) return

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications?unread=true&limit=100")
        if (!res.ok) return
        const data = await res.json()
        const unreadCount =
          data?.notifications?.filter((n: any) => !n.read).length || 0
        setNotificationCount(unreadCount)
      } catch {
      }
    }

    fetchNotifications()
  }, [isAuthenticated])

  React.useEffect(() => {
    if (!isAuthenticated) return

    const onNotificationUpdate = () => {
      fetch("/api/notifications?unread=true&limit=100")
        .then((res) => res.json())
        .then((data) => {
          const unreadCount =
            data?.notifications?.filter((n: any) => !n.read).length || 0
          setNotificationCount(unreadCount)
        })
        .catch(() => { })
    }

    window.addEventListener("notification:updated", onNotificationUpdate as EventListener)
    return () =>
      window.removeEventListener(
        "notification:updated",
        onNotificationUpdate as EventListener,
      )
  }, [isAuthenticated])

  const primaryItems: NavItem[] = [
    { key: "home", title: "Home", href: "/", icon: HomeNavIcon },
    { key: "public", title: "Public bugs", href: "/", icon: IconBug },
    {
      key: "mybugs",
      title: "My bugs",
      href: "/mybugs",
      icon: IconBug,
      requiresAuth: true,
    },
    { key: "tags", title: "Tags", href: "/tags", icon: IconTag },
    { key: "clusters", title: "Teams & clusters", href: "/clusters", icon: ClustersNavIcon },
  ]

  const secondaryItems: NavItem[] = [
    {
      key: "notifications",
      title: "Notifications",
      href: "/notifications",
      icon: BellNavIcon,
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
      key: "saved",
      title: "Saved",
      href: "/saved",
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
    {
      key: "faq",
      title: "FAQ",
      href: "/settings/faq",
      icon: FaqNavIcon,
      requiresAuth: true,
    },
  ]

  const isFaqPage = pathname === "/settings/faq"
  const isSettingsRoot = pathname === "/settings" || pathname === "/settings/"

  return (
    <aside
      className={[
        "hidden md:flex w-52 shrink-0 flex-col text-sm text-muted-foreground",
        "h-[calc(100vh-7rem)] min-h-0 overflow-y-auto pr-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <nav className="space-y-2">
        {primaryItems.map((item) => {
          const href = resolveHref(
            item.href,
            item.requiresAuth,
            isAuthenticated,
            useAuthFallback,
            authFallbackHref,
          )

          const isActive = item.key === active
          return (
            <Link
              key={item.key}
              href={href}
              className={navLinkClass(isActive)}
              data-active={isActive ? "true" : "false"}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={[
                  "size-4 transition-colors",
                  isActive ? "text-icon-orange" : "text-muted-foreground group-hover:text-foreground",
                ].join(" ")}
              />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
      <div className="mt-8">
        <nav className="space-y-2 mb-4">
          {secondaryItems.map((item) => {
            const href = resolveHref(
              item.href,
              item.requiresAuth,
              isAuthenticated,
              useAuthFallback,
              authFallbackHref,
            )

            const isActive =
              (item.key === "settings" && isSettingsRoot) ||
              (item.key === "faq" && isFaqPage) ||
              (item.key !== "settings" && item.key !== "faq" && item.key === active)

            return (
              <Link
                key={item.key}
                href={href}
                className={navLinkClass(isActive)}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={[
                    "size-4 transition-colors",
                    isActive ? "text-icon-orange" : "text-muted-foreground group-hover:text-foreground",
                  ].join(" ")}
                />
                <span>{item.title}</span>
                {item.key === "notifications" && isAuthenticated && (
                  <NotificationBadge count={notificationCount} />
                )}
              </Link>
            )
          })}
        </nav>
        <div className="border-t pt-4">
          <SidebarDashboardActions isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </aside>
  )
}

