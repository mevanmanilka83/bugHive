import { requireAuthForPage } from "@/lib"
import { MyBugsPageContent } from "@/components/features/bugs/MyBugsPageContent"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"

export default async function MyBugsPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <PublicPageLayout session={session} sidebarActive="mybugs">
      <MyBugsPageContent
        userId={userId}
        currentUserName={session.user.name ?? session.user.email ?? undefined}
        currentUserImage={session.user.image ?? undefined}
      />
    </PublicPageLayout>
  )
}
