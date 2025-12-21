/**
 * Combined Database Operations
 * 
 * Operations that use both Supabase and PostgreSQL with automatic fallback.
 * 
 * Structure:
 * - fallback/: Fallback mechanism between Supabase and PostgreSQL
 * - getSingle.ts, getMultiple.ts, insertRecord.ts, updateRecord.ts, deleteRecord.ts: Main operations with fallback
 */

// Fallback mechanism
export { executeWithFallback } from "./fallback"
export { wrapSupabaseOperation } from "./fallback/wrapper"

// CRUD operations (with fallback)
export { getSingleRecord } from "./getSingle"
export { getMultipleRecords } from "./getMultiple"
export { insertRecord } from "./insertRecord"
export { updateRecord } from "./updateRecord"
export { deleteRecord } from "./deleteRecord"
