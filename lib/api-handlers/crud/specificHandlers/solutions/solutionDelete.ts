/**
 * Solution DELETE Handler
 * 
 * Handles deleting solutions:
 * - DELETE /api/bugs/[id]/solutions
 * - Validates solution belongs to bug
 */
import { extractRouteId } from "@/lib/utils"
import { deleteRecord } from "@/lib/shared/database/database"
import { createApiHandler } from "../../../handlerFactory"

/**
 * Creates DELETE handler for solutions
 * 
 * Features:
 * - Validates solution exists
 * - Validates solution belongs to bug
 * - Returns success message on deletion
 */
export const createSolutionDeleteHandler = () => 
  createApiHandler(async (request, context) => {
    const bugId = await extractRouteId(context)
    const solutionId = request?.nextUrl?.searchParams?.get('solution_id')
    
    if (!solutionId) {
      throw new Error("Solution ID is required")
    }

    await deleteRecord(
      'bug_solution_details', 
      solutionId, 
      'id', 
      { field: 'bug_id', value: bugId }
    )
    
    return { message: "Solution deleted successfully" }
  })
