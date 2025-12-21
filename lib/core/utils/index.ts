/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application:
 * - UUID generation (random and deterministic from email)
 * - HTTP response helpers
 * - Data processing utilities
 */
import { NextResponse } from "next/server"

// ============================================================================
// UUID GENERATION
// ============================================================================

/**
 * Generates a random UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Generate a deterministic UUID from an email address
 * This ensures the same email always gets the same user ID
 * Note: auth.ts has its own version for Edge runtime compatibility
 */
export function generateUUIDFromEmailSync(email: string): string {
  let hash = 0
  const normalizedEmail = email.toLowerCase().trim()
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  const hashStr2 = ((hash * 31) >>> 0).toString(16).padStart(8, '0')
  const hashStr3 = ((hash * 17) >>> 0).toString(16).padStart(8, '0')
  const hashStr4 = ((hash * 7) >>> 0).toString(16).padStart(8, '0')
  const fullHash = (hashStr + hashStr2 + hashStr3 + hashStr4).substring(0, 32)
  const uuid = [
    fullHash.substring(0, 8),
    fullHash.substring(8, 12),
    '4' + fullHash.substring(13, 16),
    ((parseInt(fullHash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + fullHash.substring(17, 20),
    fullHash.substring(20, 32)
  ].join('-')
  return uuid
}

/**
 * Ensures a value is a valid UUID, generating one if needed
 */
export function ensureValidUUID(userId: string | undefined): string {
  if (!userId) return '00000000-0000-0000-0000-000000000000'
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(userId)) {
    return userId
  }
  
  return generateUUID()
}

// ============================================================================
// HTTP RESPONSE HELPERS
// ============================================================================

/**
 * Creates an error response
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Creates a success response
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

// ============================================================================
// DATA PROCESSING UTILITIES
// ============================================================================

/**
 * Adds created_at and updated_at timestamps to data
 */
export function addTimestamps(data: Record<string, any>): Record<string, any> {
  const now = new Date().toISOString()
  return {
    ...data,
    updated_at: now,
    ...(data.created_at ? {} : { created_at: now })
  }
}

/**
 * Parses an array field from string or JSON
 */
export function parseArrayField(value: string | null): string[] | null {
  if (!value) return null
  
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) {
      return parsed.map(s => s.toString())
    }
  } catch {
    return value.split(',').map(s => s.trim()).filter(Boolean)
  }
  
  return null
}

/**
 * Validates that all required fields are present and non-empty
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim().length === 0)
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
}
