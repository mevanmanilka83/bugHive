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

// Generate a deterministic UUID from an email address
// This ensures the same email always gets the same user ID
// Uses a synchronous hash function that works in Edge Runtime
function generateUUIDFromEmailSync(email: string): string {
  // Simple hash function that works in Edge Runtime
  let hash = 0
  const normalizedEmail = email.toLowerCase().trim()
  for (let i = 0; i < normalizedEmail.length; i++) {
    const char = normalizedEmail.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Convert to positive number and pad
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0')
  const hashStr2 = ((hash * 31) >>> 0).toString(16).padStart(8, '0')
  const hashStr3 = ((hash * 17) >>> 0).toString(16).padStart(8, '0')
  const hashStr4 = ((hash * 7) >>> 0).toString(16).padStart(8, '0')
  const fullHash = (hashStr + hashStr2 + hashStr3 + hashStr4).substring(0, 32)
  
  // Convert to UUID v4 format
  const uuid = [
    fullHash.substring(0, 8),
    fullHash.substring(8, 12),
    '4' + fullHash.substring(13, 16),
    ((parseInt(fullHash.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + fullHash.substring(17, 20),
    fullHash.substring(20, 32)
  ].join('-')
  
  return uuid
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
        // Use deterministic UUID based on email to ensure consistent user ID across sessions
        const email = credentials.email as string
        return {
          id: generateUUIDFromEmailSync(email), // Generate consistent UUID from email (sync for Edge compatibility)
          email: email,
          name: email.split('@')[0],
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
                name: userName || userEmail.split('@')[0],
                image: userImage,
                email_verified: account?.provider === 'github' ? new Date().toISOString() : null,
              }
            }
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

        // Note: User data saving is handled via server action in Node.js runtime
        // The userDataToSave flag is stored in token and will be processed by server components
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
})
