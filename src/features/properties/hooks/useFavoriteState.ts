'use client'

import { useState, useCallback, useEffect } from 'react'
import { isFavorite, toggleFavorite, getFavorites } from '@/lib/storage/favorites'

// ─────────────────────────────────────────────────────────────────────────────
// Internal event bus — same-tab cross-card synchronization
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_NAME = 'favorites-changed'

// Guard prevents ReferenceError if ever called in an SSR code path.
function dispatch(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(EVENT_NAME))
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared sync function — reads authoritative state from localStorage
// ─────────────────────────────────────────────────────────────────────────────

// Subscribes to both the same-tab custom event and the native `storage` event.
// The `storage` event is fired automatically by the browser on every OTHER tab
// when localStorage changes — this gives us cross-tab sync for free.
function subscribeToFavoritesEvents(handler: () => void): () => void {
  window.addEventListener(EVENT_NAME, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(EVENT_NAME, handler)
    window.removeEventListener('storage', handler)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// useFavoriteState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reactive favorite state for a single property card.
 *
 * Why `useState(false)` instead of `useState(() => isFavorite(id))`:
 *
 * Next.js pre-renders 'use client' components on the server. The `useState`
 * initializer runs there, but `localStorage` is unavailable — `isFavorite`
 * always returns `false`. React's hydration protocol does NOT re-run the
 * initializer on the client; it uses the server-committed value. This means
 * every favorited card would show a hollow heart after a page load or refresh
 * until the user triggered a toggle event.
 *
 * Starting with `false` matches the server render exactly (no hydration
 * mismatch), and the `useEffect` below corrects the value immediately after
 * the first paint — before the user can see or interact with the card.
 */
export function useFavoriteState(propertyId: string) {
  const [favorited, setFavorited] = useState(false)

  useEffect(() => {
    // Sync with localStorage immediately after hydration.
    // This corrects the server-default `false` for any property that is
    // already in favorites, and handles client-side navigation where the
    // component mounts fresh with no server state.
    setFavorited(isFavorite(propertyId))

    // Re-sync whenever any card in this tab OR any other tab toggles.
    return subscribeToFavoritesEvents(() => setFavorited(isFavorite(propertyId)))
  }, [propertyId])

  const toggle = useCallback(() => {
    // Write to storage first, then update local state optimistically,
    // then broadcast to all other mounted cards.
    const next = toggleFavorite(propertyId)
    setFavorited(next)
    dispatch()
  }, [propertyId])

  return { favorited, toggle }
}

// ─────────────────────────────────────────────────────────────────────────────
// useFavoritesCount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reactive count of all favorited properties.
 *
 * Same SSR-safe pattern: starts at 0, syncs with localStorage after hydration,
 * and updates on every toggle (same-tab and cross-tab).
 */
export function useFavoritesCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(getFavorites().length)
    return subscribeToFavoritesEvents(() => setCount(getFavorites().length))
  }, [])

  return count
}

// ─────────────────────────────────────────────────────────────────────────────
// useFavoriteIds
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reactive list of all favorited property IDs.
 *
 * Same SSR-safe pattern as useFavoritesCount: starts with [] on the server,
 * syncs with localStorage after hydration, and updates on every toggle
 * (same-tab via the custom event, cross-tab via the native storage event).
 *
 * Used by PropertyListRenderer to drive the Saved filter client-side —
 * no EspoCRM Follow API involved.
 */
export function useFavoriteIds(): string[] {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const update = () => setIds(getFavorites())
    update()
    return subscribeToFavoritesEvents(update)
  }, [])

  return ids
}
