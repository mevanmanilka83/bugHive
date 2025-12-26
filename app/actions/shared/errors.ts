/**
 * Server Action Error Handling Utilities
 * 
 * These error handlers are specifically designed for server actions (functions marked with "use server").
 * Server actions return plain objects with { success: boolean, error?: string } structure.
 * 
 * When to use Server Action Error Handlers:
 * - In server actions (app/actions directory files marked with "use server")
 * - When calling server actions directly from server components or other server actions
 * - When you need to return error objects that can be checked with if (!result.success)
 * 
 * When NOT to use (use API route error handlers instead):
 * - In API routes (app/api directory route.ts files)
 * - When handling HTTP requests/responses
 * - Use errorResponse() and successResponse() from @/lib/shared/shared instead
 * 
 * See also:
 * - @/lib/shared/shared for API route error handlers (errorResponse, successResponse)
 * - @/lib/api-handlers/handlerFactory for API route handler wrapper
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
 * Create a standardized error response for server actions
 * 
 * Use this in server actions to return error responses.
 * Returns an object with { success: false, error: string } structure.
 * 
 * @param error - The error to convert to a message
 * @param defaultMessage - Default message if error cannot be converted
 * @returns Error response object for server actions
 */
export function createErrorResponse(error: unknown, defaultMessage: string = "Internal server error"): { success: false; error: string } {
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
 * @param error - Supabase error object
 * @param defaultMessage - Default message if error message is not available
 * @returns Error response object with Supabase error details
 */
export function handleSupabaseError(error: any, defaultMessage: string): { success: false; error: string; details?: any } {
  return {
    success: false,
    error: error?.message || defaultMessage,
    details: error?.code || 'UNKNOWN_ERROR'
  }
}
