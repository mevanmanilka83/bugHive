import { auth } from "@/lib"
import { AppFooter } from "@/components/AppFooter"
import { AppHeader } from "@/components/AppHeader"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { SidebarPublicNav } from "@/components/SidebarPublicNav"
import { ClusterBugsPage } from "@/components/clusters/ClusterBugsPage"

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
    <main className="min-h-screen bg-muted/20 flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 pb-20 sm:px-4 md:pb-0">
        <AppHeader session={session} />

        <div className="flex flex-1 gap-6 py-6">
          <SidebarPublicNav
            active="clusters"
            isAuthenticated={isAuthenticated}
            className="hidden md:flex md:shrink-0"
          />

          <section className="flex-1 min-w-0">
            <ClusterBugsPage
              clusterId={clusterId}
              userId={userId}
              isAuthenticated={isAuthenticated}
              clustersHref="/clusters"
              bugDetailsBaseHref={`/clusters/${clusterId}/bugs`}
            />
          </section>
        </div>

        <AppFooter />
      </div>
      <MobileBottomNav active="clusters" isAuthenticated={isAuthenticated} />
    </main>
  )
}
