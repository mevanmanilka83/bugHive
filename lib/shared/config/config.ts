/**
 * Core Configuration
 * 
 * Centralized exports for all external service clients.
 * 
 * Structure:
 * - supabaseConfig.ts: Supabase client for database operations
 * - postgresConfig.ts: PostgreSQL connection pool for direct SQL queries
 * - s3Config.ts: AWS S3 client for file storage
 */

// Re-export all service clients
export { supabase } from "./supabaseConfig"
export { pool } from "./postgresConfig"
export { s3Client, getS3Client } from "./s3Config"
