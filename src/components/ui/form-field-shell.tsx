'use client'

import type { ReactNode } from 'react'
import { Info, HelpCircle, AlertCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface FormFieldShellProps {
  /** DOM id of the control this shell wraps — used to derive helper/error ids and the label's htmlFor. */
  id: string
  label?: string
  required?: boolean
  /** Already-resolved tooltip copy — this component does no i18n lookup. */
  tooltip?: string
  /** Rendered between the label row and the input slot. */
  description?: string
  helperText?: string
  error?: string
  disabled?: boolean
  readOnly?: boolean
  /** Localized "Read-only" pill text; defaults to English since this is a presentation-only primitive. */
  readOnlyLabel?: string
  /** Localized tooltip-button aria-label; defaults to an English "More info about {label}". */
  tooltipAriaLabel?: string
  /** Current character count — paired with maxLength, enables the counter row. */
  charCount?: number
  maxLength?: number
  /**
   * Fields that draw their own inline label next to the control (switch,
   * checkbox — see `FieldWrapper`'s `ownsLabel()`) pass `label=""` and skip
   * the label row entirely. That left their control sitting flush against
   * the top of the shell while every labeled peer's control starts lower,
   * below its label row — visually confirmed in a mixed row (e.g. a switch
   * beside a select): the switch's control sat ~24px higher than its
   * neighbor's, reading as unbalanced rather than as two peer fields. When
   * true, an invisible spacer matching the real label row's exact box
   * (same classes, same font metrics) reserves that height so an
   * inline-label field's control aligns with a labeled peer's control
   * regardless of row composition. Presentation-only — no visual output
   * change for fields already showing a real label.
   */
  reserveLabelSpace?: boolean
  children: ReactNode
  className?: string
}

/**
 * Presentation-only field shell: label, required indicator, tooltip,
 * description, the input slot, helper text / error message, and character
 * counter. Shared visual contract behind both form engines in this app —
 * `framework/form-engine/FieldWrapper` and `components/dynamic-form`'s
 * per-field wiring both render through this so a field looks identical
 * regardless of which engine produced it. No i18n, no schema coupling:
 * every string here is already resolved by the caller.
 */
export function FormFieldShell({
  id,
  label,
  required,
  tooltip,
  description,
  helperText,
  error,
  disabled,
  readOnly,
  readOnlyLabel = 'Read-only',
  tooltipAriaLabel,
  charCount,
  maxLength,
  reserveLabelSpace,
  children,
  className,
}: FormFieldShellProps) {
  const helperId = `${id}-helper`
  const errorId = `${id}-error`
  const showCounter = typeof charCount === 'number' && typeof maxLength === 'number'

  const describedBy = [
    error ? errorId : null,
    !error && helperText ? helperId : null,
  ].filter(Boolean).join(' ') || undefined

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn('flex flex-col gap-2.5 sm:gap-3', className)}
        data-disabled={disabled || undefined}
        data-readonly={readOnly || undefined}
      >
        {/* ── Label row ──────────────────────────────────────────── */}
        {label ? (
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {/* Required asterisk is a sibling of <label>, not a child of it —
                a Playwright audit found `getByLabel(text, {exact:true})`
                matches a label's raw textContent, which (unlike the real
                ARIA accessible-name computation getByRole uses) does NOT
                exclude aria-hidden descendants. With the asterisk nested
                inside <label>, textContent read "Category*" — silently
                breaking every exact-match E2E lookup for a required field
                even though screen readers, correctly, only ever announced
                "Category" (aria-hidden already excluded it from the real
                accessible name). Moving it outside keeps that same visual
                result (still aria-hidden, still immediately after the
                label, still red, same ml-0.5 spacing) while making the
                label's own text content exactly the field name — the
                correct, stable contract for both assistive tech and
                automated tooling. */}
            <span>
              <label
                htmlFor={id}
                className={cn(
                  'text-[13px] font-semibold leading-none tracking-tight',
                  disabled ? 'text-muted-foreground/65' : 'text-foreground/80',
                )}
              >
                {label}
              </label>
              {required && (
                <span className="ml-0.5 text-destructive" aria-hidden>
                  *
                </span>
              )}
            </span>

            {readOnly && (
              <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {readOnlyLabel}
              </span>
            )}

            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* No tabIndex={-1} — Radix's Tooltip already opens on focus
                      as well as hover, so excluding this from Tab order made
                      the tooltip's content (real content — see labelKey/
                      tooltipKey usage in the wizard schemas, not decorative)
                      entirely unreachable for keyboard-only users. Padding
                      widens the ~14px icon to a real touch target instead of
                      a hit area equal to the glyph itself. */}
                  <button
                    type="button"
                    className="-m-1.5 rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={tooltipAriaLabel ?? `More info about ${label ?? ''}`}
                  >
                    <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-60 text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : reserveLabelSpace ? (
          <div className="flex items-center gap-x-1.5 gap-y-1" aria-hidden="true">
            <span className="invisible text-[13px] font-semibold leading-none tracking-tight">
              &nbsp;
            </span>
          </div>
        ) : null}

        {/* ── Description (below label, above input) ────────────── */}
        {description && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}

        {/* ── Field input slot ──────────────────────────────────── */}
        <div
          aria-describedby={describedBy}
          aria-required={required || undefined}
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
          !error && !helperText && !showCounter && 'max-sm:hidden',
        )}>
          <div className="min-w-0 flex-1">
            {/* items-start + min-w-0 span, not items-center + bare text: a
                bare text node as a flex child (sibling to the icon) has no
                min-content floor that lets it wrap — in a narrow container
                (e.g. a compact side-by-side card) it just forces the row
                wider instead, which was overflowing the card. The wrapping
                span gives the text a real box to shrink/wrap inside;
                items-start keeps the icon aligned to the first line once
                text does wrap to 2+ lines, instead of floating dead-center
                against the whole block. */}
            {error ? (
              <p
                id={errorId}
                role="alert"
                className="ff-field-error-in flex items-start gap-1 text-xs text-destructive"
              >
                <AlertCircle className="h-3 w-3 shrink-0 translate-y-0.5" aria-hidden />
                <span className="min-w-0">{error}</span>
              </p>
            ) : helperText ? (
              <p id={helperId} className="flex items-start gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3 shrink-0 translate-y-0.5 text-muted-foreground/60" aria-hidden />
                <span className="min-w-0">{helperText}</span>
              </p>
            ) : null}
          </div>

          {showCounter && (
            <p
              className={cn(
                'shrink-0 text-[11px] tabular-nums',
                charCount! > maxLength! * 0.9 ? 'text-destructive' : 'text-muted-foreground',
              )}
              aria-live="polite"
            >
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
