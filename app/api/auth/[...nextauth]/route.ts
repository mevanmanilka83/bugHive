/**
 * NextAuth API Route Handler
 * 
 * Purpose: Handles all NextAuth authentication endpoints
 * - GET/POST /api/auth/* - All NextAuth routes (signin, signout, callback, etc.)
 * 
 * This is the standard NextAuth route handler that delegates to the auth configuration
 * defined in @/lib/auth/config. It handles OAuth callbacks, session management, and authentication flows.
 */
import { handlers } from "@/lib/auth/config"

export const runtime = 'nodejs'
export const { GET, POST } = handlers
