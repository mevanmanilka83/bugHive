/**
 * Utility Functions
 * 
 * Single source of truth for all utility functions used throughout the application.
 * 
 * Includes:
 * - cn(): Tailwind CSS class merging
 * - UUID generation and validation
 * - HTTP response helpers (API routes)
 * - Data processing utilities
 * - Route parameter extraction
 * - Form data parsing
 * - Email/username extraction
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { NextResponse } from "next/server"

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
// HTTP RESPONSE HELPERS (API ROUTES)
// ============================================================================

/**
 * API Route Error Handler
 * 
 * Creates an HTTP error response for API routes (app/api/.../route.ts files).
 * Returns a NextResponse object suitable for HTTP endpoints.
 * 
 * When to use API Route Error Handlers:
 * - In API routes (app/api/.../route.ts files)
 * - When handling HTTP requests/responses
 * - When using createApiHandler from @/lib/api-handlers/handlerFactory
 * 
 * When NOT to use (use server action error handlers instead):
 * - In server actions (app/actions/.../*.ts files marked with "use server")
 * - Use createErrorResponse() from @/app/actions/shared/errors instead
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * API Route Success Handler
 * 
 * Creates an HTTP success response for API routes (app/api/.../route.ts files).
 * Returns a NextResponse object suitable for HTTP endpoints.
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
 * @deprecated Use zod schemas from app/actions/{module}/zod/ with validateWithSchema
 * 
 * Validates that all required fields are present and non-empty
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim().length === 0)
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
  }
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

/**
 * @deprecated Use zod schemas from @/lib/schemas/zod for email validation
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * @deprecated Use zod schemas from @/lib/schemas/zod for password validation
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
  return Boolean(password && password.length >= minLength)
}

// ============================================================================
// ROUTE PARAMETER UTILITIES
// ============================================================================

/**
 * Extracts route ID from Next.js route context
 */
export async function extractRouteId(context: { params: Promise<{ id: string }> }): Promise<string> {
  const { id } = await context.params
  return id
}


