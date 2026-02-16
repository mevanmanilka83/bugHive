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
  unansweredBugs: { id: string; title: string }[]
  recentBugs: { id: string; title: string }[]
}

/** GET: Community overview for the fire-icon dialog (stats, clusters, unanswered, recent). */
export async function GET() {
  try {
    const [
      bugsRes,
      solutionsRes,
      bugUpvotesRes,
      solutionUpvotesRes,
      clustersRes,
      unansweredBugsRes,
      recentBugsRes,
    ] = await Promise.all([
      supabase.from("bugs").select("id", { count: "exact", head: true }),
      supabase.from("bug_solution_details").select("id", { count: "exact", head: true }),
      supabase.from("bug_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("solution_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("clusters").select("id, name").limit(10),
      supabase.rpc("get_unanswered_bugs", { lim: 5 }),
      supabase.from("bugs").select("id, title").order("created_at", { ascending: false }).limit(5),
    ])

    const questions = bugsRes.count ?? 0
    const answers = solutionsRes.count ?? 0
    const bugUpvotes = bugUpvotesRes.count ?? 0
    const solutionUpvotes = solutionUpvotesRes.count ?? 0
    const upvotes = bugUpvotes + solutionUpvotes

    const clusters = (clustersRes.data ?? []).map((c: { id: string; name: string }) => ({
      id: c.id,
      name: c.name || "Unnamed",
    }))
    const unansweredBugs = (unansweredBugsRes.data ?? []).map((b: { id: string; title: string }) => ({
      id: b.id,
      title: b.title || "Untitled",
    }))
    const recentBugs = (recentBugsRes.data ?? []).map((b: { id: string; title: string }) => ({
      id: b.id,
      title: b.title || "Untitled",
    }))

    const overview: OverviewResponse = {
      stats: {
        questions,
        answers,
        comments: 0,
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
