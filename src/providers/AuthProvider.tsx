'use client'

import { useEffect } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import Cookies from 'js-cookie'

// يزامن توكن EspoCRM من next-auth session إلى cookie لاستخدامه في axios
function TokenSync() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.espoToken) {
      Cookies.set('espo-token', session.espoToken, {
        expires: 7,
        sameSite: 'strict',
      })
    } else if (session === null) {
      // session === null تعني أن المستخدم غير مسجل دخوله
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
