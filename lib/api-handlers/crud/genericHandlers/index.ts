/**
 * Generic CRUD Handlers
 * 
 * Reusable factory functions for creating CRUD handlers for any table.
 * 
 * Structure:
 * - getHandler.ts: GET handler factory for fetching records
 * - postHandler.ts: POST handler factory for creating records
 * - patchHandler.ts: PATCH handler factory for updating records
 * - deleteHandler.ts: DELETE handler factory for removing records
 */

export { createGetHandler } from "./getHandler"
export { createPostHandler } from "./postHandler"
export { createPatchHandler } from "./patchHandler"
export { createDeleteHandler } from "./deleteHandler"
