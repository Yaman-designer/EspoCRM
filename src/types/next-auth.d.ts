import type { DefaultSession } from 'next-auth'
import type { EspoAclData } from './espo-acl'

declare module 'next-auth' {
  interface Session {
    espoToken: string
    /** EspoCRM ACL data from the /App/user login response — undefined until threaded through. */
    acl?: EspoAclData
    user: {
      id: string
    } & DefaultSession['user']
  }

  interface User {
    espoToken?: string
    acl?: EspoAclData
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    espoToken?: string
    acl?: EspoAclData
  }
}
