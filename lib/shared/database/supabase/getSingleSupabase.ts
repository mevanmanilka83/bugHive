/**
 * Get Single Record - Supabase
 * 
 * Supabase implementation for fetching a single record by ID.
 */
import { supabase } from "../../config/config"

/**
 * Fetches a single record by ID using Supabase
 */
export async function getSingleRecordSupabase(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  const { data, error } = await supabase.from(table).select('*').eq(idField, id).single()
  if (error) throw error
  if (data === null) throw new Error("Record not found")
  return data
}
