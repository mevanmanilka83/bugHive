import { requireAuthForPage, getSupabaseAdmin } from "@/lib"
import { requireRole } from "@/lib/auth/helpers"
import { AppSidebar } from "@/components/layout/app/AppSidebar"
import { PublicHeader } from "@/components/layout/public/PublicHeader"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import type React from "react"

export default async function AdminPage() {
  const session = await requireAuthForPage()

  // Ensure the user is an admin (will redirect/throw on failure if used differently)
  const roleResult = await requireRole("admin")
  if (!roleResult.success) {
    // Fallback: simple 403 text; you can swap this for a nicer error UI.
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Forbidden – admin access only.
      </div>
    ) as unknown as JSX.Element
  }

  const supabase = (await getSupabaseAdmin()) as any
  const [
    usersRes,
    bugsRes,
    clustersRes,
    workspacesRes,
    solutionsRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("bugs").select("id", { count: "exact", head: true }),
    supabase.from("clusters").select("id", { count: "exact", head: true }),
    supabase.from("saved_graphs").select("id", { count: "exact", head: true }),
    supabase
      .from("bug_solution_details")
      .select("id", { count: "exact", head: true }),
  ])

  const overview = {
    stats: {
      users: usersRes.count ?? 0,
      bugs: bugsRes.count ?? 0,
      clusters: clustersRes.count ?? 0,
      workspaces: workspacesRes.count ?? 0,
      solutions: solutionsRes.count ?? 0,
    },
    generatedAt: new Date().toISOString(),
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
      <AppSidebar variant="inset" user={session.user} />
      <SidebarInset>
        <PublicHeader user={session.user} />
        <main className="flex-1 px-4 py-4 lg:px-6 lg:py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <header className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                High-level overview of users, bugs, clusters, workspaces, and solutions.
              </p>
            </header>

            {overview ? (
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Users
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.stats.users.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Bugs
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.stats.bugs.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Solutions
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.stats.solutions.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Clusters
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.stats.clusters.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Workspaces
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    {overview.stats.workspaces.toLocaleString()}
                  </p>
                </div>
              </section>
            ) : (
              <p className="text-sm text-muted-foreground">
                Unable to load admin overview stats.
              </p>
            )}

            <section className="rounded-xl border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-2">
                Next steps
              </h2>
              <p className="text-sm text-muted-foreground">
                You now have admin APIs at <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/admin</code>,{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/admin/users</code>, and{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/api/admin/bugs</code>. We can extend this
                page with tables for managing users and bugs if you want a full CRUD UI.
              </p>
            </section>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

