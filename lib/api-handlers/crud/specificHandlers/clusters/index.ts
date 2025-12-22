/**
 * Cluster Handlers Module
 * 
 * Combines all cluster-related API handlers into a single handler factory.
 * 
 * Structure:
 * - clusterGet.ts: GET handler for fetching clusters
 * - clusterPost.ts: POST handler for creating clusters
 * - clusterPatch.ts: PATCH handler for updating clusters
 * - clusterDelete.ts: DELETE handler for removing clusters
 */
import { createClusterGetHandler } from "./clusterGet"
import { createClusterPostHandler } from "./clusterPost"
import { createClusterPatchHandler } from "./clusterPatch"
import { createClusterDeleteHandler } from "./clusterDelete"

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
