/**
 * Centralized formatting utilities with a pinned locale so output is
 * identical between the Node.js server (SSR) and any browser locale
 * (CSR), eliminating hydration mismatches from locale-dependent APIs.
 */

const LOCALE = 'en-US'

const _number = new Intl.NumberFormat(LOCALE)
const _compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })

/**
 * The single source of truth for this CRM's operating currency. Confirmed
 * live against EspoCRM entityDefs (a non-EUR `XCurrency` companion is
 * rejected with a hard 400 on every Currency-typed RealEstateProperty
 * field) and consistent with every other signal in this codebase (Greek
 * field labels, portal syndication to Xe.gr/Spitogatos.gr/Plot.gr). There is
 * no evidence anywhere in this application of genuine non-EUR data — do not
 * reintroduce a USD default without the same standard of live evidence this
 * one has.
 */
export const APP_CURRENCY = 'EUR'

// One memoized Intl.NumberFormat per (currency, compact) pair — constructing
// these is not free, and every consumer used to build its own inline, which
// is exactly the duplicate-formatting-logic problem this module now exists
// to eliminate (Enterprise Reconciliation Program, Wave 4, 2026-07-14).
const _currencyFormatters = new Map<string, Intl.NumberFormat>()

function getCurrencyFormatter(currency: string, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact}`
  let formatter = _currencyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      maximumFractionDigits: compact ? 2 : 0,
      ...(compact ? { notation: 'compact' } : {}),
    })
    _currencyFormatters.set(key, formatter)
  }
  return formatter
}

/** Format a plain integer/float — e.g. 1234567 → "1,234,567" */
export function formatNumber(value: number): string {
  return _number.format(value)
}

/** Compact notation — e.g. 2000 → "2K", 1500000 → "1.5M" */
export function formatCompact(value: number): string {
  return _compact.format(value)
}

/**
 * Currency formatting — the single implementation every consumer in this
 * app must use (data tables, property prices, anywhere else a monetary
 * value is displayed). Defaults to APP_CURRENCY; pass an explicit ISO 4217
 * code only when a real, evidenced reason exists for a different currency.
 * Pass `compact: true` in space-constrained contexts to abbreviate values
 * ≥ 1,000 (e.g. €1.5M instead of €1,500,000) with 2 fraction digits instead
 * of the default 0.
 */
export function formatCurrency(
  value: number,
  currency: string = APP_CURRENCY,
  options: { compact?: boolean } = {},
): string {
  return getCurrencyFormatter(currency, options.compact ?? false).format(value)
}

/**
 * Format a date with a pinned locale so SSR and CSR agree.
 * Pass a plain object of Intl.DateTimeFormatOptions to customise.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
): string {
  return new Intl.DateTimeFormat(LOCALE, options).format(new Date(date))
}
