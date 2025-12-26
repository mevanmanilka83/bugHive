/**
 * Database Operations Layer
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR DATABASE OPERATIONS ⚠️
 * 
 * Provides database access functions with Supabase and PostgreSQL fallback.
 * 
 * Structure:
 * - combined/: Operations using both Supabase and PostgreSQL with fallback
 * - supabase/: Supabase-specific implementations
 * - postgres/: PostgreSQL-specific implementations
 * 
 * Usage:
 * ```ts
 * import { getSingleRecord, insertRecord, query } from "@/lib/database"
 * ```
 * 
 * DO NOT import from lib/database/* subdirectories directly.
 */

// Combined operations (Supabase + PostgreSQL with fallback)
export {
  getSingleRecord,
  getMultipleRecords,
  insertRecord,
  updateRecord,
  deleteRecord,
  executeWithFallback
} from "./combined"

// Query operations
export { query } from "./postgres/queryPostgres"

// Supabase-specific operations (for direct use if needed)
export { getSingleRecordSupabase } from "./supabase/getSingleSupabase"
export { getMultipleRecordsSupabase } from "./supabase/getMultipleSupabase"
export { insertRecordSupabase } from "./supabase/insertRecordSupabase"
export { updateRecordSupabase } from "./supabase/updateRecordSupabase"
export { deleteRecordSupabase } from "./supabase/deleteRecordSupabase"

// PostgreSQL-specific operations (for direct use if needed)
export { getSingleRecordPostgres } from "./postgres/getSinglePostgres"
export { getMultipleRecordsPostgres } from "./postgres/getMultiplePostgres"
export { insertRecordPostgres } from "./postgres/insertRecordPostgres"
export { updateRecordPostgres } from "./postgres/updateRecordPostgres"
export { deleteRecordPostgres } from "./postgres/deleteRecordPostgres"
