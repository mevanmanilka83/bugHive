import { requireAuthForPage } from "@/lib/auth/helpers"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/ChartAreaInteractive"
import { DataTable } from "@/components/DataTable"
import { SectionCards } from "@/components/SectionCards"
import { SiteHeader } from "@/components/SiteHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { saveUserToSupabase } from "@/app/actions/User"

import data from "./data.json"

export default async function DashboardPage() {
  const session = await requireAuthForPage()

  // Save user data to Supabase if not already saved
  // This runs in Node.js runtime, so Supabase works here
  // Use Promise to avoid blocking page render
  const userEmail = session.user.email
  if (userEmail) {
    const user = session.user
    // Don't await - let it run in background to avoid blocking page load
    saveUserToSupabase(
      userEmail,
      user?.name || null,
      user?.image || null,
      null // email_verified - could be set based on provider
    ).catch(() => {
      // Silently handle errors - user data saving is non-critical for page load
    })
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
              <SectionCards userId={session.user.id} />
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
