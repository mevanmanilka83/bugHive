/**
 * Core Module
 * 
 * Centralized exports for all core functionality.
 * 
 * Structure:
 * - config/: External service clients (Supabase, PostgreSQL, S3)
 * - utils/: Utility functions (UUID, responses, data processing)
 * - database/: Database operations (CRUD with fallback)
 * - storage/: File upload/storage operations
 * - form/: Form data parsing
 * - auth/: Authentication helpers
 */

// Configuration exports
export { supabase, pool, s3Client } from "./config"

// Utility exports
export {
  generateUUID,
  generateUUIDFromEmailSync,
  ensureValidUUID,
  errorResponse,
  successResponse,
  addTimestamps,
  parseArrayField,
  validateRequiredFields
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
} from "./database"

// Storage exports
export {
  handleFileUploads,
  processFormDataWithUploads
} from "./storage"

// Form exports
export { parseFormData } from "./form"

// Auth exports
export { checkAuth, extractBugId } from "./auth"
