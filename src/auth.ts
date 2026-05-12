import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          // For demo purposes, we'll allow any email/password if valid email format
          if (credentials && typeof credentials.email === 'string' && credentials.email.includes('@')) {
            return {
              id: "1",
              name: "Demo User",
              email: credentials.email,
              image: "https://ui-avatars.com/api/?name=Demo+User",
            }
          }
          return null
        }
    })
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/")
      // For now, let's keep it open, but we could protect routes here
      return true
    },
  },
})
