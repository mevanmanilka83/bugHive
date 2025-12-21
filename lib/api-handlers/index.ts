/**
 * API Handlers Module
 * 
 * Centralized exports for all API route handlers.
 * 
 * Structure:
 * - base.ts: Core handler wrapper with auth and error handling
 * - crud/: All CRUD handlers (generic and entity-specific)
 *   - get/: GET handler factory
 *   - post/: POST handler factory
 *   - patch/: PATCH handler factory
 *   - delete/: DELETE handler factory
 *   - bugs/: Bug-specific handlers with cluster enrichment
 *   - clusters/: Cluster-specific handlers
 *   - solutions/: Solution-specific handlers
 */

// Base handler utilities
export { createApiHandler } from "./base"

// Generic CRUD handlers
export {
  createGetHandler,
  createPostHandler,
  createPatchHandler,
  createDeleteHandler
} from "./crud"

// Entity-specific handlers
export { createBugHandler } from "./crud/bugs"
export { createClusterHandler } from "./crud/clusters"
export { createSolutionHandler } from "./crud/solutions"
