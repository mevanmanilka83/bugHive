import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId } from "@/lib"

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(request.url)
        const publicOnly = searchParams.get("public") === "1" || searchParams.get("public") === "true"

        const supabase = await getSupabaseAdmin()

        if (publicOnly) {
            const { data, error } = await (supabase as any)
                .from("saved_graphs")
                .select("id, title, description, origin_bug_id, origin_cluster_id, is_public, created_at, updated_at")
                .eq("is_public", true)
                .order("updated_at", { ascending: false })
                .limit(50)
            if (error) throw error
            return NextResponse.json({ success: true, graphs: data || [] })
        }

        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        const { data, error } = await (supabase as any)
            .from("saved_graphs")
            .select("id, title, description, origin_bug_id, origin_cluster_id, is_public, created_at, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(100)
        if (error) throw error
        return NextResponse.json({ success: true, graphs: data || [] })
    } catch (e: any) {
        console.error("List graphs error:", e)
        return NextResponse.json({ error: e.message || "Failed to list graphs" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const body = await request.json()
        const { title, description, nodes, edges, origin_bug_id, origin_cluster_id, is_public } = body

        if (!title || !nodes || !edges) {
            return NextResponse.json({ error: "Missing required graph data" }, { status: 400 })
        }

        const supabase = await getSupabaseAdmin()
        const { data, error } = await (supabase as any)
            .from("saved_graphs")
            .insert({
                user_id: userId,
                title,
                description: description ?? null,
                nodes,
                edges,
                origin_bug_id: origin_bug_id || null,
                origin_cluster_id: origin_cluster_id || null,
                is_public: Boolean(is_public),
            })
            .select("id")
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, graph: data })
    } catch (e: any) {
        console.error("Save graph error:", e)
        return NextResponse.json({ error: e.message || "Failed to save graph" }, { status: 500 })
    }
}
