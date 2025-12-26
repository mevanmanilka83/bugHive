/**
 * Application Configuration
 * 
 * Single source of truth for all configuration and external service clients.
 * 
 * Re-exports:
 * - Supabase client for database operations
 * - PostgreSQL connection pool for direct SQL queries
 * - AWS S3 client for file storage
 * - NextAuth configuration and helpers
 */

// Database and Storage Configuration
export { supabase } from "./shared/config/supabaseConfig"
export { pool } from "./shared/config/postgresConfig"
export { s3Client, getS3Client } from "./shared/config/s3Config"

// Auth Configuration
export { handlers, signIn, signOut, auth } from "./auth/config"
export { getUserFromSession, getUserIdFromSession } from "./auth/helpers"
