import { requireAuthForPage } from "@/lib"
import { AppSidebar } from "@/components/appSidebar"
import { SiteHeader } from "@/components/SiteHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ClustersList } from "@/components/clusters/ClustersList"

export default async function ClustersPage() {
  const session = await requireAuthForPage()
  const user = session.user
  const userId = user.id

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <ClustersList
                  userId={userId}
                  isAuthenticated
                  title="Team Clusters"
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
