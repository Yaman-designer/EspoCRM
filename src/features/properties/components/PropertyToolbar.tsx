'use client'

import { Fragment, useState } from 'react'
import {
  Search, Plus, ChevronDown,
  LayoutGrid, LayoutList, Check, X,
  DollarSign, Ruler, SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { SortOption, ViewMode, PriceRange, AreaRange } from '../types/property.types'
import { PROPERTY_STATUSES, STATUS_DOT_COLORS } from '../domain/constants'

// Deterministic locale — avoids hydration mismatch between Node.js (ar) and browser (en-US)
const COUNT_FMT = new Intl.NumberFormat('en-US')
const fmtCount  = (n: number) => COUNT_FMT.format(n)

// Extended option type — dot is an optional Tailwind bg-color class for status indicators
interface DropdownOption {
  value: string
  label: string
  dot?:  string  // e.g. 'bg-emerald-500' — shown as a 8px circle in both dropdown and mobile sheet
}

// Colored dots sourced from the canonical STATUS_DOT_COLORS map in domain/constants
const STATUS_OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'All Statuses' },
  ...PROPERTY_STATUSES.map(s => ({ value: s, label: s, dot: STATUS_DOT_COLORS[s] })),
]

const TYPE_OPTIONS: DropdownOption[] = [
  { value: 'all',       label: 'All Types'  },
  { value: 'House',     label: 'House'      },
  { value: 'Villa',     label: 'Villa'      },
  { value: 'Apartment', label: 'Apartment'  },
  { value: 'Townhouse', label: 'Town House' },
  { value: 'Office',    label: 'Office'     },
  { value: 'Land',      label: 'Land'       },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest First'    },
  { value: 'oldest',     label: 'Oldest First'    },
  { value: 'price-high', label: 'Price: High–Low' },
  { value: 'price-low',  label: 'Price: Low–High' },
]

const PRICE_OPTIONS: { value: PriceRange; label: string }[] = [
  { value: 'all',       label: 'All Prices'    },
  { value: 'under500k', label: 'Under $500K'   },
  { value: '500k-1m',   label: '$500K – $1M'   },
  { value: '1m-2m',     label: '$1M – $2M'     },
  { value: 'over2m',    label: 'Over $2M'      },
]

const AREA_OPTIONS: { value: AreaRange; label: string }[] = [
  { value: 'all',      label: 'All Sizes'    },
  { value: 'under100', label: 'Under 100 m²' },
  { value: '100-500',  label: '100 – 500 m²' },
  { value: 'over500',  label: 'Over 500 m²'  },
]

const PRICE_LABELS: Record<PriceRange, string> = {
  'all': '', 'under500k': 'Under $500K', '500k-1m': '$500K–$1M',
  '1m-2m': '$1M–$2M', 'over2m': 'Over $2M',
}
const AREA_LABELS: Record<AreaRange, string> = {
  'all': '', 'under100': 'Under 100m²', '100-500': '100–500m²', 'over500': 'Over 500m²',
}

interface PropertyToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  sortBy: SortOption
  onSortChange: (v: SortOption) => void
  priceRange: PriceRange
  onPriceRangeChange: (v: PriceRange) => void
  areaRange: AreaRange
  onAreaRangeChange: (v: AreaRange) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  totalCount: number
  onAddProperty: () => void
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function PropertyToolbar({
  search, onSearchChange,
  statusFilter, onStatusChange,
  typeFilter, onTypeChange,
  sortBy, onSortChange,
  priceRange, onPriceRangeChange,
  areaRange, onAreaRangeChange,
  viewMode, onViewModeChange,
  totalCount, onAddProperty,
  hasActiveFilters, onClearFilters,
}: PropertyToolbarProps) {

  // ── Mobile filter sheet ─────────────────────────────────────────────
  const [filterSheet, setFilterSheet]   = useState(false)
  const [pendingStatus, setPendingStatus] = useState(statusFilter)
  const [pendingType,   setPendingType]   = useState(typeFilter)
  const [pendingPrice,  setPendingPrice]  = useState<PriceRange>(priceRange)
  const [pendingArea,   setPendingArea]   = useState<AreaRange>(areaRange)
  const [pendingSort,   setPendingSort]   = useState<SortOption>(sortBy)

  const activeFilterCount = [
    statusFilter !== 'all',
    typeFilter   !== 'all',
    priceRange   !== 'all',
    areaRange    !== 'all',
    sortBy       !== 'newest',
  ].filter(Boolean).length

  function openFilterSheet() {
    setPendingStatus(statusFilter)
    setPendingType(typeFilter)
    setPendingPrice(priceRange)
    setPendingArea(areaRange)
    setPendingSort(sortBy)
    setFilterSheet(true)
  }

  function applyFilters() {
    onStatusChange(pendingStatus)
    onTypeChange(pendingType)
    onPriceRangeChange(pendingPrice)
    onAreaRangeChange(pendingArea)
    onSortChange(pendingSort)
    setFilterSheet(false)
  }

  function resetFilters() {
    setPendingStatus('all')
    setPendingType('all')
    setPendingPrice('all')
    setPendingArea('all')
    setPendingSort('newest')
  }

  // ── Active filter chip labels ───────────────────────────────────────
  const activeStatusLabel = STATUS_OPTIONS.find(o => o.value === statusFilter && statusFilter !== 'all')?.label
  const activeTypeLabel   = TYPE_OPTIONS.find(o => o.value === typeFilter && typeFilter !== 'all')?.label
  const activePriceLabel  = priceRange !== 'all' ? PRICE_LABELS[priceRange] : undefined
  const activeAreaLabel   = areaRange  !== 'all' ? AREA_LABELS[areaRange]   : undefined
  const hasChips = !!(activeStatusLabel || activeTypeLabel || activePriceLabel || activeAreaLabel || search)

  return (
    <div className="flex flex-col gap-4">

      {/* ── Row 1: Page heading + Add Property ─────────────────────────── */}
      <div className="flex items-start justify-between gap-4">

        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[28px] font-black leading-none tracking-tight text-foreground">
              Properties
            </h1>
            <span className={cn(
              'inline-flex items-center rounded-full px-3 py-1',
              'text-[12.5px] font-bold tabular-nums leading-none',
              'border border-primary/15 bg-primary/8 text-primary',
            )}>
              {fmtCount(totalCount)}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            Manage and monitor your real estate portfolio
          </p>
        </div>

        <Button size="sm" className="mt-0.5 shrink-0 gap-1.5" onClick={onAddProperty}>
          <Plus className="size-3.5" />
          Add Property
        </Button>
      </div>

      {/* ── Row 2 — Mobile: Search + Filters button + View toggle ──────── */}
      <div className="flex items-center gap-2 sm:hidden">

        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
            style={{ width: 14, height: 14 }}
          />
          <input
            type="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search…"
            aria-label="Search properties"
            style={{ height: 36, paddingLeft: 38, paddingRight: 12, fontSize: 13 }}
            className={cn(
              'w-full rounded-xl border border-border bg-card text-foreground',
              'placeholder:text-muted-foreground/40',
              'outline-none transition-all duration-200',
              'hover:border-border/70 focus:border-primary/40 focus:ring-2 focus:ring-primary/10',
            )}
          />
        </div>

        {/* Filters button with active-count badge */}
        <button
          type="button"
          onClick={openFilterSheet}
          style={{ height: 36 }}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3',
            'text-[13px] font-medium outline-none transition-colors duration-150',
            activeFilterCount > 0
              ? 'border-primary/40 bg-brand-azure-soft text-brand-azure'
              : 'border-border bg-card text-foreground',
          )}
        >
          <SlidersHorizontal style={{ width: 13, height: 13 }} className="shrink-0" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>

        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* ── Row 2 — Desktop: Unified filter bar ────────────────────────── */}
      <div className="hidden flex-wrap items-center gap-2 sm:flex">

        {/* Search — primary interaction, flexes to fill available space */}
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
            style={{ width: 14, height: 14 }}
          />
          <input
            type="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by title, reference, or location…"
            aria-label="Search properties"
            style={{ height: 36, paddingLeft: 38, paddingRight: 16, fontSize: 13 }}
            className={cn(
              'w-full rounded-xl border border-border bg-card text-foreground',
              'placeholder:text-muted-foreground/40',
              'shadow-(--shadow-xs) outline-none',
              'transition-all duration-200',
              'hover:border-border/70',
              'focus:border-primary/40 focus:shadow-(--shadow-sm) focus:ring-2 focus:ring-primary/10',
            )}
          />
        </div>

        <FilterDropdown
          label="Status"
          currentValue={statusFilter}
          options={STATUS_OPTIONS}
          onSelect={onStatusChange}
          isActive={statusFilter !== 'all'}
        />

        <FilterDropdown
          label="Type"
          currentValue={typeFilter}
          options={TYPE_OPTIONS}
          onSelect={onTypeChange}
          isActive={typeFilter !== 'all'}
        />

        <FilterDropdown
          label="Price"
          currentValue={priceRange}
          options={PRICE_OPTIONS}
          onSelect={v => onPriceRangeChange(v as PriceRange)}
          isActive={priceRange !== 'all'}
          icon={<DollarSign style={{ width: 12, height: 12 }} className="shrink-0 opacity-40" />}
        />

        <FilterDropdown
          label="Area"
          currentValue={areaRange}
          options={AREA_OPTIONS}
          onSelect={v => onAreaRangeChange(v as AreaRange)}
          isActive={areaRange !== 'all'}
          icon={<Ruler style={{ width: 12, height: 12 }} className="shrink-0 opacity-40" />}
        />

        <FilterDropdown
          label="Sort"
          currentValue={sortBy}
          options={SORT_OPTIONS}
          onSelect={v => onSortChange(v as SortOption)}
          isActive={sortBy !== 'newest'}
          showLabelPrefix
        />

        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* ── Row 3 (conditional): Active filter chips + result count ──────── */}
      {hasChips && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted-foreground">
            <span className="font-semibold tabular-nums text-foreground">
              {fmtCount(totalCount)}
            </span>{' '}
            {totalCount === 1 ? 'result' : 'results'}
          </span>

          {activeStatusLabel && (
            <ActiveChip label={activeStatusLabel} onRemove={() => onStatusChange('all')} />
          )}
          {activeTypeLabel && (
            <ActiveChip label={activeTypeLabel} onRemove={() => onTypeChange('all')} />
          )}
          {activePriceLabel && (
            <ActiveChip label={activePriceLabel} onRemove={() => onPriceRangeChange('all')} />
          )}
          {activeAreaLabel && (
            <ActiveChip label={activeAreaLabel} onRemove={() => onAreaRangeChange('all')} />
          )}
          {search && (
            <ActiveChip label={`"${search}"`} onRemove={() => onSearchChange('')} />
          )}

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Mobile filter sheet ──────────────────────────────────────────── */}
      <Sheet open={filterSheet} onOpenChange={setFilterSheet}>
        <SheetContent
          side="bottom"
          className="gap-0 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl p-0"
          showCloseButton={false}
        >
          {/* Drag handle */}
          <div className="mx-auto mb-2 mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/20" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <SheetTitle className="text-base font-bold text-foreground">
              Filter Properties
            </SheetTitle>
            <button
              type="button"
              onClick={() => setFilterSheet(false)}
              aria-label="Close filters"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable filter sections */}
          <div className="flex-1 overflow-y-auto px-5 pb-3">

            <FilterSection title="Sort By">
              {SORT_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={pendingSort === opt.value}
                  onClick={() => setPendingSort(opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Status">
              {STATUS_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={pendingStatus === opt.value}
                  dot={opt.dot}
                  onClick={() => setPendingStatus(opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Property Type">
              {TYPE_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={pendingType === opt.value}
                  onClick={() => setPendingType(opt.value)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Price Range">
              {PRICE_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={pendingPrice === opt.value}
                  onClick={() => setPendingPrice(opt.value as PriceRange)}
                />
              ))}
            </FilterSection>

            <FilterSection title="Property Size" last>
              {AREA_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={pendingArea === opt.value}
                  onClick={() => setPendingArea(opt.value as AreaRange)}
                />
              ))}
            </FilterSection>

          </div>

          {/* Sticky footer */}
          <div className="flex items-center gap-3 border-t border-border/40 px-5 py-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={resetFilters}>
              Reset Filters
            </Button>
            <Button size="sm" className="flex-1" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>

          {/* iOS safe-area spacing */}
          <div className="h-6 shrink-0" />
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ── ViewToggle — extracted for reuse in mobile and desktop rows ───────────────

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
}) {
  return (
    <div style={{ height: 36 }} className="flex overflow-hidden rounded-xl border border-border bg-card">
      {([
        { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid view'  },
        { mode: 'list' as ViewMode, Icon: LayoutList, label: 'List view'  },
      ] as const).map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onViewModeChange(mode)}
          aria-label={label}
          aria-pressed={viewMode === mode}
          style={{ width: 36, height: 36 }}
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center outline-none',
            'transition-colors duration-150',
            'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/20',
            viewMode === mode
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <Icon style={{ width: 14, height: 14 }} />
        </button>
      ))}
    </div>
  )
}

// ── ActiveChip — applied filter tag with × remove button ─────────────────────

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-primary/20 bg-brand-azure-soft pl-2.5 pr-1 text-[11px] font-medium text-brand-azure">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-brand-azure/15 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/30"
      >
        <X className="size-2.5" />
      </button>
    </span>
  )
}

// ── FilterSection — labelled group inside the mobile filter sheet ─────────────

function FilterSection({
  title,
  last = false,
  children,
}: {
  title:    string
  last?:    boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('py-4', !last && 'border-b border-border/40')}>
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  )
}

// ── FilterPill — radio-style chip for the mobile filter sheet ─────────────────

function FilterPill({
  label,
  active,
  onClick,
  dot,
}: {
  label:   string
  active:  boolean
  onClick: () => void
  dot?:    string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-4 text-[13px] font-medium',
        'transition-colors duration-150',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-foreground hover:bg-muted',
      )}
    >
      {dot && (
        <span className={cn(
          'size-2 shrink-0 rounded-full',
          active ? 'bg-white/80' : dot,
        )} />
      )}
      {label}
    </button>
  )
}

// ── FilterDropdown — premium desktop filter dropdown ─────────────────────────
//
// Changes from generic shadcn defaults:
//   • DropdownMenuContent: rounded-2xl, p-1.5, elevated shadow, w-auto min-w-44
//   • DropdownMenuItem: rounded-xl, px-3 py-2.5 text-[13px], cursor-pointer
//   • Status options: colored dot rendered inside item AND on the trigger when active

interface FilterDropdownProps {
  label:            string
  currentValue:     string
  options:          DropdownOption[]
  onSelect:         (value: string) => void
  isActive?:        boolean
  showLabelPrefix?: boolean
  icon?:            React.ReactNode
}

function FilterDropdown({
  label,
  currentValue,
  options,
  onSelect,
  isActive = false,
  showLabelPrefix = false,
  icon,
}: FilterDropdownProps) {
  const selected    = options.find(o => o.value === currentValue)
  const selectedDot = selected?.dot

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          style={{ height: 36 }}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3',
            'text-[13px] font-medium outline-none',
            'transition-colors duration-150 hover:bg-muted',
            'focus-visible:ring-2 focus-visible:ring-ring/20',
            isActive
              ? 'border-primary/40 bg-brand-azure-soft text-brand-azure'
              : 'border-border bg-card text-foreground',
          )}
        >
          {icon}
          {/* Status color dot on trigger — shows current filter status at a glance */}
          {selectedDot && isActive && (
            <span className={cn('size-2 shrink-0 rounded-full', selectedDot)} />
          )}
          {showLabelPrefix && (
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {label}:
            </span>
          )}
          <span>{selected?.label ?? label}</span>
          <ChevronDown style={{ width: 12, height: 12 }} className="shrink-0 opacity-50" />
        </button>
      </DropdownMenuTrigger>

      {/* Premium floating panel: rounded-2xl, elevated shadow, generous item padding */}
      <DropdownMenuContent
        align="start"
        className={cn(
          'w-auto min-w-44 overflow-hidden rounded-2xl p-1.5',
          'shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]',
        )}
      >
        {options.map((opt, i) => (
          <Fragment key={opt.value}>
            {i === 1 && <DropdownMenuSeparator className="mx-1.5 my-1" />}
            <DropdownMenuItem
              onClick={() => onSelect(opt.value)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[13px]',
                currentValue === opt.value && 'font-semibold',
              )}
            >
              <span className="flex items-center gap-2.5">
                {opt.dot && (
                  <span className={cn('size-2 shrink-0 rounded-full', opt.dot)} />
                )}
                {opt.label}
              </span>
              {currentValue === opt.value && (
                <Check className="size-3.5 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
