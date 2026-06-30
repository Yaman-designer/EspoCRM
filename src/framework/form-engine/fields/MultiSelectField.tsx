'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, MultiSelectField as Schema, FieldOption } from '../types'

export function MultiSelectField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const [open, setOpen] = useState(false)
  const opts = options ?? schema.options ?? []

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const selected: (string | number | boolean)[] = Array.isArray(field.value) ? field.value : []
        const selectedOpts = selected.map(v => opts.find(o => o.value === v) ?? { value: v, label: String(v) })

        const toggle = (opt: FieldOption) => {
          if (readOnly || opt.disabled) return
          const exists = selected.some(v => v === opt.value)
          if (exists) {
            field.onChange(selected.filter(v => v !== opt.value))
          } else {
            if (schema.max && selected.length >= schema.max) return
            field.onChange([...selected, opt.value])
          }
        }

        const remove = (val: string | number | boolean, e: React.MouseEvent) => {
          e.stopPropagation()
          if (readOnly) return
          field.onChange(selected.filter(v => v !== val))
        }

        return (
          <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
            <Popover open={open && !disabled && !readOnly} onOpenChange={o => !disabled && !readOnly && setOpen(o)}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  id={getFieldId(schema.key)}
                  disabled={disabled}
                  aria-invalid={!!fieldState.error}
                  className={cn(
                    'flex min-h-12 w-full flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-input px-3 py-2.5 text-left text-sm',
                    'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200',
                    'hover:border-border/90 hover:shadow-[0_1px_4px_rgba(16,24,40,0.07)]',
                    'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15',
                    open && 'border-ring ring-3 ring-ring/15',
                    (disabled || readOnly) && 'cursor-not-allowed opacity-50',
                    fieldState.error && 'border-destructive ring-3 ring-destructive/20',
                  )}
                >
                  {selectedOpts.length === 0 ? (
                    <span className="text-muted-foreground/50">
                      {schema.placeholder ?? `Select ${schema.label.toLowerCase()}…`}
                    </span>
                  ) : (
                    selectedOpts.map(opt => (
                      <Badge
                        key={String(opt.value)}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1"
                      >
                        {opt.label}
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={e => remove(opt.value, e)}
                            className="ml-0.5 hover:text-destructive transition-colors duration-200"
                            aria-label={`Remove ${opt.label}`}
                          >
                            <X className="h-3 w-3" aria-hidden />
                          </button>
                        )}
                      </Badge>
                    ))
                  )}
                  <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-40" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command>
                  <CommandInput placeholder={`Search ${schema.label.toLowerCase()}…`} />
                  <CommandList>
                    <CommandEmpty>No options found.</CommandEmpty>
                    <CommandGroup>
                      {opts.map(opt => {
                        const isSelected = selected.some(v => v === opt.value)
                        return (
                          <CommandItem
                            key={String(opt.value)}
                            value={String(opt.value) + opt.label}
                            onSelect={() => toggle(opt)}
                            disabled={opt.disabled || (!isSelected && !!schema.max && selected.length >= schema.max)}
                          >
                            <Check className={cn('mr-2 h-4 w-4 shrink-0', isSelected ? 'opacity-100 text-primary' : 'opacity-0')} />
                            {opt.label}
                            {opt.description && (
                              <span className="ml-1 text-xs text-muted-foreground">{opt.description}</span>
                            )}
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldWrapper>
        )
      }}
    />
  )
}
