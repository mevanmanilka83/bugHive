/**
 * Base API Handler Utilities
 * 
 * Provides the foundational wrapper function for creating API route handlers
 * with authentication and error handling built-in.
 */
import { NextRequest, NextResponse } from "next/server"
import { checkAuth, errorResponse, successResponse } from "@/lib/core"

/**
 * Creates a generic API route handler with authentication and error handling
 * 
 * @param handler - The actual handler function that processes the request
 * @param statusCode - HTTP status code to return on success (default: 200)
 * @returns A Next.js API route handler function
 */
export function createApiHandler<T = any>(
  handler: (request: NextRequest, context?: any, authResult?: any) => Promise<T>,
  statusCode: number = 200
) {
  return async (request: NextRequest, context?: any) => {
    try {
      const authResult = await checkAuth()
      if (authResult instanceof NextResponse) return authResult

      const result = await handler(request, context, authResult)
      return successResponse(result, statusCode)
    } catch (error: any) {
      return errorResponse(error.message || "Internal server error", 500)
    }
  }
}
