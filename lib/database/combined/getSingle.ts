/**
 * Get Single Record
 * 
 * Fetches a single record by ID from the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { getSingleRecordSupabase } from "../supabase/getSingleSupabase"
import { getSingleRecordPostgres } from "../postgres/getSinglePostgres"

/**
 * Fetches a single record by ID
 */
export async function getSingleRecord(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  return executeWithFallback(
    () => wrapSupabaseOperation(() => getSingleRecordSupabase(table, id, idField)),
    () => getSingleRecordPostgres(table, id, idField),
    `Failed to fetch ${table} record`
  )
}
