import type { CalendarEventKind } from '../../types'

// Reuses the project's existing chart-*/brand-* design tokens for
// event-type color coding — same convention CalendarAgendaPanel already
// uses for visit/meeting/followup (bg-primary / bg-chart-4 / bg-chart-3).
//
// Tint strength (/8) matches ReminderList's own established convention for
// this exact "subtle tinted row" pattern (its AlertRow uses bg-chart-4/8,
// bg-primary/6) — kept consistent with that precedent rather than picked
// arbitrarily. The three brand-*-soft tokens are pre-defined pastel colors at
// a comparable visual strength, not percentage-based, so they need no tuning.
export const EVENT_KIND_STYLE: Record<CalendarEventKind, { bar: string; tint: string; text: string }> = {
  visit:    { bar: 'border-l-primary',        tint: 'bg-primary/8',         text: 'text-primary' },
  call:     { bar: 'border-l-chart-3',        tint: 'bg-chart-3/8',         text: 'text-chart-3' },
  followup: { bar: 'border-l-chart-4',        tint: 'bg-chart-4/8',         text: 'text-chart-4' },
  legal:    { bar: 'border-l-brand-navy',     tint: 'bg-brand-navy-soft',   text: 'text-brand-navy' },
  payment:  { bar: 'border-l-brand-teal',     tint: 'bg-brand-teal-soft',   text: 'text-brand-teal' },
  contract: { bar: 'border-l-brand-lavender', tint: 'bg-brand-lavender-soft', text: 'text-brand-lavender' },
  cancelled:{ bar: 'border-l-muted-foreground/40', tint: 'bg-muted/40',    text: 'text-muted-foreground' },
}
