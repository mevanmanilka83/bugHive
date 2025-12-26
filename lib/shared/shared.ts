/**
 * Shared Module
 * 
 * Centralized exports for all shared functionality.
 * 
 * Structure:
 * - config/: External service clients (Supabase, PostgreSQL, S3)
 * - utils.ts: Utility functions (UUID, responses, data processing)
 * - database/: Database operations (CRUD with fallback)
 * - s3Uploads.ts: S3 file upload operations
 * - formParser.ts: Form data parsing
 * 
 * Note: Authentication helpers are in @/lib/auth/helpers
 * Import auth functions directly from @/lib/auth/helpers
 */

// Configuration exports
export { supabase, pool, s3Client } from "./config/config"

// Utility exports
export {
  generateUUID,
  generateUUIDFromEmailSync,
  ensureValidUUID,
  errorResponse,
  successResponse,
  addTimestamps,
  parseArrayField,
  validateRequiredFields,
  parseQueryFilters,
  isValidEmail,
  isValidPassword,
  extractUsernameFromEmail,
  extractBugId,
  extractRouteId
} from "./utils"

// Database exports
export {
  query,
  executeWithFallback,
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord
} from "./database/database"

// Storage exports
export {
  handleFileUploads,
  processFormDataWithUploads
} from "./s3Uploads"

// Form exports
export { parseFormData } from "./formParser"

// Auth exports removed - import directly from @/lib/auth/helpers
// This keeps auth code centralized in the auth module
