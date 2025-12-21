/**
 * Insert Record - PostgreSQL
 * 
 * PostgreSQL implementation for inserting a new record.
 */
import { query } from "./queryPostgres"

/**
 * Inserts a new record using PostgreSQL
 */
export async function insertRecordPostgres(
  table: string,
  data: Record<string, any>
): Promise<any> {
  const fields = Object.keys(data)
  const values = Object.values(data)
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ')
  const sql = `INSERT INTO public.${table} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`
  const result = await query(sql, values)
  return result.rows[0]
}
