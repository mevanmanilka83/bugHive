import { NextResponse } from "next/server"
import { supabase } from "@/lib"
import { buildBugSubgraph } from "@/lib/graph-builder"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const bugId = searchParams.get("bugId")

        let mainBug: any = null
        if (bugId) {
            const { data } = await supabase.from("bugs").select("*").eq("id", bugId).single()
            mainBug = data
        } else {
            // Find the most recent bug as a fallback
            const { data } = await supabase.from("bugs").select("*").order("created_at", { ascending: false }).limit(1).single()
            mainBug = data
        }

        if (!mainBug) {
            return NextResponse.json({ error: "No bug found" }, { status: 404 })
        }

        const { center, nodes, edges } = await buildBugSubgraph(mainBug)

        const insights = {
            rootCausePatterns: ["Generated from real relationships"],
            recurringEnvironments: [],
            aiMetrics: { precision: 1.0 }
        }

        return NextResponse.json({ center, nodes, edges, insights })
    } catch (error) {
        console.error("Graph API Error:", error)
        return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 })
    }
}
