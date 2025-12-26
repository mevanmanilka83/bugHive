/**
 * AWS S3 Configuration
 * 
 * Initializes and exports AWS S3 client for file storage operations.
 */
import { S3Client } from "@aws-sdk/client-s3"

// Validate AWS S3 environment variables
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
  // Don't throw here - let it fail when actually used with a better error message
}

// AWS S3 configuration for file storage
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
