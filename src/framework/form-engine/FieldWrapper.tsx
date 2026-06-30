'use client'

import type { ReactNode } from 'react'
import { Info, HelpCircle, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getFieldId } from './utils'
import type { FieldSchema } from './types'

interface FieldWrapperProps {
  schema: FieldSchema
  error?: string
  disabled?: boolean
  readOnly?: boolean
  /** Current character count — enables character counter display */
  charCount?: number
  children: ReactNode
  className?: string
}

/**
 * Universal field container: label, required indicator, tooltip,
 * description, the input slot, helper text / error message, and character counter.
 *
 * Every field component renders through this wrapper for a11y + visual consistency.
 */
export function FieldWrapper({
  schema,
  error,
  disabled,
  readOnly,
  charCount,
  children,
  className,
}: FieldWrapperProps) {
  const inputId  = getFieldId(schema.key)
  const helperId = `${inputId}-helper`
  const errorId  = `${inputId}-error`
  const hasMax   = 'maxLength' in schema && typeof schema.maxLength === 'number'
  const showCounter = 'characterCounter' in schema && schema.characterCounter && hasMax

  const describedBy = [
    error ? errorId : null,
    !error && schema.helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn('flex flex-col gap-2 sm:gap-2.5', className)}
        data-field-key={schema.key}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        {/* ── Label row ──────────────────────────────────────────── */}
        {schema.label && (
          <div className="flex items-center gap-1.5">
            <label
              htmlFor={inputId}
              className={cn(
                'text-[13px] font-semibold leading-none tracking-tight',
                disabled ? 'text-muted-foreground/65' : 'text-foreground/80',
              )}
            >
              {schema.label}
              {schema.required && (
                <span className="ml-0.5 text-destructive" aria-hidden>
                  *
                </span>
              )}
            </label>

            {readOnly && (
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Read-only
              </span>
            )}

            {schema.tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    aria-label={`More info about ${schema.label}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-60 text-xs">
                  {schema.tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* ── Description (below label, above input) ────────────── */}
        {schema.description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {schema.description}
          </p>
        )}

        {/* ── Field input slot ──────────────────────────────────── */}
        <div
          aria-describedby={describedBy}
          aria-required={schema.required || undefined}
          aria-invalid={!!error || undefined}
        >
          {children}
        </div>

        {/* ── Bottom row: error | helper | counter ──────────────── */}
        {/* sm:min-h-4 reserves space on desktop for multi-column grid alignment.
            max-sm:hidden collapses it on mobile when there is nothing to show,
            eliminating ~16 px of dead space per plain field. */}
        <div className={cn(
          'flex items-start justify-between gap-2 sm:min-h-4',
          !error && !schema.helperText && !(showCounter && typeof charCount === 'number')
            && 'max-sm:hidden',
        )}>
          <div className="flex-1">
            {error ? (
              <p
                id={errorId}
                role="alert"
                className="ff-field-error-in flex items-center gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3 w-3 shrink-0" aria-hidden />
                {error}
              </p>
            ) : schema.helperText ? (
              <p id={helperId} className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3 shrink-0 text-muted-foreground/60" aria-hidden />
                {schema.helperText}
              </p>
            ) : null}
          </div>

          {showCounter && typeof charCount === 'number' && (
            <p
              className={cn(
                'shrink-0 text-[11px] tabular-nums',
                charCount > (schema as { maxLength: number }).maxLength * 0.9
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
              aria-live="polite"
            >
              {charCount}/{(schema as { maxLength: number }).maxLength}
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
