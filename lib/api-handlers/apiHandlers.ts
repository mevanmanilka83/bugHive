/**
 * API Handlers Module
 * 
 * Centralized exports for all API route handlers.
 * 
 * Structure:
 * - handlerFactory.ts: Core handler factory with auth and error handling
 * - crud/: All CRUD handlers (generic and entity-specific)
 *   - genericHandlers/: Reusable factory functions for creating CRUD handlers
 *   - specificHandlers/: Entity-specific handlers with custom logic
 *     - bugs/: Bug-specific handlers with cluster enrichment
 *     - clusters/: Cluster-specific handlers
 *     - solutions/: Solution-specific handlers
 */

// Handler factory
export { createApiHandler } from "./handlerFactory"

// Generic CRUD handlers
export {
  createGetHandler,
  createPostHandler,
  createPatchHandler,
  createDeleteHandler
} from "./crud"

// Entity-specific handlers
export { createBugHandler } from "./crud/specificHandlers/bugs"
export { createClusterHandler } from "./crud/specificHandlers/clusters"
export { createSolutionHandler } from "./crud/specificHandlers/solutions"
