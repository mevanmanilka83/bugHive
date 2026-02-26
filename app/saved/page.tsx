import { requireAuthForPage } from "@/lib"
import { SavedBugsList } from "@/components/features/saved/SavedBugsList"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"

export default async function SavedPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <PublicPageLayout session={session} sidebarActive="saved">
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Saved</h1>
        <p className="text-sm text-muted-foreground">
          Keep track of bugs you want to revisit.
        </p>
      </div>
      <div className="rounded-lg bg-card">
        <SavedBugsList userId={userId} />
      </div>
    </PublicPageLayout>
  )
}
