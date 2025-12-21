/**
 * Delete Record
 * 
 * Deletes a record from the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { deleteRecordSupabase } from "../supabase/delete_record_supabase"
import { deleteRecordPostgres } from "../postgres/delete_record_postgres"

/**
 * Deletes a record from the database
 */
export async function deleteRecord(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  await executeWithFallback(
    () => wrapSupabaseOperation(() => deleteRecordSupabase(table, id, idField, additionalFilter).then(() => ({} as any))),
    () => deleteRecordPostgres(table, id, idField, additionalFilter),
    `Failed to delete ${table} record`
  )
}
