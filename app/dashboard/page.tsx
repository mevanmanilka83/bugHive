import { requireAuthForPage } from "@/lib"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { ChartAreaInteractive } from "@/components/dashboard/ChartAreaInteractive"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import { DashboardQuickActions } from "@/components/dashboard/DashboardQuickActions"
import { UserKpiOverview } from "@/components/dashboard/UserKpiOverview"
import { ActivityInsightsPanel } from "@/components/dashboard/ActivityInsightsPanel"
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { saveUserToSupabase } from "@/app/actions/User"
import { getActivitySummary, getActivityTrend } from "@/app/actions/activity"

export default async function DashboardPage() {
  const session = await requireAuthForPage()
  const summaryResult = await getActivitySummary()
  const trendResult = await getActivityTrend(90)
  const summaryData = summaryResult.success ? summaryResult.data : null
  const trendData = trendResult.success ? trendResult.data : []

  const userEmail = session.user.email
  if (userEmail) {
    const user = session.user
    saveUserToSupabase(
      userEmail,
      user?.name || null,
      user?.image || null,
      null
    ).catch(() => {
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
        <PublicHeader user={session.user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <UserKpiOverview summaryData={summaryData} trendData={trendData} />
              </div>
              <div className="px-4 lg:px-6">
                <RecentActivityPanel items={summaryData?.recentActivity ?? []} />
              </div>
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={trendData} />
              </div>
              <div className="px-4 lg:px-6">
                <ActivityInsightsPanel trendData={trendData} />
              </div>
              <div className="px-4 lg:px-6">
                <DashboardQuickActions />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
