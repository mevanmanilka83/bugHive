import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin, getAuthenticatedUserId, getUserClusterIds } from "@/lib"
import { awardBugXP, awardGraphArchitectBadge, checkDeepDiverBadge, checkOnFireBadge } from "@/lib"

export async function GET(request: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId()
        const { searchParams } = new URL(request.url)
        const publicOnly = searchParams.get("public") === "1" || searchParams.get("public") === "true"
        const clusterId = searchParams.get("clusterId")

        const supabase = await getSupabaseAdmin()

        // Cluster-scoped listing: workspaces for a specific cluster
        if (clusterId) {
            const baseQuery = (supabase as any)
                .from("saved_graphs")
                .select("id, title, description, origin_bug_id, origin_cluster_id, is_public, created_at, updated_at")
                .eq("origin_cluster_id", clusterId)
                .order("updated_at", { ascending: false })

            // Unauthenticated: only cluster-public workspaces
            if (!userId) {
                const { data, error } = await baseQuery.eq("is_public", true).limit(50)
                if (error) throw error
                return NextResponse.json({ success: true, graphs: data || [] })
            }

            // Authenticated: show all for this cluster; client can filter by private/public
            const { data, error } = await baseQuery.limit(100)
            if (error) throw error
            return NextResponse.json({ success: true, graphs: data || [] })
        }

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

        const userClusterIds = await getUserClusterIds(userId)

        const ownerPromise = (supabase as any)
            .from("saved_graphs")
            .select("id, title, description, origin_bug_id, origin_cluster_id, is_public, created_at, updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false })
            .limit(100)

        const clusterPromise =
            userClusterIds.size > 0
                ? (supabase as any)
                      .from("saved_graphs")
                      .select("id, title, description, origin_bug_id, origin_cluster_id, is_public, created_at, updated_at")
                      .in("origin_cluster_id", Array.from(userClusterIds))
                      .order("updated_at", { ascending: false })
                      .limit(100)
                : Promise.resolve({ data: [] })

        const [ownerResult, clusterResult] = await Promise.all([ownerPromise, clusterPromise])

        const graphsMap = new Map<string, any>()
        for (const g of ownerResult.data ?? []) {
            graphsMap.set(g.id, g)
        }
        for (const g of clusterResult.data ?? []) {
            if (!graphsMap.has(g.id)) {
                graphsMap.set(g.id, g)
            }
        }

        return NextResponse.json({ success: true, graphs: Array.from(graphsMap.values()) })
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
        let { title, description, nodes, edges, origin_bug_id, origin_cluster_id, is_public } = body

        if (!title || !nodes || !edges) {
            return NextResponse.json({ error: "Missing required graph data" }, { status: 400 })
        }

        const supabase = await getSupabaseAdmin()

        // Derive origin_cluster_id from origin_bug_id when not explicitly provided
        if (!origin_cluster_id && origin_bug_id) {
            try {
                const { data: bug } = await (supabase as any)
                    .from("bugs")
                    .select("cluster_id")
                    .eq("id", origin_bug_id)
                    .single()

                if (bug?.cluster_id) {
                    origin_cluster_id = bug.cluster_id
                }
            } catch {
                // If we fail to look up the bug/cluster, continue without blocking workspace creation.
            }
        }
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

        const nodeIds = Array.isArray(nodes)
          ? nodes.map((n: { id?: string }) => n?.id).filter((id): id is string => typeof id === "string")
          : []
        const xp = await awardBugXP(userId, "graph_node", {
          nodeIds,
          graphId: data?.id,
        })
        awardGraphArchitectBadge(userId).catch(() => {})
        checkDeepDiverBadge(userId).catch(() => {})
        checkOnFireBadge(userId).catch(() => {})

        return NextResponse.json({ success: true, graph: data, xpEarned: xp })
    } catch (e: any) {
        console.error("Save graph error:", e)
        return NextResponse.json({ error: e.message || "Failed to save graph" }, { status: 500 })
    }
}
