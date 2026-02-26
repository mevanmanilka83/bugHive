import type { NextAuthConfig } from "next-auth"
import GitHub from "next-auth/providers/github"
import { env } from "../env"
import { generateUUID, generateUUIDFromEmailSync, extractUsernameFromEmail } from "../utils"
import { getSupabaseAdmin } from "../supabase"

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
            email_verified: account?.provider === 'github' ? new Date().toISOString() : null,
          }
        }
        token.provider = account?.provider ?? 'credentials'
      } else if (token.email && !token.id) {
        token.id = generateUUIDFromEmailSync(token.email as string)
      } else if (token.email && token.id) {
        token.id = generateUUIDFromEmailSync(token.email as string)
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
          (session.user as { provider?: string }).provider = token.provider as string
        }

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
