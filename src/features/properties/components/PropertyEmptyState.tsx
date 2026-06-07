'use client'

import { Building2, SearchX, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PropertyEmptyStateProps {
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  onAddProperty?: () => void
  className?: string
}

export function PropertyEmptyState({
  hasActiveFilters = false,
  onClearFilters,
  onAddProperty,
  className,
}: PropertyEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-72 flex-col items-center justify-center gap-6',
        'rounded-2xl border border-dashed border-border/50 bg-card/50 px-8 py-16 text-center',
        className,
      )}
    >
      {hasActiveFilters ? (
        <FilteredEmptyState
          onClearFilters={onClearFilters}
          onAddProperty={onAddProperty}
        />
      ) : (
        <BlankEmptyState onAddProperty={onAddProperty} />
      )}
    </div>
  )
}

// ── No properties at all ──────────────────────────────────────────────────────

function BlankEmptyState({ onAddProperty }: { onAddProperty?: () => void }) {
  return (
    <>
      <div className="relative">
        <div className={cn(
          'flex h-20 w-20 items-center justify-center rounded-3xl',
          'bg-linear-to-br from-brand-azure-soft to-secondary shadow-design-sm',
          'border border-border/30',
        )}>
          <Building2 className="size-9 text-brand-azure/70" strokeWidth={1.5} />
        </div>
        <span className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-card bg-brand-azure/20" />
        <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-card bg-brand-emerald/25" />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          No properties yet
        </h3>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Your portfolio is empty. Add your first listing to start managing properties and tracking your real estate pipeline.
        </p>
      </div>

      <Button size="sm" className="gap-1.5" onClick={onAddProperty}>
        <Plus className="size-3.5" />
        Add your first property
      </Button>
    </>
  )
}

// ── No results for current filters ───────────────────────────────────────────

function FilteredEmptyState({
  onClearFilters,
  onAddProperty,
}: {
  onClearFilters?: () => void
  onAddProperty?: () => void
}) {
  return (
    <>
      <div className={cn(
        'flex h-20 w-20 items-center justify-center rounded-3xl',
        'bg-secondary shadow-design-sm border border-border/30',
      )}>
        <SearchX className="size-9 text-muted-foreground/40" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          No results found
        </h3>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          No properties match your current search or filters. Try adjusting your criteria or clear all filters to browse everything.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear all filters
        </Button>
        <Button size="sm" className="gap-1.5" onClick={onAddProperty}>
          <Plus className="size-3.5" />
          Add property
        </Button>
      </div>
    </>
  )
}
