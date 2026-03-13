import { NextResponse } from "next/server"
import { supabase } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export type OverviewResponse = {
  stats: {
    questions: number
    answers: number
    comments: number
    upvotes: number
    usersOnline: number | null
  }
  clusters: { id: string; name: string }[]
  unansweredBugs: { id: string; title: string; priority?: string; status?: string; created_at?: string }[]
  recentBugs: { id: string; title: string; priority?: string; status?: string; created_at?: string }[]
}

/** GET: Community overview for the fire-icon dialog (stats, clusters, unanswered, recent). */
export async function GET() {
  try {
    const [
      bugsRes,
      solutionsRes,
      bugUpvotesRes,
      solutionUpvotesRes,
      commentsRes,
      clustersRes,
      unansweredBugsRes,
      recentBugsRes,
    ] = await Promise.all([
      supabase.from("bugs").select("id", { count: "exact", head: true }),
      supabase.from("bug_solution_details").select("id", { count: "exact", head: true }),
      supabase.from("bug_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("solution_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("bug_comments").select("id", { count: "exact", head: true }),
      supabase.from("clusters").select("id, name").limit(10),
      supabase.rpc("get_unanswered_bugs", { lim: 5 }),
      supabase.from("bugs").select("id, title, priority, status, created_at").order("created_at", { ascending: false }).limit(5),
    ])

    const questions = bugsRes.count ?? 0
    const answers = solutionsRes.count ?? 0
    const bugUpvotes = bugUpvotesRes.count ?? 0
    const solutionUpvotes = solutionUpvotesRes.count ?? 0
    const comments = commentsRes.count ?? 0
    const upvotes = bugUpvotes + solutionUpvotes

    const clusters = (clustersRes.data ?? []).map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name || "Unnamed",
    }))

    const unansweredFromRpc = (unansweredBugsRes.data ?? []) as { id: string; title: string }[]
    let unansweredBugs: OverviewResponse["unansweredBugs"] = []
    if (unansweredFromRpc.length > 0) {
      const ids = unansweredFromRpc.map((b) => b.id)
      const { data: bugRows } = await supabase
        .from("bugs")
        .select("id, title, priority, status, created_at")
        .in("id", ids)
      const byId = new Map((bugRows ?? []).map((r: any) => [r.id, r]))
      unansweredBugs = unansweredFromRpc.map((b) => {
        const row = byId.get(b.id) as { priority?: string; status?: string; created_at?: string } | undefined
        return {
          id: b.id,
          title: b.title || "Untitled",
          priority: row?.priority,
          status: row?.status,
          created_at: row?.created_at,
        }
      })
    }

    const recentBugs = (recentBugsRes.data ?? []).map((b: { id: string; title: string; priority?: string; status?: string; created_at?: string }) => ({
      id: b.id,
      title: b.title || "Untitled",
      priority: b.priority,
      status: b.status,
      created_at: b.created_at,
    }))

    const overview: OverviewResponse = {
      stats: {
        questions,
        answers,
        comments,
        upvotes,
        usersOnline: null,
      },
      clusters,
      unansweredBugs,
      recentBugs,
    }

    return NextResponse.json(overview)
  } catch (error: unknown) {
    console.error("Overview API error:", error)
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Failed to fetch overview" },
      { status: 500 }
    )
  }
}
