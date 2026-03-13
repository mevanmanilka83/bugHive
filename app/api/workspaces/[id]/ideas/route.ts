import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId, isClusterOwnerOrMember } from "@/lib"

/**
 * GET /api/workspaces/[id]/ideas
 * List ideas/solutions for a saved graph (owner or public graph).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const supabase = await getSupabaseAdmin()

    const { data: graph } = await (supabase as any)
      .from("saved_graphs")
      .select("id, user_id, is_public, origin_cluster_id")
      .eq("id", id)
      .single()

    if (!graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 })
    }

    const userId = await getAuthenticatedUserId()
    let isClusterMember = false
    if (graph.origin_cluster_id && userId) {
      isClusterMember = await isClusterOwnerOrMember(userId, graph.origin_cluster_id)
    }
    const canView = graph.is_public || (userId && graph.user_id === userId) || isClusterMember
    if (!canView) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: ideas, error } = await (supabase as any)
      .from("graph_ideas")
      .select("id, kind, title, content, created_at, updated_at")
      .eq("saved_graph_id", id)
      .order("created_at", { ascending: true })

    if (error) throw error
    return NextResponse.json({ success: true, ideas: ideas ?? [] })
  } catch (e: any) {
    console.error("List ideas error:", e)
    return NextResponse.json({ error: e.message || "Failed to list ideas" }, { status: 500 })
  }
}

/**
 * POST /api/workspaces/[id]/ideas
 * Add an idea/solution/fix to a saved graph (owner only).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    const body = await request.json()
    const { kind = "idea", title, content } = body

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const validKind = ["idea", "solution", "fix"].includes(kind) ? kind : "idea"
    const supabase = await getSupabaseAdmin()

    const { data: graph, error: fetchErr } = await (supabase as any)
      .from("saved_graphs")
      .select("id, user_id, origin_cluster_id")
      .eq("id", id)
      .single()

    if (fetchErr || !graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 })
    }

    let canEdit = graph.user_id === userId
    if (!canEdit && graph.origin_cluster_id) {
      canEdit = await isClusterOwnerOrMember(userId, graph.origin_cluster_id)
    }

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: idea, error: insertErr } = await (supabase as any)
      .from("graph_ideas")
      .insert({
        saved_graph_id: id,
        user_id: userId,
        kind: validKind,
        title: title.trim(),
        content: content && typeof content === "string" ? content.trim() : null,
      })
      .select()
      .single()

    if (insertErr) throw insertErr
    return NextResponse.json({ success: true, idea })
  } catch (e: any) {
    console.error("Add idea error:", e)
    return NextResponse.json({ error: e.message || "Failed to add idea" }, { status: 500 })
  }
}

/**
 * DELETE /api/workspaces/[id]/ideas
 * Delete an idea/solution/fix from a saved graph (owner only).
 * Expects JSON body: { id: string }
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    const body = await request.json().catch(() => null)
    const ideaId = body?.id as string | undefined

    if (!ideaId) {
      return NextResponse.json({ error: "Idea id is required" }, { status: 400 })
    }

    const supabase = await getSupabaseAdmin()

    // Ensure the current user owns the graph
    const { data: graph, error: fetchErr } = await (supabase as any)
      .from("saved_graphs")
      .select("id, user_id, origin_cluster_id")
      .eq("id", id)
      .single()

    if (fetchErr || !graph) {
      return NextResponse.json({ error: "Graph not found" }, { status: 404 })
    }

    let canEdit = graph.user_id === userId
    if (!canEdit && graph.origin_cluster_id) {
      canEdit = await isClusterOwnerOrMember(userId, graph.origin_cluster_id)
    }

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { error: deleteErr } = await (supabase as any)
      .from("graph_ideas")
      .delete()
      .eq("id", ideaId)
      .eq("saved_graph_id", id)

    if (deleteErr) throw deleteErr

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error("Delete idea error:", e)
    return NextResponse.json({ error: e.message || "Failed to delete idea" }, { status: 500 })
  }
}
