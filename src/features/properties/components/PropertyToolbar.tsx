'use client'

import { useState, memo, useCallback, useMemo, useEffect, forwardRef } from 'react'
import {
  Search, Plus, ChevronDown,
  LayoutGrid, LayoutList, X, Heart, SlidersHorizontal, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sheet, SheetContent, SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../lib/display'
import { usePropertyOptions } from '../hooks/usePropertyOptions'
import type { SortOption, ViewMode } from '../types/property.types'
import type { TypeOption } from '../services/property.query.service'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COUNT_FMT = new Intl.NumberFormat('en-US')
const fmtCount  = (n: number) => COUNT_FMT.format(n)

const PRICE_MIN  = 0
const PRICE_MAX  = 10_000_000
const PRICE_STEP = 10_000

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest First'    },
  { value: 'oldest',     label: 'Oldest First'    },
  { value: 'price-high', label: 'Price: High–Low' },
  { value: 'price-low',  label: 'Price: Low–High' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Pending state type (used by mobile drawer)
// ─────────────────────────────────────────────────────────────────────────────

interface PendingFilters {
  type:      string
  savedOnly: boolean
  bedrooms:  number | null
  bathrooms: number | null
  minPrice:  number | null
  maxPrice:  number | null
  sortBy:    SortOption
}

// ─────────────────────────────────────────────────────────────────────────────
// PropertyToolbar props
// ─────────────────────────────────────────────────────────────────────────────

interface PropertyToolbarProps {
  search:              string;         onSearchChange:    (v: string) => void
  typeFilter:          string;         onTypeChange:      (v: string) => void
  savedOnly:           boolean;        onSavedOnlyChange: (v: boolean) => void
  bedrooms:            number | null;  onBedroomsChange:  (v: number | null) => void
  bathrooms:           number | null;  onBathroomsChange: (v: number | null) => void
  minPrice:            number | null
  maxPrice:            number | null;  onPriceChange:     (min: number | null, max: number | null) => void
  sortBy:              SortOption;     onSortChange:      (v: SortOption) => void
  viewMode:            ViewMode;       onViewModeChange:  (v: ViewMode) => void
  totalCount:          number;         onAddProperty:     () => void
  hasActiveFilters:    boolean;        onClearFilters:    () => void
  isSavedFetching?:   boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// PropertyToolbar
// ─────────────────────────────────────────────────────────────────────────────

export function PropertyToolbar({
  search, onSearchChange,
  typeFilter, onTypeChange,
  savedOnly, onSavedOnlyChange,
  bedrooms, onBedroomsChange,
  bathrooms, onBathroomsChange,
  minPrice, maxPrice, onPriceChange,
  sortBy, onSortChange,
  viewMode, onViewModeChange,
  totalCount, onAddProperty,
  hasActiveFilters, onClearFilters,
  isSavedFetching = false,
}: PropertyToolbarProps) {

  // options are fetched once and cached by React Query (staleTime 5 min).
  // The hook does not re-run when filters change — only on stale/mount.
  const { data: options } = usePropertyOptions()
  const typeOptions   = useMemo(() => options?.types     ?? [], [options?.types])
  const bedroomOpts   = useMemo(() => options?.bedrooms  ?? [], [options?.bedrooms])
  const bathroomOpts  = useMemo(() => options?.bathrooms ?? [], [options?.bathrooms])

  // ── Stable toggle handler (avoids anonymous function in JSX) ─────────────

  const handleSavedToggle = useCallback(
    () => onSavedOnlyChange(!savedOnly),
    [savedOnly, onSavedOnlyChange],
  )

  // ── Mobile drawer ────────────────────────────────────────────────────────

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pending, setPending] = useState<PendingFilters>({
    type: typeFilter, savedOnly, bedrooms, bathrooms,
    minPrice, maxPrice, sortBy,
  })

  const activeFilterCount = useMemo(() => [
    typeFilter !== 'all',
    savedOnly,
    bedrooms  !== null,
    bathrooms !== null,
    minPrice  !== null || maxPrice !== null,
    sortBy    !== 'newest',
  ].filter(Boolean).length, [typeFilter, savedOnly, bedrooms, bathrooms, minPrice, maxPrice, sortBy])

  const openDrawer = useCallback(() => {
    setPending({ type: typeFilter, savedOnly, bedrooms, bathrooms, minPrice, maxPrice, sortBy })
    setDrawerOpen(true)
  }, [typeFilter, savedOnly, bedrooms, bathrooms, minPrice, maxPrice, sortBy])

  const applyDrawer = useCallback(() => {
    onTypeChange(pending.type)
    onSavedOnlyChange(pending.savedOnly)
    onBedroomsChange(pending.bedrooms)
    onBathroomsChange(pending.bathrooms)
    onPriceChange(pending.minPrice, pending.maxPrice)
    onSortChange(pending.sortBy)
    setDrawerOpen(false)
  }, [pending, onTypeChange, onSavedOnlyChange, onBedroomsChange, onBathroomsChange, onPriceChange, onSortChange])

  const resetDrawer = useCallback(() => {
    setPending({ type: 'all', savedOnly: false, bedrooms: null, bathrooms: null, minPrice: null, maxPrice: null, sortBy: 'newest' })
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3">

      {/* ── Row 1: Title + (sm+) Add button ─────────────────────────────── */}
      {/* Mobile: title row has no button — prevents overflow.
          The Add Property button sits in the subtitle row on mobile,
          and is hidden there on sm+ where it appears here instead. */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            <h1 className="text-[26px] font-black leading-none tracking-tight text-foreground">
              Properties
            </h1>
            <span className={cn(
              'inline-flex items-center rounded-full border border-primary/15 bg-primary/8',
              'px-2.5 py-0.5 text-[12px] font-bold tabular-nums text-primary',
            )}>
              {fmtCount(totalCount)}
            </span>
          </div>
          <Button size="sm" className="hidden shrink-0 gap-1.5 sm:inline-flex" aria-label="Add Property" onClick={onAddProperty}>
            <Plus className="size-3.5" />
            Add Property
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
            Manage and monitor your real estate portfolio
          </p>
          <Button size="sm" className="shrink-0 gap-1.5 sm:hidden" aria-label="Add Property" onClick={onAddProperty}>
            <Plus className="size-3.5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* ── Row 2 — Mobile: Search + Filters button + View toggle ─────────── */}
      <div className="flex items-center gap-3 sm:hidden">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search…"
        />
        <button
          type="button"
          onClick={openDrawer}
          style={{ height: 38 }}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3',
            'text-[13px] font-medium outline-none transition-colors duration-150',
            activeFilterCount > 0
              ? 'border-primary/40 bg-primary/8 text-primary'
              : 'border-border bg-card text-foreground hover:bg-muted',
          )}
        >
          <SlidersHorizontal className="size-3.5 shrink-0" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold leading-none text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </button>
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      {/* ── Row 2 — Desktop: Single filter bar ───────────────────────────── */}
      <div className="hidden items-center gap-2 sm:flex">

        {/* Search — grows to fill available space */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by title, reference, or location…"
        />

        {/* Filter controls — fixed width, single row, no wrap */}
        <div className="flex shrink-0 items-center gap-1.5">
          <TypeFilter
            types={typeOptions}
            value={typeFilter}
            onChange={onTypeChange}
          />
          <SavedChip active={savedOnly} onToggle={handleSavedToggle} isFetching={isSavedFetching} />
          <BedsFilter
            beds={bedroomOpts}
            value={bedrooms}
            onChange={onBedroomsChange}
          />
          <PriceFilter
            minPrice={minPrice}
            maxPrice={maxPrice}
            onChange={onPriceChange}
          />
          <BathsFilter
            baths={bathroomOpts}
            value={bathrooms}
            onChange={onBathroomsChange}
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="px-1 text-[12.5px] font-medium text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sort + View — pushed to the right */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <SortDropdown sortBy={sortBy} onSortChange={onSortChange} />
          <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        </div>
      </div>

      {/* ── Mobile right-side drawer ──────────────────────────────────────── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="flex w-[90vw] max-w-105 flex-col gap-0 overflow-hidden p-0"
          showCloseButton={false}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
            <SheetTitle className="text-base font-bold text-foreground">
              Filter Properties
            </SheetTitle>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close filters"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
            >
              <X className="size-4 text-muted-foreground" />
            </button>
          </div>

          {/* Scrollable sections */}
          <div className="flex-1 overflow-y-auto">

            <DrawerSection title="Sort By">
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map(opt => (
                  <ChipButton
                    key={opt.value}
                    active={pending.sortBy === opt.value}
                    onClick={() => setPending(p => ({ ...p, sortBy: opt.value }))}
                  >
                    {opt.label}
                  </ChipButton>
                ))}
              </div>
            </DrawerSection>

            {typeOptions.length > 0 && (
              <DrawerSection title="Property Type">
                <div className="flex flex-col gap-0.5">
                  {([{ value: 'all', label: 'All Types' }, ...typeOptions.map(t => ({ value: t.value, label: t.value }))]).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPending(p => ({ ...p, type: opt.value }))}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13px] transition-colors',
                        pending.type === opt.value
                          ? 'bg-primary/8 font-semibold text-primary'
                          : 'font-medium text-foreground hover:bg-muted',
                      )}
                    >
                      <div className={cn(
                        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                        pending.type === opt.value
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30',
                      )}>
                        {pending.type === opt.value && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Saved Properties">
              <button
                type="button"
                onClick={() => setPending(p => ({ ...p, savedOnly: !p.savedOnly }))}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl border py-2.5',
                  'text-[13px] font-medium transition-all duration-150',
                  pending.savedOnly
                    ? 'border-rose-400/60 bg-rose-50 text-rose-600'
                    : 'border-border bg-card text-foreground hover:bg-muted',
                )}
              >
                <Heart className={cn(
                  'size-4 transition-all duration-150',
                  pending.savedOnly ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/60',
                )} />
                Saved Properties
              </button>
            </DrawerSection>

            {bedroomOpts.length > 0 && (
              <DrawerSection title="Bedrooms">
                <div className="flex flex-wrap gap-1.5">
                  {bedroomOpts.map(n => (
                    <ChipButton
                      key={n}
                      active={pending.bedrooms === n}
                      onClick={() => setPending(p => ({
                        ...p, bedrooms: p.bedrooms === n ? null : n,
                      }))}
                    >
                      {n}+
                    </ChipButton>
                  ))}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Price Range">
              {/* Local slider state; commits to pending on onValueCommit (pointer up) */}
              <DrawerPriceControl
                minPrice={pending.minPrice}
                maxPrice={pending.maxPrice}
                onChange={(min, max) => setPending(p => ({ ...p, minPrice: min, maxPrice: max }))}
              />
            </DrawerSection>

            {bathroomOpts.length > 0 && (
              <DrawerSection title="Bathrooms" last>
                <div className="flex flex-wrap gap-1.5">
                  {bathroomOpts.map(n => (
                    <ChipButton
                      key={n}
                      active={pending.bathrooms === n}
                      onClick={() => setPending(p => ({
                        ...p, bathrooms: p.bathrooms === n ? null : n,
                      }))}
                    >
                      {n}+
                    </ChipButton>
                  ))}
                </div>
              </DrawerSection>
            )}

          </div>

          {/* Sticky footer */}
          <div className="flex gap-3 border-t border-border/40 px-5 py-4">
            <Button variant="outline" className="flex-1" onClick={resetDrawer}>
              Reset
            </Button>
            <Button className="flex-1" onClick={applyDrawer}>
              Apply Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput
// ─────────────────────────────────────────────────────────────────────────────

const SearchInput = memo(function SearchInput({
  value, onChange, placeholder,
}: {
  value:       string
  onChange:    (v: string) => void
  placeholder: string
}) {
  return (
    <div className="relative min-w-0 flex-1">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40"
        style={{ width: 13, height: 13 }}
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search properties"
        style={{ height: 38, paddingLeft: 36, paddingRight: 14, fontSize: 13 }}
        className={cn(
          'w-full rounded-xl border border-border bg-card text-foreground',
          'placeholder:text-muted-foreground/40 shadow-(--shadow-xs) outline-none',
          'transition-all duration-200 hover:border-border/70',
          'focus:border-primary/40 focus:shadow-(--shadow-sm) focus:ring-2 focus:ring-primary/12',
        )}
      />
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// FilterPill — Airbnb-style trigger button for all filter popovers
// ─────────────────────────────────────────────────────────────────────────────

interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
  hasChevron?: boolean
}

const FilterPill = memo(forwardRef<HTMLButtonElement, FilterPillProps>(
  function FilterPill({ isActive = false, hasChevron = true, children, className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        style={{ height: 38 }}
        className={cn(
          'inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-xl border px-3',
          'text-[13px] font-medium outline-none transition-all duration-150',
          'focus-visible:ring-2 focus-visible:ring-ring/20',
          isActive
            ? 'border-foreground/30 bg-foreground/6 text-foreground font-semibold'
            : 'border-border bg-card text-foreground hover:border-foreground/25 hover:bg-muted',
          className,
        )}
        {...props}
      >
        {children}
        {hasChevron && (
          <ChevronDown
            style={{ width: 11, height: 11 }}
            className="shrink-0 text-muted-foreground/60"
          />
        )}
      </button>
    )
  },
))

// ─────────────────────────────────────────────────────────────────────────────
// TypeFilter
// ─────────────────────────────────────────────────────────────────────────────

const TypeFilter = memo(function TypeFilter({
  types, value, onChange,
}: {
  types:    TypeOption[]
  value:    string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = value !== 'all'
  const label    = isActive ? value : 'Type'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterPill isActive={isActive}>{label}</FilterPill>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-48 p-0">
        <Command>
          <CommandInput placeholder="Search type…" />
          <CommandList>
            <CommandEmpty>No type found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                data-checked={value === 'all' ? 'true' : undefined}
                onSelect={() => { onChange('all'); setOpen(false) }}
              >
                All
              </CommandItem>
              {types.map(t => (
                <CommandItem
                  key={t.value}
                  value={t.value}
                  data-checked={value === t.value ? 'true' : undefined}
                  onSelect={() => { onChange(value === t.value ? 'all' : t.value); setOpen(false) }}
                >
                  {t.value}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// BedsFilter
// ─────────────────────────────────────────────────────────────────────────────

const BedsFilter = memo(function BedsFilter({
  beds, value, onChange,
}: {
  beds:     number[]
  value:    number | null
  onChange: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = value !== null
  const label    = isActive ? `${value}+ Beds` : 'Beds'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterPill isActive={isActive}>{label}</FilterPill>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-52 p-3">
        <PopoverHeader
          title="Bedrooms"
          isActive={isActive}
          onClear={() => { onChange(null); setOpen(false) }}
        />
        <div className="mt-2 flex gap-1.5">
          {beds.map(n => (
            <ChipButton
              key={n}
              active={value === n}
              onClick={() => { onChange(value === n ? null : n); setOpen(false) }}
            >
              {n}+
            </ChipButton>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// PriceFilter — local state during drag; commits on "Apply" only
// ─────────────────────────────────────────────────────────────────────────────

const PriceFilter = memo(function PriceFilter({
  minPrice, maxPrice, onChange,
}: {
  minPrice: number | null
  maxPrice: number | null
  onChange: (min: number | null, max: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [localMin, setLocalMin] = useState(minPrice ?? PRICE_MIN)
  const [localMax, setLocalMax] = useState(maxPrice ?? PRICE_MAX)

  // Reset local state to committed values whenever the popover opens
  function handleOpenChange(next: boolean) {
    if (next) {
      setLocalMin(minPrice ?? PRICE_MIN)
      setLocalMax(maxPrice ?? PRICE_MAX)
    }
    setOpen(next)
  }

  function apply() {
    onChange(
      localMin > PRICE_MIN ? localMin : null,
      localMax < PRICE_MAX ? localMax : null,
    )
    setOpen(false)
  }

  const isActive = minPrice !== null || maxPrice !== null
  const label = useMemo(() => {
    if (minPrice !== null && maxPrice !== null) return `${fmtPrice(minPrice)} – ${fmtPrice(maxPrice)}`
    if (minPrice !== null) return `≥ ${fmtPrice(minPrice)}`
    if (maxPrice !== null) return `≤ ${fmtPrice(maxPrice)}`
    return 'Price'
  }, [minPrice, maxPrice])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FilterPill isActive={isActive}>{label}</FilterPill>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-72 p-4">
        <PopoverHeader
          title="Price Range"
          isActive={isActive}
          onClear={() => { onChange(null, null); setOpen(false) }}
        />

        {/* Price display */}
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[15px] font-bold tabular-nums text-foreground">
            {fmtPrice(localMin)}
          </span>
          <span className="text-[12px] text-muted-foreground">to</span>
          <span className="text-[15px] font-bold tabular-nums text-foreground">
            {localMax >= PRICE_MAX ? 'No max' : fmtPrice(localMax)}
          </span>
        </div>

        {/* Dual-thumb range slider — does NOT trigger onChange until Apply is clicked */}
        <Slider
          min={PRICE_MIN}
          max={PRICE_MAX}
          step={PRICE_STEP}
          value={[localMin, localMax]}
          onValueChange={([min, max]) => { setLocalMin(min); setLocalMax(max) }}
          className="mt-4 mb-1"
        />

        <Button size="sm" className="mt-3 w-full" onClick={apply}>
          Apply
        </Button>
      </PopoverContent>
    </Popover>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// BathsFilter
// ─────────────────────────────────────────────────────────────────────────────

const BathsFilter = memo(function BathsFilter({
  baths, value, onChange,
}: {
  baths:    number[]
  value:    number | null
  onChange: (v: number | null) => void
}) {
  const [open, setOpen] = useState(false)
  const isActive = value !== null
  const label    = isActive ? `${value}+ Baths` : 'Baths'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterPill isActive={isActive}>{label}</FilterPill>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={6} className="w-52 p-3">
        <PopoverHeader
          title="Bathrooms"
          isActive={isActive}
          onClear={() => { onChange(null); setOpen(false) }}
        />
        <div className="mt-2 flex gap-1.5">
          {baths.map(n => (
            <ChipButton
              key={n}
              active={value === n}
              onClick={() => { onChange(value === n ? null : n); setOpen(false) }}
            >
              {n}+
            </ChipButton>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SavedChip — inline heart toggle (no popover)
// ─────────────────────────────────────────────────────────────────────────────

const SavedChip = memo(function SavedChip({
  active, onToggle, isFetching = false,
}: {
  active:      boolean
  onToggle:    () => void
  isFetching?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{ height: 38 }}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3',
        'text-[13px] font-medium outline-none transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-ring/20',
        active
          ? 'border-rose-400/50 bg-rose-50 text-rose-600 font-semibold'
          : 'border-border bg-card text-foreground hover:border-foreground/25 hover:bg-muted',
      )}
    >
      {isFetching
        ? <Loader2 className="size-3.5 animate-spin text-rose-500" />
        : (
          <Heart className={cn(
            'size-3.5 transition-all duration-150',
            active ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/50',
          )} />
        )
      }
      Saved
    </button>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SortDropdown
// ─────────────────────────────────────────────────────────────────────────────

const SortDropdown = memo(function SortDropdown({
  sortBy, onSortChange,
}: {
  sortBy:       SortOption
  onSortChange: (v: SortOption) => void
}) {
  const current  = SORT_OPTIONS.find(o => o.value === sortBy)
  const isActive = sortBy !== 'newest'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <FilterPill isActive={isActive}>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">Sort:</span>
          <span>{current?.label ?? 'Sort'}</span>
        </FilterPill>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-44 overflow-hidden rounded-xl p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)]"
      >
        {SORT_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={cn(
              'cursor-pointer rounded-lg px-3 py-2 text-[13px]',
              sortBy === opt.value && 'font-semibold',
            )}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// ViewToggle
// ─────────────────────────────────────────────────────────────────────────────

const ViewToggle = memo(function ViewToggle({
  viewMode, onViewModeChange,
}: {
  viewMode:         ViewMode
  onViewModeChange: (v: ViewMode) => void
}) {
  return (
    <div
      style={{ height: 38 }}
      className="flex shrink-0 overflow-hidden rounded-xl border border-border bg-card"
    >
      {([
        { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid view' },
        { mode: 'list' as ViewMode, Icon: LayoutList, label: 'List view' },
      ] as const).map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          onClick={() => onViewModeChange(mode)}
          aria-label={label}
          aria-pressed={viewMode === mode}
          style={{ width: 38, height: 38 }}
          className={cn(
            'flex shrink-0 cursor-pointer items-center justify-center outline-none',
            'transition-all duration-150',
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
})

// ─────────────────────────────────────────────────────────────────────────────
// ChipButton — option chip inside popover panels / mobile drawer
// ─────────────────────────────────────────────────────────────────────────────

const ChipButton = memo(function ChipButton({
  active, onClick, children,
}: {
  active:   boolean
  onClick:  () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 34 }}
      className={cn(
        'inline-flex cursor-pointer items-center rounded-lg border px-3 text-[13px] font-medium',
        'transition-all duration-150',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-card text-foreground hover:bg-muted hover:border-border/70',
      )}
    >
      {children}
    </button>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// PopoverHeader — reused header row inside each filter popover
// ─────────────────────────────────────────────────────────────────────────────

function PopoverHeader({
  title, isActive, onClear,
}: {
  title:    string
  isActive: boolean
  onClear:  () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {title}
      </span>
      {isActive && (
        <button
          type="button"
          onClick={onClear}
          className="text-[11.5px] font-medium text-primary underline-offset-2 hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawerSection — labelled group inside the mobile filter drawer
// ─────────────────────────────────────────────────────────────────────────────

function DrawerSection({
  title, last = false, children,
}: {
  title:    string
  last?:    boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn('px-5 py-4', !last && 'border-b border-border/40')}>
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawerPriceControl — price slider inside the mobile drawer.
// Uses onValueCommit so the pending state only updates when the thumb is released,
// preventing unnecessary re-renders during drag.
// ─────────────────────────────────────────────────────────────────────────────

function DrawerPriceControl({
  minPrice, maxPrice, onChange,
}: {
  minPrice: number | null
  maxPrice: number | null
  onChange: (min: number | null, max: number | null) => void
}) {
  const [localMin, setLocalMin] = useState(minPrice ?? PRICE_MIN)
  const [localMax, setLocalMax] = useState(maxPrice ?? PRICE_MAX)

  // Sync when parent resets (e.g., Reset button sets pending.minPrice/maxPrice to null)
  useEffect(() => { setLocalMin(minPrice ?? PRICE_MIN) }, [minPrice])
  useEffect(() => { setLocalMax(maxPrice ?? PRICE_MAX) }, [maxPrice])

  return (
    <div className="flex flex-col gap-3">
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={PRICE_STEP}
        value={[localMin, localMax]}
        onValueChange={([min, max]) => { setLocalMin(min); setLocalMax(max) }}
        onValueCommit={([min, max]) => {
          onChange(
            min > PRICE_MIN ? min : null,
            max < PRICE_MAX ? max : null,
          )
        }}
      />
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-bold tabular-nums text-foreground">
          {fmtPrice(localMin)}
        </span>
        <span className="text-[12px] text-muted-foreground">to</span>
        <span className="text-[13px] font-bold tabular-nums text-foreground">
          {localMax >= PRICE_MAX ? 'No max' : fmtPrice(localMax)}
        </span>
      </div>
    </div>
  )
}
