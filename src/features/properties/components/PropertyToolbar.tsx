'use client'

import { Fragment } from 'react'
import {
  Search, Plus, Download, ChevronDown,
  LayoutGrid, LayoutList, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { SortOption, ViewMode } from '../types/property.types'

// Title Case values match EspoCRM entity field enum values
const STATUS_OPTIONS = [
  { value: 'all',              label: 'All Statuses'   },
  { value: 'Available',        label: 'Available'      },
  { value: 'Pending',          label: 'Pending'        },
  { value: 'Under Approval',   label: 'Under Approval' },
  { value: 'Rented',           label: 'Rented'         },
  { value: 'Sold',             label: 'Sold'           },
  { value: 'Draft',            label: 'Draft'          },
]

const TYPE_OPTIONS = [
  { value: 'all',       label: 'All Types'  },
  { value: 'House',     label: 'House'      },
  { value: 'Villa',     label: 'Villa'      },
  { value: 'Apartment', label: 'Apartment'  },
  { value: 'Townhouse', label: 'Town House' },
  { value: 'Office',    label: 'Office'     },
  { value: 'Land',      label: 'Land'       },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest First'   },
  { value: 'oldest',     label: 'Oldest First'   },
  { value: 'price-high', label: 'Price: High–Low' },
  { value: 'price-low',  label: 'Price: Low–High' },
]

interface PropertyToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  statusFilter: string
  onStatusChange: (v: string) => void
  typeFilter: string
  onTypeChange: (v: string) => void
  sortBy: SortOption
  onSortChange: (v: SortOption) => void
  viewMode: ViewMode
  onViewModeChange: (v: ViewMode) => void
  totalCount: number
  onAddProperty: () => void
}

export function PropertyToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  totalCount,
  onAddProperty,
}: PropertyToolbarProps) {
  return (
    <div className="flex flex-col gap-3">

      {/* ── Row 1: Page heading + CTA ──────────────────── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

        {/* Left: title + count */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] font-bold leading-none tracking-tight text-foreground">
              Properties
            </h1>
            <span className="inline-flex h-5 items-center rounded-full bg-secondary px-2.5 text-[11px] font-medium tabular-nums text-muted-foreground">
              {totalCount}
            </span>
          </div>
          <p className="text-[13px] leading-snug text-muted-foreground">
            Manage your real estate portfolio
          </p>
        </div>

        {/* Right: Export + Add */}
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={onAddProperty}>
            <Plus className="size-3.5" />
            Add Property
          </Button>
        </div>
      </div>

      {/* ── Row 2: Search + Filters + Sort + View toggle ─ */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative min-w-45 flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
            style={{ width: 15, height: 15 }}
          />
          <input
            type="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search properties…"
            aria-label="Search properties"
            style={{ height: 36, paddingLeft: 40, paddingRight: 16, fontSize: 13 }}
            className={cn(
              'w-full rounded-xl border border-border bg-card text-foreground',
              'placeholder:text-muted-foreground/50',
              'shadow-(--shadow-xs) outline-none',
              'transition-all duration-200',
              'hover:border-border/80',
              'focus:border-primary/40 focus:shadow-(--shadow-sm) focus:ring-2 focus:ring-primary/10',
            )}
          />
        </div>

        {/* Status filter */}
        <FilterDropdown
          label="Status"
          currentValue={statusFilter}
          options={STATUS_OPTIONS}
          onSelect={onStatusChange}
          isActive={statusFilter !== 'all'}
        />

        {/* Type filter */}
        <FilterDropdown
          label="Type"
          currentValue={typeFilter}
          options={TYPE_OPTIONS}
          onSelect={onTypeChange}
          isActive={typeFilter !== 'all'}
        />

        {/* Sort */}
        <FilterDropdown
          label="Sort"
          currentValue={sortBy}
          options={SORT_OPTIONS}
          onSelect={v => onSortChange(v as SortOption)}
          isActive={sortBy !== 'newest'}
          showLabelPrefix
        />

        {/* Grid / List toggle */}
        <div
          style={{ height: 36 }}
          className="flex overflow-hidden rounded-xl border border-border"
        >
          {(
            [
              { mode: 'grid' as ViewMode, Icon: LayoutGrid, label: 'Grid view' },
              { mode: 'list' as ViewMode, Icon: LayoutList, label: 'List view' },
            ] as const
          ).map(({ mode, Icon, label }) => (
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
              <Icon style={{ width: 15, height: 15 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── FilterDropdown ────────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label: string
  currentValue: string
  options: { value: string; label: string }[]
  onSelect: (value: string) => void
  isActive?: boolean
  showLabelPrefix?: boolean
}

function FilterDropdown({
  label,
  currentValue,
  options,
  onSelect,
  isActive = false,
  showLabelPrefix = false,
}: FilterDropdownProps) {
  const selected = options.find(o => o.value === currentValue)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          style={{ height: 36 }}
          className={cn(
            'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium outline-none',
            'transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/20',
            isActive
              ? 'border-primary/40 bg-brand-azure-soft text-brand-azure'
              : 'border-border bg-card text-foreground',
          )}
        >
          {showLabelPrefix && (
            <span className="hidden text-[11px] text-muted-foreground sm:inline">
              {label}:
            </span>
          )}
          <span>{selected?.label ?? label}</span>
          <ChevronDown style={{ width: 13, height: 13 }} className="shrink-0 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-40">
        {options.map((opt, i) => (
          <Fragment key={opt.value}>
            {i === 1 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onClick={() => onSelect(opt.value)}
              className={cn(
                'flex items-center justify-between gap-2',
                currentValue === opt.value && 'font-medium',
              )}
            >
              {opt.label}
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
