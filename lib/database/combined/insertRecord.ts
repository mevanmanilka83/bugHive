/**
 * Insert Record
 * 
 * Inserts a new record into the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { insertRecordSupabase } from "../supabase/insertRecordSupabase"
import { insertRecordPostgres } from "../postgres/insertRecordPostgres"

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
