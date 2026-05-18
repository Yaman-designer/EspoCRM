'use client'

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { FieldConfig } from './types'

interface FormTagsProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormTags({ field, config }: FormTagsProps) {
  const [input, setInput] = useState('')
  const tags: string[] = Array.isArray(field.value) ? field.value : []

  function addTag() {
    const v = input.trim()
    if (v && !tags.includes(v)) {
      field.onChange([...tags, v])
      setInput('')
    }
  }

  function removeTag(tag: string) {
    field.onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="min-h-9 w-full rounded-md border border-input bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/20 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-[11px]">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              disabled={config.disabled}
              className="rounded-full outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? (config.placeholder ?? 'Type and press Enter…') : ''}
          disabled={config.disabled}
          className="min-w-[100px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
      </div>
    </div>
  )
}
