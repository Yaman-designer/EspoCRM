import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    espoToken: string
    user: {
      id: string
    } & DefaultSession['user']
  }

  interface User {
    espoToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    espoToken?: string
  }
}
