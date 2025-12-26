/**
 * Authentication Helpers
 * 
 * Unified authentication utilities for both API routes and server actions.
 * This provides a consistent interface across different contexts.
 */
import { NextResponse } from "next/server"
import { auth } from "./config"
import { ensureValidUUID, extractUsernameFromEmail } from "@/lib"

/**
 * Authenticated session type with user guaranteed to exist
 */
export type AuthenticatedSession = Awaited<ReturnType<typeof auth>> & {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
  }
}

/**
 * Standard action response type
 */
export type ActionResponse<T = any> = {
  success: boolean
  error?: string
  message?: string
  details?: any
} & T

/**
 * API Route Authentication Helper
 * 
 * Checks if the current request is authenticated.
 * Returns NextResponse error if not authenticated, or session/user object if authenticated.
 * 
 * Usage in API routes:
 * ```ts
 * const authResult = await checkAuth()
 * if (authResult instanceof NextResponse) return authResult
 * const { session, user } = authResult
 * ```
 */
export async function checkAuth(): Promise<
  | NextResponse
  | { session: AuthenticatedSession; user: AuthenticatedSession["user"] }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return { 
    session: session as unknown as AuthenticatedSession, 
    user: session.user as AuthenticatedSession["user"]
  }
}

/**
 * Server Action Authentication Helper
 * 
 * Get authenticated session or return error response.
 * Designed for use in server actions.
 * 
 * Usage in server actions:
 * ```ts
 * const authResult = await requireAuth()
 * if (!authResult.success) {
 *   return { success: false, error: authResult.error }
 * }
 * const { session } = authResult
 * ```
 */
export async function requireAuth(): Promise<
  | { success: false; error: string; session: null }
  | { success: true; session: AuthenticatedSession }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized", session: null }
  }
  // TypeScript now knows session is non-null and has user.id
  return { success: true, session: session as unknown as AuthenticatedSession }
}

/**
 * Get authenticated user ID
 * 
 * Returns the authenticated user's ID, or null if not authenticated.
 * Validates and ensures the ID is a valid UUID.
 * 
 * Usage:
 * ```ts
 * const userId = await getAuthenticatedUserId()
 * if (!userId) {
 *   // Handle unauthenticated case
 * }
 * ```
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ? ensureValidUUID(session.user.id) : null
}

/**
 * Extract username from session
 * 
 * Gets the username from an authenticated session.
 * Falls back to email prefix or 'User' if name/email not available.
 */
export function getUsernameFromSession(session: AuthenticatedSession): string {
  if (!session?.user) return 'User'
  return session.user.name || extractUsernameFromEmail(session.user.email)
}

/**
 * Page Component Authentication Helper
 * 
 * Gets authenticated session for page components.
 * Automatically redirects to sign-in if not authenticated.
 * 
 * Usage in page components:
 * ```ts
 * const session = await requireAuthForPage()
 * // session is guaranteed to be authenticated at this point
 * ```
 */
export async function requireAuthForPage(): Promise<AuthenticatedSession> {
  const session = await auth()
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/signin")
  }
  return session as unknown as AuthenticatedSession
}

