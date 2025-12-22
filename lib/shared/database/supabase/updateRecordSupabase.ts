/**
 * Update Record - Supabase
 * 
 * Supabase implementation for updating an existing record.
 */
import { supabase } from "../../config/config"

/**
 * Updates an existing record using Supabase
 */
export async function updateRecordSupabase(
  table: string,
  id: string,
  data: Record<string, any>,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<any> {
  let query = supabase.from(table).update(data).eq(idField, id)
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  const { data: result, error } = await query.select().single()
  if (error) throw error
  return result
}
