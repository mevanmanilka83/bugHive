import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { getSupabaseAdmin } from "../config"
import { extractUsernameFromEmail } from "../utils/server"
import { getLoginValidationSchema } from "../schemas/zod"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
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
})
