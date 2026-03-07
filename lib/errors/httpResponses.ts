/**
 * Error Handling Utilities
 * 
 * Single source of truth for all error handling across the application.
 * 
 * API Routes:
 * - Use errorResponse() and successResponse() for HTTP responses
 * 
 * Server Actions:
 * - Use createErrorResponse() and handleSupabaseError() for action responses
 */

import { NextResponse } from "next/server"

// ============================================================================
// COMMON ERROR UTILITIES
// ============================================================================

/**
 * Convert any error to a standardized error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return "Internal server error"
}

// ============================================================================
// API ROUTE ERROR HANDLERS
// ============================================================================

/**
 * API Route Error Handler
 * 
 * Creates an HTTP error response for API routes (app/api/.../route.ts files).
 * Returns a NextResponse object suitable for HTTP endpoints.
 * 
 * Usage in API routes:
 * ```ts
 * return errorResponse("Not found", 404)
 * ```
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * API Route Success Handler
 * 
 * Creates an HTTP success response for API routes (app/api/.../route.ts files).
 * Returns a NextResponse object suitable for HTTP endpoints.
 * 
 * Usage in API routes:
 * ```ts
 * return successResponse({ data: result }, 200)
 * ```
 */
export function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status })
}

// ============================================================================
// SERVER ACTION ERROR HANDLERS
// ============================================================================

/**
 * Create a standardized error response for server actions
 * 
 * Use this in server actions (marked with "use server") to return error responses.
 * Returns an object with { success: false, error: string } structure.
 * 
 * Usage in server actions:
 * ```ts
 * try {
 *   // action logic
 * } catch (error) {
 *   return createErrorResponse(error)
 * }
 * ```
 * 
 * @param error - The error to convert to a message
 * @param defaultMessage - Default message if error cannot be converted
 * @returns Error response object for server actions
 */
export function createErrorResponse(
  error: unknown, 
  defaultMessage: string = "Internal server error"
): { success: false; error: string } {
  return {
    success: false,
    error: getErrorMessage(error) || defaultMessage
  }
}

/**
 * Handle Supabase errors consistently in server actions
 * 
 * Use this in server actions when handling Supabase-specific errors.
 * Returns an object with { success: false, error: string, details?: any } structure.
 * 
 * Usage in server actions:
 * ```ts
 * const { error } = await supabase.from('table').insert(data)
 * if (error) {
 *   return handleSupabaseError(error, 'Failed to insert record')
 * }
 * ```
 * 
 * @param error - Supabase error object
 * @param defaultMessage - Default message if error message is not available
 * @returns Error response object with Supabase error details
 */
export function handleSupabaseError(
  error: any, 
  defaultMessage: string
): { success: false; error: string; details?: any } {
  return {
    success: false,
    error: error?.message || defaultMessage,
    details: error?.code || 'UNKNOWN_ERROR'
  }
}
