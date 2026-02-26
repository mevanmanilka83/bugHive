"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { GalleryVerticalEnd } from "lucide-react"

export function PublicHeader({ 
  user 
}: { 
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}) {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-3" />
          </div>
          <h1 className="text-base font-medium">BugHive Dashboard</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">
            Welcome, {user?.name || user?.email || "User"}!
          </span>
        </div>
      </div>
    </header>
  )
}
