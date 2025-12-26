/**
 * Library Index - Centralized Exports
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL LIBRARY IMPORTS ⚠️
 * 
 * Import everything from @/lib - never import from subdirectories directly.
 * 
 * ```ts
 * import { cn, supabase, getSingleRecord, errorResponse } from "@/lib"
 * ```
 */

// ============================================================================
// CORE UTILITIES
// ============================================================================

export {
  cn,
  generateUUID,
  generateUUIDFromEmailSync,
  ensureValidUUID,
  addTimestamps,
  parseArrayField,
  parseQueryFilters,
  extractUsernameFromEmail,
  extractRouteId
} from "./utils"

// ============================================================================
// ERROR HANDLING
// ============================================================================

export {
  getErrorMessage,
  errorResponse,
  successResponse,
  createErrorResponse,
  handleSupabaseError
} from "./errors"

// ============================================================================
// VALIDATION
// ============================================================================

export { validateWithSchema } from "./validation"

// ============================================================================
// DATABASE HELPERS
// ============================================================================

export { getClusterById, verifyClusterOwnership } from "./database-helpers"

// ============================================================================
// CONFIGURATION (Database, Storage, Auth)
// ============================================================================

export {
  supabase,
  pool,
  s3Client,
  getS3Client,
  handlers,
  signIn,
  signOut,
  auth
} from "./config"

// ============================================================================
// AUTH HELPERS
// ============================================================================

export {
  checkAuth,
  requireAuth,
  getAuthenticatedUserId,
  getUsernameFromSession,
  requireAuthForPage,
  type AuthenticatedSession,
  type ActionResponse
} from "./auth/helpers"

// ============================================================================
// API HANDLERS
// ============================================================================

export {
  createApiHandler,
  createGetHandler,
  createPostHandler,
  createPatchHandler,
  createDeleteHandler,
  createBugHandler,
  createClusterHandler,
  createSolutionHandler
} from "./api-handlers/apiHandlers"

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export {
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeWithFallback,
  query
} from "./database/database"

// ============================================================================
// FILE HANDLING
// ============================================================================

export { parseFormData } from "./formParser"
export {
  handleFileUploads,
  processFormDataWithUploads
} from "./s3Uploads"
