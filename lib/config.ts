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
 * - getS3Client: AWS S3 client for file storage (lazy initialization)
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
import { S3Client } from "@aws-sdk/client-s3"

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/**
 * Environment configuration - Single source of truth for all env vars
 */
export const env = {
  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  
  // AWS S3
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  
  // GitHub OAuth
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  
  // Other
  nodeEnv: process.env.NODE_ENV,
} as const

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

function getSupabaseUrl(): string {
  const url = env.supabaseUrl
  if (!url) {
    // Return a dummy URL for client-side imports (will fail if actually used)
    if (typeof window !== 'undefined') {
      return 'https://placeholder.supabase.co'
    }
    throw new Error('SUPABASE_URL environment variable is not set')
  }
  return url
}

function getSupabaseKey(): string {
  const key = env.supabaseServiceKey || env.supabaseAnonKey
  if (!key) {
    // Return a dummy key for client-side imports (will fail if actually used)
    if (typeof window !== 'undefined') {
      return 'placeholder-key'
    }
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is not set')
  }
  return key
}

const supabaseUrl = getSupabaseUrl()
const supabaseKey = getSupabaseKey()

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// ============================================================================
// AWS S3 CONFIGURATION
// ============================================================================

function validateS3Config() {
  if (!env.awsAccessKeyId) {
    throw new Error('AWS_ACCESS_KEY_ID environment variable is not set')
  }
  if (!env.awsSecretAccessKey) {
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable is not set')
  }
  if (!env.awsRegion) {
    throw new Error('AWS_REGION environment variable is not set')
  }
  if (!env.awsS3Bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set')
  }
}

// Lazy initialization to ensure env vars are loaded
let _s3Client: S3Client | null = null

export function getS3Client(): S3Client {
  if (!_s3Client) {
    validateS3Config()
    _s3Client = new S3Client({
      region: env.awsRegion!,
      credentials: {
        accessKeyId: env.awsAccessKeyId!,
        secretAccessKey: env.awsSecretAccessKey!,
      },
    })
  }
  return _s3Client
}

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

// Re-export auth from auth/config to keep auth logic separate
export { handlers, signIn, signOut, auth } from "./auth/config"
