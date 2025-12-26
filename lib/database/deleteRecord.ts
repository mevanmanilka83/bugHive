/**
 * Delete Record
 * 
 * Deletes a record from the database.
 */
import { supabase } from "@/lib"

/**
 * Deletes a record from the database
 */
export async function deleteRecord(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  let query = supabase.from(table).delete().eq(idField, id)
  
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  
  const { error } = await query
  if (error) throw error
}
