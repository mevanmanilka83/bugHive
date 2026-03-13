import Link from "next/link"
import { auth, getRecordOrNotFound, ensureValidUUID, supabase } from "@/lib"
import { incrementViewCount } from "@/lib"
import { BugDetailsView } from "@/components/features/bugs/BugDetailsView"
import { RelatedBugsPanel } from "@/components/features/bugs/RelatedBugsPanel"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { GraphButton } from "@/components/features/bugs/GraphButton"
import { notFound, redirect } from "next/navigation"

export default async function ClusterBugDetailsPage({
  params,
}: {
  params: Promise<{ clusterId: string; bugId: string }>
}) {
  const session = await auth()
  const { clusterId, bugId } = await params
  const validatedBugId = ensureValidUUID(bugId)

  const bug = await getRecordOrNotFound("bugs", validatedBugId)
  if (bug.cluster_id !== clusterId) notFound()
  await incrementViewCount("bugs", validatedBugId)

  const { data: cluster, error } = await supabase
    .from("clusters")
    .select("id, owner_id, members, visibility")
    .eq("id", clusterId)
    .single()

  if (error || !cluster) notFound()

  const visibility = String(cluster.visibility || "private").toLowerCase()
  const userId = session?.user?.id ? ensureValidUUID(session.user.id) : null
  const isMember =
    !!userId && Array.isArray(cluster.members) && cluster.members.includes(userId)
  const isOwner = !!userId && cluster.owner_id === userId

  if (visibility !== "public" && !isOwner && !isMember) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(
        `/clusters/${clusterId}/bugs/${bugId}`,
      )}`,
    )
  }

  return (
    <PublicPageLayout
      session={session}
      sidebarActive="clusters"
      aside={<RelatedBugsPanel bugId={bug.id} context="cluster" />}
    >
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/clusters/${clusterId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Cluster
        </Link>
        <GraphButton bugId={bug.id} />
      </div>
      <BugDetailsView bug={bug} userId={session?.user?.id} />
    </PublicPageLayout>
  )
}
