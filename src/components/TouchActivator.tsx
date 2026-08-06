'use client'

import { useEffect } from 'react'

// Mobile UX pass (2026-07-24). Renders nothing — exists purely to register
// one passive, no-op touchstart listener. iOS Safari only enables CSS
// :active on tap when some element in the document has a real touch
// listener attached; without one, every `active:` press state across the
// app (buttons, document rows, tabs, segmented controls) is silently inert
// on iPhone/iPad while working everywhere else. Split into its own Client
// Component because RootLayout must stay a Server Component (it exports
// `metadata`) and Next.js doesn't allow DOM event-handler props on elements
// rendered directly from a Server Component.
export function TouchActivator() {
  useEffect(() => {
    const noop = () => {}
    document.addEventListener('touchstart', noop, { passive: true })
    return () => document.removeEventListener('touchstart', noop)
  }, [])

  return null
}
