/**
 * Favorites persistence layer — localStorage only.
 *
 * Architecture is intentionally layered so UI components never touch storage
 * directly. To migrate to an API later, swap only this file; the hook and
 * all components remain unchanged.
 *
 * Storage key is versioned (v1) so a future schema change can migrate cleanly.
 */

const STORAGE_KEY = 'property_favorites_v1'

function readIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // localStorage unavailable or quota exceeded — degrade silently
  }
}

/** Returns all favorited property IDs. */
export function getFavorites(): string[] {
  return readIds()
}

/** Returns true when the given property ID is in the favorites list. */
export function isFavorite(id: string): boolean {
  return readIds().includes(id)
}

/** Adds a property to favorites. No-op if already present. */
export function saveFavorite(id: string): void {
  const ids = readIds()
  if (!ids.includes(id)) writeIds([...ids, id])
}

/** Removes a property from favorites. No-op if not present. */
export function removeFavorite(id: string): void {
  writeIds(readIds().filter(fid => fid !== id))
}

/**
 * Toggles a property's favorite state.
 * Returns the new state: true = now favorited, false = now removed.
 */
export function toggleFavorite(id: string): boolean {
  if (isFavorite(id)) {
    removeFavorite(id)
    return false
  }
  saveFavorite(id)
  return true
}

/** Clears all favorites. */
export function clearFavorites(): void {
  writeIds([])
}
