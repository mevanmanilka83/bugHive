import { NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId } from "@/lib"

/**
 * POST /api/workspaces/[id]/copy
 * Copy a public saved graph to the current user's private graphs (so they can add ideas/solutions).
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await context.params
    const supabase = await getSupabaseAdmin()

    const { data: source, error: fetchErr } = await (supabase as any)
      .from("saved_graphs")
      .select("id, title, description, nodes, edges, origin_bug_id, origin_cluster_id")
      .eq("id", id)
      .eq("is_public", true)
      .single()

    if (fetchErr || !source) {
      return NextResponse.json({ error: "Public graph not found or not public" }, { status: 404 })
    }

    const { data: copy, error: insertErr } = await (supabase as any)
      .from("saved_graphs")
      .insert({
        user_id: userId,
        title: source.title ? `${source.title} (copy)` : "Copy of graph",
        description: source.description ?? null,
        nodes: source.nodes ?? [],
        edges: source.edges ?? [],
        origin_bug_id: source.origin_bug_id ?? null,
        origin_cluster_id: source.origin_cluster_id ?? null,
        is_public: false,
      })
      .select("id")
      .single()

    if (insertErr) throw insertErr

    return NextResponse.json({ success: true, graph: copy })
  } catch (e: any) {
    console.error("Copy graph error:", e)
    return NextResponse.json({ error: e.message || "Failed to copy graph" }, { status: 500 })
  }
}
