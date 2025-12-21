"use client"

import * as React from "react"
import {
  IconCamera,
  IconDashboard,
  IconDatabase,
  IconBell,
  IconFileDescription,
  IconFileWord,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
import { GalleryVerticalEnd } from "lucide-react"

import { NavDocuments } from "@/components/NavDocuments"
import { NavMain } from "@/components/NavMain"
import { NavSecondary } from "@/components/NavSecondary"
import { NavUser } from "@/components/NavUser"
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
    name?: string | null
    email?: string | null
    image?: string | null
  }
}) {
  const [notificationCount, setNotificationCount] = React.useState(0)

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
        // Silently fail
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  React.useEffect(() => {
    const onNotificationUpdate = () => {
      fetch('/api/notifications?unread=true&limit=100')
        .then(res => res.json())
        .then(data => {
          const unreadCount = data?.notifications?.filter((n: any) => !n.read).length || 0
          setNotificationCount(unreadCount)
        })
        .catch(() => {})
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
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Bug Explore",
      url: "/dashboard/bugs",
      icon: IconSearch,
    },
    {
      title: "My Bugs",
      url: "/dashboard/my-bugs",
      icon: IconFileDescription,
    },
    {
      title: "Team Clusters",
      url: "/dashboard/clusters",
      icon: IconUsers,
    },
  ]

  const navSecondary = [
    {
      title: "Notifications",
      url: "/dashboard/notifications",
      icon: IconBell,
      notificationCount,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ]

  const documents = [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ]

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <span className="text-base font-semibold">Bug Hive</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavDocuments items={documents} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
