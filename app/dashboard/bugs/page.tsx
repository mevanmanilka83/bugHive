import { requireAuthForPage } from "@/lib"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { BugExploreList } from "@/components/features/bugs/BugExploreList"

export default async function BugExplorePage() {
  const session = await requireAuthForPage()

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
                <h1 className="text-2xl font-semibold mb-4">Bug Explore</h1>
                <BugExploreList
                  userId={session.user.id}
                  currentUserName={session.user.name ?? session.user.email ?? undefined}
                  currentUserImage={session.user.image ?? undefined}
                  detailBasePath="/dashboard/bugs"
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

