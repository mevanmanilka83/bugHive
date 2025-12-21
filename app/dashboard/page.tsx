import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/ChartAreaInteractive"
import { DataTable } from "@/components/DataTable"
import { SectionCards } from "@/components/SectionCards"
import { SiteHeader } from "@/components/SiteHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={session.user} />
      <SidebarInset>
        <SiteHeader user={session.user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
