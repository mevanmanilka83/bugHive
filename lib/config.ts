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
import { env } from "./env"

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

// Re-export env for convenience
export { env }

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

/** Server-only Supabase client using the service role key. Bypasses RLS. Use for server actions that already validate the user (e.g. voting). */
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin() must only be used on the server')
  }
  const serviceKey = env.supabaseServiceKey
  if (!serviceKey || !serviceKey.trim()) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for server-side operations that bypass RLS (e.g. voting). ' +
      'Set it in your environment. Find it in Supabase Dashboard → Settings → API.'
    )
  }
  if (serviceKey.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY must be the service_role secret (long JWT starting with eyJ...), not the publishable key. ' +
      'In Supabase Dashboard → Settings → API, use the "service_role" key (click Reveal), not the anon/publishable key.'
    )
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }
  return _supabaseAdmin
}

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
