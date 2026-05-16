'use client'

import { createContext, useCallback, useContext, useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ebla-crm-theme'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// ─── Pure DOM helpers (module-level = stable references) ─────────────────────

/** Read the current theme from the <html> class — source of truth on client. */
function getSnapshot(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Observe class-attribute mutations on <html> so useSyncExternalStore
 * re-reads the snapshot whenever the class changes.
 */
function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
  return () => observer.disconnect()
}

/**
 * Apply a theme: toggle the DOM class, persist to localStorage, and write
 * a cookie so the server can bake the correct class before the first byte.
 *
 * Transitions are disabled for one frame to prevent color-transition flicker
 * (replicates next-themes' `disableTransitionOnChange` behaviour).
 */
function applyTheme(theme: Theme): void {
  // Suppress all CSS transitions for this frame so colors switch instantly
  const style = document.createElement('style')
  style.setAttribute('data-theme-no-transition', '')
  style.textContent = '*,*::before,*::after{transition-duration:0s!important}'
  document.head.appendChild(style)

  document.documentElement.classList.toggle('dark', theme === 'dark')

  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // localStorage may be unavailable in private browsing
  }
  document.cookie = `${STORAGE_KEY}=${theme};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`

  // Re-enable transitions after the browser has painted the new colours
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => style.remove())
  })
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode
  /**
   * The theme that the server already baked into the HTML (read from cookie
   * in the root layout). Passed here so the useSyncExternalStore server
   * snapshot matches the server-rendered HTML exactly → zero mismatch.
   */
  initialTheme: Theme
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  /*
   * useSyncExternalStore gives us:
   *  - Server render: uses `getServerSnapshot` (= the cookie value the server baked)
   *  - Client hydration: React checks that getSnapshot() matches — it will, because
   *    the server baked the same class onto <html> that we read back here.
   *  - After hydration: subscribes via MutationObserver; re-renders on class change.
   *
   * Result: no extra re-render on mount, no hydration warning, no script injection.
   */
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => initialTheme,
  )

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
