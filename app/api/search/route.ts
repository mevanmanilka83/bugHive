import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") ?? "").trim()
    const type = searchParams.get("type") ?? "all"

    const supabase = getSupabaseAdmin() as any

    const results: { bugs: Array<{ id: string; title: string; description?: string | null }>; clusters: Array<{ id: string; name: string; description?: string | null }> } = {
      bugs: [],
      clusters: [],
    }

    if ((type === "bugs" || type === "all") && q.length >= 2) {
      const { data: bugs } = await supabase
        .from("bugs")
        .select("id, title, description")
        .ilike("title", `%${q}%`)
        .limit(15)
      results.bugs = (bugs ?? []).map((b: { id: string; title: string; description?: string | null }) => ({
        id: b.id,
        title: b.title,
        description: b.description,
      }))
    }

    if ((type === "clusters" || type === "all") && q.length >= 2) {
      const { data: clusters } = await supabase
        .from("clusters")
        .select("id, name, description")
        .ilike("name", `%${q}%`)
        .limit(15)
      results.clusters = (clusters ?? []).map((c: { id: string; name: string; description?: string | null }) => ({
        id: c.id,
        name: c.name,
        description: c.description,
      }))
    }

    return NextResponse.json(results)
  } catch (e: any) {
    console.error("Search error:", e)
    return NextResponse.json({ error: e.message || "Search failed" }, { status: 500 })
  }
}
