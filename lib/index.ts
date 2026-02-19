/**
 * Library Index - Centralized Exports
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL LIBRARY IMPORTS ⚠️
 * 
 * Import everything from @/lib - never import from subdirectories directly.
 * 
 * Directory structure:
 * - lib/config.ts        → Database, Storage, Auth configuration
 * - lib/database.ts      → All CRUD operations and cluster helpers
 * - lib/utils.ts         → Server utilities (re-exports client-safe from utils-client.ts)
 * - lib/utils-client.ts  → Client-safe utilities (cn, generateUUID, etc.)
 * - lib/errors.ts        → Error handling (errorResponse, successResponse, etc.)
 * - lib/validation.ts    → Schema validation
 * - lib/auth/            → Authentication config and helpers
 * - lib/schemas/         → Zod schemas and TypeScript types
 * - lib/handlerFactory.ts → API route handler wrappers
 * - lib/formParser.ts    → Form data parsing
 * - lib/s3Uploads.ts     → File upload handling
 * 
 * For client components, import from @/lib/utils-client to avoid server-side code.
 * 
 * ```ts
 * // Server-side (API routes, server actions)
 * import { cn, supabase, getSingleRecord, errorResponse } from "@/lib"
 * 
 * // Client-side (React components)
 * import { cn } from "@/lib/utils-client"
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
  extractRouteId,
  stripHtml
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
// SCHEMAS (Zod & Types)
// ============================================================================

// Re-export all Zod schemas
export * from "./schemas/zod"

// Re-export all TypeScript types
export type {
  NotificationPayload,
  ClusterPayload,
  ClusterFormData,
  InviteFormData,
  BugPayload,
  BugDialogErrors,
  BugFormData,
  SolutionPayload,
  SolutionDialogErrors,
  SolutionFormData
} from "./schemas/types"

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export {
  getSingleRecord,
  getRecordOrNotFound,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  getClusterById,
  verifyClusterOwnership,
  getUserClusterIds,
  isClusterOwnerOrMember,
  canUserViewBug
} from "./database"

// ============================================================================
// CONFIGURATION (Database, Storage, Auth)
// ============================================================================

export { env } from "./env"
export {
  supabase,
  getSupabaseAdmin,
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
// FILE HANDLING
// ============================================================================

export { parseFormData } from "./formParser"
export {
  handleFileUploads,
  processFormDataWithUploads,
  uploadAvatarFile
} from "./s3Uploads"
