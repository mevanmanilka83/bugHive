import { requireAuthForPage } from "@/lib"
import { NotificationsList } from "@/components/notifications/NotificationsList"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function NotificationsPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <PublicPageLayout session={session} sidebarActive="notifications">
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
    </PublicPageLayout>
  )
}
