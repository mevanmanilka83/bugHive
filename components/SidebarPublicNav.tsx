"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  IconActivity,
  IconBell,
  IconBookmark,
  IconBug,
  IconHelpCircle,
  IconHome2,
  IconSettings,
  IconTag,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react"
import { SidebarDashboardActions } from "@/components/SidebarDashboardActions"
import { NotificationBadge } from "@/components/NotificationBadge"

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
  icon: Icon
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
    "flex items-center gap-2 rounded-full px-3 py-2 text-sm",
    isActive ? "bg-muted font-medium text-foreground" : "hover:bg-muted",
  ].join(" ")
}

export function SidebarPublicNav({
  active,
  isAuthenticated,
  useAuthFallback = false,
  className,
}: SidebarPublicNavProps) {
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
        // Silently fail
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
        .catch(() => {})
    }

    window.addEventListener("notification:updated", onNotificationUpdate as EventListener)
    return () =>
      window.removeEventListener(
        "notification:updated",
        onNotificationUpdate as EventListener
      )
  }, [isAuthenticated])

  const primaryItems: NavItem[] = [
    {
      key: "home",
      title: "Home",
      href: "/",
      icon: IconHome2,
    },
    {
      key: "public",
      title: "Public bugs",
      href: "/",
      icon: IconBug,
    },
    {
      key: "mybugs",
      title: "My bugs",
      href: "/mybugs",
      icon: IconBug,
      requiresAuth: true,
    },
    {
      key: "tags",
      title: "Tags",
      href: "/tags",
      icon: IconTag,
    },
    {
      key: "clusters",
      title: "Teams & clusters",
      href: "/clusters",
      icon: IconUsersGroup,
    },
  ]

  const secondaryItems: NavItem[] = [
    {
      key: "notifications",
      title: "Notifications",
      href: "/notifications",
      icon: IconBell,
      requiresAuth: true,
    },
    {
      key: "workspaces",
      title: "Workspaces",
      href: "/workspaces",
      icon: IconBookmark,
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
      key: "activity",
      title: "Activity",
      href: "/activity",
      icon: IconActivity,
      requiresAuth: true,
    },
    {
      key: "settings",
      title: "Settings",
      href: "/settings",
      icon: IconSettings,
      requiresAuth: true,
    },
    {
      key: "faq",
      title: "FAQ",
      href: "/settings/faq",
      icon: IconHelpCircle,
      requiresAuth: true,
    },
  ]

  const isFaqPage = pathname === "/settings/faq"
  const isSettingsRoot = pathname === "/settings" || pathname === "/settings/"

  return (
    <aside
      className={[
        "w-52 shrink-0 flex-col text-sm text-muted-foreground flex",
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

          return (
            <Link key={item.key} href={href} className={navLinkClass(item.key === active)}>
              <item.icon className="size-4" />
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

            return (
              <Link
                key={item.key}
                href={href}
                className={navLinkClass(
                  (item.key === "settings" && isSettingsRoot) ||
                    (item.key === "faq" && isFaqPage) ||
                    (item.key !== "settings" && item.key !== "faq" && item.key === active)
                )}
              >
                <item.icon className="size-4" />
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
