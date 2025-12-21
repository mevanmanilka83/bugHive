/**
 * Solution Handlers Module
 * 
 * Combines all solution-related API handlers into a single handler factory.
 * 
 * Structure:
 * - solution_get.ts: GET handler for fetching solutions by bug_id
 * - solution_post.ts: POST handler for creating solutions with file uploads
 * - solution_patch.ts: PATCH handler for updating solutions
 * - solution_delete.ts: DELETE handler for removing solutions
 */
import { createSolutionGetHandler } from "./solution_get"
import { createSolutionPostHandler } from "./solution_post"
import { createSolutionPatchHandler } from "./solution_patch"
import { createSolutionDeleteHandler } from "./solution_delete"

/**
 * Creates solution handlers for bug solutions
 * 
 * Returns handlers for:
 * - GET: Fetch solutions for a specific bug
 * - POST: Create new solution
 * - PATCH: Update existing solution
 * - DELETE: Delete solution
 */
export const createSolutionHandler = () => ({
  GET: createSolutionGetHandler(),
  POST: createSolutionPostHandler(),
  PATCH: createSolutionPatchHandler(),
  DELETE: createSolutionDeleteHandler()
})

// Export individual handlers for direct use if needed
export { createSolutionGetHandler } from "./solution_get"
export { createSolutionPostHandler } from "./solution_post"
export { createSolutionPatchHandler } from "./solution_patch"
export { createSolutionDeleteHandler } from "./solution_delete"
