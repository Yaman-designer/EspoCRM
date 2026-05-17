'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { getSession } from 'next-auth/react'
import type { Session } from 'next-auth'
import Cookies from 'js-cookie'

// ─── Types ────────────────────────────────────────────────────────────────────

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  session: Session | null
  status: AuthStatus
  /** Re-fetch the session from the server — call after login/logout if needed. */
  refresh: () => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Persists across React StrictMode's simulated unmount/remount cycle because
  // refs belong to the component instance, not the effect. When StrictMode
  // re-runs the effect body, this is already true → early return → no second fetch.
  const didFetch = useRef(false)

  const applySession = useCallback((s: Session | null) => {
    setSession(s)
    setStatus(s ? 'authenticated' : 'unauthenticated')

    // Keep the EspoCRM API token in a cookie so axiosClient can read it
    // synchronously on every request without touching React state.
    if (s?.espoToken) {
      Cookies.set('espo-token', s.espoToken, { expires: 7, sameSite: 'strict' })
    } else {
      Cookies.remove('espo-token')
    }
  }, [])

  // Stable reference — safe to list as a useEffect dependency.
  const refresh = useCallback(async () => {
    applySession(await getSession())
  }, [applySession])

  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    refresh()
  }, [refresh])

  return (
    <AuthContext.Provider value={{ session, status, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
