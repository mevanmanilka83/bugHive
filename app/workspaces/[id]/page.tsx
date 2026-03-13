import Link from "next/link"
import { requireAuthForPage, getSupabaseAdmin, isClusterOwnerOrMember } from "@/lib"
import { notFound } from "next/navigation"
import { WorkspaceCanvas } from "@/components/features/workspaces/WorkspaceCanvas"
import { CopyGraphButton } from "@/components/features/workspaces/CopyGraphButton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await requireAuthForPage()
    const { id } = await params

    const supabase = await getSupabaseAdmin()
    const { data: workspace } = await (supabase as any)
        .from("saved_graphs")
        .select("*")
        .eq("id", id)
        .single()

    if (!workspace) {
        notFound()
    }

    const isOwner = workspace.user_id === session.user.id
    const isPublic = Boolean(workspace.is_public)

    let isClusterMember = false
    if (workspace.origin_cluster_id) {
        isClusterMember = await isClusterOwnerOrMember(session.user.id, workspace.origin_cluster_id)
    }

    const canView = isPublic || isOwner || isClusterMember
    if (!canView) {
        notFound()
    }

    const canEdit = isOwner || isClusterMember

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
            <header className="flex h-14 items-center justify-between border-b px-4 lg:px-6 bg-card shrink-0 gap-4">
                <div className="flex items-center gap-2 min-w-0">
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                        <Link href="/workspaces" aria-label="Back to workspaces">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold truncate">{workspace.title}</h1>
                    <span className="text-sm text-muted-foreground hidden sm:inline-block truncate">
                        {workspace.description || "Graph idea workspace"}
                    </span>
                </div>
                {!isOwner && isPublic && (
                    <CopyGraphButton workspaceId={id} />
                )}
            </header>
            <main className="flex-1 w-full relative">
                <WorkspaceCanvas
                    initialWorkspace={workspace}
                    isOwner={isOwner}
                    canEdit={canEdit}
                    userId={session.user.id}
                    userName={session.user.name ?? session.user.email ?? "Anonymous"}
                />
            </main>
        </div>
    )
}
