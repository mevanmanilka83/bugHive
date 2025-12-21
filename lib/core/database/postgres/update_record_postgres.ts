/**
 * Update Record - PostgreSQL
 * 
 * PostgreSQL implementation for updating an existing record.
 */
import { query } from "./query_postgres"

/**
 * Updates an existing record using PostgreSQL
 */
export async function updateRecordPostgres(
  table: string,
  id: string,
  data: Record<string, any>,
  idField: string = 'id',
  additionalFilter?: { field: string; value: string }
): Promise<any> {
  const fields = Object.keys(data)
  const values = Object.values(data)
  const setClause = fields.map((field, index) => `${field} = $${index + 3}`).join(', ')
  let sql = `UPDATE public.${table} SET ${setClause} WHERE ${idField} = $1`
  const params = [id, ...values]
  
  if (additionalFilter) {
    sql += ` AND ${additionalFilter.field} = $${params.length + 1}`
    params.push(additionalFilter.value)
  }
  
  sql += ' RETURNING *'
  const result = await query(sql, params)
  if (result.rows.length === 0) throw new Error("Record not found")
  return result.rows[0]
}
