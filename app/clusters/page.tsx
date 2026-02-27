import { auth } from "@/lib"
import { ClustersList } from "@/components/features/clusters/ClustersList"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"

export default async function ClustersPage() {
  const session = await auth()
  const isAuthenticated = !!session?.user?.id
  const userId = session?.user?.id

  return (
    <PublicPageLayout session={session} sidebarActive="clusters">
      <div className="max-w-4xl">
        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Team clusters</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage teams to collaborate on bugs.
          </p>
        </div>

        <div className="rounded-lg border border-border/40 bg-card p-4 sm:p-6">
          <ClustersList
            userId={userId}
            isAuthenticated={isAuthenticated}
            basePath="/clusters"
            variant="embedded"
          />
        </div>
      </div>
    </PublicPageLayout>
  )
}
