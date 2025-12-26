/**
 * Client-Safe Utilities
 * 
 * Utilities that are safe to use on the client side.
 * These don't depend on server-only modules like Supabase.
 * 
 * Import from this file in client components to avoid
 * triggering server-side code evaluation.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// TAILWIND UTILITIES
// ============================================================================

/**
 * Merges Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// UUID GENERATION & VALIDATION
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
// EMAIL & USERNAME UTILITIES
// ============================================================================

/**
 * Extracts username from email address
 */
export function extractUsernameFromEmail(email: string | null | undefined, fallback: string = 'User'): string {
  if (!email) return fallback
  const parts = email.split('@')
  return parts[0] || fallback
}
