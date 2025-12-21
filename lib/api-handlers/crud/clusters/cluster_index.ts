/**
 * Cluster Handlers Module
 * 
 * Combines all cluster-related API handlers into a single handler factory.
 * 
 * Structure:
 * - cluster_get.ts: GET handler for fetching clusters
 * - cluster_post.ts: POST handler for creating clusters
 * - cluster_patch.ts: PATCH handler for updating clusters
 * - cluster_delete.ts: DELETE handler for removing clusters
 */
import { createClusterGetHandler } from "./cluster_get"
import { createClusterPostHandler } from "./cluster_post"
import { createClusterPatchHandler } from "./cluster_patch"
import { createClusterDeleteHandler } from "./cluster_delete"

/**
 * Creates cluster handlers
 * 
 * Returns handlers for:
 * - GET: Fetch clusters
 * - POST: Create new clusters
 * - PATCH: Update clusters
 * - DELETE: Delete clusters
 */
export const createClusterHandler = () => ({
  GET: createClusterGetHandler(),
  POST: createClusterPostHandler(),
  PATCH: createClusterPatchHandler(),
  DELETE: createClusterDeleteHandler()
})

// Export individual handlers for direct use if needed
export { createClusterGetHandler } from "./cluster_get"
export { createClusterPostHandler } from "./cluster_post"
export { createClusterPatchHandler } from "./cluster_patch"
export { createClusterDeleteHandler } from "./cluster_delete"
