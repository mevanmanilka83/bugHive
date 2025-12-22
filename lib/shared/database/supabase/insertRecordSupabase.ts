/**
 * Insert Record - Supabase
 * 
 * Supabase implementation for inserting a new record.
 */
import { supabase } from "../../config/config"

/**
 * Inserts a new record using Supabase
 */
export async function insertRecordSupabase(
  table: string,
  data: Record<string, any>
): Promise<any> {
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) throw error
  return result
}
