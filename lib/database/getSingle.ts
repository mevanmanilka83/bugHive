/**
 * Get Single Record
 * 
 * Fetches a single record by ID from the database.
 */
import { supabase } from "@/lib"

/**
 * Fetches a single record by ID
 */
export async function getSingleRecord(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  const { data, error } = await supabase.from(table).select('*').eq(idField, id).single()
  if (error) throw error
  if (data === null) throw new Error("Record not found")
  return data
}
