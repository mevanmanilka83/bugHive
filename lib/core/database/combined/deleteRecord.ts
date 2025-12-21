/**
 * Delete Record
 * 
 * Deletes a record from the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseVoidOperation } from "./fallback/wrapper"
import { deleteRecordSupabase } from "../supabase/deleteRecordSupabase"
import { deleteRecordPostgres } from "../postgres/deleteRecordPostgres"

/**
 * Deletes a record from the database
 */
export async function deleteRecord(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  await executeWithFallback<true>(
    () => wrapSupabaseVoidOperation(() => deleteRecordSupabase(table, id, idField, additionalFilter)),
    async () => {
      await deleteRecordPostgres(table, id, idField, additionalFilter)
      return true
    },
    `Failed to delete ${table} record`
  )
}
