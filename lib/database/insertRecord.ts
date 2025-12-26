/**
 * Insert Record
 * 
 * Inserts a new record into the database.
 */
import { supabase } from "@/lib"

/**
 * Inserts a new record into the database
 */
export async function insertRecord(
  table: string,
  data: Record<string, any>
): Promise<any> {
  const { data: result, error } = await supabase.from(table).insert(data).select().single()
  if (error) throw error
  return result
}
