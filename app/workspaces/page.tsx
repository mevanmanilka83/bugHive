import { requireAuthForPage, getSupabaseAdmin } from "@/lib"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PublicPageLayout } from "@/components/layout/public/PublicPageLayout"
import { WorkspaceSuccessBanner } from "@/components/features/workspaces/WorkspaceSuccessBanner"
import { WorkspaceGraphList } from "@/components/features/workspaces/WorkspaceGraphList"

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
      <WorkspaceSuccessBanner show={showSuccess} />

      {/* Same layout as Saved page: title card + content card */}
      <div className="rounded-lg border border-border/40 bg-card p-6 mb-6">
        <h1 className="mb-1 text-xl font-semibold sm:text-2xl">Saved relationship graphs</h1>
        <p className="text-sm text-muted-foreground">
          Save a bug relationship diagram from a bug page, then open it here to add ideas and solutions. Public graphs can be copied to your list to build on.
        </p>
      </div>

      {/* My graphs — primary section with count + sort aligned to header */}
      <div className="rounded-lg bg-card mb-5">
        <div className="px-4 pt-4 pb-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              My graphs
            </h2>
            <p className="text-sm text-muted-foreground">
              Your private and public graphs. Open any to add ideas and solutions.
            </p>
          </div>
          {myGraphs.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs text-muted-foreground">
                {myGraphs.length.toLocaleString()}{" "}
                {myGraphs.length === 1 ? "graph" : "graphs"}
              </p>
              <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1 py-1">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-md bg-muted">
                  Newest
                </span>
              </div>
            </div>
          )}
        </div>
        <WorkspaceGraphList
          graphs={myGraphs}
          emptyMessage="No graphs yet. Open a bug, click the relationship graph icon, then &quot;Save relationship diagram&quot; (as private or public)."
          emptyAction={
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

      {/* Public graphs — secondary section with improved empty state */}
      <div className="rounded-lg bg-card">
        <div className="px-4 pt-4 pb-3 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Public graphs
            </h2>
            <p className="text-sm text-muted-foreground">
              Open any graph to view it. Use &quot;Save to my graphs&quot; to copy it privately and add your own ideas.
            </p>
          </div>
          {publicGraphs.length > 0 && (
            <div className="flex items-center gap-3">
              <p className="shrink-0 text-xs text-muted-foreground">
                {publicGraphs.length.toLocaleString()}{" "}
                {publicGraphs.length === 1 ? "graph" : "graphs"}
              </p>
              <div className="inline-flex items-center gap-1 rounded-md border bg-background px-1 py-1">
                <span className="px-3 py-1.5 text-xs font-semibold rounded-md bg-muted">
                  Newest
                </span>
              </div>
            </div>
          )}
        </div>
        {publicGraphs.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground/80">
              <span className="text-lg">📈</span>
            </div>
            <p className="font-medium text-foreground mb-1">No public graphs yet</p>
            <p className="max-w-sm mx-auto">
              When you or your team save a relationship graph as public, it will
              appear here for everyone to open, explore, and copy into their own
              workspace.
            </p>
          </div>
        ) : (
          <WorkspaceGraphList
            graphs={publicGraphs.map((g) => ({ ...g, is_public: true }))}
            emptyMessage=""
          />
        )}
      </div>
    </PublicPageLayout>
  )
}
