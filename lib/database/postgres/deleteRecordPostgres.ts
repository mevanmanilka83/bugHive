/**
 * Delete Record - PostgreSQL
 * 
 * PostgreSQL implementation for deleting a record.
 */
import { query } from "./queryPostgres"

/**
 * Deletes a record using PostgreSQL
 */
export async function deleteRecordPostgres(
  table: string,
  id: string,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<void> {
  let sql = `DELETE FROM public.${table} WHERE ${idField} = $1`
  const params = [id]
  
  if (additionalFilter) {
    sql += ` AND ${additionalFilter.field} = $2`
    params.push(additionalFilter.value)
  }
  
  sql += ' RETURNING *'
  const result = await query(sql, params)
  if (result.rows.length === 0) throw new Error("Record not found")
}
