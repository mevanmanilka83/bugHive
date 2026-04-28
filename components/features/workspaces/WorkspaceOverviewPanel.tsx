import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type WorkspaceOverviewItem = {
  id: string
  title?: string | null
  description?: string | null
  is_public?: boolean
  updated_at?: string | null
}

interface WorkspaceOverviewPanelProps {
  stats: {
    myTotal: number
    myPublic: number
    myPrivate: number
    discoverablePublic: number
  }
  recentMine: WorkspaceOverviewItem[]
  discoverPublic: WorkspaceOverviewItem[]
}

function formatUpdated(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString()
}

export function WorkspaceOverviewPanel({
  stats,
  recentMine,
  discoverPublic,
}: WorkspaceOverviewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My total graphs</CardDescription>
            <CardTitle className="text-2xl">{stats.myTotal.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My public graphs</CardDescription>
            <CardTitle className="text-2xl">{stats.myPublic.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My private graphs</CardDescription>
            <CardTitle className="text-2xl">{stats.myPrivate.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Public graphs to discover</CardDescription>
            <CardTitle className="text-2xl">{stats.discoverablePublic.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recently updated by me</CardTitle>
            <CardDescription>Jump back into your latest graph workspaces.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentMine.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved graphs yet.</p>
            ) : (
              recentMine.map((graph) => (
                <Link
                  key={graph.id}
                  href={`/workspaces/${graph.id}`}
                  className="block rounded-none border p-3 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium leading-none">
                    {graph.title || "Untitled graph"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatUpdated(graph.updated_at)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discover public workspaces</CardTitle>
            <CardDescription>Explore recent public graphs from other users.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {discoverPublic.length === 0 ? (
              <p className="text-sm text-muted-foreground">No public workspaces available right now.</p>
            ) : (
              discoverPublic.map((graph) => (
                <Link
                  key={graph.id}
                  href={`/workspaces/${graph.id}`}
                  className="block rounded-none border p-3 hover:bg-muted/50 transition-colors"
                >
                  <p className="text-sm font-medium leading-none">
                    {graph.title || "Untitled graph"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Updated {formatUpdated(graph.updated_at)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild className="px-4">
          <Link href="/workspaces">Back to saved graphs</Link>
        </Button>
      </div>
    </div>
  )
}
