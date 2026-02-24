/**
 * NextAuth Configuration
 * 
 * Centralized authentication configuration for the application.
 * This is the single source of truth for all auth settings.
 */
import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"
import { env } from "../env"
import { getSupabaseAdmin } from "../config"
import { generateUUID, generateUUIDFromEmailSync, extractUsernameFromEmail } from "../utils"
import { getLoginValidationSchema } from "../schemas/zod"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: env.githubClientId!,
      clientSecret: env.githubClientSecret!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const validation = getLoginValidationSchema().safeParse({
          email: credentials?.email,
          password: credentials?.password,
        })
        if (!validation.success) return null

        const { email, password } = validation.data
        const db = getSupabaseAdmin()
        const { data: user, error } = await db
          .from("users")
          .select("id, email, name, password_hash")
          .eq("email", email.toLowerCase().trim())
          .maybeSingle()

        if (error || !user) return null

        const row = user as { id: string; email: string | null; name: string | null; password_hash: string | null }
        const storedHash = row.password_hash ?? null
        const { verifyPassword, hashPassword } = await import("../password")

        if (storedHash) {
          const ok = await verifyPassword(password, storedHash)
          if (!ok) return null
        } else {
          // Legacy user without stored hash: accept this password and store its hash for next time
          const newHash = await hashPassword(password)
          await db.from("users").update({ password_hash: newHash, updated_at: new Date().toISOString() } as never).eq("id", row.id)
        }

        return {
          id: row.id,
          email: row.email ?? email,
          name: row.name ?? extractUsernameFromEmail(email),
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Always ensure we have a deterministic UUID based on email
      // This fixes the issue where old sessions had random UUIDs
      if (user) {
        // On initial login, use user's email to generate UUID
        let userId: string
        let userEmail: string | undefined = user.email || undefined
        let userName: string | undefined = user.name || undefined
        let userImage: string | undefined = user.image || undefined

        if (user.email) {
          userId = generateUUIDFromEmailSync(user.email)
          token.id = userId
          token.email = user.email
        } else if (user.id) {
          userId = user.id
          token.id = userId
        } else {
          userId = generateUUID()
          token.id = userId
        }

        // Store user data in token to save in session callback (which runs in Node.js runtime)
        if (userEmail) {
          token.userDataToSave = {
            email: userEmail,
            name: userName || extractUsernameFromEmail(userEmail),
            image: userImage,
            email_verified: account?.provider === 'github' ? new Date().toISOString() : null,
          }
        }
        token.provider = account?.provider ?? 'credentials'
      } else if (token.email && !token.id) {
        // On token refresh, if we have email but no id, regenerate from email
        token.id = generateUUIDFromEmailSync(token.email as string)
      } else if (token.email && token.id) {
        // On token refresh, always regenerate ID from email to ensure consistency
        // This migrates old random UUIDs to deterministic ones
        token.id = generateUUIDFromEmailSync(token.email as string)
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        // Always use deterministic UUID from email if available
        if (token.email) {
          session.user.id = generateUUIDFromEmailSync(token.email as string)
        } else if (token.id) {
          session.user.id = token.id as string
        }
        // Ensure email is in session for debugging
        if (token.email) {
          session.user.email = token.email as string
        }
        if (token.provider) {
          (session.user as { provider?: string }).provider = token.provider as string
        }

        // Ensure OAuth users (and any user with userDataToSave) have a row in public.users so FKs (e.g. saved_graphs.user_id) succeed
        const toSave = token.userDataToSave as { email: string; name?: string; image?: string | null; email_verified?: string | null } | undefined
        if (toSave?.email) {
          try {
            const { saveUserToSupabase } = await import("@/app/actions/User")
            await saveUserToSupabase(toSave.email, toSave.name ?? undefined, toSave.image ?? undefined, toSave.email_verified ?? undefined)
            delete (token as { userDataToSave?: unknown }).userDataToSave
          } catch {
            // Non-fatal; user may already exist or will be created on first write
          }
        }

        // Use name and image from database so uploaded avatar and profile name show everywhere (header, dropdown, etc.)
        if (session?.user?.id) {
          try {
            const db = getSupabaseAdmin()
            const { data: userRow } = await db
              .from("users")
              .select("name, image")
              .eq("id", session.user.id)
              .single()
            const data = userRow as { name: string | null; image: string | null } | null
            if (data) {
              if (data.name != null) session.user.name = data.name
              if (data.image != null) session.user.image = data.image
            }
          } catch {
            // Keep session.user.name/image from token if DB fetch fails
          }
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: env.nodeEnv === "development",
})

