/**
 * PostgreSQL Configuration
 * 
 * Initializes and exports PostgreSQL connection pool for direct SQL queries.
 */
import { Pool } from 'pg'

// PostgreSQL connection pool for direct SQL queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export { pool }
