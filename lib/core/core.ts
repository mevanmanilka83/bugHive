/**
 * Core Module
 * 
 * Centralized exports for all core functionality.
 * 
 * Structure:
 * - config/: External service clients (Supabase, PostgreSQL, S3)
 * - utils/: Utility functions (UUID, responses, data processing)
 * - database/: Database operations (CRUD with fallback)
 * - s3Uploads.ts: S3 file upload operations
 * - formParser.ts: Form data parsing
 * - auth.ts: Authentication helpers
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
} from "./utils/utils"

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

// Auth exports
export { checkAuth } from "../shared/auth"
