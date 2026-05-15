'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { listings, type Listing, type ListingStatus } from './data'

// ── Design tokens ─────────────────────────────────────────────────────────────

type BadgeVariant = React.ComponentProps<typeof Badge>['variant']

const STATUS_VARIANT: Record<ListingStatus, BadgeVariant> = {
  Available:  'won',
  Occupied:   'visit',
  'Sold Out': 'cancelled',
}

const THUMB_GRADIENT = [
  'from-primary/20 to-primary/5',
  'from-chart-3/20 to-chart-3/5',
  'from-chart-4/20 to-chart-4/5',
  'from-chart-1/20 to-chart-1/5',
  'from-chart-5/20 to-chart-5/5',
]

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
]

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ listing }: { listing: Listing }) {
  const variant = STATUS_VARIANT[listing.status]
  const label   = listing.occupancy
    ? `${listing.occupancy} ${listing.status}`
    : listing.status
  return <Badge variant={variant}>{label}</Badge>
}

function LeadStack({ count }: { count: number }) {
  const shown = Math.min(3, count > 0 ? 3 : 0)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-2">
        {Array.from({ length: shown }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full border-2 border-card text-[9px] font-bold',
              AVATAR_PALETTE[i % AVATAR_PALETTE.length],
            )}
          >
            {String.fromCharCode(65 + i)}
          </span>
        ))}
      </div>
      {count > 0 && (
        <span className="text-[11px] font-medium text-muted-foreground">+{count}</span>
      )}
    </div>
  )
}

function PropertyThumb({ index }: { index: number }) {
  return (
    <div className={cn(
      'h-10 w-12 shrink-0 rounded-lg bg-linear-to-br',
      THUMB_GRADIENT[index % THUMB_GRADIENT.length],
    )} />
  )
}

function ListingRow({ listing, index }: { listing: Listing; index: number }) {
  return (
    <tr className="transition-colors hover:bg-muted/40">
      <td className="whitespace-nowrap py-3 pl-4 pr-3">
        <div className="flex items-center gap-3">
          <PropertyThumb index={index} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
            <p className="text-[11px] text-muted-foreground">{listing.location}</p>
          </div>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-muted-foreground sm:table-cell">
        {listing.type}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-muted-foreground md:table-cell">
        {listing.units.toLocaleString()}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-semibold text-foreground">
        {listing.cost}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 lg:table-cell">
        <LeadStack count={listing.leadCount} />
      </td>
      <td className="hidden whitespace-nowrap px-3 py-3 text-sm text-muted-foreground xl:table-cell">
        {listing.views}
      </td>
      <td className="whitespace-nowrap py-3 pl-3 pr-4">
        <StatusBadge listing={listing} />
      </td>
    </tr>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function ActiveListingsTable() {
  const [search, setSearch] = useState('')

  const filtered = listings.filter((l) =>
    l.title.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <Card className="gap-0 p-0">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Active Listings</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute inset-s-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 w-36 ps-8 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {[
                { label: 'Property',     cls: 'pl-4 pr-3'               },
                { label: 'Type',         cls: 'hidden px-3 sm:table-cell' },
                { label: 'Units',        cls: 'hidden px-3 md:table-cell' },
                { label: 'Cost',         cls: 'px-3'                      },
                { label: 'Active Leads', cls: 'hidden px-3 lg:table-cell' },
                { label: 'Views',        cls: 'hidden px-3 xl:table-cell' },
                { label: 'Status',       cls: 'pl-3 pr-4'                 },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={cn(
                    'py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
                    cls,
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length > 0
              ? filtered.map((l, i) => <ListingRow key={l.id} listing={l} index={i} />)
              : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    No listings match your search.
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

    </Card>
  )
}
