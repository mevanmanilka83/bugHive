/**
 * Application Configuration
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH FOR ALL CONFIGURATION ⚠️
 * 
 * This is the ONLY file that should be imported for configuration.
 * 
 * Usage:
 * ```ts
 * import { supabase, auth, env } from "@/lib/config"
 * ```
 */

import { S3Client } from "@aws-sdk/client-s3"
import { env } from "./environment"

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

export { env }

// ============================================================================
// SUPABASE CONFIGURATION
// ============================================================================

export { supabase, getSupabaseAdmin } from "./supabaseClient"

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

export { handlers, signIn, signOut, auth } from "../auth/config"
