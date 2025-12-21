/**
 * Insert Record
 * 
 * Inserts a new record into the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { insertRecordSupabase } from "../supabase/insert_record_supabase"
import { insertRecordPostgres } from "../postgres/insert_record_postgres"

/**
 * Inserts a new record into the database
 */
export async function insertRecord(
  table: string,
  data: Record<string, any>
): Promise<any> {
  return executeWithFallback(
    () => wrapSupabaseOperation(() => insertRecordSupabase(table, data)),
    () => insertRecordPostgres(table, data),
    `Failed to create ${table} record`
  )
}
