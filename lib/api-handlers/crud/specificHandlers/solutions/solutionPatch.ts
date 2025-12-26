/**
 * Solution PATCH Handler
 * 
 * Handles updating existing solutions:
 * - PATCH /api/bugs/[id]/solutions
 * - Only allows updates to specified fields
 */
import { extractRouteId, addTimestamps } from "@/lib/utils"
import { updateRecord } from "@/lib/database/database"
import { createApiHandler } from "../../../handlerFactory"

/**
 * Fields that can be updated for solutions
 */
const ALLOWED_UPDATE_FIELDS = [
  'status',
  'priority',
  'assignee',
  'title',
  'description',
  'estimated_hours',
  'links'
] as const

/**
 * Creates PATCH handler for solutions
 * 
 * Features:
 * - Only allows updates to specified fields
 * - Validates solution belongs to bug
 * - Prevents unauthorized field modifications
 */
export const createSolutionPatchHandler = () => 
  createApiHandler(async (request, context) => {
    const bugId = await extractRouteId(context)
    const body = await request.json().catch(() => ({}))
    
    const solutionId = body.solution_id || request?.nextUrl?.searchParams?.get('solution_id')
    if (!solutionId) {
      throw new Error("Solution ID is required")
    }

    const updateData: any = {}
    
    for (const field of ALLOWED_UPDATE_FIELDS) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error("No valid fields to update")
    }

    const solution = await updateRecord(
      'bug_solution_details', 
      solutionId, 
      addTimestamps(updateData), 
      'id', 
      { field: 'bug_id', value: bugId }
    )
    
    return { solution }
  })
