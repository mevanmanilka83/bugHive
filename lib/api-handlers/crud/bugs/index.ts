/**
 * Bug Handlers Module
 * 
 * Combines all bug-related API handlers into a single handler factory.
 * 
 * Structure:
 * - get.ts: GET handler for fetching bugs with cluster enrichment
 * - post.ts: POST handler for creating bugs with file uploads
 * - patch.ts: PATCH handler for updating bugs
 * - delete.ts: DELETE handler for removing bugs
 * - utils.ts: Utility functions for cluster enrichment
 */
import { createBugGetHandler } from "./bug_get"
import { createBugPostHandler } from "./bug_post"
import { createBugPatchHandler } from "./bug_patch"
import { createBugDeleteHandler } from "./bug_delete"

/**
 * Creates bug handlers with cluster name enrichment
 * 
 * Returns handlers for:
 * - GET: Fetch bugs with cluster names included
 * - POST: Create new bugs
 * - PATCH: Update bugs
 * - DELETE: Delete bugs
 */
export const createBugHandler = () => ({
  GET: createBugGetHandler(),
  POST: createBugPostHandler(),
  PATCH: createBugPatchHandler(),
  DELETE: createBugDeleteHandler()
})

// Export individual handlers for direct use if needed
export { createBugGetHandler } from "./bug_get"
export { createBugPostHandler } from "./bug_post"
export { createBugPatchHandler } from "./bug_patch"
export { createBugDeleteHandler } from "./bug_delete"
export { enrichBugWithCluster, enrichBugsWithClusters } from "./bug_utils"
