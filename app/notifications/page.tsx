import { requireAuthForPage } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"

export default async function NotificationsPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active="notifications"
            isAuthenticated
            className="hidden md:flex md:shrink-0"
          />

          <section className="flex-1 min-w-0">
            <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
              <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Stay up to date with bug activity and team updates.
              </p>
            </div>
            <div className="rounded-lg border border-border/40 bg-card">
              <div className="p-6">
                <NotificationsList userId={userId} />
              </div>
            </div>
          </section>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="notifications" isAuthenticated />
    </main>
  )
}
