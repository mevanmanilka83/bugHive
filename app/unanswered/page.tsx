import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAuthForPage } from "@/lib"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { Button } from "@/components/ui/button"
import { UnansweredBugsQueue } from "@/components/features/bugs/UnansweredBugsQueue"

export default async function UnansweredPage() {
  const session = await requireAuthForPage()

  return (
    <PublicPageLayout session={session} sidebarActive="public">
      <div className="max-w-6xl">
        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <div className="mb-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to newest bugs
              </Link>
            </Button>
          </div>
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Unanswered bugs queue</h1>
          <p className="text-sm text-muted-foreground">
            Separate queue of bugs that still need their first solution.
          </p>
        </div>

        <UnansweredBugsQueue />
      </div>
    </PublicPageLayout>
  )
}
