/**
 * Bug Handlers Module
 * 
 * Combines all bug-related API handlers into a single handler factory.
 * 
 * Structure:
 * General Bug Handlers:
 * - bugGet.ts: GET handler for fetching general bugs (with cluster filtering)
 * - bugPost.ts: POST handler for creating general bugs (without cluster_id)
 * - bugPatch.ts: PATCH handler for updating general bugs
 * - bugDelete.ts: DELETE handler for removing general bugs
 * 
 * Cluster Bug Handlers:
 * - clusterBugGet.ts: GET handler for cluster-specific bugs
 * - clusterBugPost.ts: POST handler for creating cluster-specific bugs
 * - clusterBugPatch.ts: PATCH handler for updating cluster-specific bugs
 * - clusterBugDelete.ts: DELETE handler for removing cluster-specific bugs
 * 
 * Utilities:
 * - bugUtils.ts: Utility functions for cluster name enrichment
 * - clusterBugUtils.ts: Utility functions for cluster-specific bug operations
 */
import { createBugGetHandler } from "./bugGet"
import { createBugPostHandler } from "./bugPost"
import { createBugPatchHandler } from "./bugPatch"
import { createBugDeleteHandler } from "./bugDelete"
import { createClusterBugGetHandler } from "./clusterBugGet"
import { createClusterBugPostHandler } from "./clusterBugPost"
import { createClusterBugPatchHandler } from "./clusterBugPatch"
import { createClusterBugDeleteHandler } from "./clusterBugDelete"

/**
 * Creates general bug handlers
 * 
 * Returns handlers for:
 * - GET: Fetch bugs with cluster names included and cluster access filtering
 * - POST: Create new general bugs (without cluster_id)
 * - PATCH: Update general bugs
 * - DELETE: Delete general bugs
 */
export const createBugHandler = () => ({
  GET: createBugGetHandler(),
  POST: createBugPostHandler(),
  PATCH: createBugPatchHandler(),
  DELETE: createBugDeleteHandler()
})

/**
 * Creates cluster-specific bug handlers
 * 
 * Returns handlers for:
 * - GET: Fetch cluster-specific bugs with access validation
 * - POST: Create new cluster-specific bugs
 * - PATCH: Update cluster-specific bugs
 * - DELETE: Delete cluster-specific bugs
 */
export const createClusterBugHandler = () => ({
  GET: createClusterBugGetHandler(),
  POST: createClusterBugPostHandler(),
  PATCH: createClusterBugPatchHandler(),
  DELETE: createClusterBugDeleteHandler()
})

