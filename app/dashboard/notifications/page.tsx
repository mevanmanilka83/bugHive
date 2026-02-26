import { requireAuthForPage } from "@/lib"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { NotificationsList } from "@/components/features/notifications/NotificationsList"

export default async function NotificationsPage() {
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
        <PublicHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-2xl font-semibold mb-4">Notifications</h1>
                <NotificationsList userId={userId} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
