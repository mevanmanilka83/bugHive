import Link from "next/link"
import {
  IconBell,
  IconBug,
  IconHome2,
  IconSettings,
  IconTag,
  IconUsersGroup,
  type Icon,
} from "@tabler/icons-react"
import { SidebarDashboardActions } from "@/components/SidebarDashboardActions"

type NavKey =
  | "home"
  | "public"
  | "mybugs"
  | "tags"
  | "clusters"
  | "notifications"
  | "settings"

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
) {
  if (requiresAuth && useAuthFallback && !isAuthenticated) {
    return "/auth/signin"
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
      href: "/dashboard/bugs",
      icon: IconTag,
      requiresAuth: true,
    },
    {
      key: "clusters",
      title: "Teams & clusters",
      href: "/clusters",
      icon: IconUsersGroup,
      requiresAuth: true,
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
      key: "settings",
      title: "Settings",
      href: "/settings",
      icon: IconSettings,
      requiresAuth: true,
    },
  ]

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
            )

            return (
              <Link
                key={item.key}
                href={href}
                className={navLinkClass(item.key === active)}
              >
                <item.icon className="size-4" />
                <span>{item.title}</span>
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
