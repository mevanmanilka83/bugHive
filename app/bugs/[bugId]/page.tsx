import Link from "next/link"
import { BarChart3 } from "lucide-react"
import { auth, getSingleRecord, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/bugs/RelatedBugsPanel"
import { BugGraphDialog } from "@/components/bugs/BugGraphDialog"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { notFound } from "next/navigation"
import { GraphButton } from "@/components/bugs/GraphButton"

export default async function BugDetailsPage({
  params,
}: {
  params: Promise<{ bugId: string }>
}) {
  const session = await auth()
  const { bugId } = await params
  const validatedBugId = ensureValidUUID(bugId)

  let bug: Awaited<ReturnType<typeof getSingleRecord>>
  try {
    bug = await getSingleRecord("bugs", validatedBugId)
    
    // Increment view count
    await incrementViewCount("bugs", validatedBugId)
  } catch {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        {/* Top navigation – same as homepage */}
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active="public"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex md:shrink-0"
          />

          <section className="flex-1 min-w-0 min-h-0 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Link
                href="/"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to Public bugs
              </Link>
              <GraphButton bugId={bug.id} />
            </div>
            <BugDetailsView
              bug={bug}
              userId={session?.user?.id ?? undefined}
            />
          </section>

          <aside className="hidden w-72 shrink-0 md:block">
            <div className="sticky top-6">
              <RelatedBugsPanel bugId={bug.id} />
            </div>
          </aside>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="public" isAuthenticated={!!session} useAuthFallback />
    </main>
  )
}
