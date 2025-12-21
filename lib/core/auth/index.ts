/**
 * Authentication & Context Helpers
 * 
 * Provides authentication utilities for API routes:
 * - Checks if user is authenticated
 * - Extracts user information from session
 * - Helper for extracting route parameters
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

/**
 * Extracts bug ID from route parameters
 * 
 * @param context - Next.js route context with params
 * @returns The ID string from route parameters
 */
export async function extractBugId(context: { params: Promise<{ id: string }> }): Promise<string> {
  const { id } = await context.params
  return id
}
