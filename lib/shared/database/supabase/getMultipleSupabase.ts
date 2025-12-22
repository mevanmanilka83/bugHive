/**
 * Get Multiple Records - Supabase
 * 
 * Supabase implementation for fetching multiple records with optional filtering.
 */
import { supabase } from "../../config"

/**
 * Fetches multiple records with optional filtering using Supabase
 */
export async function getMultipleRecordsSupabase(
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
  const { data, error } = await query.order(orderBy, { ascending: orderDirection === 'asc' })
  if (error) throw error
  return data || []
}
