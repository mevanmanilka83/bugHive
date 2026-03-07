import Link from "next/link"
import { auth, getRecordOrNotFound, ensureValidUUID } from "@/lib"
import { incrementViewCount } from "@/lib"
import { BugDetailsView } from "@/components/features/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/features/bugs/RelatedBugsPanel"
import { GraphButton } from "@/components/features/bugs/GraphButton"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"

export default async function BugDetailsPage({
  params,
}: {
  params: Promise<{ bugId: string }>
}) {
  const session = await auth()
  const { bugId } = await params
  const validatedBugId = ensureValidUUID(bugId)

  const bug = await getRecordOrNotFound("bugs", validatedBugId)
  await incrementViewCount("bugs", validatedBugId)

  return (
    <PublicPageLayout
      session={session}
      sidebarActive="public"
      useAuthFallback
      aside={<RelatedBugsPanel bugId={bug.id} />}
    >
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
    </PublicPageLayout>
  )
}
