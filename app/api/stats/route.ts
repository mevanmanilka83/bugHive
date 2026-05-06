import { NextResponse } from "next/server"
import { supabase } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export type StatsResponse = {
  questions: number
  answers: number
  comments: number
  upvotes: number
  teams: number
  clusters: number
  unanswered: number
  usersOnline?: number | null
}

export async function GET() {
  try {
    const [
      bugsRes,
      solutionsRes,
      bugUpvotesRes,
      solutionUpvotesRes,
      clustersRes,
      unansweredRes,
    ] = await Promise.all([
      supabase.from("bugs").select("id", { count: "exact", head: true }),
      supabase.from("bug_solution_details").select("id", { count: "exact", head: true }),
      supabase.from("bug_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("solution_votes").select("id", { count: "exact", head: true }).eq("vote_type", "upvote"),
      supabase.from("clusters").select("id", { count: "exact", head: true }),
      supabase.rpc("get_unanswered_bugs_count"),
    ])

    const questions = bugsRes.count ?? 0
    const answers = solutionsRes.count ?? 0
    const bugUpvotes = bugUpvotesRes.count ?? 0
    const solutionUpvotes = solutionUpvotesRes.count ?? 0
    const upvotes = bugUpvotes + solutionUpvotes
    const clusters = clustersRes.count ?? 0
    const unanswered = Number(unansweredRes.data ?? 0)

    const stats: StatsResponse = {
      questions,
      answers,
      comments: 0,
      upvotes,
      teams: clusters,
      clusters,
      unanswered,
      usersOnline: null,
    }

    return NextResponse.json(stats)
  } catch (error: unknown) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      { error: (error as Error)?.message ?? "Failed to fetch stats" },
      { status: 500 }
    )
  }
}
