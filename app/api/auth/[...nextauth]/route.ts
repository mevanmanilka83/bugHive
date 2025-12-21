/**
 * NextAuth API Route Handler
 * 
 * Purpose: Handles all NextAuth authentication endpoints
 * - GET/POST /api/auth/* - All NextAuth routes (signin, signout, callback, etc.)
 * 
 * This is the standard NextAuth route handler that delegates to the auth configuration
 * defined in /auth.ts. It handles OAuth callbacks, session management, and authentication flows.
 */
import { handlers } from "@/auth"

export const { GET, POST } = handlers
