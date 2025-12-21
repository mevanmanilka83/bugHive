/**
 * CRUD Handlers Module
 * 
 * All CRUD handlers (generic factories and entity-specific implementations).
 * 
 * Structure:
 * - get/: GET handler factory for fetching records
 * - post/: POST handler factory for creating records
 * - patch/: PATCH handler factory for updating records
 * - delete/: DELETE handler factory for removing records
 * - bugs/: Bug-specific handlers with cluster enrichment
 * - clusters/: Cluster-specific handlers
 * - solutions/: Solution-specific handlers
 * 
 * Exports:
 * - Generic factories: createGetHandler, createPostHandler, createPatchHandler, createDeleteHandler
 * - Entity handlers: createBugHandler, createClusterHandler, createSolutionHandler
 */
export { createGetHandler } from "./get"
export { createPostHandler } from "./post"
export { createPatchHandler } from "./patch"
export { createDeleteHandler } from "./delete"
