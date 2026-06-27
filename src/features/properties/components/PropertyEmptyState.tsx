'use client'

import { Building2, SearchX, Plus, Heart, Filter, WifiOff, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PropertyEmptyStateProps {
  hasActiveFilters?: boolean
  savedOnly?: boolean
  searchQuery?: string
  error?: boolean
  onClearFilters?: () => void
  onAddProperty?: () => void
  onRetry?: () => void
  className?: string
}

export function PropertyEmptyState({
  hasActiveFilters = false,
  savedOnly = false,
  searchQuery = '',
  error = false,
  onClearFilters,
  onAddProperty,
  onRetry,
  className,
}: PropertyEmptyStateProps) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-175 flex-col items-center justify-center gap-5',
        'rounded-2xl border px-8 py-14 text-center',
        error
          ? [
              'border-destructive/18 bg-card',
              'shadow-[0_2px_4px_rgba(239,68,68,0.04),0_8px_24px_rgba(239,68,68,0.05),0_1px_2px_rgba(16,24,40,0.04)]',
            ]
          : savedOnly
          ? [
              'border-rose-200/50 bg-card',
              'shadow-[0_2px_4px_rgba(244,63,94,0.04),0_8px_24px_rgba(244,63,94,0.06),0_1px_2px_rgba(16,24,40,0.04)]',
            ]
          : [
              'border-border/40 bg-card',
              'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_12px_rgba(16,24,40,0.06),0_8px_24px_rgba(16,24,40,0.05)]',
            ],
        className,
      )}
    >
      {error ? (
        <ErrorEmptyState onRetry={onRetry} />
      ) : savedOnly ? (
        <SavedEmptyState onClearFilters={onClearFilters} />
      ) : searchQuery.trim() ? (
        <SearchEmptyState query={searchQuery} onClearFilters={onClearFilters} onAddProperty={onAddProperty} />
      ) : hasActiveFilters ? (
        <FilterEmptyState onClearFilters={onClearFilters} onAddProperty={onAddProperty} />
      ) : (
        <BlankEmptyState onAddProperty={onAddProperty} />
      )}
    </div>
  )
}

// ── API / network error ───────────────────────────────────────────────────────

function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
  return (
    <>
      <div className={cn(
        'flex h-18 w-18 items-center justify-center rounded-2xl',
        'bg-linear-to-br from-destructive/10 to-destructive/5',
        'border border-destructive/18',
        'shadow-[0_4px_20px_rgba(239,68,68,0.08),0_1px_4px_rgba(239,68,68,0.05)]',
      )}>
        <WifiOff className="size-8 text-destructive/40" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          Unable to load properties
        </h3>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          There was a problem fetching your listings. Check your connection and try again.
        </p>
      </div>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          Try again
        </Button>
      )}
    </>
  )
}

// ── No saved properties ───────────────────────────────────────────────────────

function SavedEmptyState({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <>
      <div className="relative">
        <div className={cn(
          'flex h-18 w-18 items-center justify-center rounded-full',
          'bg-linear-to-br from-rose-100 to-rose-50',
          'border border-rose-200/70',
          'shadow-[0_4px_20px_rgba(244,63,94,0.12),0_1px_4px_rgba(244,63,94,0.08)]',
        )}>
          <Heart
            className="size-8 text-rose-400"
            style={{ fill: 'rgba(251,113,133,0.55)', strokeWidth: 1.5 }}
          />
        </div>
        <div
          aria-hidden
          className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-rose-100 shadow-sm"
        >
          <span className="text-[9px] font-bold leading-none text-rose-500">0</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          No saved properties yet
        </h3>
        <p className="mx-auto max-w-67 text-[13px] leading-relaxed text-muted-foreground">
          Tap the{' '}
          <Heart
            aria-hidden
            className="inline size-3 align-[-1px] text-rose-400"
            style={{ fill: 'rgba(251,113,133,0.7)', strokeWidth: 1.5 }}
          />{' '}
          heart on any listing to save it. Your collection will appear here.
        </p>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onClearFilters}
        className="rounded-xl border-rose-200/70 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
      >
        Browse all properties
      </Button>
    </>
  )
}

// ── No search results ─────────────────────────────────────────────────────────

function SearchEmptyState({
  query,
  onClearFilters,
  onAddProperty,
}: {
  query: string
  onClearFilters?: () => void
  onAddProperty?: () => void
}) {
  return (
    <>
      <div className={cn(
        'flex h-18 w-18 items-center justify-center rounded-2xl',
        'bg-secondary shadow-design-sm border border-border/30',
      )}>
        <SearchX className="size-8 text-muted-foreground/40" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          No results for{' '}
          <span className="text-foreground">&ldquo;{query}&rdquo;</span>
        </h3>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Check the spelling or try a broader search term — reference ID, location, or property type.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          Clear search
        </Button>
        <Button size="sm" className="gap-1.5" onClick={onAddProperty}>
          <Plus className="size-3.5" />
          Add property
        </Button>
      </div>
    </>
  )
}

// ── No results for filters ────────────────────────────────────────────────────

function FilterEmptyState({
  onClearFilters,
  onAddProperty,
}: {
  onClearFilters?: () => void
  onAddProperty?: () => void
}) {
  return (
    <>
      <div className={cn(
        'flex h-18 w-18 items-center justify-center rounded-2xl',
        'bg-secondary shadow-design-sm border border-border/30',
      )}>
        <Filter className="size-8 text-muted-foreground/35" strokeWidth={1.5} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[17px] font-semibold text-foreground">
          No matching properties
        </h3>
        <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          No properties match your active filters. Try adjusting your criteria or clear all filters to browse everything.
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

// ── No properties at all ──────────────────────────────────────────────────────

function BlankEmptyState({ onAddProperty }: { onAddProperty?: () => void }) {
  return (
    <>
      <div className="relative">
        <div className={cn(
          'flex h-18 w-18 items-center justify-center rounded-3xl',
          'bg-linear-to-br from-brand-azure-soft to-secondary shadow-design-sm',
          'border border-border/30',
        )}>
          <Building2 className="size-8 text-brand-azure/70" strokeWidth={1.5} />
        </div>
        <span aria-hidden className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-card bg-brand-azure/20" />
        <span aria-hidden className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-card bg-brand-emerald/25" />
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
