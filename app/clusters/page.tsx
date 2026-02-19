import { auth } from "@/lib"
import { ClustersList } from "@/components/clusters/ClustersList"
import { PublicPageLayout } from "@/components/PublicPageLayout"

export default async function ClustersPage() {
  const session = await auth()
  const isAuthenticated = !!session?.user?.id
  const userId = session?.user?.id

  return (
    <PublicPageLayout session={session} sidebarActive="clusters">
      <ClustersList
        userId={userId}
        isAuthenticated={isAuthenticated}
        basePath="/clusters"
        title="Team Clusters"
        description="Create and manage teams to collaborate on bugs."
      />
    </PublicPageLayout>
  )
}
