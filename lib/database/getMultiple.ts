/**
 * Get Multiple Records
 * 
 * Fetches multiple records with optional filtering from the database.
 */
import { supabase } from "@/lib"

/**
 * Fetches multiple records with optional filtering
 */
export async function getMultipleRecords(
  table: string,
  filterField?: string,
  filterValue?: string,
  orderBy: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  let query = supabase.from(table).select('*')
  
  if (filterField && filterValue) {
    query = query.eq(filterField, filterValue)
  }
  
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}
