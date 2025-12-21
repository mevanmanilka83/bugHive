import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

// Edge-compatible UUID generation (for middleware)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For now, accept any email/password combination
        // In production, you'd validate against your database
            return {
              id: generateUUID(), // Generate proper UUID
              email: credentials.email as string,
              name: (credentials.email as string).split('@')[0],
            }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
        async jwt({ token, user }) {
          if (user) {
            // Ensure we have a proper UUID for the user
            token.id = user.id || generateUUID()
          }
          return token
        },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
})
