/**
 * Get Single Record - PostgreSQL
 * 
 * PostgreSQL implementation for fetching a single record by ID.
 */
import { query } from "./queryPostgres"

/**
 * Fetches a single record by ID using PostgreSQL
 */
export async function getSingleRecordPostgres(
  table: string,
  id: string,
  idField: string = 'id'
): Promise<any> {
  const result = await query(`SELECT * FROM public.${table} WHERE ${idField} = $1`, [id])
  if (result.rows.length === 0) throw new Error("Record not found")
  return result.rows[0]
}
