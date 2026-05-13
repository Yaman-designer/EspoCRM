import type { NextAuthConfig } from 'next-auth'
import { authRoutes, apiAuthPrefix, DEFAULT_LOGIN_REDIRECT } from '@/lib/config'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix)
      const isAuthRoute = authRoutes.includes(nextUrl.pathname)


      if (isApiAuthRoute) return true

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl))
        }
        return true
      }


      if (!isLoggedIn) return false

      return true
    },
  },
  providers: [],
} satisfies NextAuthConfig
