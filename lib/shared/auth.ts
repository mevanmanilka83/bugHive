/**
 * Authentication Helpers
 * 
 * Provides authentication utilities for API routes:
 * - Checks if user is authenticated
 * - Extracts user information from session
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
