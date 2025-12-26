/**
 * Environment Configuration
 * 
 * Single source of truth for all environment variables.
 * This file has no dependencies to avoid circular imports.
 */

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
