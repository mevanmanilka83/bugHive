/**
 * Solution Handlers Module
 * 
 * Combines all solution-related API handlers into a single handler factory.
 * 
 * Structure:
 * - solutionGet.ts: GET handler for fetching solutions by bug_id
 * - solutionPost.ts: POST handler for creating solutions with file uploads
 * - solutionPatch.ts: PATCH handler for updating solutions
 * - solutionDelete.ts: DELETE handler for removing solutions
 */
import { createSolutionGetHandler } from "./solutionGet"
import { createSolutionPostHandler } from "./solutionPost"
import { createSolutionPatchHandler } from "./solutionPatch"
import { createSolutionDeleteHandler } from "./solutionDelete"

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
