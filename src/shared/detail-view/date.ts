import { formatDate } from '@/lib/format'

const EN_GB_DATE_OPTS: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
const EN_US_SHORT_DATE_OPTS: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

/**
 * "22 Jul 2026" style date (en-GB, day-month-year). Consolidates what were
 * two independently-defined but identical local formatters in the Property
 * details page (FinancialIntelligenceOS's old `fmtDate`, OperationsCommandHub's
 * old `formatDate`) — output is unchanged, now defined in exactly one place.
 * Entity-agnostic — not Property-specific.
 */
export function formatDateGB(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', EN_GB_DATE_OPTS)
  } catch {
    return '—'
  }
}

/**
 * "5m ago" / "3h ago" / "12d ago" relative time, falling back to an en-US
 * short date (month/day/year, via the app's global `formatDate`) past 30
 * days. Extracted verbatim from the Property details page's former local
 * `relTime()`.
 */
export function formatRelativeTime(iso: string | undefined | null): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'Just now'
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1)  return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso, EN_US_SHORT_DATE_OPTS)
}

/** Safe epoch-ms conversion; unparsable/missing dates sort last via -Infinity. */
export function toEpochMs(iso: string | undefined | null): number {
  if (!iso) return -Infinity
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? -Infinity : t
}
