import { supabase } from "@/lib"
import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** GET: Community stats for the home right sidebar (questions, answers, upvotes, unanswered bugs, etc.) */
export async function GET() {
  try {
    const [
      { count: usersCount },
      { data: bugs },
      { data: solutions },
      { data: clusters },
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase
        .from("bugs")
        .select("id, title, upvotes_count")
        .is("cluster_id", null)
        .order("created_at", { ascending: false })
        .limit(500),
      supabase.from("bug_solution_details").select("id, bug_id, upvotes_count"),
      supabase.from("clusters").select("id, name, visibility").eq("visibility", "public").limit(10),
    ])

    const questions = bugs?.length ?? 0
    const bugIdsWithSolutions = new Set((solutions ?? []).map((s: { bug_id: string }) => s.bug_id))
    const unansweredBugs = (bugs ?? []).filter((b: { id: string }) => !bugIdsWithSolutions.has(b.id)).slice(0, 5)
    const answers = solutions?.length ?? 0
    const upvotesBugs = (bugs ?? []).reduce((s: number, b: { upvotes_count?: number }) => s + (Number(b.upvotes_count) ?? 0), 0)
    const upvotesSolutions = (solutions ?? []).reduce((s: number, sol: { upvotes_count?: number }) => s + (Number(sol.upvotes_count) ?? 0), 0)
    const upvotes = upvotesBugs + upvotesSolutions

    return NextResponse.json({
      usersOnline: usersCount ?? 0,
      questions,
      answers,
      comments: 0,
      upvotes,
      unansweredBugs: unansweredBugs.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title || "Untitled bug" })),
      clusters: (clusters ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name || "Unnamed" })),
    })
  } catch (error: unknown) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      {
        usersOnline: 0,
        questions: 0,
        answers: 0,
        comments: 0,
        upvotes: 0,
        unansweredBugs: [],
        clusters: [],
      },
      { status: 200 }
    )
  }
}
