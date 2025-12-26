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

export { getClusterById, verifyClusterOwnership, getUserClusterIds, isClusterOwnerOrMember, canUserViewBug } from "./clusterHelpers"

// ============================================================================
// CONFIGURATION (Database, Storage, Auth)
// ============================================================================

export {
  supabase,
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

export { createApiHandler, createBugHandler, createSolutionHandler } from "./handlerFactory"

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// Re-export database operations
export {
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord
} from "./database"

// ============================================================================
// FILE HANDLING
// ============================================================================

export { parseFormData } from "./formParser"
export {
  handleFileUploads,
  processFormDataWithUploads
} from "./s3Uploads"
