import type { FieldErrors } from 'react-hook-form'
import type { ColSpan, FieldOption, FieldSchema, GridSpan } from './types'

/* ─── Field ID generation ────────────────────────────────────────── */

export function getFieldId(key: string): string {
  return `fe-${key.replace(/[.[\]]/g, '-')}`
}

/**
 * Id of the element that describes this field (its error message, or its
 * helper text when there's no error) — or undefined when neither is shown.
 * Mirrors `FormFieldShell`'s own internal `${id}-error`/`${id}-helper`
 * precedence exactly (error wins), since both must agree on the same ids to
 * actually connect.
 *
 * `FormFieldShell` puts `aria-describedby` on a wrapper `<div>` around the
 * field's native control, which screen readers do NOT use as that control's
 * accessible description (only the focused element's own attributes count).
 * Every field component must additionally apply this to its OWN native
 * control (the actual `<input>`/`<button>`/etc a screen reader will focus)
 * for the error/helper text to actually be announced.
 */
export function getFieldDescribedBy(schema: FieldSchema, error: string | undefined): string | undefined {
  const id = getFieldId(schema.key)
  if (error) return `${id}-error`
  if (schema.helperTextKey) return `${id}-helper`
  return undefined
}

/**
 * Resolves a `FieldOption`'s display text: `labelKey` (translated per the
 * active locale) when present, otherwise the static `label` unchanged.
 * Most option lists never set `labelKey` — this is a no-op passthrough for
 * them. It exists for the handful whose source label isn't locale-neutral
 * (e.g. a Greek PDF/EspoCRM spec name) and therefore can't be a single
 * hardcoded string shared by every locale.
 */
export function resolveOptionLabel(t: (key: string) => string, opt: FieldOption): string {
  return opt.labelKey ? t(opt.labelKey) : opt.label
}

/* ─── Error extraction (supports dot-notation keys) ─────────────── */

export function getFieldError(
  errors: FieldErrors<Record<string, unknown>>,
  key: string,
): string | undefined {
  const parts = key.split('.')
  let cursor: unknown = errors
  for (const part of parts) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  if (cursor != null && typeof cursor === 'object' && 'message' in cursor) {
    const msg = (cursor as Record<string, unknown>).message
    return typeof msg === 'string' ? msg : undefined
  }
  return undefined
}

/* ─── Nested value access (for dependency + visibility engines) ──── */

export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let cursor: unknown = obj
  for (const part of parts) {
    if (cursor == null || typeof cursor !== 'object') return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return cursor
}

/* ─── Grid class generation ──────────────────────────────────────── */

// Explicit class maps so Tailwind includes all variants in the build.
//
// SM/MD/LG use CSS container-query variants (`@md:`, `@2xl:`, `@4xl:`), not
// viewport breakpoints (`sm:`, `md:`, `lg:`) — see GridEngine.tsx, which
// wraps the grid in `@container`. Three container tiers, chosen so a field
// never goes to more columns than its ACTUAL rendered width comfortably
// supports, regardless of what column count another field's span implies at
// the same key:
//   sm → @md  (28rem / 448px container) — first "go to 2 columns" point,
//        shared by half()/third()/quarter(): ~206px+ per column, enough for
//        any single-line input, select, or date field.
//   md → @2xl (42rem / 672px container) — third()'s 3-up point: ~208px+/col.
//   lg → @4xl (56rem / 896px container) — quarter()'s 4-up point: ~206px+/col.
// (half() only ever uses `sm`; third() uses `sm`+`md`; quarter() uses
// `sm`+`lg` — see SchemaBuilder.ts. Each helper's own final tier is picked
// so its own column count gets enough width, independent of what the other
// helpers do with the same key elsewhere.)
const XS: Record<ColSpan, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
}
const SM: Record<ColSpan, string> = {
  1: '@md:col-span-1', 2: '@md:col-span-2', 3: '@md:col-span-3', 4: '@md:col-span-4',
  5: '@md:col-span-5', 6: '@md:col-span-6', 7: '@md:col-span-7', 8: '@md:col-span-8',
  9: '@md:col-span-9', 10: '@md:col-span-10', 11: '@md:col-span-11', 12: '@md:col-span-12',
}
const MD: Record<ColSpan, string> = {
  1: '@2xl:col-span-1', 2: '@2xl:col-span-2', 3: '@2xl:col-span-3', 4: '@2xl:col-span-4',
  5: '@2xl:col-span-5', 6: '@2xl:col-span-6', 7: '@2xl:col-span-7', 8: '@2xl:col-span-8',
  9: '@2xl:col-span-9', 10: '@2xl:col-span-10', 11: '@2xl:col-span-11', 12: '@2xl:col-span-12',
}
const LG: Record<ColSpan, string> = {
  1: '@4xl:col-span-1', 2: '@4xl:col-span-2', 3: '@4xl:col-span-3', 4: '@4xl:col-span-4',
  5: '@4xl:col-span-5', 6: '@4xl:col-span-6', 7: '@4xl:col-span-7', 8: '@4xl:col-span-8',
  9: '@4xl:col-span-9', 10: '@4xl:col-span-10', 11: '@4xl:col-span-11', 12: '@4xl:col-span-12',
}

export function getGridClasses(span?: GridSpan): string {
  if (!span) return 'col-span-12'
  const parts: string[] = [XS[span.xs ?? 12]]
  if (span.sm != null) parts.push(SM[span.sm])
  if (span.md != null) parts.push(MD[span.md])
  if (span.lg != null) parts.push(LG[span.lg])
  return parts.join(' ')
}

/* ─── Collect all fields from a StepSchema ───────────────────────── */

export function getAllFields(schema: { sections?: { fields: unknown[] }[]; fields?: unknown[] }): unknown[] {
  if (schema.sections) return schema.sections.flatMap(s => s.fields)
  return schema.fields ?? []
}

/* ─── File size formatting ───────────────────────────────────────── */

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
