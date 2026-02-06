import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { IconBug, IconHome2, IconTag, IconUsersGroup } from "@tabler/icons-react"
import { auth, getSingleRecord, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { SidebarDashboardActions } from "@/components/SidebarDashboardActions"
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
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
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
        <div className="flex flex-1 gap-6 py-6">
          {/* Left sidebar (same as homepage) */}
          <aside className="hidden w-52 shrink-0 flex-col justify-between text-sm text-muted-foreground md:flex">
            <nav className="space-y-1">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconHome2 className="size-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconBug className="size-4" />
                <span>Public bugs</span>
              </Link>
              <Link
                href="/mybugs"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconBug className="size-4" />
                <span>My bugs</span>
              </Link>
              <Link
                href="/dashboard/bugs"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconTag className="size-4" />
                <span>Tags</span>
              </Link>
              <Link
                href="/clusters"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:bg-muted"
              >
                <IconUsersGroup className="size-4" />
                <span>Teams & clusters</span>
              </Link>
            </nav>
            <div className="mt-6 border-t pt-4">
              <SidebarDashboardActions isAuthenticated={!!session} />
            </div>
          </aside>

          {/* Main content column */}
          <section className="flex-1 min-w-0">
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
