/**
 * Centralized formatting utilities with a pinned locale so output is
 * identical between the Node.js server (SSR) and any browser locale
 * (CSR), eliminating hydration mismatches from locale-dependent APIs.
 */

const LOCALE = 'en-US'

const _number = new Intl.NumberFormat(LOCALE)
const _compact = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
const _currency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

/** Format a plain integer/float — e.g. 1234567 → "1,234,567" */
export function formatNumber(value: number): string {
  return _number.format(value)
}

/** Compact notation — e.g. 2000 → "2K", 1500000 → "1.5M" */
export function formatCompact(value: number): string {
  return _compact.format(value)
}

/** USD currency — e.g. 1500000 → "$1,500,000" */
export function formatCurrency(value: number): string {
  return _currency.format(value)
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
