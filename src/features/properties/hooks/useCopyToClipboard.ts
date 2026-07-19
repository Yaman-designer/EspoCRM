'use client'

import { useState, useCallback, useRef } from 'react'

// Interaction Design Sprint 4 (2026-07-18). Single copy-to-clipboard
// implementation shared by every "copy" affordance on the Details page
// (Address & Coordinates, Property Code, Price) — previously
// AddressCoordinatesPanel had its own inline copy/timeout logic with no
// other caller; extracted here so the pattern isn't re-implemented per card.

export function useCopyToClipboard(resetDelayMs = 1500) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), resetDelayMs)
    } catch {
      // Clipboard unavailable (permissions/non-secure context) — silently
      // ignore, the trigger stays interactive and simply won't confirm.
    }
  }, [resetDelayMs])

  return { copied, copy }
}
