'use client'

import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import Cookies from 'js-cookie'

// Syncs EspoCRM token from next-auth session to cookie for use in axios
function TokenSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.espoToken) {
      Cookies.set('espo-token', session.espoToken, {
        expires: 7,
        sameSite: 'strict',
      })
    } else if (session === null) {
      // session === null means user is not logged in
      Cookies.remove('espo-token')
    }
  }, [session?.espoToken, session])

  return null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TokenSync />
      {children}
    </SessionProvider>
  )
}
