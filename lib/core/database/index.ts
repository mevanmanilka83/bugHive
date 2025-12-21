/**
 * Database Operations
 * 
 * Provides database access functions with Supabase and PostgreSQL fallback.
 * 
 * Structure:
 * - combined/: Operations using both Supabase and PostgreSQL with fallback
 * - supabase/: Supabase-specific implementations
 * - postgres/: PostgreSQL-specific implementations
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
export { query } from "./postgres/query_postgres"

// Supabase-specific operations (for direct use if needed)
export { getSingleRecordSupabase } from "./supabase/get_single_supabase"
export { getMultipleRecordsSupabase } from "./supabase/get_multiple_supabase"
export { insertRecordSupabase } from "./supabase/insert_record_supabase"
export { updateRecordSupabase } from "./supabase/update_record_supabase"
export { deleteRecordSupabase } from "./supabase/delete_record_supabase"

// PostgreSQL-specific operations (for direct use if needed)
export { getSingleRecordPostgres } from "./postgres/get_single_postgres"
export { getMultipleRecordsPostgres } from "./postgres/get_multiple_postgres"
export { insertRecordPostgres } from "./postgres/insert_record_postgres"
export { updateRecordPostgres } from "./postgres/update_record_postgres"
export { deleteRecordPostgres } from "./postgres/delete_record_postgres"
