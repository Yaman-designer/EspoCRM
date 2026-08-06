'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ComboboxTriggerProps extends Omit<React.ComponentPropsWithoutRef<'button'>, 'children'> {
  /** Whether the popover this trigger opens is currently open — drives the ring/chevron state. There is no Radix data-state to hook into here (Popover.Trigger doesn't carry one), so callers pass their own open boolean. */
  open?: boolean
  error?: boolean
  size?: 'sm' | 'default'
  /** False omits the trailing chevron — e.g. a calendar-icon-led date picker trigger doesn't need one. */
  showChevron?: boolean
  /** Left-aligned trigger content (selected value / placeholder / leading icon). */
  children: React.ReactNode
}

/**
 * Shared premium trigger button for every Popover-driven "select-like"
 * field in the app — searchable/async selects, multi-selects, date pickers.
 * Same token language as `ui/select.tsx`'s `SelectTrigger` (h-12, rounded-xl,
 * border-border/70, bg-input, shadow micro-tokens, ring-3 ring-ring/15) and
 * the same idle-muted -> hover/open-foreground chevron treatment, so a
 * combobox reads as the same control family as a plain Select everywhere in
 * the app. Content (value text, clear button, leading icons) is fully
 * composed by the caller as children — this component only owns the outer
 * shell + the trailing chevron.
 *
 * CONTRACT for callers: the child that renders the (potentially long)
 * display value MUST carry its own `min-w-0 truncate` — e.g.
 * `<span className="min-w-0 truncate">{value}</span>`. The wrapper span
 * below already has `truncate` too, but that alone is NOT enough: it's a
 * flex container, and CSS `text-overflow` only ellipsizes a box's OWN
 * overflowing inline content, not overflow caused by a nested child's box.
 * Every current consumer (SelectField, SearchableSelectField,
 * AsyncSelectField, MultiSelectField, RelationField, DateField,
 * FormSelect/FormDatePicker) follows this — confirmed live that a long
 * selected value hard-clips mid-word with no ellipsis if a child skips it.
 */
export const ComboboxTrigger = React.forwardRef<HTMLButtonElement, ComboboxTriggerProps>(
  function ComboboxTrigger(
    { open, error, size = 'default', showChevron = true, className, children, disabled, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-invalid={error || undefined}
        data-size={size}
        className={cn(
          'group relative flex w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-input px-4 text-start text-sm font-normal whitespace-nowrap',
          'shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-200 outline-none select-none',
          // Final polish pass: matches Input/Select/Textarea's strengthened
          // hover signal — see input.tsx.
          'hover:border-border hover:shadow-[0_1px_4px_rgba(16,24,40,0.09)]',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/15',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          size === 'default' ? 'h-12' : 'h-9',
          open && 'border-ring shadow-[0_1px_4px_rgba(16,24,40,0.06)] ring-3 ring-ring/15',
          className,
        )}
        {...props}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">{children}</span>
        {showChevron && (
          <ChevronDown
            className={cn(
              'pointer-events-none size-4 shrink-0 text-muted-foreground/70 transition-[rotate,color] duration-200 ease-out',
              'group-hover:text-foreground',
              open && 'rotate-180 text-foreground',
            )}
            aria-hidden
          />
        )}
      </button>
    )
  },
)
