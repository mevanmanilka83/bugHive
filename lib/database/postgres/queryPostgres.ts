/**
 * PostgreSQL Query Operations
 * 
 * Executes raw SQL queries using PostgreSQL connection pool.
 */
import { pool } from "@/lib/config"

/**
 * Executes a raw SQL query using PostgreSQL connection pool
 */
export async function query(text: string, params?: any[]) {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}
