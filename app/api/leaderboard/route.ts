import { getSupabaseAdmin } from "@/lib"
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get("period") || "week"
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10) || 10, 50)

  try {
    const db = getSupabaseAdmin() as any

    let query = db
      .from("users")
      .select("id, name, email, image, points, badges, current_rank")
      .not("points", "is", null)
      .order("points", { ascending: false })
      .limit(limit)

    if (period === "week") {
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { getRankForXp } = await import("@/lib")
    const hunters = ((data || []) as any[]).map((u) => {
      const pts = u.points ?? 0
      const rank = getRankForXp(pts)
      return {
        id: u.id,
        name: u.name || u.email?.split("@")[0] || "Anonymous",
        image: u.image || null,
        points: pts,
        rank: rank.label,
        badges: Array.isArray(u.badges) ? u.badges : [],
      }
    })

    return NextResponse.json({ hunters, period })
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
