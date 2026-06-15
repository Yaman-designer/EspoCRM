// ── Shared date formatting utilities ─────────────────────────────────────────
//
// Single source of truth for the two display formats used across the CRM.
// Both functions accept null / undefined and return '—' for empty or invalid
// inputs — no caller needs to guard before passing.
//
// Formatters are module-level constants so the Intl objects are constructed
// once per module load rather than on every render.

const DATE_FMT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day:   'numeric',
  year:  'numeric',
})

const DATETIME_FMT = new Intl.DateTimeFormat('en-GB', {
  day:    '2-digit',
  month:  'long',
  year:   'numeric',
  hour:   '2-digit',
  minute: '2-digit',
})

/**
 * Short date — e.g. "Jun 14, 2026".
 * Returns '—' for null, undefined, empty string, or unparseable input.
 */
export function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return DATE_FMT.format(d)
}

/**
 * Long date + time — e.g. "14 June 2026, 10:30".
 * Returns '—' for null, undefined, empty string, or unparseable input.
 */
export function formatDatetime(raw: string | null | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return DATETIME_FMT.format(d)
}
