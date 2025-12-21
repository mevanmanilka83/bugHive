/**
 * Combined Database Operations
 * 
 * Operations that use both Supabase and PostgreSQL with automatic fallback.
 * 
 * Structure:
 * - fallback/: Fallback mechanism between Supabase and PostgreSQL
 * - get_single.ts, get_multiple.ts, insert_record.ts, update_record.ts, delete_record.ts: Main operations with fallback
 */

// Fallback mechanism
export { executeWithFallback } from "./fallback"
export { wrapSupabaseOperation } from "./fallback/wrapper"

// CRUD operations (with fallback)
export { getSingleRecord } from "./get_single"
export { getMultipleRecords } from "./get_multiple"
export { insertRecord } from "./insert_record"
export { updateRecord } from "./update_record"
export { deleteRecord } from "./delete_record"
