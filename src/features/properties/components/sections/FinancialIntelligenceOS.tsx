'use client'

import { LineChart, Tag, Ruler, CalendarDays, Wallet, Copy, Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../../lib/display'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'

// Property Details Sprint 2 — Data Authenticity Certification. Previously:
// `barPct()` generated bar heights from a deterministic hash of price + area
// ("same property always shows the same pattern," per its own prior
// comment) and a 1M/6M/1Y toggle that updated local state the chart never
// read — both presented as if they showed a real 12-month price trend, with
// no such time-series data anywhere in the EspoCRM schema (confirmed during
// the Wizard/metadata certification work and reconfirmed in Sprint 1's
// Runtime Completion audit). Per this sprint's explicit policy — "prefer
// showing 'No historical data available' instead of fake charts" — both are
// removed and replaced with an honest empty state.
//
// Executive Dashboard pass (2026-07-19). Rebuilt from a flat stack of
// generic "Stitch"-scaffold cards (rounded-[24px], full-opacity borders,
// a decorative dot-grid texture, uniform heavy-black labels competing with
// the numbers next to them) into the same visual language established on
// the Hero: one dominant price figure, quiet secondary labels, bordered KPI
// tiles with a soft hover lift, and a premium (not just empty) explanation
// for the one thing this listing genuinely doesn't have — price history.
// No field was added, removed, or renamed; every number here already
// existed in the component's own props.

// ── Types ──────────────────────────────────────────────────────────────────────

interface FinancialIntelligenceOSProps {
  price?:      number
  square?:     number
  type?:       string
  requestType?: string
  yearBuilt?:  number
  createdAt?:  string
  modifiedAt?: string
  // Property Details Completion (2026-07-17) — Financial Detail sub-block.
  // Each row below only renders when its own value/gate is present, mirroring
  // the Wizard's own visibility rules (investment gates cRentalprice,
  // withinMonthlyUtilities gates cAverageMonthlyUtilities, cConsideration
  // gates cCompensationFactor).
  initialPrice?: number
  objectiveValue?: number
  lowerPriceLimit?: number
  vat?: boolean
  cRemuneration?: number
  investment?: boolean
  cRentalprice?: number
  withinMonthlyUtilities?: boolean
  cAverageMonthlyUtilities?: number
  exchangeScheme?: boolean
  exchangeSchemePercentage?: number
  cConsideration?: boolean
  cCompensationFactor?: number
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
  requestType,
  yearBuilt,
  createdAt,
  modifiedAt,
  initialPrice,
  objectiveValue,
  lowerPriceLimit,
  vat,
  cRemuneration,
  investment,
  cRentalprice,
  withinMonthlyUtilities,
  cAverageMonthlyUtilities,
  exchangeScheme,
  exchangeSchemePercentage,
  cConsideration,
  cCompensationFactor,
}: FinancialIntelligenceOSProps) {
  const pricePerSqm = price != null && square ? Math.round(price / square) : null
  const { copied, copy } = useCopyToClipboard()

  const listingType = [type, requestType].filter(Boolean).join(' · ')

  return (
    <section className="space-y-4">

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
            Financial Intelligence OS
          </h2>
          <p className="text-xs text-muted-foreground font-semibold mt-0.5">
            Property financial overview · listing data
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5 items-start">

        {/* ── LEFT: The financial story — price, freshness, history ────────── */}
        <div className="col-span-12 xl:col-span-8 bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 sm:p-7">

          {/* Price — same baseline-aligned cluster as the Hero, the app's
              one established "premium price" pattern, reused here instead
              of a second bespoke treatment. */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-6 mb-6 border-b border-border/25">
            <div>
              <p className="text-[10px] font-semibold text-primary/55 uppercase tracking-wider mb-2">
                Asking Price{requestType ? ` · For ${requestType}` : ''}
              </p>
              {price != null ? (
                <button
                  type="button"
                  onClick={() => copy(String(price))}
                  aria-label={copied ? 'Price copied' : 'Copy asking price'}
                  className="group/price flex items-center gap-2 text-4xl sm:text-5xl font-black text-foreground font-heading tracking-tighter leading-none transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-lg"
                >
                  {fmtPrice(price, false)}
                  {copied ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4 text-muted-foreground/30 opacity-0 transition-opacity group-hover/price:opacity-100" />
                  )}
                </button>
              ) : (
                <p className="text-xl font-black text-muted-foreground/40 font-heading tracking-tighter leading-none">
                  Not provided
                </p>
              )}
            </div>
            {pricePerSqm != null && (
              <div className="flex items-baseline gap-1 pl-6 border-l border-border/25">
                <span className="text-base font-bold text-muted-foreground/55 tracking-tight tabular-nums">
                  {pricePerSqm.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground/35">/m²</span>
              </div>
            )}
          </div>

          {/* Historical trend — a premium empty state, not a void. Explains
              the absence in one line rather than leaving a large blank
              region under a lone icon. */}
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/30 bg-muted/3 px-5 py-4 mb-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted/50">
              <LineChart className="size-4.5 text-muted-foreground/40" />
            </div>
            <div className="min-w-0">
              <p className="text-[11.5px] font-bold text-foreground/70">No historical price trend available</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground/50">
                Price history isn&rsquo;t part of the current listing data — there&rsquo;s nothing to chart yet.
              </p>
            </div>
          </div>

          {/* Listing freshness — Built / Listed / Updated as one calm row
              instead of three heavily bordered pills competing with the
              price above them. */}
          {(yearBuilt != null || createdAt || modifiedAt) && (
            <div className="flex items-center flex-wrap gap-x-8 gap-y-2.5 border-t border-border/20 pt-5">
              {yearBuilt != null && <FreshnessStat label="Built" value={String(yearBuilt)} />}
              {createdAt && <FreshnessStat label="Listed" value={fmtDate(createdAt)} />}
              {modifiedAt && <FreshnessStat label="Updated" value={fmtDate(modifiedAt)} />}
            </div>
          )}
        </div>

        {/* ── RIGHT: Executive Snapshot — KPI tiles, same recipe as the
            Hero's own KPI cards, top-aligned rather than stretched to
            match the left card's height (a shorter card that ends where
            its content ends reads as intentional; a stretched one with
            empty middle space does not). ── */}
        <div className="col-span-12 xl:col-span-4 bg-card border border-border/40 rounded-2xl shadow-design-xs p-6">
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-4">
            Executive Snapshot
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SnapshotKpi icon={Wallet} label="Asking Price" value={price != null ? fmtPrice(price, true) : '—'} accent />
            <SnapshotKpi icon={Ruler} label="Price / m²" value={pricePerSqm != null ? `${pricePerSqm.toLocaleString('en-US')}/m²` : '—'} />
            <SnapshotKpi icon={CalendarDays} label="Year Built" value={yearBuilt != null ? String(yearBuilt) : '—'} />
            <SnapshotKpi icon={Tag} label="Listing" value={listingType || '—'} />
          </div>
        </div>
      </div>

      {/* Financial Detail — Property Details Completion (2026-07-17). Each
          row conditional on its own value/gate, same pattern as the
          Wizard's own visibleWhen rules. */}
      <FinancialDetailBlock
        initialPrice={initialPrice}
        objectiveValue={objectiveValue}
        lowerPriceLimit={lowerPriceLimit}
        vat={vat}
        cRemuneration={cRemuneration}
        investment={investment}
        cRentalprice={cRentalprice}
        withinMonthlyUtilities={withinMonthlyUtilities}
        cAverageMonthlyUtilities={cAverageMonthlyUtilities}
        exchangeScheme={exchangeScheme}
        exchangeSchemePercentage={exchangeSchemePercentage}
        cConsideration={cConsideration}
        cCompensationFactor={cCompensationFactor}
      />
    </section>
  )
}

// ── FreshnessStat ────────────────────────────────────────────────────────────

function FreshnessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[9px] font-semibold text-muted-foreground/45 uppercase tracking-wider">{label}</span>
      <span className="text-[12.5px] font-bold text-foreground/75 tabular-nums">{value}</span>
    </div>
  )
}

// ── SnapshotKpi ───────────────────────────────────────────────────────────────
// Deliberately the same recipe as the Hero's SummaryKpi tile — icon chip,
// quiet label, bold value, soft hover lift — so the Financial section reads
// as the same dashboard system rather than a second, competing style.

function SnapshotKpi({
  icon: Icon, label, value, accent,
}: {
  icon:    LucideIcon
  label:   string
  value:   string
  accent?: boolean
}) {
  const isEmpty = value === '—'
  return (
    <div className={cn(
      'flex items-center gap-3 min-w-0 rounded-xl border border-border/35 bg-muted/3 px-4 py-3.5',
      'transition-all duration-200 ease-out',
      'hover:border-border/60 hover:-translate-y-px hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.08)]',
      'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
    )}>
      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', accent ? 'bg-primary/8' : 'bg-muted/50')}>
        <Icon className={cn('size-4', accent ? 'text-primary/70' : 'text-muted-foreground/50')} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-muted-foreground/45 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={cn(
          'text-[14px] font-black tracking-tight truncate',
          isEmpty ? 'text-muted-foreground/35' : 'text-foreground',
        )}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ── Financial Detail block ───────────────────────────────────────────────────

interface FinancialDetailBlockProps {
  initialPrice?: number
  objectiveValue?: number
  lowerPriceLimit?: number
  vat?: boolean
  cRemuneration?: number
  investment?: boolean
  cRentalprice?: number
  withinMonthlyUtilities?: boolean
  cAverageMonthlyUtilities?: number
  exchangeScheme?: boolean
  exchangeSchemePercentage?: number
  cConsideration?: boolean
  cCompensationFactor?: number
}

type FinancialRow = { label: string; value: string }

// IA Sprint 3 (2026-07-18). Previously one flat grid of up to 13 fields
// mixing negotiation range, tax facts, and 4 independent conditional
// pairs (e.g. "Investment Opportunity: Yes" next to "Expected Rental
// Price: €X" read as two unrelated facts instead of one relationship).
// Grouped into 3 labeled clusters — same data, same card, no fields
// added or removed, each conditional pair now reads together.
function FinancialDetailBlock(props: FinancialDetailBlockProps) {
  const {
    initialPrice, objectiveValue, lowerPriceLimit, vat, cRemuneration,
    investment, cRentalprice, withinMonthlyUtilities, cAverageMonthlyUtilities,
    exchangeScheme, exchangeSchemePercentage, cConsideration, cCompensationFactor,
  } = props

  const negotiationRows: FinancialRow[] = [
    initialPrice    != null && { label: 'Initial Price',      value: fmtPrice(initialPrice, true) },
    objectiveValue  != null && { label: 'Objective Value',    value: fmtPrice(objectiveValue, true) },
    lowerPriceLimit != null && { label: 'Lower Price Limit',  value: fmtPrice(lowerPriceLimit, true) },
  ].filter((r): r is FinancialRow => !!r)

  const taxRows: FinancialRow[] = [
    vat           != null && { label: 'VAT', value: vat ? 'Applicable' : 'Not applicable' },
    cRemuneration != null && { label: 'Remuneration', value: String(cRemuneration) },
  ].filter((r): r is FinancialRow => !!r)

  const conditionalRows: FinancialRow[] = [
    investment && { label: 'Investment Opportunity', value: cRentalprice != null ? `Yes · Expected rent ${fmtPrice(cRentalprice, true)}` : 'Yes' },
    withinMonthlyUtilities && { label: 'Utilities Included', value: cAverageMonthlyUtilities != null ? `Yes · Avg. ${fmtPrice(cAverageMonthlyUtilities, true)}/mo` : 'Yes' },
    exchangeScheme && { label: 'Exchange Scheme', value: exchangeSchemePercentage != null ? `Yes · ${exchangeSchemePercentage}%` : 'Yes' },
    cConsideration && { label: 'Under Consideration', value: cCompensationFactor != null ? `Yes · Factor ${cCompensationFactor}` : 'Yes' },
  ].filter((r): r is FinancialRow => !!r)

  const clusters: Array<{ label: string; rows: FinancialRow[] }> = [
    { label: 'Negotiation Range', rows: negotiationRows },
    { label: 'Tax & Fees',        rows: taxRows },
    { label: 'Conditional Terms', rows: conditionalRows },
  ].filter(c => c.rows.length > 0)

  if (clusters.length === 0) return null

  return (
    <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 space-y-5">
      <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
        Financial Detail
      </p>
      {clusters.map((cluster, i) => (
        <div key={cluster.label} className={i > 0 ? 'border-t border-border/20 pt-5' : ''}>
          <p className="text-[8px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-3">
            {cluster.label}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {cluster.rows.map(row => (
              <div key={row.label}>
                <div className="text-[8px] font-bold text-muted-foreground/45 uppercase tracking-wider mb-1">{row.label}</div>
                <div className="text-sm font-black text-foreground">{row.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
