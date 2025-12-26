/**
 * Database Operations
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR DATABASE OPERATIONS ⚠️
 * 
 * Simplified database operations using Supabase.
 * All CRUD operations in one place.
 * 
 * Usage:
 * ```ts
 * import { getSingleRecord, insertRecord } from "@/lib"
 * ```
 */

import { supabase } from "@/lib/config"

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
  let query = supabase.from(table).update(data).eq(idField, id)
  
  if (additionalFilter) {
    query = query.eq(additionalFilter.field, additionalFilter.value)
  }
  
  const { data: result, error } = await query.select().single()
  if (error) throw error
  return result
}

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
