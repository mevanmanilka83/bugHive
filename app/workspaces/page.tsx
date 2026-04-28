import { requireAuthForPage, getSupabaseAdmin, getUserClusterIds } from "@/lib"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { WorkspaceSuccessBanner } from "@/components/features/workspaces/WorkspaceSuccessBanner"
import { WorkspaceGraphsPanel } from "@/components/features/workspaces/WorkspaceGraphsPanel"
import { Button } from "@/components/ui/button"

export default async function WorkspacesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }> | { saved?: string }
}) {
  const session = await requireAuthForPage()
  const supabase = await getSupabaseAdmin()
  const resolved = searchParams
    ? await (typeof (searchParams as Promise<{ saved?: string }>).then === "function"
        ? (searchParams as Promise<{ saved?: string }>)
        : Promise.resolve(searchParams as { saved?: string }))
    : {}
  const showSuccess = resolved.saved === "1"

  const userClusterIds = await getUserClusterIds(session.user.id)

  const ownerPromise = (supabase as any)
    .from("saved_graphs")
    .select("id, title, description, is_public, updated_at, origin_cluster_id")
    .eq("user_id", session.user.id)
    .order("updated_at", { ascending: false })
    .limit(100)

  const clusterPromise =
    userClusterIds.size > 0
      ? (supabase as any)
          .from("saved_graphs")
          .select("id, title, description, is_public, updated_at, origin_cluster_id")
          .in("origin_cluster_id", Array.from(userClusterIds))
          .order("updated_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] })

  const publicPromise = (supabase as any)
    .from("saved_graphs")
    .select("id, title, description, updated_at")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(50)

  const [ownerResult, clusterResult, publicResult] = await Promise.all([
    ownerPromise,
    clusterPromise,
    publicPromise,
  ])

  const myGraphsMap = new Map<string, any>()
  for (const g of ownerResult.data ?? []) {
    myGraphsMap.set(g.id, g)
  }
  for (const g of clusterResult.data ?? []) {
    if (!myGraphsMap.has(g.id)) {
      myGraphsMap.set(g.id, g)
    }
  }

  const myGraphs: any[] = Array.from(myGraphsMap.values())
  const publicGraphs: any[] = publicResult.data ?? []

  return (
    <PublicPageLayout session={session} sidebarActive="workspaces">
      <div className="max-w-4xl">
        <WorkspaceSuccessBanner show={showSuccess} />

        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold sm:text-2xl">
              Saved relationship graphs
            </h1>
            <Button asChild className="px-4">
              <Link href="/workspaces/overview">
                Open overview
              </Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Save a bug relationship diagram from a bug page, then open it here to add
            ideas and solutions. Public graphs can be copied to your list to build on.
          </p>
        </div>

        <WorkspaceGraphsPanel
          myGraphs={myGraphs}
          publicGraphs={publicGraphs}
          myEmptyAction={
            <Button asChild>
              <Link href="/" className="inline-flex items-center gap-2">
                Browse bugs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </div>
    </PublicPageLayout>
  )
}
