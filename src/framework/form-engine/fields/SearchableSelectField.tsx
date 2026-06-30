'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, SearchableSelectField as Schema } from '../types'

export function SearchableSelectField({ schema, form, disabled, readOnly, options }: FieldComponentProps<Schema>) {
  const [open, setOpen] = useState(false)
  const [creatableInput, setCreatableInput] = useState('')
  const opts = options ?? schema.options ?? []

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => {
        const selectedOpt = opts.find(o => o.value === field.value || String(o.value) === String(field.value))
        const displayLabel = selectedOpt?.label ?? (field.value != null ? String(field.value) : null)

        const select = (val: string | number | boolean, label?: string) => {
          if (readOnly) return
          field.onChange(val)
          setOpen(false)
          setCreatableInput('')
        }

        const clear = (e: React.MouseEvent) => {
          e.stopPropagation()
          if (readOnly) return
          field.onChange(null)
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
                    'flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm',
                    'hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    open && 'ring-2 ring-ring',
                    (disabled || readOnly) && 'cursor-not-allowed opacity-50',
                    fieldState.error && 'border-destructive',
                  )}
                >
                  <span className={displayLabel ? 'text-foreground' : 'text-muted-foreground'}>
                    {displayLabel ?? (schema.placeholder ?? `Select ${schema.label.toLowerCase()}…`)}
                  </span>
                  <div className="flex items-center gap-1">
                    {schema.clearable && field.value != null && (
                      <span onClick={clear} className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded">
                        <X className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-40" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-(--radix-popover-trigger-width)" align="start">
                <Command>
                  <CommandInput
                    placeholder={`Search ${schema.label.toLowerCase()}…`}
                    onValueChange={schema.creatable ? setCreatableInput : undefined}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {schema.creatable && creatableInput ? (
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => select(creatableInput)}
                        >
                          Create &quot;{creatableInput}&quot;
                        </button>
                      ) : (
                        'No options found.'
                      )}
                    </CommandEmpty>
                    <CommandGroup>
                      {opts.map(opt => (
                        <CommandItem
                          key={String(opt.value)}
                          value={String(opt.value) + opt.label}
                          onSelect={() => select(opt.value)}
                          disabled={opt.disabled}
                        >
                          <Check className={cn('mr-2 h-4 w-4 shrink-0', String(field.value) === String(opt.value) ? 'opacity-100 text-primary' : 'opacity-0')} />
                          {opt.label}
                          {opt.description && (
                            <span className="ml-1 text-xs text-muted-foreground">{opt.description}</span>
                          )}
                        </CommandItem>
                      ))}
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
