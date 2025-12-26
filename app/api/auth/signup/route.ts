/**
 * User Signup API Route
 * 
 * Purpose: HTTP endpoint for user registration
 * - Accepts signup requests from client-side forms
 * - Creates user record in Supabase database
 * - Returns success/error response for client handling
 * 
 * Note: This is an API route (HTTP endpoint) vs server action (direct function call)
 * Use API routes when you need HTTP endpoints for external clients or form submissions
 */
import { NextRequest } from "next/server"
import { errorResponse, successResponse, validateWithSchema } from "@/lib"
import { saveUserToSupabase } from "@/app/actions/user"
import { getSignupValidationSchema } from "@/lib/schemas/zod/signup"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate with zod schema
    const validation = validateWithSchema(getSignupValidationSchema(), body)
    if (!validation.success) {
      return errorResponse(validation.error, 400)
    }

    const { email, password, name } = validation.data

    // Save user to Supabase database
    // Note: Password is not stored here - authentication is handled by NextAuth
    // This creates the user profile record in the database
    const result = await saveUserToSupabase(
      email,
      name,
      null, // image
      null  // email_verified
    )

    if (!result.success) {
      return errorResponse(result.error || "Failed to create user", 500)
    }

    return successResponse({ 
      message: "User created successfully", 
      user: result.data
    }, 201)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error", 
      500
    )
  }
}
