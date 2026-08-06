/**
 * Filters "garbage" address fragments — live EspoCRM data on this staging
 * instance includes fields populated with single stray characters
 * (confirmed: addressCity: "e" on a real record), almost certainly
 * test-data entry artifacts, not real city/street/state/country names.
 * Requires at least 2 trimmed characters to treat a fragment as real
 * address information. Display-only: never alters what's stored, only what
 * gets joined into a displayed address line. Entity-agnostic.
 */
export function isMeaningfulAddressFragment(value: string | undefined | null): value is string {
  return !!value && value.trim().length >= 2
}

/** Joins non-empty, non-garbage address fragments into one display line (e.g. "Main St, City, Country"). */
export function joinAddressParts(parts: Array<string | undefined | null>): string {
  return parts.filter(isMeaningfulAddressFragment).join(', ')
}

/**
 * First non-blank value among several candidate fields, in priority order —
 * each call site supplies its own field list/order, so this generalizes the
 * `a?.trim() || b?.trim() || fallback` idiom without changing any one
 * site's specific field priority or fallback.
 */
export function firstNonEmpty(...values: Array<string | undefined | null>): string | undefined {
  for (const v of values) {
    const trimmed = v?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}
