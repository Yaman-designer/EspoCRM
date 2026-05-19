'use client'

import { cn } from '@/lib/utils'
import type { QuickFilter, BadgeVariant } from './types'

interface QuickFilterBarProps {
  filters: QuickFilter[]
  activeFilter: QuickFilter | null
  counts: Record<string, number>
  onChange: (filter: QuickFilter | null) => void
}

export function QuickFilterBar({
  filters,
  activeFilter,
  counts,
  onChange,
}: QuickFilterBarProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto border-b border-border/40 bg-card/80 px-5 py-2',
        '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
      )}
    >
      {/* "All" chip */}
      <FilterChip
        label="All"
        count={counts['__all__'] ?? 0}
        active={activeFilter === null}
        onClick={() => onChange(null)}
      />

      <div className="mx-1 h-4 w-px shrink-0 bg-border/60" />

      {filters.map((filter, i) => {
        const countKey =
          filter.value !== null && filter.column
            ? `${filter.column}:${filter.value}`
            : '__all__'
        const count = counts[countKey] ?? 0
        const isActive =
          activeFilter !== null &&
          activeFilter.column === filter.column &&
          activeFilter.value === filter.value

        return (
          <FilterChip
            key={i}
            label={filter.label}
            count={count}
            active={isActive}
            badgeVariant={filter.badgeVariant}
            onClick={() => onChange(isActive ? null : filter)}
          />
        )
      })}
    </div>
  )
}

const BADGE_VARIANT_CLASSES: Partial<Record<BadgeVariant, string>> = {
  destructive: 'bg-destructive/15 text-destructive',
  error:       'bg-destructive/15 text-destructive',
  success:     'bg-emerald-500/15 text-emerald-600',
  warning:     'bg-amber-500/15 text-amber-600',
  info:        'bg-blue-500/15 text-blue-600',
}

function FilterChip({
  label,
  count,
  active,
  badgeVariant,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  badgeVariant?: BadgeVariant
  onClick: () => void
}) {
  const badgeClass = badgeVariant && !active
    ? (BADGE_VARIANT_CLASSES[badgeVariant] ?? 'bg-muted text-muted-foreground')
    : active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-3',
        'text-[12px] font-medium whitespace-nowrap transition-all duration-150',
        active
          ? 'border-primary/25 bg-primary/8 text-primary'
          : 'border-border/50 bg-transparent text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/40',
      )}
    >
      {label}
      <span
        className={cn(
          'flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1',
          'text-[10px] font-semibold tabular-nums leading-none',
          badgeClass,
        )}
      >
        {count}
      </span>
    </button>
  )
}
