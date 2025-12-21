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
import { errorResponse, successResponse } from "@/lib/core"
import { saveUserToSupabase } from "@/app/actions/User"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validate required fields
    if (!email || !password || !name) {
      return errorResponse("Email, password, and name are required", 400)
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return errorResponse("Invalid email format", 400)
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
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
