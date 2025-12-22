/**
 * API Route Authentication Helper
 * 
 * Provides authentication utilities for API routes:
 * - Checks if user is authenticated
 * - Extracts user information from session
 * - Returns error response if not authenticated
 * 
 * Note: This wraps the main auth() function from @/auth
 * to provide a consistent API route authentication pattern.
 */
import { NextResponse } from "next/server"

/**
 * Checks if the current request is authenticated
 * 
 * @returns User session and user object if authenticated, or error response if not
 */
export async function checkAuth() {
  const { auth } = await import("@/auth")
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { session, user: session.user }
}
