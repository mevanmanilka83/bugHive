import { requireAuthForPage, getSupabaseAdmin, getUserClusterIds } from "@/lib"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import { WorkspaceSuccessBanner } from "@/components/features/workspaces/WorkspaceSuccessBanner"
import { WorkspaceGraphsPanel } from "@/components/features/workspaces/WorkspaceGraphsPanel"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardWorkspacesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }> | { saved?: string }
}) {
  const session = await requireAuthForPage()
  const user = session.user
  const supabase = await getSupabaseAdmin()
  const resolved = searchParams
    ? await (typeof (searchParams as Promise<{ saved?: string }>).then === "function"
        ? (searchParams as Promise<{ saved?: string }>)
        : Promise.resolve(searchParams as { saved?: string }))
    : {}
  const showSuccess = resolved.saved === "1"

  const userClusterIds = await getUserClusterIds(user.id)

  const ownerPromise = (supabase as any)
    .from("saved_graphs")
    .select("id, title, description, is_public, updated_at, origin_cluster_id")
    .eq("user_id", user.id)
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <PublicHeader user={user} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="max-w-4xl">
                  <WorkspaceSuccessBanner show={showSuccess} />
                  <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h1 className="text-xl font-semibold sm:text-2xl">Saved relationship graphs</h1>
                      <Link
                        href="/dashboard/workspaces/overview"
                        className="focus-visible:border-ring focus-visible:ring-ring/30 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 border bg-clip-padding font-medium focus-visible:ring-[2px] aria-invalid:ring-[2px] inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none rounded-none aria-expanded:ring-[2px] aria-expanded:ring-ring/30 cursor-pointer border-border dark:bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3 active:scale-[0.97] transition-all duration-150"
                      >
                        Open overview
                      </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Save a bug relationship diagram from a bug page, then open it here to add ideas and solutions.
                      Public graphs can be copied to your list to build on.
                    </p>
                  </div>

                  <WorkspaceGraphsPanel
                    myGraphs={myGraphs}
                    publicGraphs={publicGraphs}
                    detailBasePath="/dashboard/workspaces"
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
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
