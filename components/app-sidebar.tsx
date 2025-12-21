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

const data = {
  navMain: [
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
      url: "/dashboard/bugs?view=clusters",
      icon: IconUsers,
    },
  ],
  navClouds: [],
  navSecondary: [
    {
      title: "Notifications",
      url: "/dashboard?view=notifications",
      icon: IconBell,
    },
    {
      title: "Settings",
      url: "/dashboard/settings",
      icon: IconSettings,
    },
  ],
  documents: [
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
  ],
}

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
  const userData = {
    name: user?.name || "User",
    email: user?.email || "user@example.com",
    avatar: user?.image || "/next.svg",
  }

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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
