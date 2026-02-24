import { NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId, supabase } from "@/lib"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { data, error } = await (supabase as any).from("saved_graphs").select("*").eq("id", id).single()

        if (error || !data) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        // Add an isOwner check optionally based on auth (simplifying since RLS handles read restrictions mostly)
        return NextResponse.json({ success: true, workspace: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to load workspace" }, { status: 500 })
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const { title, description, nodes, edges } = body

        // Validate Ownership before update via admin or RLS authenticated client
        const supabaseAdmin = await getSupabaseAdmin()

        const { data: ws } = await (supabaseAdmin as any).from("saved_graphs").select("user_id").eq("id", id).single()
        if (!ws || ws.user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        // Perform update
        const { data, error } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .update({
                title,
                description,
                nodes,
                edges,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, workspace: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to update workspace" }, { status: 500 })
    }
}
