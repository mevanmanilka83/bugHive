/**
 * Core Utility Functions
 * 
 * Single source of truth for common utility functions.
 * 
 * Includes:
 * - cn(): Tailwind CSS class merging
 * - UUID generation and validation
 * - Data processing (timestamps, arrays, query filters)
 * - Email/username extraction
 * - Route parameter extraction
 * 
 * For specialized utilities, see:
 * - @/lib/errors: Error handling (errorResponse, successResponse, createErrorResponse)
 * - @/lib/validation: Data validation (validateWithSchema)
 * - @/lib/database-helpers: Database utilities
 * - @/lib/shared/formParser: Form data parsing
 * - @/lib/shared/s3Uploads: File upload handling
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
 * This ensures the same email always gets the same user ID
 * Works in both Node.js and Edge runtime environments
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
 * Parses query parameters for filtering and limiting records
 */
export function parseQueryFilters(searchParams: URLSearchParams | null): {
  filterField?: string
  filterValue?: string
  limit?: number
} {
  if (!searchParams) {
    return {}
  }
  
  const createdByParam = searchParams.get('created_by')
  const clusterIdParam = searchParams.get('cluster_id')
  const filterField = clusterIdParam ? 'cluster_id' : (createdByParam ? 'created_by' : undefined)
  const filterValue: string | undefined = clusterIdParam ?? createdByParam ?? undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  
  return { filterField, filterValue, limit }
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

// ============================================================================
// ROUTE PARAMETER UTILITIES
// ============================================================================

/**
 * Extracts route ID from Next.js route context
 */
/**
 * Extract route ID from Next.js 15 App Router context params
 * Handles both string and Promise-based params
 */
export async function extractRouteId(context: any): Promise<string> {
  const params = context?.params
  if (!params) throw new Error("Missing route params")
  
  // Handle Promise-based params (Next.js 15+)
  const resolvedParams = typeof params.then === 'function' ? await params : params
  const id = resolvedParams.id || resolvedParams.bugId || resolvedParams.clusterId
  
  if (!id) throw new Error("Missing ID in route params")
  return typeof id === 'string' ? id : await id
}