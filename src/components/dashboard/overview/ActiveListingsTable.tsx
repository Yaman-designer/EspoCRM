'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Building2, Eye, Pencil, ChevronRight, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/format'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { listings, type Listing, type ListingStatus } from './data'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ListingStatus, { dot: string; bg: string; text: string }> = {
  Available: { dot: 'bg-chart-3', bg: 'bg-chart-3/10', text: 'text-chart-3' },
  Occupied: { dot: 'bg-chart-4', bg: 'bg-chart-4/10', text: 'text-chart-4' },
  'Sold Out': { dot: 'bg-brand-crimson', bg: 'bg-brand-crimson-soft', text: 'text-brand-crimson' },
}

const THUMB_CFG = [
  { from: 'from-primary/20', to: 'to-primary/5', icon: 'text-primary' },
  { from: 'from-chart-3/20', to: 'to-chart-3/5', icon: 'text-chart-3' },
  { from: 'from-chart-4/20', to: 'to-chart-4/5', icon: 'text-chart-4' },
  { from: 'from-brand-teal/20', to: 'to-brand-teal/5', icon: 'text-brand-teal' },
]

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function PropertyThumb({ index }: { index: number }) {
  const { from, to, icon } = THUMB_CFG[index % THUMB_CFG.length]
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br',
        from,
        to,
      )}
    >
      <Building2 className={cn('h-4 w-4', icon)} />
    </div>
  )
}

function StatusBadge({ listing }: { listing: Listing }) {
  const cfg = STATUS_CFG[listing.status]
  const label = listing.occupancy
    ? `${listing.occupancy} · ${listing.status}`
    : listing.status
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.bg, cfg.text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', cfg.dot)} />
      {label}
    </span>
  )
}

function LeadStack({ count }: { count: number }) {
  const shown = Math.min(3, count)
  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {Array.from({ length: shown }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold',
              AVATAR_PALETTE[i % AVATAR_PALETTE.length],
            )}
          >
            {String.fromCharCode(65 + i)}
          </span>
        ))}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">+{count}</span>
    </div>
  )
}

function ColumnHeader({ label, sortable = false, cls }: { label: string; sortable?: boolean; cls?: string }) {
  return (
    <th
      className={cn(
        'py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
        sortable && 'cursor-pointer select-none hover:text-foreground',
        cls,
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortable && <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </span>
    </th>
  )
}

function ListingRow({ listing, index }: { listing: Listing; index: number }) {
  return (
    <tr className="group border-b border-border/40 transition-colors last:border-0 hover:bg-muted/25">

      {/* Property */}
      <td className="py-2.5 pl-5 pr-3">
        <div className="flex items-center gap-2.5">
          <PropertyThumb index={index} />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-foreground">{listing.title}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{listing.location}</p>
          </div>
        </div>
      </td>

      {/* Type */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 sm:table-cell">
        <span className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
          {listing.type}
        </span>
      </td>

      {/* Price */}
      <td className="whitespace-nowrap px-3 py-2.5">
        <span className="text-[13px] font-bold text-foreground">{listing.cost}</span>
      </td>

      {/* Status */}
      <td className="whitespace-nowrap px-3 py-2.5">
        <StatusBadge listing={listing} />
      </td>

      {/* Leads */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 lg:table-cell">
        <LeadStack count={listing.leadCount} />
      </td>

      {/* Views */}
      <td className="hidden whitespace-nowrap px-3 py-2.5 xl:table-cell">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Eye className="h-3 w-3 opacity-60" />
          {formatNumber(listing.views)}
        </span>
      </td>

      {/* Quick actions (visible on hover) */}
      <td className="py-2.5 pl-2 pr-5">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            aria-label="View listing"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <Eye className="h-3 w-3" />
          </button>
          <button
            aria-label="Edit listing"
            className="flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-40" />
        </div>
      </td>

    </tr>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ActiveListingsTable() {
  const { t } = useTranslation('dashboard')
  const [search, setSearch] = useState('')

  const filtered = listings.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 bg-muted/10 px-6 py-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{t('listings.title')}</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t('listings.properties', { count: filtered.length })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-s-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('listings.search')}
              className="h-8 w-44 ps-8 text-xs"
            />
          </div>
          <Button size="xs" className="gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            {t('listings.newListing')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border/50 bg-muted/25">
              <ColumnHeader label={t('listings.columns.property')} sortable cls="pl-5 pr-4" />
              <ColumnHeader label={t('listings.columns.type')} cls="hidden px-3 sm:table-cell" />
              <ColumnHeader label={t('listings.columns.price')} sortable cls="px-3" />
              <ColumnHeader label={t('listings.columns.status')} cls="px-3" />
              <ColumnHeader label={t('listings.columns.leads')} sortable cls="hidden px-3 lg:table-cell" />
              <ColumnHeader label={t('listings.columns.views')} sortable cls="hidden px-3 xl:table-cell" />
              <th className="py-2 pr-5" />
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0
              ? filtered.map((l, i) => <ListingRow key={l.id} listing={l} index={i} />)
              : (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-muted-foreground">{t('listings.noResults')}</p>
                      <p className="text-xs text-muted-foreground/70">{t('listings.noResultsHint')}</p>
                    </div>
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/50 px-5 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          {t('listings.showing', { shown: filtered.length, total: listings.length })}
        </p>
        <button className="flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80">
          {t('listings.viewAll')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  )
}
