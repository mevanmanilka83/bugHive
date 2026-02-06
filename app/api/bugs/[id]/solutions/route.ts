import { NextRequest } from "next/server"
import { createSolutionHandler, getMultipleRecords, extractRouteId, successResponse, supabase } from "@/lib"

const solutionHandler = createSolutionHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public GET: anyone can read solutions for a bug (no auth required). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const bugId = await extractRouteId(context)

  const { data: solutions, error } = await supabase
    .from("bug_solution_details")
    .select("*")
    .eq("bug_id", bugId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching solutions:", error)
    return successResponse({ solutions: [] })
  }

  const creatorIds = (solutions || [])
    .map((solution: any) => solution.created_by)
    .filter((id: string | null) => Boolean(id)) as string[]

  if (creatorIds.length === 0) {
    return successResponse({ solutions: solutions || [] })
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, image")
    .in("id", creatorIds)

  if (usersError) {
    console.error("Error fetching users:", usersError)
    return successResponse({ solutions: solutions || [] })
  }

  const userById = new Map((users || []).map((user: any) => [user.id, user]))
  const formattedSolutions = (solutions || []).map((solution: any) => ({
    ...solution,
    user: userById.get(solution.created_by) || null,
  }))

  return successResponse({ solutions: formattedSolutions })
}

export const POST = solutionHandler.POST
export const PATCH = solutionHandler.PATCH
export const DELETE = solutionHandler.DELETE
