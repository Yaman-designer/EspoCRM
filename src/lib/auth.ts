import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { loginSchema } from './schemas/auth'
import { login } from '@/api/espocrm/authService'
import type { EspoAclData } from '@/types/espo-acl'

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        try {
          const { user, token } = await login(
            parsed.data.username,
            parsed.data.password
          )
          // EspoCRM's /App/user response nests ACL data at acl.data (or,
          // on some versions, user.acl.data) — same defensive lookup used
          // by scripts/investigate-403.mjs.
          const rawAcl = (user as Record<string, unknown>).acl as { data?: EspoAclData } | undefined
          const nestedUser = (user as Record<string, unknown>).user as { acl?: { data?: EspoAclData } } | undefined
          const acl = rawAcl?.data ?? nestedUser?.acl?.data
          return {
            id: (user.id ?? user.userName) as string,
            name: (user.name ?? user.userName) as string,
            email: (user.emailAddress ?? null) as string | null,
            espoToken: token,
            acl,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.espoToken = user.espoToken
        token.acl = user.acl
      }
      return token
    },
    session({ session, token }) {
      return {
        ...session,
        user: { ...session.user, id: token.id as string },
        espoToken: (token.espoToken ?? '') as string,
        acl: token.acl,
      }
    },
  },
  session: { strategy: 'jwt' },
})
