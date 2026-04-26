import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAuthForPage, getSupabaseAdmin } from "@/lib"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import { WorkspaceOverviewPanel } from "@/components/features/workspaces/WorkspaceOverviewPanel"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default async function DashboardWorkspacesOverviewPage() {
  const session = await requireAuthForPage()
  const user = session.user
  const supabase = await getSupabaseAdmin()

  const [mineResult, discoverResult] = await Promise.all([
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, is_public, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, is_public, updated_at")
      .eq("is_public", true)
      .neq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
  ])

  const myGraphs: any[] = mineResult.data ?? []
  const discoverablePublicGraphs: any[] = discoverResult.data ?? []

  const stats = {
    myTotal: myGraphs.length,
    myPublic: myGraphs.filter((item) => Boolean(item.is_public)).length,
    myPrivate: myGraphs.filter((item) => !item.is_public).length,
    discoverablePublic: discoverablePublicGraphs.length,
  }

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
                <div className="max-w-5xl">
                  <div className="mb-6 mt-4 rounded-none border border-border/40 bg-card p-6">
                    <div className="mb-3">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/workspaces" className="inline-flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Saved graphs
                        </Link>
                      </Button>
                    </div>
                    <h1 className="text-xl font-semibold sm:text-2xl">Workspace overview</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track your graph workspace activity and discover new public workspaces.
                    </p>
                  </div>

                  <WorkspaceOverviewPanel
                    stats={stats}
                    recentMine={myGraphs.slice(0, 6)}
                    discoverPublic={discoverablePublicGraphs.slice(0, 6)}
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
