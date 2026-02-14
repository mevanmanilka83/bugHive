import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth, getSingleRecord, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/bugs/RelatedBugsPanel"
import { RecentlyViewedTracker } from "@/components/bugs/RecentlyViewedTracker"
import { AppFooter } from "@/components/AppFooter"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { notFound } from "next/navigation"

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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        {/* Top navigation – same as homepage */}
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

        {/* Main content – sidebar | main | related panel; stacks on mobile */}
        <div className="flex flex-1 gap-0 py-6 md:gap-6">
          <SidebarPublicNav
            active="public"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex md:shrink-0"
          />

          <section className="min-w-0 flex-1 basis-0">
            <RecentlyViewedTracker bugId={bug.id} bugTitle={bug.title ?? ""} />
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
            >
              ← Back to Public bugs
            </Link>
            <BugDetailsView
              bug={bug}
              userId={session?.user?.id ?? undefined}
            />
          </section>

          <aside className="hidden md:block md:w-[152px] lg:w-[164px] xl:w-[176px] shrink-0 border-l border-border/60 bg-muted/20 pl-3">
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
