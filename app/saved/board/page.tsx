import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAuthForPage } from "@/lib"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { Button } from "@/components/ui/button"
import { SavedBugsBoard } from "@/components/features/saved/SavedBugsBoard"

export default async function SavedBoardPage() {
  const session = await requireAuthForPage()

  return (
    <PublicPageLayout session={session} sidebarActive="saved">
      <div className="max-w-6xl">
        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <div className="mb-3">
            <Button asChild className="px-4">
              <Link href="/saved" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Saved bugs list
              </Link>
            </Button>
          </div>
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Saved bugs board</h1>
          <p className="text-sm text-muted-foreground">
            Separate board view of your saved bugs grouped by status.
          </p>
        </div>

        <SavedBugsBoard />
      </div>
    </PublicPageLayout>
  )
}
