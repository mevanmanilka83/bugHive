import { auth } from "@/lib"
import { ClusterBugsPage } from "@/components/clusters/ClusterBugsPage"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function ClusterDetailPage({
  params,
}: {
  params: Promise<{ clusterId: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  const isAuthenticated = !!session?.user?.id
  const { clusterId } = await params

  return (
    <PublicPageLayout session={session} sidebarActive="clusters">
      <ClusterBugsPage
        clusterId={clusterId}
        userId={userId}
        isAuthenticated={isAuthenticated}
        clustersHref="/clusters"
        bugDetailsBaseHref={`/clusters/${clusterId}/bugs`}
      />
    </PublicPageLayout>
  )
}
