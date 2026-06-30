'use client'

import { useCallback } from 'react'
import { useController } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { ImageIcon, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, formatBytes } from '../utils'
import type { FieldComponentProps, ImageField as Schema } from '../types'

export function ImageField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { field, fieldState } = useController({
    control: form.control,
    name: schema.key,
    rules: buildRules(schema, form.getValues),
  })

  const onDrop = useCallback((files: File[]) => {
    if (readOnly || disabled) return
    const file = files[0]
    if (!file) return
    if (schema.maxSize && file.size > schema.maxSize) return
    field.onChange(file)
  }, [readOnly, disabled, field, schema.maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: schema.accept ? Object.fromEntries(schema.accept.map(t => [t, []])) : { 'image/*': [] },
    maxFiles: 1,
    disabled: disabled || readOnly,
  })

  const preview = field.value instanceof File
    ? URL.createObjectURL(field.value)
    : typeof field.value === 'string'
    ? field.value
    : null

  return (
    <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
      {preview ? (
        <div className="relative">
          <div className={cn(
            'relative overflow-hidden rounded-xl border border-border bg-muted',
            schema.aspectRatio ? 'w-full' : 'h-48 w-full',
          )}>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
              style={schema.aspectRatio ? { aspectRatio: schema.aspectRatio } : undefined}
            />
          </div>
          {!readOnly && !disabled && (
            <button
              type="button"
              onClick={() => field.onChange(null)}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-background/80 text-foreground shadow backdrop-blur-sm hover:bg-destructive hover:text-white transition-colors"
              aria-label="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          id={getFieldId(schema.key)}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
            isDragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/30',
            (disabled || readOnly) && 'cursor-not-allowed opacity-50',
            fieldState.error && 'border-destructive',
          )}
        >
          <input {...getInputProps()} />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            {isDragActive ? <UploadCloud className="h-6 w-6 text-primary" /> : <ImageIcon className="h-6 w-6" />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop the image here' : 'Drop an image or click to browse'}
            </p>
            {schema.maxSize && (
              <p className="mt-0.5 text-xs text-muted-foreground">Max {formatBytes(schema.maxSize)}</p>
            )}
          </div>
        </div>
      )}
    </FieldWrapper>
  )
}
