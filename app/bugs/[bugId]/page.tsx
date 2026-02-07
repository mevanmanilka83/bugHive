import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { auth, getSingleRecord, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/bugs/RelatedBugsPanel"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
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
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4">
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

        {/* Main content – same layout as homepage with left sidebar */}
        <div className="flex flex-1 flex-col gap-6 py-6 md:grid md:grid-cols-[200px_minmax(0,1fr)_320px] md:items-start lg:grid-cols-[220px_minmax(0,1fr)_360px] xl:grid-cols-[240px_minmax(0,1fr)_380px]">
          {/* Left sidebar (same as homepage) */}
          <SidebarPublicNav
            active="public"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex"
          />

          {/* Main content column */}
          <section className="min-w-0">
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

          <aside className="w-full">
            <RelatedBugsPanel bugId={bug.id} />
          </aside>
        </div>

        {/* Footer – same as homepage */}
        <footer className="mt-auto border-t bg-background">
          <div className="flex flex-col gap-2 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} BugHive. All rights reserved.</span>
            <span>Built for sharing and solving real-world bugs.</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
