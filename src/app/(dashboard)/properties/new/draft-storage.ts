// localStorage-only draft persistence for the property creation wizard.
// EspoCRM has no partial-draft concept of its own — creating a real
// Draft-status record on every autosave tick would accumulate orphaned
// records, so per the approved rebuild plan this stays client-local for v1.
//
// File objects (from the Media step's imagesIds) are stripped before saving:
// JSON.stringify on a File produces `{}` (no enumerable own properties),
// which would silently corrupt the field on restore — simplest correct
// behavior is to not persist in-progress image selections across a reload.

const DRAFT_STORAGE_KEY = 'property_wizard_draft_v1'

function stripFiles(values: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value) && value.some(v => v instanceof File)) {
      clean[key] = value.filter(v => typeof v === 'string')
      continue
    }
    if (value instanceof File) continue
    clean[key] = value
  }
  return clean
}

export function saveDraft(values: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(stripFiles(values)))
  } catch { /* storage unavailable or quota exceeded — best-effort only */ }
}

// One-time field migration: drafts saved before the `purpose` -> `requestType`
// rename (PDF-confirmed backend name) still have the old key in localStorage.
// Carries the value over on load so an in-progress draft isn't silently lost.
function migratePurposeToRequestType(draft: Record<string, unknown>): Record<string, unknown> {
  if ('purpose' in draft && !('requestType' in draft)) {
    const { purpose, ...rest } = draft
    return { ...rest, requestType: purpose }
  }
  return draft
}

// One-time field migration: drafts saved before the `parkingCount` ->
// `parkingSpaces` rename (PDF-confirmed backend name) still have the old key
// in localStorage. Carries the value over on load so an in-progress draft
// isn't silently lost.
function migrateParkingCountToParkingSpaces(draft: Record<string, unknown>): Record<string, unknown> {
  if ('parkingCount' in draft && !('parkingSpaces' in draft)) {
    const { parkingCount, ...rest } = draft
    return { ...rest, parkingSpaces: parkingCount }
  }
  return draft
}

export function loadDraft(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return migrateParkingCountToParkingSpaces(migratePurposeToRequestType(parsed as Record<string, unknown>))
  } catch { return null }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(DRAFT_STORAGE_KEY) } catch { /* ignore */ }
}
