'use client'

import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react'
import { useController } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, formatBytes } from '../utils'
import type { FieldComponentProps, MultiImageField as Schema } from '../types'

// Stable reference for the "no value yet" case — `Array.isArray(field.value)
// ? field.value : []` would otherwise produce a brand-new empty array every
// render, which would defeat the object-URL effect's dependency check below
// (a fresh [] is never === the previous fresh [], so the effect would think
// the file list changed on every unrelated re-render).
const EMPTY_FILES: (File | string)[] = []

export function MultiImageField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { field, fieldState } = useController({
    control: form.control,
    name: schema.key,
    rules: buildRules(schema, form.getValues),
  })

  const files: (File | string)[] = Array.isArray(field.value) ? field.value : EMPTY_FILES
  const canAdd = !schema.maxFiles || files.length < schema.maxFiles

  const onDrop = useCallback((accepted: File[]) => {
    if (readOnly || disabled) return
    const remaining = schema.maxFiles ? schema.maxFiles - files.length : Infinity
    const filtered = accepted
      .filter(f => !schema.maxSize || f.size <= schema.maxSize)
      .slice(0, remaining)
    field.onChange([...files, ...filtered])
  }, [files, field, readOnly, disabled, schema.maxFiles, schema.maxSize])

  const remove = useCallback((idx: number) => {
    if (readOnly) return
    field.onChange(files.filter((_, i) => i !== idx))
  }, [files, field, readOnly])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: schema.accept ? Object.fromEntries(schema.accept.map(t => [t, []])) : { 'image/*': [] },
    disabled: disabled || readOnly || !canAdd,
  })

  // Blob-URL lifecycle for locally-picked Files: each File keeps the SAME
  // object URL across re-renders (keyed by File identity in the map below)
  // instead of getting a fresh, never-revoked one every render — this step
  // re-renders on every keystroke anywhere in the form (DynamicForm watches
  // the whole form), so the previous render-time `URL.createObjectURL()`
  // call was leaking one blob URL per keystroke for every selected image.
  // useLayoutEffect so URLs for newly-added files are ready before paint —
  // same frame the old synchronous call would have painted, no visible
  // flash. Same "synchronizing a local resource with an external value"
  // rationale as ImageField.tsx's own object-URL effect.
  //
  // The dedup lookup below reads/writes `objectUrlsRef` (a ref), never the
  // `objectUrls` state itself — this project runs with reactStrictMode:true
  // (next.config.ts), which invokes an effect body twice on mount without
  // necessarily committing the first invocation's setState before the
  // second one runs. Looking up "does this File already have a URL" against
  // React state (via a functional setState updater's `prev` argument) would
  // see the SAME stale (pre-first-invocation) snapshot on both invocations,
  // so the second invocation would create — and immediately orphan, never
  // revoked — a duplicate URL for every file the first invocation just
  // handled. Refs are mutated synchronously and are visible immediately to
  // a subsequent synchronous call in the same tick, so the second
  // invocation correctly sees the first invocation's freshly-created URLs
  // and reuses them instead of duplicating them.
  const [objectUrls, setObjectUrls] = useState<Map<File, string>>(() => new Map())
  const objectUrlsRef = useRef<Map<File, string>>(objectUrls)

  useLayoutEffect(() => {
    const prev = objectUrlsRef.current
    const next = new Map<File, string>()
    for (const f of files) {
      if (f instanceof File) next.set(f, prev.get(f) ?? URL.createObjectURL(f))
    }
    // Revoke urls for files no longer in the list (removed, or replaced).
    for (const [file, url] of prev) {
      if (!next.has(file)) URL.revokeObjectURL(url)
    }
    objectUrlsRef.current = next
    // eslint-disable-next-line react-hooks/set-state-in-effect -- external-resource sync (object URLs), see the comment above this effect
    setObjectUrls(next)
  }, [files])

  // Unmount-only: revoke whatever's still outstanding when this field
  // itself is torn down — the diffing effect above only revokes entries
  // dropped from `files` on each re-run, never the ones still present at
  // the moment the component actually unmounts.
  useEffect(() => () => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  const previews = files.map(f => {
    if (f instanceof File) return objectUrls.get(f) ?? null
    return schema.resolvePreviewSrc ? schema.resolvePreviewSrc(f) : f
  })

  return (
    <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
      <div className="space-y-3">
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={(src ?? `pending-${i}`) + i} className="group relative aspect-square overflow-hidden rounded-xl border border-border/50">
                {/* src can be briefly null for a just-picked File on the render
                    before its object URL is created (see the useLayoutEffect
                    above) — never actually painted (layout effects run before
                    paint), guarded here anyway to avoid ever committing an
                    <img src=""> (browsers can treat an empty src as a request
                    for the current page). */}
                {src && <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />}
                {!readOnly && !disabled && (
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove image ${i + 1}`}
                  >
                    <Trash2 className="h-5 w-5 text-white" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {canAdd && !readOnly && (
          <div
            {...getRootProps()}
            id={getFieldId(schema.key)}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-all duration-200 cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                : 'border-border/55 bg-muted/20 hover:border-primary/45 hover:bg-primary/4',
              (disabled || readOnly) && 'cursor-not-allowed opacity-50',
              fieldState.error && 'border-destructive',
            )}
          >
            <input {...getInputProps()} />
            <UploadCloud className={cn('h-10 w-10', isDragActive ? 'text-primary' : 'text-muted-foreground/60')} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Drop images here' : 'Drop images or click to browse'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {schema.maxFiles && `${files.length}/${schema.maxFiles} images`}
                {schema.maxSize && ` · Max ${formatBytes(schema.maxSize)} each`}
              </p>
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}
