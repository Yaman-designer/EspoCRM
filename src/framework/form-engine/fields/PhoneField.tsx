'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, PhoneField as Schema } from '../types'

const COUNTRIES = [
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'Egypt' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'United States' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'United Kingdom' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'France' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Germany' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turkey' },
]

export function PhoneField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const defaultCountry = COUNTRIES.find(c => c.code === (schema.defaultCountry ?? 'SA')) ?? COUNTRIES[0]
  const [country, setCountry] = useState(defaultCountry)
  const [open, setOpen] = useState(false)

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="flex gap-2">
            {/* Country prefix picker */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled || readOnly}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm',
                    'hover:bg-muted/40 transition-colors',
                    open && 'ring-2 ring-ring ring-offset-background',
                    (disabled || readOnly) && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span>{country.flag}</span>
                  <span className="text-muted-foreground">{country.dial}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-64" align="start">
                <Command>
                  <CommandInput placeholder="Search country…" />
                  <CommandList>
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandGroup>
                      {COUNTRIES.map(c => (
                        <CommandItem
                          key={c.code}
                          value={`${c.name} ${c.dial}`}
                          onSelect={() => { setCountry(c); setOpen(false) }}
                          className="flex items-center gap-2"
                        >
                          <span>{c.flag}</span>
                          <span className="flex-1">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.dial}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Phone number input */}
            <Input
              {...field}
              id={getFieldId(schema.key)}
              value={field.value ?? ''}
              type="tel"
              placeholder={schema.placeholder ?? '5xx xxx xxxx'}
              disabled={disabled}
              readOnly={readOnly}
              inputMode="tel"
              aria-invalid={!!fieldState.error}
              className="flex-1"
            />
          </div>
        </FieldWrapper>
      )}
    />
  )
}
