import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireAuthForPage, getSupabaseAdmin } from "@/lib"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { WorkspaceOverviewPanel } from "@/components/features/workspaces/WorkspaceOverviewPanel"
import { Button } from "@/components/ui/button"

export default async function WorkspacesOverviewPage() {
  const session = await requireAuthForPage()
  const supabase = await getSupabaseAdmin()

  const [mineResult, discoverResult] = await Promise.all([
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, is_public, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, is_public, updated_at")
      .eq("is_public", true)
      .neq("user_id", session.user.id)
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
    <PublicPageLayout session={session} sidebarActive="workspaces">
      <div className="max-w-5xl">
        <div className="mb-6 mt-4 rounded-none border border-border/40 bg-card p-6">
          <div className="mb-3">
            <Button asChild className="px-4">
              <Link href="/workspaces" className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Saved graphs
              </Link>
            </Button>
          </div>
          <h1 className="text-xl font-semibold sm:text-2xl">Workspace overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A separate overview to track your graph workspace activity and discover new public workspaces.
          </p>
        </div>

        <WorkspaceOverviewPanel
          stats={stats}
          recentMine={myGraphs.slice(0, 6)}
          discoverPublic={discoverablePublicGraphs.slice(0, 6)}
        />
      </div>
    </PublicPageLayout>
  )
}
