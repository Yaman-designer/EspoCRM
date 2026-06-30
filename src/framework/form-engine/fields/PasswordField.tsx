'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FieldWrapper } from '../FieldWrapper'
import { buildRules } from '../ValidationEngine'
import { getFieldId } from '../utils'
import type { FieldComponentProps, PasswordField as Schema } from '../types'

function StrengthMeter({ value }: { value: string }) {
  const strength = getStrength(value)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-destructive', 'bg-orange-400', 'bg-yellow-400', 'bg-brand-emerald']

  if (!value) return null
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i <= strength ? colors[strength] : 'bg-muted')}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{labels[strength]}</p>
    </div>
  )
}

function getStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

export function PasswordField({ schema, form, disabled, readOnly }: FieldComponentProps<Schema>) {
  const [show, setShow] = useState(false)

  return (
    <Controller
      control={form.control}
      name={schema.key}
      rules={buildRules(schema, form.getValues)}
      render={({ field, fieldState }) => (
        <FieldWrapper schema={schema} error={fieldState.error?.message} disabled={disabled} readOnly={readOnly}>
          <div className="relative">
            <Input
              {...field}
              id={getFieldId(schema.key)}
              value={field.value ?? ''}
              type={show ? 'text' : 'password'}
              placeholder={schema.placeholder ?? '••••••••'}
              disabled={disabled}
              readOnly={readOnly}
              autoComplete="current-password"
              aria-invalid={!!fieldState.error}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {schema.showStrengthMeter && <StrengthMeter value={field.value ?? ''} />}
        </FieldWrapper>
      )}
    />
  )
}
