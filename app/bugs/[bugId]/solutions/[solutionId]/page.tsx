import Link from "next/link"
import { GalleryVerticalEnd } from "lucide-react"
import { IconBug, IconHome2, IconTag, IconUsersGroup } from "@tabler/icons-react"
import { auth, getSingleRecord, ensureValidUUID, supabase } from "@/lib"
import { BugDetailsView } from "@/components/bugs/BugDetailsView"
import { SolutionDetailsForm } from "@/components/bugs/SolutionDetailsForm"
import { HomeHeaderUser } from "@/components/HomeHeaderUser"
import { SidebarDashboardActions } from "@/components/SidebarDashboardActions"
import { notFound } from "next/navigation"

export default async function BugSolutionDetailsPage({
  params,
}: {
  params: Promise<{ bugId: string; solutionId: string }>
}) {
  const session = await auth()
  const { bugId, solutionId } = await params
  const bugUuid = ensureValidUUID(bugId)
  const solutionUuid = ensureValidUUID(solutionId)

  let bug: Awaited<ReturnType<typeof getSingleRecord>>
  try {
    bug = await getSingleRecord("bugs", bugUuid)
  } catch {
    notFound()
  }

  // Fetch the solution details
  let solution: any = null
  try {
    const { data, error } = await supabase
      .from("bug_solution_details")
      .select("*")
      .eq("id", solutionUuid)
      .eq("bug_id", bugUuid)
      .single()

    if (error || !data) {
      notFound()
    }
    solution = data
  } catch {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4">
        {/* Top navigation – same as bug details page */}
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

        {/* Main content – same layout as bug details page */}
        <div className="flex flex-1 gap-6 py-6">
          {/* Left sidebar (same as bug details) */}
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
              href={`/bugs/${bugUuid}`}
              className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block"
            >
              ← Back to bug details
            </Link>
            <div className="mb-4">
              <h1 className="text-2xl font-semibold tracking-tight">
                {solution?.title || "Solution details"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Solution information and details
              </p>
            </div>
            <div className="flex flex-col gap-4 overflow-y-auto text-sm rounded-lg border bg-card p-4 md:p-6">
              <SolutionDetailsForm
                solution={solution}
                userId={session?.user?.id ?? undefined}
              />
            </div>
          </section>
        </div>

        {/* Footer – same as bug details page */}
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

