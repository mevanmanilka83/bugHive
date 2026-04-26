"use client"

import * as React from "react"
import {
  IconFileDescription,
  IconSearch,
  IconGitBranch,
} from "@tabler/icons-react"
import { Share2 } from "lucide-react"
import Image from "next/image"
import { BellIcon } from "@/components/ui/bell"
import { SettingsIcon } from "@/components/ui/settings"
import { UsersIcon } from "@/components/ui/users"

import { GlobalGraphDialog } from "@/components/features/graph/GlobalGraphDialog"
import { NavMain } from "@/components/navigation/NavMain"
import { NavSecondary } from "@/components/navigation/NavSecondary"
import { NavUser } from "@/components/navigation/NavUser"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    id?: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}) {
  const BellNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <BellIcon size={16} className={className} />
    ),
    []
  )
  const SettingsNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <SettingsIcon size={16} className={className} />
    ),
    []
  )
  const ClustersNavIcon = React.useCallback(
    ({ className }: { className?: string }) => (
      <UsersIcon size={16} className={className} />
    ),
    []
  )

  const [notificationCount, setNotificationCount] = React.useState(0)
  const [graphOpen, setGraphOpen] = React.useState(false)

  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=100')
        if (res.ok) {
          const data = await res.json()
          const unreadCount = data?.notifications?.filter((n: any) => !n.read).length || 0
          setNotificationCount(unreadCount)
        }
      } catch (error) {
      }
    }

    fetchNotifications()
  }, [])

  React.useEffect(() => {
    const onNotificationUpdate = () => {
      fetch('/api/notifications?unread=true&limit=100')
        .then(res => res.json())
        .then(data => {
          const unreadCount = data?.notifications?.filter((n: any) => !n.read).length || 0
          setNotificationCount(unreadCount)
        })
        .catch(() => { })
    }

    window.addEventListener("notification:updated", onNotificationUpdate as EventListener)
    return () => window.removeEventListener("notification:updated", onNotificationUpdate as EventListener)
  }, [])

  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "/next.svg",
  }

  const navMain = [
    {
      title: "Bug Explore",
      url: "/dashboard/bugs",
      icon: IconSearch,
    },
    {
      title: "My Bugs",
      url: "/dashboard/mybugs",
      icon: IconFileDescription,
    },
    {
      title: "Team Clusters",
      url: "/dashboard/clusters",
      icon: ClustersNavIcon,
    },
    {
      title: "Saved Graphs",
      url: "/dashboard/workspaces",
      icon: IconGitBranch,
    },
  ]

  const navSecondary = [
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: BellNavIcon,
      notificationCount,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: SettingsNavIcon,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <GlobalGraphDialog open={graphOpen} onOpenChange={setGraphOpen} userId={user?.id} />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="BugHive logo"
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <span className="text-base font-semibold">BugHive</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          <SidebarMenuItem>
            <button
              onClick={() => setGraphOpen(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors group"
            >
              <Share2 className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Graph View</span>
            </button>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}

