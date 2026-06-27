'use client'

import { useState, memo, useCallback, useMemo, forwardRef, useRef, useEffect } from 'react'
import {
  Search, Plus, ChevronDown, Check,
  LayoutGrid, LayoutList, X, Heart, SlidersHorizontal, Loader2, Clock,
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
import { useFavoritesCount } from '../hooks/useFavoriteState'
import type { SortOption, ViewMode } from '../types/property.types'
import type { TypeOption } from '../services/property.query.service'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const COUNT_FMT = new Intl.NumberFormat('en-US')
const NUM_FMT   = new Intl.NumberFormat('en-US')
const fmtCount  = (n: number) => COUNT_FMT.format(n)
const fmtNum    = (n: number) => NUM_FMT.format(n)

const PRICE_MIN  = 0
const PRICE_MAX  = 10_000_000
const PRICE_STEP = 10_000

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest First'    },
  { value: 'oldest',     label: 'Oldest First'    },
  { value: 'price-high', label: 'Price: High–Low' },
  { value: 'price-low',  label: 'Price: Low–High' },
]

const SORT_OPTIONS_MOBILE: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest'  },
  { value: 'oldest',     label: 'Oldest'  },
  { value: 'price-high', label: 'Price ↑' },
  { value: 'price-low',  label: 'Price ↓' },
]

// Shared popover content class — 22px radius matches card inner containers, premium layered shadow
const POPOVER_CLASS =
  'rounded-2xl border border-border/25 shadow-[0_4px_8px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.09),0_24px_48px_rgba(0,0,0,0.08)] bg-popover p-4'

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

  const { data: options } = usePropertyOptions()
  const typeOptions   = useMemo(() => options?.types     ?? [], [options?.types])
  const bedroomOpts   = useMemo(() => options?.bedrooms  ?? [], [options?.bedrooms])
  const bathroomOpts  = useMemo(() => options?.bathrooms ?? [], [options?.bathrooms])

  const handleSavedToggle = useCallback(
    () => onSavedOnlyChange(!savedOnly),
    [savedOnly, onSavedOnlyChange],
  )

  // ── Mobile drawer ────────────────────────────────────────────────────────

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [resetToken, setResetToken] = useState(0)
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
    setResetToken(t => t + 1)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">

      {/* ── Row 1: Title + counter (+ desktop Add Property inline) ─────────── */}
      <div className="flex flex-col gap-2 sm:gap-[7px]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2.5 sm:gap-2">
            <h1 className="text-[27px] font-bold leading-none tracking-[-0.025em] text-foreground">
              Properties
            </h1>
            <span className={cn(
              'inline-flex items-center rounded-[7px] border border-primary/[0.12] bg-primary/[0.055]',
              'px-2.5 py-[5px] text-[11.5px] font-semibold tabular-nums text-primary',
            )}>
              {fmtCount(totalCount)}
            </span>
          </div>
          <Button
            size="sm"
            className="hidden shrink-0 gap-1.5 sm:inline-flex shadow-[0_1px_2px_rgba(0,97,188,0.20),0_2px_8px_rgba(0,97,188,0.14),inset_0_1px_0_rgba(255,255,255,0.16)]"
            aria-label="Add Property"
            onClick={onAddProperty}
          >
            <Plus className="size-3.5" />
            Add Property
          </Button>
        </div>
        <Button className="h-12 w-full gap-2 sm:hidden" aria-label="Add Property" onClick={onAddProperty}>
          <Plus className="size-4" />
          Add Property
        </Button>
        <p className="hidden min-w-0 truncate text-[13px] text-muted-foreground/80 sm:block">
          {savedOnly
            ? 'Your saved property collection'
            : activeFilterCount > 0
              ? `${activeFilterCount} active ${activeFilterCount === 1 ? 'filter' : 'filters'} applied`
              : 'Manage and monitor your real estate portfolio'
          }
        </p>
      </div>

      {/* ── Row 2 — Mobile: Search full width ───────────────────────────── */}
      <div className="sm:hidden">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search properties…"
          height={44}
        />
      </div>

      {/* ── Row 3 — Mobile: Filters + View Switcher ──────────────────────── */}
      <div className="flex items-center gap-2.5 sm:hidden">
        <button
          type="button"
          onClick={openDrawer}
          className={cn(
            'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border outline-none transition-colors duration-150',
            'h-10 text-[13px] active:scale-[0.97]',
            'focus-visible:ring-2 focus-visible:ring-primary/15',
            activeFilterCount > 0
              ? [
                  'border-primary/20 bg-primary/[0.07] text-primary font-semibold',
                  'shadow-[0_1px_3px_rgba(0,97,188,0.10),inset_0_1px_0_rgba(255,255,255,0.65)]',
                ]
              : [
                  'border-border/70 bg-card text-foreground font-medium',
                  'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_2px_6px_rgba(16,24,40,0.05)]',
                ],
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
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} buttonSize={36} />
      </div>

      {/* ── Desktop: Floating filter bar ─────────────────────────────────── */}
      <div className="hidden items-center gap-2 sm:flex">

        {/* Search — grows to fill available space */}
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search by title, reference, or location…"
        />

        {/* ── Attribute filters ──────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-1.5">
          <TypeFilter
            types={typeOptions}
            value={typeFilter}
            onChange={onTypeChange}
          />
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
              style={{ height: 36 }}
              className={cn(
                'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5',
                'text-[11.5px] font-medium text-muted-foreground/70',
                'border-border/40 bg-background',
                'shadow-[0_1px_2px_rgba(16,24,40,0.04)]',
                'transition-colors duration-150',
                'hover:border-border/70 hover:bg-muted/30 hover:text-foreground',
              )}
            >
              <X style={{ width: 10, height: 10 }} />
              Clear
            </button>
          )}
        </div>

        {/* ── Actions: Saved | divider | Sort + View ─────────────────────── */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <SavedChip active={savedOnly} onToggle={handleSavedToggle} isFetching={isSavedFetching} />
          <div className="mx-1 h-4 w-px shrink-0 bg-border/45" aria-hidden />
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
          <div className="flex items-center justify-between border-b border-border/30 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <SheetTitle className="text-[17px] font-bold leading-none text-foreground">
                Filters
              </SheetTitle>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-none text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </div>
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
              <div className="flex flex-wrap gap-2.5">
                {SORT_OPTIONS_MOBILE.map(opt => (
                  <DrawerChip
                    key={opt.value}
                    active={pending.sortBy === opt.value}
                    onClick={() => setPending(p => ({ ...p, sortBy: opt.value }))}
                  >
                    {opt.label}
                  </DrawerChip>
                ))}
              </div>
            </DrawerSection>

            {typeOptions.length > 0 && (
              <DrawerSection title="Property Type">
                <div className="flex flex-wrap gap-2.5">
                  {([{ value: 'all', label: 'All Types' }, ...typeOptions.map(t => ({ value: t.value, label: t.value }))]).map(opt => (
                    <DrawerChip
                      key={opt.value}
                      active={pending.type === opt.value}
                      onClick={() => setPending(p => ({ ...p, type: opt.value }))}
                    >
                      {opt.label}
                    </DrawerChip>
                  ))}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Saved Properties">
              <button
                type="button"
                onClick={() => setPending(p => ({ ...p, savedOnly: !p.savedOnly }))}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4',
                  'text-[13px] font-semibold transition-colors duration-150 active:scale-[0.98]',
                  pending.savedOnly
                    ? 'border-rose-400/50 bg-rose-500/10 text-rose-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                    : 'border-border/40 bg-muted/30 text-foreground hover:border-border/70 hover:bg-muted/50',
                )}
              >
                <Heart className={cn(
                  'size-4 transition-colors duration-150',
                  pending.savedOnly ? 'fill-rose-500 text-rose-500' : 'text-muted-foreground/50',
                )} />
                Show Saved Only
              </button>
            </DrawerSection>

            {bedroomOpts.length > 0 && (
              <DrawerSection title="Bedrooms">
                <div className="flex flex-wrap gap-2.5">
                  {bedroomOpts.map(n => (
                    <DrawerChip
                      key={n}
                      active={pending.bedrooms === n}
                      onClick={() => setPending(p => ({
                        ...p, bedrooms: p.bedrooms === n ? null : n,
                      }))}
                    >
                      {n}+
                    </DrawerChip>
                  ))}
                </div>
              </DrawerSection>
            )}

            <DrawerSection title="Price Range">
              <DrawerPriceControl
                key={resetToken}
                minPrice={pending.minPrice}
                maxPrice={pending.maxPrice}
                onChange={(min, max) => setPending(p => ({ ...p, minPrice: min, maxPrice: max }))}
              />
            </DrawerSection>

            {bathroomOpts.length > 0 && (
              <DrawerSection title="Bathrooms" last>
                <div className="flex flex-wrap gap-2.5">
                  {bathroomOpts.map(n => (
                    <DrawerChip
                      key={n}
                      active={pending.bathrooms === n}
                      onClick={() => setPending(p => ({
                        ...p, bathrooms: p.bathrooms === n ? null : n,
                      }))}
                    >
                      {n}+
                    </DrawerChip>
                  ))}
                </div>
              </DrawerSection>
            )}

          </div>

          {/* Sticky footer */}
          <div className="flex gap-3 border-t border-border/25 bg-background/98 px-4 py-4 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-xl text-[13px] font-semibold"
              onClick={resetDrawer}
            >
              Reset
            </Button>
            <Button
              className="h-12 flex-[2] rounded-xl text-[13px] font-semibold shadow-sm"
              onClick={applyDrawer}
            >
              Show {fmtCount(totalCount)} Properties
            </Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Search history helpers (localStorage)
// ─────────────────────────────────────────────────────────────────────────────

const SEARCH_HISTORY_KEY = 'property_search_history'
const MAX_HISTORY = 5

function getSearchHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]).slice(0, MAX_HISTORY) : []
  } catch { return [] }
}

function saveToSearchHistory(term: string): void {
  if (!term.trim() || typeof window === 'undefined') return
  try {
    const existing = getSearchHistory().filter(s => s !== term.trim())
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([term.trim(), ...existing].slice(0, MAX_HISTORY)))
  } catch {}
}

function clearSearchHistoryStorage(): void {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(SEARCH_HISTORY_KEY) } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// SearchInput — command-bar feel with recent searches + keyboard shortcut
// ─────────────────────────────────────────────────────────────────────────────

const SearchInput = memo(function SearchInput({
  value, onChange, placeholder, height = 38,
}: {
  value:       string
  onChange:    (v: string) => void
  placeholder: string
  height?:     number
}) {
  const [focused,     setFocused]     = useState(false)
  const [panelOpen,   setPanelOpen]   = useState(false)
  const [history,     setHistory]     = useState<string[]>([])
  const inputRef    = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load history whenever the panel opens
  useEffect(() => {
    if (panelOpen) setHistory(getSearchHistory())
  }, [panelOpen])

  // Global '/' shortcut — focuses the search input from anywhere on the page
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/') return
      const el = e.target as HTMLElement
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Click outside closes the panel without blurring the input
  useEffect(() => {
    if (!panelOpen) return
    const onDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setPanelOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [panelOpen])

  const handleFocus = () => {
    setFocused(true)
    setPanelOpen(true)
    setHistory(getSearchHistory())
  }

  const handleBlur = () => {
    setFocused(false)
    if (value.trim()) saveToSearchHistory(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setPanelOpen(false); inputRef.current?.blur() }
    if (e.key === 'Enter' && value.trim()) { saveToSearchHistory(value); setPanelOpen(false) }
  }

  const applyHistory = (term: string) => {
    onChange(term)
    saveToSearchHistory(term)
    setHistory(getSearchHistory())
    setPanelOpen(false)
  }

  const clearHistory = () => {
    clearSearchHistoryStorage()
    setHistory([])
  }

  const showHint    = !focused && !value
  const showPanel   = panelOpen && history.length > 0

  return (
    <div ref={containerRef} className="relative min-w-36 flex-1">

      {/* Search icon */}
      <Search
        className={cn(
          'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-[color,transform] duration-150',
          focused ? 'text-primary/65 scale-105' : 'text-muted-foreground/35',
        )}
        style={{ width: 14, height: 14 }}
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search properties"
        style={{
          height,
          paddingLeft: 38,
          paddingRight: value ? 32 : (showHint ? 48 : 14),
          fontSize: 13,
        }}
        className={cn(
          'w-full rounded-xl border bg-card text-foreground outline-none',
          'placeholder:text-muted-foreground/38',
          'transition-[border-color,box-shadow,background-color] duration-200',
          focused || panelOpen
            ? [
                'border-primary/30 ring-2 ring-primary/10 bg-white',
                'shadow-[0_0_0_3px_rgba(0,97,188,0.09),0_4px_16px_rgba(0,97,188,0.07),0_1px_3px_rgba(16,24,40,0.05)]',
              ]
            : [
                'border-border/55 bg-card',
                'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_2px_8px_rgba(16,24,40,0.05),0_0_0_1px_rgba(16,24,40,0.015)]',
                'hover:border-border/80 hover:shadow-[0_1px_3px_rgba(16,24,40,0.07),0_3px_10px_rgba(16,24,40,0.06)]',
              ],
        )}
      />

      {/* Clear button */}
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onMouseDown={e => { e.preventDefault(); onChange(''); inputRef.current?.focus() }}
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2',
            'flex h-5 w-5 items-center justify-center rounded-full',
            'bg-muted/80 text-muted-foreground/50',
            'transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          <X style={{ width: 10, height: 10 }} />
        </button>
      )}

      {/* Keyboard shortcut badge */}
      {showHint && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center sm:flex">
          <kbd className={cn(
            'inline-flex h-5 items-center justify-center rounded border px-1.5',
            'border-border/50 bg-muted/60 text-[10px] font-medium leading-none text-muted-foreground/40',
            'shadow-[0_1px_1px_rgba(0,0,0,0.04),inset_0_-1px_0_rgba(0,0,0,0.06)]',
          )}>
            /
          </kbd>
        </div>
      )}

      {/* Recent-searches panel */}
      {showPanel && (
        <div className={cn(
          'absolute left-0 right-0 z-50',
          'top-[calc(100%+6px)]',
          'overflow-hidden rounded-2xl',
          'border border-border/30 bg-popover',
          'shadow-[0_4px_8px_rgba(0,0,0,0.04),0_12px_28px_rgba(0,0,0,0.09),0_24px_48px_rgba(0,0,0,0.06)]',
          'animate-in fade-in-0 slide-in-from-top-1 duration-150',
        )}>
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-border/20 px-4 py-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/40">
              Recent Searches
            </span>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); clearHistory() }}
              className="text-[11px] font-medium text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              Clear
            </button>
          </div>

          {/* History items */}
          <div className="py-1">
            {history.map(term => (
              <button
                key={term}
                type="button"
                onMouseDown={e => { e.preventDefault(); applyHistory(term) }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-left',
                  'text-[13px] text-foreground',
                  'transition-colors hover:bg-muted/60',
                )}
              >
                <Clock className="size-3.5 shrink-0 text-muted-foreground/30" />
                <span className="min-w-0 flex-1 truncate">{term}</span>
                <span aria-hidden className="shrink-0 text-[11px] text-muted-foreground/20">↵</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// FilterPill — trigger button shared by all filter popovers
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
        style={{ height: 36 }}
        className={cn(
          // `group` enables chevron rotation via group-data-[state=open] (Radix sets data-state on trigger)
          'group inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-3',
          'text-[12.5px] font-medium outline-none transition-colors duration-150',
          'active:scale-[0.97]',
          'focus-visible:ring-2 focus-visible:ring-primary/15',
          isActive
            ? [
                'border-primary/18 bg-primary/6.5 text-primary font-semibold',
                'shadow-[0_1px_2px_rgba(0,97,188,0.10),0_2px_6px_rgba(0,97,188,0.08),inset_0_1px_0_rgba(255,255,255,0.55)]',
              ]
            : [
                'border-border/55 bg-card text-foreground',
                'shadow-[0_1px_2px_rgba(16,24,40,0.05),0_2px_6px_rgba(16,24,40,0.05)]',
                'hover:border-border/75 hover:bg-muted/30 hover:shadow-[0_1px_3px_rgba(16,24,40,0.07),0_3px_8px_rgba(16,24,40,0.06)]',
              ],
          className,
        )}
        {...props}
      >
        {children}
        {hasChevron && (
          <ChevronDown
            style={{ width: 11, height: 11 }}
            className={cn(
              'shrink-0 transition-transform duration-200 ease-out',
              'group-data-[state=open]:rotate-180',
              isActive ? 'text-primary/55' : 'text-muted-foreground/50',
            )}
          />
        )}
      </button>
    )
  },
))

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
      <span className="text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground/45">
        {title}
      </span>
      {isActive && (
        <button
          type="button"
          onClick={onClear}
          className="text-[11.5px] font-medium text-primary/80 underline-offset-2 transition-colors duration-150 hover:text-primary hover:underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ChipButton — equal-width option chip inside popover panels
// ─────────────────────────────────────────────────────────────────────────────

const ChipButton = memo(function ChipButton({
  active, onClick, children, className,
}: {
  active:    boolean
  onClick:   () => void
  children:  React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ height: 34 }}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-xl border px-3 text-[13px] font-medium',
        'transition-colors duration-150',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,97,188,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]'
          : 'border-border/70 bg-card text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-muted/60 hover:border-border',
        className,
      )}
    >
      {children}
    </button>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// TypeFilter — searchable dropdown with checkmark on selected item
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
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        className={cn(POPOVER_CLASS, 'w-52 p-0 overflow-hidden')}
      >
        <Command>
          <div className="border-b border-border/25 px-3 py-2.5">
            <CommandInput
              placeholder="Search type…"
              className="h-8 text-[13px]"
            />
          </div>
          <CommandList className="max-h-52 py-1.5">
            <CommandEmpty className="py-6 text-center text-[13px] text-muted-foreground">
              No type found.
            </CommandEmpty>
            <CommandGroup>
              {[{ value: 'all', label: 'All Types' }, ...types.map(t => ({ value: t.value, label: t.value }))].map(opt => {
                const selected = value === opt.value
                return (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => {
                      onChange(selected && opt.value !== 'all' ? 'all' : opt.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'mx-1.5 flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]',
                      'transition-colors duration-150 ease-out',
                      selected
                        ? 'bg-primary/8 font-semibold text-primary'
                        : 'font-normal text-foreground hover:bg-muted/65',
                    )}
                  >
                    {opt.label}
                    {selected && <Check className="size-3.5 shrink-0 text-primary" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// BedsFilter — equal-width chip grid; never overflows regardless of count
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
      <PopoverContent align="start" sideOffset={8} collisionPadding={12} className={cn(POPOVER_CLASS, 'w-60')}>
        <PopoverHeader
          title="Bedrooms"
          isActive={isActive}
          onClear={() => { onChange(null); setOpen(false) }}
        />
        {/* grid forces equal width per chip — no overflow regardless of count */}
        <div
          className="mt-3"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${beds.length || 1}, 1fr)`, gap: 6 }}
        >
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
// PriceFilter — dual numeric inputs + range slider, commits on Apply
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
  const [minStr, setMinStr] = useState('')
  const [maxStr, setMaxStr] = useState('')

  function handleOpenChange(next: boolean) {
    if (next) {
      const min = minPrice ?? PRICE_MIN
      const max = maxPrice ?? PRICE_MAX
      setLocalMin(min)
      setLocalMax(max)
      setMinStr(min > PRICE_MIN ? fmtNum(min) : '')
      setMaxStr(max < PRICE_MAX ? fmtNum(max) : '')
    }
    setOpen(next)
  }

  // Slider → updates both numeric state and input strings simultaneously
  function handleSlider([min, max]: number[]) {
    setLocalMin(min)
    setLocalMax(max)
    setMinStr(min > PRICE_MIN ? fmtNum(min) : '')
    setMaxStr(max < PRICE_MAX ? fmtNum(max) : '')
  }

  // Min input → parse digits, update slider position, keep raw string for display
  function handleMinInput(v: string) {
    const digits = v.replace(/[^0-9]/g, '')
    setMinStr(digits)
    const n = parseInt(digits, 10)
    if (!isNaN(n)) {
      setLocalMin(Math.min(Math.max(Math.round(n / PRICE_STEP) * PRICE_STEP, PRICE_MIN), localMax - PRICE_STEP))
    } else if (digits === '') {
      setLocalMin(PRICE_MIN)
    }
  }

  // Max input → parse digits, update slider position, keep raw string for display
  function handleMaxInput(v: string) {
    const digits = v.replace(/[^0-9]/g, '')
    setMaxStr(digits)
    const n = parseInt(digits, 10)
    if (!isNaN(n)) {
      setLocalMax(Math.max(Math.min(Math.round(n / PRICE_STEP) * PRICE_STEP, PRICE_MAX), localMin + PRICE_STEP))
    } else if (digits === '') {
      setLocalMax(PRICE_MAX)
    }
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

  const priceInputClass = cn(
    'w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5',
    'text-[13px] font-semibold text-foreground tabular-nums',
    'placeholder:font-normal placeholder:text-muted-foreground/35',
    'transition-[border-color,box-shadow,background-color] duration-150 outline-none',
    'focus:border-primary/40 focus:bg-card focus:ring-2 focus:ring-primary/10',
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <FilterPill isActive={isActive}>{label}</FilterPill>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} collisionPadding={12} className={cn(POPOVER_CLASS, 'w-80')}>
        <PopoverHeader
          title="Price Range"
          isActive={isActive}
          onClear={() => { onChange(null, null); setOpen(false) }}
        />

        {/* Dual numeric inputs */}
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Min Price
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={minStr}
              onChange={e => handleMinInput(e.target.value)}
              placeholder="No min"
              aria-label="Minimum price"
              className={priceInputClass}
            />
          </div>
          <span className="mb-3 shrink-0 text-[13px] text-muted-foreground/30">–</span>
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              Max Price
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={maxStr}
              onChange={e => handleMaxInput(e.target.value)}
              placeholder="No max"
              aria-label="Maximum price"
              className={priceInputClass}
            />
          </div>
        </div>

        {/* Dual-thumb range slider */}
        <div className="mt-5 px-0.5">
          <Slider
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            value={[localMin, localMax]}
            onValueChange={handleSlider}
          />
        </div>

        {/* Range boundary labels */}
        <div className="mt-1.5 flex justify-between">
          <span className="text-[10px] text-muted-foreground/35">$0</span>
          <span className="text-[10px] text-muted-foreground/35">$10M+</span>
        </div>

        <Button size="sm" className="mt-3 w-full rounded-xl font-semibold" onClick={apply}>
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
      <PopoverContent align="end" sideOffset={8} collisionPadding={12} className={cn(POPOVER_CLASS, 'w-60')}>
        <PopoverHeader
          title="Bathrooms"
          isActive={isActive}
          onClear={() => { onChange(null); setOpen(false) }}
        />
        <div
          className="mt-3"
          style={{ display: 'grid', gridTemplateColumns: `repeat(${baths.length || 1}, 1fr)`, gap: 6 }}
        >
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
// SavedChip — heart toggle in the actions group, visually distinct from filters
// ─────────────────────────────────────────────────────────────────────────────

const SavedChip = memo(function SavedChip({
  active, onToggle, isFetching = false,
}: {
  active:      boolean
  onToggle:    () => void
  isFetching?: boolean
}) {
  const count = useFavoritesCount()
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? 'Showing saved properties' : 'Show saved properties'}
      style={{ height: 38 }}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3',
        'text-[13px] font-semibold outline-none transition-colors duration-150',
        'focus-visible:ring-2 focus-visible:ring-rose-400/30',
        active
          ? 'border-rose-400/50 bg-rose-500 text-white shadow-[0_2px_8px_rgba(239,68,68,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] dark:bg-rose-500'
          : 'border-rose-200/80 bg-rose-50/60 text-rose-500 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.05)] hover:border-rose-300/80 hover:bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5 dark:text-rose-400',
      )}
    >
      {isFetching
        ? <Loader2 className={cn('size-3.5 animate-spin', active ? 'text-white' : 'text-rose-400')} />
        : (
          <Heart className={cn(
            'size-3.5 transition-colors duration-150',
            active ? 'fill-white text-white scale-110' : 'fill-rose-200 text-rose-400',
          )} />
        )
      }
      Saved
      {count > 0 && (
        <span className={cn(
          'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1',
          'text-[10px] font-bold leading-none tabular-nums',
          active ? 'bg-white/25 text-white' : 'bg-rose-500 text-white',
        )}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// SortDropdown — checkmark on active item, tighter option spacing
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
          <span className="hidden text-[11px] text-muted-foreground/50 sm:inline">Sort:</span>
          <span>{current?.label ?? 'Sort'}</span>
        </FilterPill>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className={cn(POPOVER_CLASS, 'min-w-48 p-1.5')}
      >
        {SORT_OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => onSortChange(opt.value)}
            className={cn(
              'flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-[13px]',
              'transition-colors duration-150 ease-out',
              sortBy === opt.value
                ? 'bg-primary/8 font-semibold text-primary'
                : 'font-normal text-foreground hover:bg-muted/65',
            )}
          >
            {opt.label}
            {sortBy === opt.value && <Check className="size-3.5 shrink-0 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// ViewToggle — segmented control with sliding pill indicator
// ─────────────────────────────────────────────────────────────────────────────

const ViewToggle = memo(function ViewToggle({
  viewMode, onViewModeChange, buttonSize = 38,
}: {
  viewMode:         ViewMode
  onViewModeChange: (v: ViewMode) => void
  buttonSize?:      number
}) {
  const isGrid   = viewMode === 'grid'
  // 15px floor — icons need visual weight at 36–40px button size
  const iconSize = Math.max(15, Math.round(buttonSize * 0.39))
  // 3px (0.75 Tailwind unit) follows iOS/Linear formula: innerRadius = outerRadius − padding → 12 − 3 = 9
  const padding  = 3

  return (
    <div
      role="group"
      aria-label="View mode"
      style={{ width: buttonSize * 2, height: buttonSize }}
      className="relative flex shrink-0 rounded-[12px] border border-border/20 bg-muted/40 p-0.75"
    >
      {/* Sliding pill — absolutely positioned, translates exactly one button-width */}
      <div
        aria-hidden
        style={{ width: `calc(50% - ${padding}px)` }}
        className={cn(
          'pointer-events-none absolute inset-y-0.75 left-0.75 rounded-[9px]',
          'bg-card shadow-[0_1px_2px_rgba(0,0,0,0.10),0_2px_5px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.70)]',
          'transition-transform duration-200 ease-out',
          !isGrid && 'translate-x-full',
        )}
      />

      {([
        { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid view' },
        { mode: 'list' as ViewMode, Icon: LayoutList, label: 'List view' },
      ] as const).map(({ mode, Icon, label }) => {
        const active = viewMode === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              'relative z-10 flex flex-1 cursor-pointer select-none items-center justify-center rounded-[9px]',
              'outline-none transition-colors duration-150',
              'focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-inset',
              'active:scale-[0.93]',
              active
                ? 'text-foreground'
                : 'text-muted-foreground/38 hover:text-muted-foreground/65',
            )}
          >
            <Icon style={{ width: iconSize, height: iconSize, strokeWidth: 1.75 }} />
          </button>
        )
      })}
    </div>
  )
})

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
    <div className={cn('px-4 py-4', !last && 'border-b border-border/25')}>
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground/45">
        {title}
      </p>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawerChip — selection chip for mobile filter drawer (sort, type, beds, baths)
// ─────────────────────────────────────────────────────────────────────────────

function DrawerChip({
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
      className={cn(
        'inline-flex h-11 cursor-pointer items-center rounded-xl border px-4 text-[13px] font-semibold',
        'transition-colors duration-150 active:scale-[0.97]',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,97,188,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'border-border/50 bg-muted/30 text-foreground hover:border-border/70 hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawerPriceControl — price range inside the mobile filter drawer.
// Uses onValueCommit so pending state only updates when thumb is released.
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2.5">
        <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border/40 bg-muted/30 px-3.5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">Min Price</span>
          <span className="text-[15px] font-bold leading-none tabular-nums text-foreground">
            {fmtPrice(localMin)}
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-[11px] text-muted-foreground/25">—</span>
        </div>
        <div className="flex flex-1 flex-col gap-1 rounded-xl border border-border/40 bg-muted/30 px-3.5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/45">Max Price</span>
          <span className="text-[15px] font-bold leading-none tabular-nums text-foreground">
            {localMax >= PRICE_MAX ? 'No Limit' : fmtPrice(localMax)}
          </span>
        </div>
      </div>
      <Slider
        className="**:data-[slot=slider-track]:h-1.5 **:data-[slot=slider-thumb]:size-5 **:data-[slot=slider-thumb]:border-2 **:data-[slot=slider-thumb]:border-primary **:data-[slot=slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
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
    </div>
  )
}

