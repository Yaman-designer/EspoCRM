'use client'

import { useState } from 'react'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { FieldConfig } from './types'

// ── Date utilities (no date-fns dependency) ────────────────────────────────────

function parseISODate(value: unknown): Date | undefined {
  if (!value || typeof value !== 'string') return undefined
  const d = new Date(value + 'T00:00:00')
  return isNaN(d.getTime()) ? undefined : d
}

function toISODate(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDisplay(value: unknown): string {
  const d = parseISODate(value)
  if (!d) return ''
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Component ──────────────────────────────────────────────────────────────────

interface FormDatePickerProps {
  field: ControllerRenderProps<FieldValues, string>
  config: FieldConfig
}

export function FormDatePicker({ field, config }: FormDatePickerProps) {
  const [open, setOpen] = useState(false)
  const date = parseISODate(field.value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-9 w-full justify-start border-border/60 text-left text-sm font-normal',
            !date && 'text-muted-foreground',
            (config.disabled || config.readOnly) && 'pointer-events-none opacity-60',
          )}
          disabled={config.disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? formatDisplay(field.value) : (config.placeholder ?? 'Pick a date…')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            field.onChange(d ? toISODate(d) : '')
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
