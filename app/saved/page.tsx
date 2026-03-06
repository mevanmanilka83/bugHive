import { requireAuthForPage } from "@/lib"
import { SavedBugsList } from "@/components/features/saved/SavedBugsList"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function SavedPage() {
  const session = await requireAuthForPage()
  const userId = session.user.id

  return (
    <PublicPageLayout session={session} sidebarActive="saved">
      <div className="max-w-4xl">
        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold sm:text-2xl">Saved bugs</h1>
            <Button asChild variant="outline" size="sm">
              <Link href="/saved/board">Open board</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Bugs you&apos;ve saved to revisit later.
          </p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card">
          <SavedBugsList userId={userId} />
        </div>
      </div>
    </PublicPageLayout>
  )
}
