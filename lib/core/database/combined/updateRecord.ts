/**
 * Update Record
 * 
 * Updates an existing record in the database with Supabase/PostgreSQL fallback.
 */
import { executeWithFallback } from "./fallback"
import { wrapSupabaseOperation } from "./fallback/wrapper"
import { updateRecordSupabase } from "../supabase/updateRecordSupabase"
import { updateRecordPostgres } from "../postgres/updateRecordPostgres"

/**
 * Updates an existing record
 */
export async function updateRecord(
  table: string,
  id: string,
  data: Record<string, any>,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<any> {
  return executeWithFallback(
    () => wrapSupabaseOperation(() => updateRecordSupabase(table, id, data, idField, additionalFilter)),
    () => updateRecordPostgres(table, id, data, idField, additionalFilter),
    `Failed to update ${table} record`
  )
}
