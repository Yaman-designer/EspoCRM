import type { FieldErrors } from 'react-hook-form'
import type { ColSpan, GridSpan } from './types'

/* ─── Field ID generation ────────────────────────────────────────── */

export function getFieldId(key: string): string {
  return `fe-${key.replace(/[.[\]]/g, '-')}`
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

// Explicit class maps so Tailwind includes all variants in the build
const XS: Record<ColSpan, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
}
const SM: Record<ColSpan, string> = {
  1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4',
  5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8',
  9: 'sm:col-span-9', 10: 'sm:col-span-10', 11: 'sm:col-span-11', 12: 'sm:col-span-12',
}
const MD: Record<ColSpan, string> = {
  1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
  5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
  9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
}
const LG: Record<ColSpan, string> = {
  1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
  5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
  9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
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
