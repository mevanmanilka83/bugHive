import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { requireAuthForPage } from "@/lib"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"

export default async function NotificationsPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <header className="border-b bg-background">
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold leading-tight">BugHive</span>
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <HomeHeaderUser session={session} />
            </div>
          </div>
        </header>

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active="notifications"
            isAuthenticated
            className="hidden md:flex"
          />

          <section className="flex-1 min-w-0">
            <div className="mb-4">
              <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Stay up to date with bug activity and team updates.
              </p>
            </div>
            <NotificationsList userId={userId} />
          </section>
        </div>

        <footer className="mt-auto border-t bg-background">
          <div className="flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} BugHive. All rights reserved.</span>
            <span>Built for sharing and solving real-world bugs.</span>
          </div>
        </footer>
      </div>
      <MobileBottomNav active="notifications" isAuthenticated />
    </main>
  )
}
