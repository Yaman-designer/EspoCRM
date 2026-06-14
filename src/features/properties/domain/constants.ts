export const PROPERTY_STATUSES = [
  'Available', 'Reserved', 'Pending', 'Under Approval', 'Rented', 'Sold', 'Draft',
] as const

export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number]

export const STATUS_DOT_COLORS: Record<string, string> = {
  Available:        'bg-emerald-500',
  Reserved:         'bg-amber-400',
  Pending:          'bg-violet-500',
  'Under Approval': 'bg-orange-400',
  Rented:           'bg-teal-500',
  Sold:             'bg-rose-500',
  Draft:            'bg-slate-400',
}

export const STATUS_DOT_FALLBACK = 'bg-muted-foreground/40'
