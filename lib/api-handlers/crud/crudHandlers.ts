/**
 * CRUD Handlers Module
 * 
 * HTTP API handlers for CRUD operations.
 * 
 * This is the HTTP/API LAYER - it handles HTTP requests/responses, authentication, and routing.
 * Database operations are delegated to lib/core/database.
 * 
 * Architecture:
 * - Uses lib/core/database for all database operations (no duplication)
 * - Uses handlerFactory.ts for authentication and error handling
 * - Handles HTTP-specific concerns (request parsing, response formatting, routing)
 * 
 * Structure:
 * - genericHandlers/: Reusable factory functions for creating CRUD handlers
 *   - getHandler.ts: GET handler factory for fetching records
 *   - postHandler.ts: POST handler factory for creating records
 *   - patchHandler.ts: PATCH handler factory for updating records
 *   - deleteHandler.ts: DELETE handler factory for removing records
 * - specificHandlers/: Entity-specific handlers with custom logic
 *   - bugs/: Bug-specific handlers with cluster enrichment
 *   - clusters/: Cluster-specific handlers
 *   - solutions/: Solution-specific handlers
 * 
 * Separation of Concerns:
 * - lib/core/database: Database operations (data access)
 * - lib/api-handlers: HTTP handlers (API routes, authentication, request/response)
 * 
 * Exports:
 * - Generic factories: createGetHandler, createPostHandler, createPatchHandler, createDeleteHandler
 * - Entity handlers: createBugHandler, createClusterHandler, createSolutionHandler
 */
export { createGetHandler, createPostHandler, createPatchHandler, createDeleteHandler } from "./genericHandlers"
export { createBugHandler } from "./specificHandlers/bugs"
export { createClusterHandler } from "./specificHandlers/clusters"
export { createSolutionHandler } from "./specificHandlers/solutions"
