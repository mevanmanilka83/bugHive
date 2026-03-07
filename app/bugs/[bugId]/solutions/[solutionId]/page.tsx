import Link from "next/link"
import { auth, getRecordOrNotFound, ensureValidUUID, supabase } from "@/lib"
import { incrementViewCount } from "@/lib"
import { SolutionDetailsForm } from "@/components/features/bugs/SolutionDetailsForm"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
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

  await getRecordOrNotFound("bugs", bugUuid)

  const { data: solution, error } = await supabase
    .from("bug_solution_details")
    .select("*")
    .eq("id", solutionUuid)
    .eq("bug_id", bugUuid)
    .single()

  if (error || !solution) notFound()
  await incrementViewCount("bug_solution_details", solutionUuid)

  return (
    <PublicPageLayout
      session={session}
      sidebarActive="public"
      useAuthFallback
    >
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
    </PublicPageLayout>
  )
}

