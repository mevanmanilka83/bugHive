import { NextRequest } from "next/server"
import { createSolutionHandler, getMultipleRecords, extractRouteId, successResponse } from "@/lib"

const solutionHandler = createSolutionHandler()

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Public GET: anyone can read solutions for a bug (no auth required). */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const bugId = await extractRouteId(context)
  const solutions = await getMultipleRecords("bug_solution_details", "bug_id", bugId)
  return successResponse({ solutions })
}

export const POST = solutionHandler.POST
export const PATCH = solutionHandler.PATCH
export const DELETE = solutionHandler.DELETE
