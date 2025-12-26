/**
 * Application Configuration
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL CONFIGURATION ⚠️
 * 
 * This is the ONLY file that should be imported for configuration.
 * 
 * Available exports:
 * 
 * Database & Storage:
 * - supabase: Supabase client for database operations
 * - pool: PostgreSQL connection pool for direct SQL queries
 * - s3Client, getS3Client: AWS S3 client for file storage
 * 
 * Authentication:
 * - handlers, signIn, signOut, auth: NextAuth configuration
 * - getUserFromSession, getUserIdFromSession: Auth helpers
 * 
 * Usage:
 * ```ts
 * import { supabase, auth, pool } from "@/lib/config"
 * ```
 */

import { createClient } from "@supabase/supabase-js"
import { Pool } from 'pg'
import { S3Client } from "@aws-sdk/client-s3"

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// POSTGRESQL CONFIGURATION
// ============================================================================

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// ============================================================================
// AWS S3 CONFIGURATION
// ============================================================================

function validateS3Config() {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_ACCESS_KEY_ID environment variable is not set')
  }
  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set')
  }
  if (!process.env.AWS_REGION) {
    throw new Error('AWS_REGION environment variable is not set')
  }
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET environment variable is not set')
  }
}

// Validate configuration before creating client
try {
  validateS3Config()
} catch (error) {
  console.error('S3 Configuration Error:', error instanceof Error ? error.message : 'Unknown error')
}

// Lazy initialization to ensure env vars are loaded
let _s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!_s3Client) {
    validateS3Config()
    _s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _s3Client
}

// Export for backward compatibility
export const s3Client = getS3Client()

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

// Re-export auth from auth/config to keep auth logic separate
export { handlers, signIn, signOut, auth } from "./auth/config"
