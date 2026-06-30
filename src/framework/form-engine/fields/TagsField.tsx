'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { Controller } from 'react-hook-form'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, TagsField as Schema } from '../types'

export function TagsField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const opts = options ?? schema.options ?? []
  const suggestions = opts.filter(o =>
    input && String(o.label).toLowerCase().includes(input.toLowerCase()),
  )

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const tags: (string | number)[] = Array.isArray(field.value) ? field.value : []

        const addTag = (tag: string | number) => {
          if (!tag || tags.includes(tag)) return
          if (schema.max && tags.length >= schema.max) return
          field.onChange([...tags, tag])
          setInput('')
        }

        const removeTag = (tag: string | number) => {
          if (readOnly) return
          field.onChange(tags.filter(t => t !== tag))
        }

        const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
          if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
            e.preventDefault()
            if (schema.creatable !== false || opts.some(o => String(o.label) === input.trim())) {
              addTag(input.trim())
            }
          } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            removeTag(tags[tags.length - 1])
          }
        }

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <div
              className={cn(
                'flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-input px-3 py-2.5',
                'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 cursor-text',
                'hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)]',
                'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15',
                (disabled || readOnly) && 'opacity-50 cursor-not-allowed',
                fieldState.error && 'border-destructive ring-3 ring-destructive/20',
              )}
              onClick={() => inputRef.current?.focus()}
            >
              {tags.map(tag => (
                <Badge key={String(tag)} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                  {opts.find(o => o.value === tag)?.label ?? String(tag)}
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); removeTag(tag) }}
                      className="hover:text-destructive transition-colors duration-200"
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}

              {(!schema.max || tags.length < schema.max) && !readOnly && (
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    id={getFieldId(schema.key)}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    disabled={disabled}
                    placeholder={tags.length === 0 ? (schema.placeholder ?? 'Type and press Enter…') : ''}
                    className="min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                  />
                  {/* Suggestions dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute left-0 top-full z-10 mt-1 min-w-48 rounded-xl border border-border/25 bg-popover py-1 shadow-[0_4px_20px_rgba(16,24,40,0.10),0_1px_4px_rgba(16,24,40,0.06)]">
                      {suggestions.map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-sm hover:bg-muted"
                          onMouseDown={e => { e.preventDefault(); addTag(opt.value as string | number) }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {schema.max && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {tags.length}/{schema.max} tags
              </p>
            )}
          </FieldWrapper>
        )
      }}
    />
  )
}
