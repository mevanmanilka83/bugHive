import Link from "next/link"
import { auth, getSingleRecord, ensureValidUUID, supabase } from "@/lib"
import { incrementViewCount } from "@/lib/views"
import { SolutionDetailsForm } from "@/components/bugs/SolutionDetailsForm"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
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
    
    // Increment view count for solution
    await incrementViewCount("bug_solution_details", solutionUuid)
  } catch {
    notFound()
  }

  return (
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active="public"
            isAuthenticated={!!session}
            useAuthFallback
            className="hidden md:flex md:shrink-0"
          />

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

        <AppFooter />
      </div>
      <MobileBottomNav active="public" isAuthenticated={!!session} useAuthFallback />
    </main>
  )
}

