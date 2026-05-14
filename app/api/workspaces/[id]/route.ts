import { NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId, supabase, isClusterOwnerOrMember } from "@/lib"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const { data, error } = await (supabase as any)
            .from("saved_graphs")
            .select("*")
            .eq("id", id)
            .single()

        if (error || !data) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        const userId = await getAuthenticatedUserId()

        const isOwner = userId && data.user_id === userId
        const isPublic = Boolean(data.is_public)
        let isClusterMember = false

        if (data.origin_cluster_id && userId) {
            isClusterMember = await isClusterOwnerOrMember(userId, data.origin_cluster_id)
        }

        const canView = isPublic || isOwner || isClusterMember

        if (!canView) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

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

        const supabaseAdmin = await getSupabaseAdmin()

        const { data: ws } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .select("user_id, origin_cluster_id")
            .eq("id", id)
            .single()

        if (!ws) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        let canEdit = ws.user_id === userId
        if (!canEdit && ws.origin_cluster_id) {
            canEdit = await isClusterOwnerOrMember(userId, ws.origin_cluster_id)
        }

        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const body = await request.json().catch(() => ({}))
        const title = typeof body?.title === "string" ? body.title.trim() : ""
        const description = typeof body?.description === "string" ? body.description : undefined

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 })
        }

        const supabaseAdmin = await getSupabaseAdmin()

        const { data: ws } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .select("user_id, origin_cluster_id")
            .eq("id", id)
            .single()

        if (!ws) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        let canEdit = ws.user_id === userId
        if (!canEdit && ws.origin_cluster_id) {
            canEdit = await isClusterOwnerOrMember(userId, ws.origin_cluster_id)
        }

        if (!canEdit) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const updatePayload: Record<string, unknown> = {
            title,
            updated_at: new Date().toISOString(),
        }
        if (description !== undefined) updatePayload.description = description

        const { data, error } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .update(updatePayload)
            .eq("id", id)
            .select("id, title, description, updated_at")
            .single()

        if (error) throw error
        return NextResponse.json({ success: true, workspace: data })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to rename workspace" }, { status: 500 })
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const userId = await getAuthenticatedUserId()
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { id } = await params
        const supabaseAdmin = await getSupabaseAdmin()

        const { data: ws } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .select("user_id, origin_cluster_id")
            .eq("id", id)
            .single()

        if (!ws) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 })
        }

        let canDelete = ws.user_id === userId
        if (!canDelete && ws.origin_cluster_id) {
            canDelete = await isClusterOwnerOrMember(userId, ws.origin_cluster_id)
        }

        if (!canDelete) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const { error } = await (supabaseAdmin as any)
            .from("saved_graphs")
            .delete()
            .eq("id", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to delete workspace" }, { status: 500 })
    }
}
