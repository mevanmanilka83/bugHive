/**
 * Get Multiple Records - PostgreSQL
 * 
 * PostgreSQL implementation for fetching multiple records with optional filtering.
 */
import { query } from "./queryPostgres"

/**
 * Fetches multiple records with optional filtering using PostgreSQL
 */
export async function getMultipleRecordsPostgres(
  table: string,
  filterField?: string,
  filterValue?: string,
  orderBy: string = 'created_at',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<any[]> {
  let sql = `SELECT * FROM public.${table}`
  const params: any[] = []
  if (filterField && filterValue) {
    sql += ` WHERE ${filterField} = $1`
    params.push(filterValue)
  }
  sql += ` ORDER BY ${orderBy} ${orderDirection.toUpperCase()}`
  const result = await query(sql, params)
  return result.rows
}
