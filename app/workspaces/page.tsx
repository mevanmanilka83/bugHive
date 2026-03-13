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

  // Include workspaces the user owns OR where they are a member of the origin cluster
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
            <Link
              href="/workspaces/overview"
              className="focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border bg-clip-padding font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none gap-2! rounded-none aria-expanded:ring-[2px] aria-expanded:ring-ring/30 cursor-pointer border-border dark:bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3 active:scale-[0.97] transition-all duration-150"
            >
              Open overview
            </Link>
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
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Browse bugs
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      </div>
    </PublicPageLayout>
  )
}
