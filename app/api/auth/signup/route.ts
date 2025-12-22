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
import { errorResponse, successResponse, isValidEmail, isValidPassword, validateRequiredFields } from "@/lib/shared/shared"
import { saveUserToSupabase } from "@/app/actions/User"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate required fields
    try {
      validateRequiredFields(body, ['email', 'password', 'name'])
    } catch (error) {
      return errorResponse(error instanceof Error ? error.message : "Missing required fields", 400)
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return errorResponse("Invalid email format", 400)
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      return errorResponse("Password must be at least 6 characters", 400)
    }

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
