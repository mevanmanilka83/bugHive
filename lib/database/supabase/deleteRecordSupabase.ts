/**
 * Delete Record - Supabase
 * 
 * Supabase implementation for deleting a record.
 */
import { supabase } from "@/lib/config"

/**
 * Deletes a record using Supabase
 */
export async function deleteRecordSupabase(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  let query = supabase.from(table).delete().eq(idField, id)
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  const { error } = await query.select().single()
  if (error) throw error
}
