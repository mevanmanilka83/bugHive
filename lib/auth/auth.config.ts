import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import { env } from "../config/environment"
import { getSupabaseAdmin } from "../config/supabaseClient"
import { generateUUID, generateUUIDFromEmailSync, extractUsernameFromEmail } from "../utils/server"

export const authConfig = {
  providers: [
    GitHub({
      clientId: env.githubClientId!,
      clientSecret: env.githubClientSecret!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
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

        if (userEmail) {
          token.userDataToSave = {
            email: userEmail,
            name: userName || extractUsernameFromEmail(userEmail),
            image: userImage,
            email_verified: account?.provider === "github" ? new Date().toISOString() : null,
          }
        }
        token.provider = account?.provider ?? "credentials"
      } else if (token.email && !token.id) {
        token.id = generateUUIDFromEmailSync(token.email as string)
      } else if (token.email && token.id) {
        token.id = generateUUIDFromEmailSync(token.email as string)
      }
      // Attach role from database to token on every JWT callback
      if (token.id) {
        try {
          const db = getSupabaseAdmin() as any
          const { data: userRow } = await db
            .from("users")
            .select("role")
            .eq("id", token.id as string)
            .maybeSingle()
          const row = userRow as any
          if (row && typeof row.role === "string") {
            ;(token as any).role = row.role
          }
        } catch {
          // ignore role fetch errors; default will be used
        }
      }
      if (!(token as any).role) {
        ;(token as any).role = "user"
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        if (token.email) {
          session.user.id = generateUUIDFromEmailSync(token.email as string)
        } else if (token.id) {
          session.user.id = token.id as string
        }
        if (token.email) {
          session.user.email = token.email as string
        }
        if (token.provider) {
          ;(session.user as { provider?: string }).provider = token.provider as string
        }
        if ((token as any).role) {
          ;(session.user as { role?: string }).role = (token as any).role as string
        }

        if (session?.user?.id) {
          try {
            const db = getSupabaseAdmin()
            const { data: userRow } = await db
              .from("users")
              .select("name, image, role")
              .eq("id", session.user.id)
              .single()
            const data = userRow as { name: string | null; image: string | null; role?: string | null } | null
            if (data) {
              if (data.name != null) session.user.name = data.name
              if (data.image != null) session.user.image = data.image
              if (data.role) (session.user as { role?: string }).role = data.role
            }
          } catch {
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
} satisfies NextAuthConfig
