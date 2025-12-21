/**
 * Solution GET Handler
 * 
 * Handles fetching solutions for a specific bug:
 * - GET /api/bugs/[id]/solutions
 */
import { getMultipleRecords, extractBugId } from "@/lib/core"
import { createApiHandler } from "../../base"

/**
 * Creates GET handler for solutions
 * 
 * Features:
 * - Fetches solutions by bug_id
 * - Returns solutions for a specific bug
 */
export const createSolutionGetHandler = () => 
  createApiHandler(async (request, context) => {
    const bugId = await extractBugId(context)
    const solutions = await getMultipleRecords('bug_solution_details', 'bug_id', bugId)
    return { solutions }
  })
