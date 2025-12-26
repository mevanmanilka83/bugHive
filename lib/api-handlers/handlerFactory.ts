/**
 * Generic API Handler Wrapper for Next.js App Router
 * 
 * This is a generic API handler wrapper for a Next.js (App Router) backend.
 * Its purpose is to centralize authentication and error handling so individual
 * API routes stay small and focused.
 * 
 * Features:
 * - Automatic authentication checking
 * - Centralized error handling
 * - Consistent response formatting
 * - Reduces boilerplate in individual route handlers
 */
import { NextRequest, NextResponse } from "next/server"
import { checkAuth } from "@/lib/auth/helpers"
import { errorResponse, successResponse } from "@/lib/utils"

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
