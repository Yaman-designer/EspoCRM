'use client'

import { useCallback } from 'react'
import { useController } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, formatBytes } from '../utils'
import type { FieldComponentProps, MultiImageField as Schema } from '../types'

export function MultiImageField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { field, fieldState } = useController({
    control: form.control,
    name: schema.key,
    rules: buildRules(schema, form.getValues),
  })

  const files: (File | string)[] = Array.isArray(field.value) ? field.value : []
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

  const previews = files.map(f => (f instanceof File ? URL.createObjectURL(f) : String(f)))

  return (
    <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
      <div className="space-y-3">
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((src, i) => (
              <div key={src + i} className="group relative aspect-square overflow-hidden rounded-xl border border-border/50">
                <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
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
