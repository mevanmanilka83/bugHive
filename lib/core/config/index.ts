/**
 * Core Configuration
 * 
 * Centralized exports for all external service clients.
 * 
 * Structure:
 * - supabase/: Supabase client for database operations
 * - postgres/: PostgreSQL connection pool for direct SQL queries
 * - s3/: AWS S3 client for file storage
 */

// Re-export all service clients
export { supabase } from "./supabase"
export { pool } from "./postgres"
export { s3Client } from "./s3"
