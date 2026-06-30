'use client'

import { useCallback } from 'react'
import { useController } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { File as FileIcon, Paperclip, Trash2, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId, formatBytes } from '../utils'
import type { FieldComponentProps, FileField as Schema } from '../types'

export function FileField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const { field, fieldState } = useController({
    control: form.control,
    name: schema.key,
    rules: buildRules(schema, form.getValues),
  })

  const multiple = schema.multiple ?? false
  const files: File[] = multiple
    ? (Array.isArray(field.value) ? field.value : [])
    : field.value instanceof File
    ? [field.value]
    : []

  const canAdd = multiple ? (!schema.maxFiles || files.length < schema.maxFiles) : files.length === 0

  const onDrop = useCallback((accepted: File[]) => {
    if (readOnly || disabled) return
    const filtered = accepted.filter(f => !schema.maxSize || f.size <= schema.maxSize)
    if (multiple) {
      const maxF = schema.maxFiles ?? Infinity
      field.onChange([...files, ...filtered].slice(0, maxF))
    } else {
      field.onChange(filtered[0] ?? null)
    }
  }, [files, field, readOnly, disabled, multiple, schema.maxFiles, schema.maxSize])

  const remove = useCallback((idx: number) => {
    if (readOnly) return
    if (multiple) field.onChange(files.filter((_, i) => i !== idx))
    else field.onChange(null)
  }, [files, field, readOnly, multiple])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: schema.accept ? Object.fromEntries(schema.accept.map(t => [t, []])) : undefined,
    multiple,
    disabled: disabled || readOnly,
  })

  return (
    <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
      <div className="space-y-2">
        {files.map((file, i) => (
          <div
            key={file.name + i}
            className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-muted/25 px-3 py-2.5 transition-all duration-200"
          >
            <FileIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
            {!readOnly && !disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive transition-colors duration-200"
                aria-label={`Remove ${file.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}

        {canAdd && !readOnly && (
          <div
            {...getRootProps()}
            id={getFieldId(schema.key)}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all duration-200 cursor-pointer',
              isDragActive
                ? 'border-primary bg-primary/5 ring-2 ring-primary/15'
                : 'border-border/55 hover:border-primary/45 hover:bg-primary/4',
              (disabled || readOnly) && 'cursor-not-allowed opacity-50',
              fieldState.error && 'border-destructive',
            )}
          >
            <input {...getInputProps()} />
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              {isDragActive ? <UploadCloud className="h-5 w-5 text-primary" /> : <Paperclip className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragActive ? 'Drop files here' : 'Drag & drop or click to browse'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {schema.accept?.join(', ') ?? 'Any file type'}
                {schema.maxSize && ` · Max ${formatBytes(schema.maxSize)}`}
                {schema.maxFiles && multiple && ` · Up to ${schema.maxFiles} files`}
              </p>
            </div>
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}
