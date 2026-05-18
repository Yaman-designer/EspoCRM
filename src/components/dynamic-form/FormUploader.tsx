'use client'

import { useCallback, useState } from 'react'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileIcon, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { FieldConfig } from './types'

interface FormUploaderProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormUploader({ field, config }: FormUploaderProps) {
  const isImage = config.type === 'image'
  const maxSizeBytes = (config.maxSizeMB ?? 5) * 1024 * 1024

  const [preview, setPreview] = useState<string | null>(
    typeof field.value === 'string' && field.value.startsWith('http') ? field.value : null,
  )

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (!accepted.length) return
      const file = config.multiple ? accepted : accepted[0]
      field.onChange(file)
      if (isImage && !config.multiple) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(accepted[0])
      }
    },
    [field, config.multiple, isImage],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: config.accept ? { [config.accept]: [] } : undefined,
    multiple: config.multiple ?? false,
    maxSize: maxSizeBytes,
    disabled: config.disabled,
  })

  function clear() {
    field.onChange(null)
    setPreview(null)
  }

  const hasFile = !!field.value

  return (
    <div className="space-y-2">
      {isImage && preview ? (
        <div className="relative w-full overflow-hidden rounded-lg border border-border/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="max-h-48 w-full object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7"
            onClick={clear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border/60 bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
            config.disabled && 'cursor-not-allowed opacity-50',
          )}
        >
          <input {...getInputProps()} />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            {isImage
              ? <ImageIcon className="h-5 w-5 text-muted-foreground" />
              : <Upload className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? 'Drop to upload' : 'Click or drag to upload'}
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              {config.accept
                ? `${config.accept} · max ${config.maxSizeMB ?? 5} MB`
                : `Max ${config.maxSizeMB ?? 5} MB`}
            </p>
          </div>
        </div>
      )}

      {!isImage && hasFile && (
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
          <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm text-foreground">
            {field.value instanceof File
              ? field.value.name
              : Array.isArray(field.value)
                ? `${field.value.length} file(s)`
                : String(field.value)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={clear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
