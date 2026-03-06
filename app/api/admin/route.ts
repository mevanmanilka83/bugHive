"use server"

import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib"
import { requireRole } from "@/lib/auth/helpers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AdminOverviewResponse = {
  stats: {
    users: number
    bugs: number
    clusters: number
    workspaces: number
    solutions: number
  }
  generatedAt: string
}

export async function GET() {
  try {
    // Only admins can access this endpoint
    const roleResult = await requireRole("admin")
    if (!roleResult.success) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = (await getSupabaseAdmin()) as any

    const [
      usersRes,
      bugsRes,
      clustersRes,
      workspacesRes,
      solutionsRes,
    ] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("bugs").select("id", { count: "exact", head: true }),
      supabase.from("clusters").select("id", { count: "exact", head: true }),
      supabase.from("saved_graphs").select("id", { count: "exact", head: true }),
      supabase
        .from("bug_solution_details")
        .select("id", { count: "exact", head: true }),
    ])

    const payload: AdminOverviewResponse = {
      stats: {
        users: usersRes.count ?? 0,
        bugs: bugsRes.count ?? 0,
        clusters: clustersRes.count ?? 0,
        workspaces: workspacesRes.count ?? 0,
        solutions: solutionsRes.count ?? 0,
      },
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(payload)
  } catch (error) {
    console.error("Admin overview API error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch admin overview",
      },
      { status: 500 }
    )
  }
}

