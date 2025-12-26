/**
 * Standard error handling utilities
 */

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

/**
 * Create a standardized error response
 */
export function createErrorResponse(error: unknown, defaultMessage: string = "Internal server error"): { success: false; error: string } {
  return {
    success: false,
    error: getErrorMessage(error) || defaultMessage
  }
}

/**
 * Handle Supabase errors consistently
 */
export function handleSupabaseError(error: any, defaultMessage: string): { success: false; error: string; details?: any } {
  return {
    success: false,
    error: error?.message || defaultMessage,
    details: error?.code || 'UNKNOWN_ERROR'
  }
}
