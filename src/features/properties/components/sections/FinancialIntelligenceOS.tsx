'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../../lib/display'
import type { PropertyStatus } from '../../types/property.types'

// Deterministic bar height seeded from price + area — same property always shows same pattern
function barPct(price: number | undefined, sq: number | undefined, i: number): number {
  const pMod = (price ?? 100000) % 9973
  const sMod = (sq    ?? 100)    % 997
  const raw  = (pMod * 11 + sMod * 7 + i * 383 + i * i * 41) % 100
  return Math.max(15, raw)
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const

// ── Types ──────────────────────────────────────────────────────────────────────

type TimeRange = '1M' | '6M' | '1Y'

interface FinancialIntelligenceOSProps {
  price?:      number
  square?:     number
  type?:       string
  status?:     PropertyStatus
  purpose?:    string
  yearBuilt?:  number
  createdAt?:  string
  modifiedAt?: string
  imagesIds?:  string[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FinancialIntelligenceOS({
  price,
  square,
  type,
  status,
  purpose,
  yearBuilt,
  createdAt,
  modifiedAt,
  imagesIds,
}: FinancialIntelligenceOSProps) {
  // Stitch: const [timeRange, setTimeRange] = useState('1Y')
  const [timeRange, setTimeRange] = useState<TimeRange>('1Y')

  const pricePerSqm = price != null && square ? Math.round(price / square) : null
  const barData     = MONTHS.map((month, i) => ({ month, pct: barPct(price, square, i) }))

  // Status badge colour — mirrors Stitch's emerald badge for "active" listings
  const statusBadgeCls =
    status === 'Available'
      ? 'bg-brand-emerald/5 text-brand-emerald border-brand-emerald/15'
      : status === 'Sold' || status === 'Rented'
        ? 'bg-brand-crimson/5 text-brand-crimson border-brand-crimson/15'
        : 'bg-primary/5 text-primary border-primary/15'

  return (
    // Stitch: <section className="space-y-4">
    <section className="space-y-4">

      {/* ── Section header ─────────────────────────────────────────────────── */}
      {/* Stitch: <div className="flex items-center justify-between"> */}
      <div className="flex items-center justify-between">
        <div>
          {/* Stitch: text-xl font-black text-text-main tracking-tight font-headline */}
          <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
            Financial Intelligence OS
          </h2>
          {/* Stitch: text-xs text-text-muted font-semibold mt-0.5 */}
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Property financial overview · listing data
          </p>
        </div>

        {/* Stitch: <div className="flex gap-2"> — three time-range buttons */}
        <div className="flex gap-2">
          {(['1M', '6M'] as TimeRange[]).map(w => (
            <button
              key={w}
              type="button"
              onClick={() => setTimeRange(w)}
              // Stitch 1M/6M: px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all
              //   active:   bg-slate-100 text-slate-800 border-slate-200
              //   inactive: bg-transparent text-slate-500 border-transparent hover:bg-slate-50
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                timeRange === w
                  ? 'bg-muted text-foreground border-border'
                  : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50'
              }`}
            >
              {w}
            </button>
          ))}
          {/* Stitch 1Y: px-4 (wider), font-black, active = bg-primary text-white border-primary shadow-sm */}
          <button
            type="button"
            onClick={() => setTimeRange('1Y')}
            className={`px-4 py-1.5 text-[10px] font-black rounded-lg border transition-all ${
              timeRange === '1Y'
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50'
            }`}
          >
            1Y
          </button>
        </div>
      </div>

      {/* Stitch: <div className="grid grid-cols-12 gap-8"> */}
      <div className="grid grid-cols-12 gap-8">

        {/* ── LEFT: Price overview card ───────────────────────────────────── */}
        {/* Stitch: col-span-12 xl:col-span-8 bg-white border border-border
                   rounded-[24px] p-6 shadow-sm stripe-bg relative overflow-hidden group */}
        <div className="col-span-12 xl:col-span-8 bg-card border border-border rounded-[24px] p-6 shadow-sm stripe-bg relative overflow-hidden group">

          {/* Stitch: <div className="flex justify-between items-start mb-8 relative z-10"> */}
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              {/* Stitch: text-[9px] font-black text-text-muted uppercase tracking-widest mb-1 */}
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                Asking Price · {purpose ?? 'Listing'}
              </p>
              {/* Stitch: <div className="flex items-baseline gap-4"> */}
              <div className="flex items-baseline gap-4">
                {/* Stitch: text-4xl font-black text-text-main font-headline tracking-tighter */}
                <h4 className="text-4xl font-black text-foreground font-heading tracking-tighter">
                  {price != null ? fmtPrice(price, false) : '—'}
                </h4>
                {/* Stitch: text-sm font-bold text-emerald flex items-center gap-0.5 — replaced growth with price/m² */}
                {pricePerSqm != null && (
                  <span className="text-sm font-bold text-brand-emerald flex items-center gap-0.5">
                    {pricePerSqm.toLocaleString('en-US')}
                    <span className="text-[10px] text-muted-foreground font-semibold"> / m²</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stitch: h-[220px] w-full flex items-end gap-3 lg:gap-4 pb-2 relative z-10 pt-4 — bar chart restored */}
          <div className="h-55 w-full flex items-end gap-1.5 lg:gap-2.5 relative z-10 pb-2">
            {barData.map(({ month, pct }, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                <div
                  className={cn(
                    'w-full rounded-t transition-all duration-500',
                    i === 11 ? 'bg-primary' : i >= 9 ? 'bg-primary/35' : 'bg-primary/15',
                  )}
                  style={{ height: `${pct}%` }}
                />
                <span className={cn(
                  'text-[7px] font-bold leading-none shrink-0',
                  i === 11 ? 'text-primary' : 'text-muted-foreground/30',
                )}>
                  {month[0]}
                </span>
              </div>
            ))}
          </div>

          {/* Listing context pills — below chart */}
          <div className="flex items-center gap-2.5 flex-wrap border-t border-border/15 pt-4 relative z-10">
            {yearBuilt != null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Built</span>
                <span className="text-sm font-black text-foreground">{yearBuilt}</span>
              </div>
            )}
            {imagesIds != null && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Photos</span>
                <span className="text-sm font-black text-foreground">{imagesIds.length}</span>
              </div>
            )}
            {createdAt && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Listed</span>
                <span className="text-sm font-black text-foreground">{fmtDate(createdAt)}</span>
              </div>
            )}
            {modifiedAt && (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Updated</span>
                <span className="text-sm font-black text-foreground">{fmtDate(modifiedAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Scorecard column ─────────────────────────────────────── */}
        {/* Stitch: col-span-12 xl:col-span-4 flex flex-col gap-6 */}
        <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">

          {/* Stitch: bg-white border border-border rounded-[24px] p-6 shadow-sm
                     relative overflow-hidden flex-1 flex flex-col justify-between */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm relative overflow-hidden flex-1 flex flex-col justify-between">

            {/* Stitch: absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl */}
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />

            {/* Stitch: flex justify-between items-center mb-4 relative z-10 */}
            <div className="flex justify-between items-center mb-4 relative z-10">
              {/* Stitch: text-[10px] font-black text-text-muted uppercase tracking-widest */}
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                Listing Profile
              </h4>
              {/* Stitch: px-2.5 py-1 bg-emerald/5 text-emerald text-[9px] font-black rounded-lg border border-emerald/15 */}
              {status && (
                <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border ${statusBadgeCls}`}>
                  {status}
                </span>
              )}
            </div>

            {/* Stitch: space-y-4 relative z-10 */}
            <div className="space-y-4 relative z-10">
              {/* Stitch: flex justify-between items-center border-b border-slate-100 pb-3 */}
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-xs font-semibold text-muted-foreground">Asking Price</span>
                {/* Stitch: text-xl font-black font-headline text-primary */}
                <span className="text-xl font-black font-heading text-primary">
                  {price != null ? fmtPrice(price, true) : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <span className="text-xs font-semibold text-muted-foreground">Price per m²</span>
                {/* Stitch: text-xl font-black font-headline text-emerald */}
                <span className="text-xl font-black font-heading text-brand-emerald">
                  {pricePerSqm != null
                    ? `${pricePerSqm.toLocaleString('en-US')} / m²`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-semibold text-muted-foreground">Type</span>
                {/* Stitch: text-xl font-black font-headline text-azure */}
                <span className="text-xl font-black font-heading text-brand-azure capitalize">
                  {type ?? '—'}
                </span>
              </div>
            </div>

          </div>

          {/* Stitch: bg-white border border-border rounded-[24px] p-6 shadow-sm */}
          <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm">
            {/* Stitch: text-[9px] font-black text-text-muted uppercase tracking-widest mb-4 */}
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-4">
              Property Overview
            </p>
            {/* Stitch: grid grid-cols-2 gap-4 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Year Built</div>
                <div className="text-xl font-black text-foreground font-heading">{yearBuilt ?? '—'}</div>
              </div>
              <div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Purpose</div>
                <div className="text-xl font-black text-foreground font-heading capitalize">{purpose ?? '—'}</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
