import { requireAuthForPage, getSupabaseAdmin } from "@/lib"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { WorkspaceSuccessBanner } from "@/components/features/workspaces/WorkspaceSuccessBanner"
import { WorkspaceGraphsPanel } from "@/components/features/workspaces/WorkspaceGraphsPanel"

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

  const [myResult, publicResult] = await Promise.all([
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, is_public, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false })
      .limit(100),
    (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, updated_at")
      .eq("is_public", true)
      .order("updated_at", { ascending: false })
      .limit(50),
  ])

  const myGraphs: any[] = myResult.data ?? []
  const publicGraphs: any[] = publicResult.data ?? []

  return (
    <PublicPageLayout session={session} sidebarActive="workspaces">
      <div className="max-w-4xl">
        <WorkspaceSuccessBanner show={showSuccess} />

        <div className="rounded-lg border border-border/40 bg-card p-6 mb-6 mt-4">
          <h1 className="mb-1 text-xl font-semibold sm:text-2xl">
            Saved relationship graphs
          </h1>
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
