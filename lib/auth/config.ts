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
        // Validate credentials with zod schema
        const validation = getLoginValidationSchema().safeParse({
          email: credentials?.email,
          password: credentials?.password,
        })

        if (!validation.success) {
          return null
        }

        const { email } = validation.data

        // For now, accept any email/password combination
        // In production, you'd validate against your database
        // Use deterministic UUID based on email to ensure consistent user ID across sessions
        return {
          id: generateUUIDFromEmailSync(email), // Generate consistent UUID from email (sync for Edge compatibility)
          email: email,
          name: extractUsernameFromEmail(email),
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

        // Use name and image from database so uploaded avatar and profile name show everywhere (header, dropdown, etc.)
        if (session?.user?.id) {
          try {
            const db = getSupabaseAdmin()
            const { data } = await db
              .from("users")
              .select("name, image")
              .eq("id", session.user.id)
              .single()
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

