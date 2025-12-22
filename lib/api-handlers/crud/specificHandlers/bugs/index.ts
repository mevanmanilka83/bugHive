/**
 * Bug Handlers Module
 * 
 * Combines all bug-related API handlers into a single handler factory.
 * 
 * Structure:
 * - bugGet.ts: GET handler for fetching bugs with cluster enrichment
 * - bugPost.ts: POST handler for creating bugs with file uploads
 * - bugPatch.ts: PATCH handler for updating bugs
 * - bugDelete.ts: DELETE handler for removing bugs
 * - bugUtils.ts: Utility functions for cluster enrichment
 */
import { createBugGetHandler } from "./bugGet"
import { createBugPostHandler } from "./bugPost"
import { createBugPatchHandler } from "./bugPatch"
import { createBugDeleteHandler } from "./bugDelete"

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

// Export utility functions for cluster enrichment
export { enrichBugWithCluster, enrichBugsWithClusters } from "./bugUtils"
