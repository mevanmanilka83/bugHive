import { NextResponse } from "next/server"
import { auth } from "./config"
import { ensureValidUUID, extractUsernameFromEmail } from "../utils/client"

export type AuthenticatedSession = Awaited<ReturnType<typeof auth>> & {
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    role?: string | null
  }
}

export type ActionResponse<T = any> =
  | ({
      success: true
      message?: string
      details?: any
    } & T)
  | ({
      success: false
      error: string
      message?: string
      details?: any
    } & Partial<T>)

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

export async function requireAuth(): Promise<
  | { success: false; error: string; session: null }
  | { success: true; session: AuthenticatedSession }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized", session: null }
  }
  return { success: true, session: session as unknown as AuthenticatedSession }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ? ensureValidUUID(session.user.id) : null
}

export function getUsernameFromSession(session: AuthenticatedSession): string {
  if (!session?.user) return 'User'
  return session.user.name || extractUsernameFromEmail(session.user.email)
}

export type UserRole = "user" | "admin"

export function userHasRole(session: AuthenticatedSession | null | undefined, role: UserRole): boolean {
  const userRole = (session as AuthenticatedSession | null | undefined)?.user?.role ?? "user"
  if (role === "user") return !!session?.user?.id
  return userRole === role
}

export async function requireRole(role: UserRole): Promise<
  | { success: false; error: string; session: null }
  | { success: true; session: AuthenticatedSession }
> {
  const base = await requireAuth()
  if (!base.success) return base
  const session = base.session
  const userRole = session.user.role ?? "user"
  if (role === "admin" && userRole !== "admin") {
    return { success: false, error: "Forbidden", session: null }
  }
  return { success: true, session }
}

export async function requireAuthForPage(): Promise<AuthenticatedSession> {
  const session = await auth()
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation")
    redirect("/auth/signin")
  }
  return session as unknown as AuthenticatedSession
}

