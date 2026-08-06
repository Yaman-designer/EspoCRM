'use client'

import type { ReactNode } from 'react'
import { LineChart, Copy, Check, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { fmtPrice } from '../../lib/display'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { SectionHeader, DefinitionList } from '@/components/shared'
import type { FinancialDetailCluster, FinancialViewModel, InvestmentOpportunity } from '../../view-models/financial.viewmodel'

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
//
// Information Architecture refinement (2026-07-22, first pass). The
// right-hand "Executive Snapshot" KPI column was removed — it duplicated
// this very component's own left card (Asking Price, Price/m² shown twice
// inside one section) plus Quick Specifications (Year Built) and Command
// Hub (Type/Request Type, via the "Listing" tile). The freshness row's
// "Built" stat was removed too — year built is a physical spec, exclusively
// owned by Quick Specifications, not a financial date; Listed/Updated stay
// here since this component is this app's one designated owner of listing
// timeline dates (Command Hub's own Created/Updated line was removed to
// match — see OperationsCommandHub.tsx's own IA note).
//
// Information Architecture refinement (2026-07-22, second pass). Removing
// that column left the section a single, full-width card with real empty
// margin beside it at desktop width. The brief was explicit: don't
// reintroduce duplicated information to fill that space — instead check
// whether real, already-fetched financial fields can occupy it. They can:
// the "Financial Detail" cluster below (Negotiation Range / Tax & Fees /
// Conditional Terms) was previously a second full-width card, stacked
// beneath the price card, competing for the same reading column. It is
// exactly this component's own remaining financial data with nowhere else
// to live — moved into the second column instead of invented content. When
// a property has none of those fields populated, the column doesn't render
// and the price card reclaims the full width — no permanent empty shell for
// data-sparse listings.
//
// Enterprise architecture pass (2026-07-23). Field selection, the price/m²
// calculation, date formatting, and the three-cluster grouping used to live
// inline in this component; all of it now arrives pre-shaped via
// `FinancialViewModel` (see view-models/financial.viewmodel.ts) — this
// component only renders.
//
// Enterprise UX Architecture pass (2026-07-24) — contrast remediation, not a
// palette change. Every `text-muted-foreground` (rgb 102,112,133) instance
// here that additionally applied a /35–/55 opacity was computed (WCAG
// relative-luminance formula, against this card's actual white background)
// to land between 1.6:1 and 2.8:1 — nowhere near the 4.5:1 (normal text) or
// 3:1 (large text/non-text) floors, and in some cases below even a casual
// glance threshold. `muted-foreground` at its own full, undiluted opacity
// already sits at ~4.97:1 — a real, if tight, pass — so the fix is removing
// the *extra* opacity stacked on top of an already-correctly-muted token,
// not picking a new color. Where full-opacity `muted-foreground` still read
// as too close to the historical/freshness text above it, `foreground` at a
// verified-passing partial opacity was used instead (pricePerSqm/70 → 6.6:1,
// /m² unit at /65 → 5.5:1) so the secondary-vs-primary size/weight hierarchy
// stays intact through contrast, not through failing it. The price copy
// icon and its press feedback are a second, separate fix: it was
// `opacity-0` until `:hover`, meaning touch users never saw it at all (no
// hover state exists on touch) — now dimly visible by default (still passes
// the lower 3:1 non-text-contrast bar) and brightens on hover/focus, with
// `active:scale` press feedback on this app's shared motion tokens instead
// of a bare `transition-colors`.

// ── Main component ─────────────────────────────────────────────────────────────

// Structural layout pass (2026-07-26). Financial Detail used to be a real
// `<aside>`, absolutely positioned into a reserved right-hand margin beside
// the price card at `xl` (see git history for the full prior rationale) —
// explicitly justified at the time as "this element's height must not gate
// its siblings," with the overlap that causes on a data-heavy listing
// (all four clusters) accepted as a known tradeoff. Lived experience of
// that tradeoff: the overlap reads as the *next* section (Location
// Intelligence's map) starting underneath a sticky-looking sidebar rather
// than as its own chapter — the out-of-flow win wasn't worth that cost.
//
// Reworked into two ordinary, full-width, in-flow chapters instead: no
// absolute positioning, no reserved margin, nothing that can ever overlap
// whatever comes next — the next section starts exactly at this one's true
// bottom edge, always. Same component, same anchor
// (`#section-financial` in PropertyDetailView), same reading position in
// the IA — only the internal structure changed:
//   1. "Property Pricing"       — the price card, unchanged content.
//   2. "Financial Intelligence" — Investment Opportunity + the three
//      clusters (Negotiation Range / Tax & Fees / Conditional Terms),
//      previously stacked in one tall card, now a horizontal dashboard of
//      equal-weight tiles (FinancialDetailGrid below) instead of a vertical
//      list — a "chapter," not a sidebar.
// `space-y-10` between them (vs. this page's usual `space-y-4`/`gap-4`) is
// deliberate — these two read as genuinely separate chapters, not adjacent
// cards in the same zone, and need more air than the standard rhythm gives
// same-zone siblings.
export function FinancialIntelligenceOS({ data }: { data: FinancialViewModel }) {
  const { t } = useTranslation('properties')
  const { price, requestType, pricePerSqm, listedLabel, updatedLabel, investmentOpportunity, hasFinancialDetail, detailClusters } = data
  const { copied, copy } = useCopyToClipboard()

  return (
    <section className="space-y-10">

      {/* ── Chapter 1 — Property Pricing ──────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader title={t('financial.pricingTitle')} subtitle={t('financial.pricingSubtitle')} />

        <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 sm:p-7">

          {/* Price — same baseline-aligned cluster as the Hero, the app's
              one established "premium price" pattern, reused here instead
              of a second bespoke treatment. */}
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 pb-6 mb-6 border-b border-border/25">
            <div>
              <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-2">
                {t('financial.askingPrice')}{requestType ? ` · ${t('common.for')} ${requestType}` : ''}
              </p>
              {price != null ? (
                <button
                  type="button"
                  onClick={() => copy(String(price))}
                  aria-label={copied ? t('financial.priceCopied') : t('financial.copyAskingPrice')}
                  className={cn(
                    'group/price flex items-center gap-2 text-[26px] min-[360px]:text-4xl sm:text-5xl font-black text-foreground font-heading tracking-tighter leading-none rounded-lg',
                    'transition-[color,transform] duration-(--duration-fast) ease-(--ease-premium)',
                    'hover:text-primary active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  )}
                >
                  {fmtPrice(price, false)}
                  {copied ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4 text-muted-foreground/85 opacity-70 transition-opacity duration-(--duration-fast) ease-(--ease-premium) group-hover/price:opacity-100 motion-reduce:transition-none" />
                  )}
                </button>
              ) : (
                <p className="text-xl font-black text-muted-foreground/85 font-heading tracking-tighter leading-none">
                  {t('common.notProvided')}
                </p>
              )}
            </div>
            {pricePerSqm != null && (
              <div className="flex items-baseline gap-1 pl-6 border-l border-border/25">
                <span className="text-base font-bold text-foreground/70 tracking-tight tabular-nums">
                  {pricePerSqm.toLocaleString('en-US')}
                </span>
                <span className="text-[10px] font-semibold text-foreground/65">/{t('common.sqmUnit')}</span>
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
              <p className="text-[11.5px] font-bold text-foreground/70">{t('financial.noHistoricalTitle')}</p>
              <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
                {t('financial.noHistoricalDesc')}
              </p>
            </div>
          </div>

          {/* Listing freshness — Listed / Updated. "Built" (year built) was
              removed here — see top-of-file IA note; it is a physical spec,
              exclusively owned by Quick Specifications. */}
          {(listedLabel || updatedLabel) && (
            <div className="flex items-center flex-wrap gap-x-8 gap-y-2.5 border-t border-border/20 pt-5">
              {listedLabel && <FreshnessStat label={t('financial.listed')} value={listedLabel} />}
              {updatedLabel && <FreshnessStat label={t('financial.updated')} value={updatedLabel} />}
            </div>
          )}
        </div>
      </div>

      {/* ── Chapter 2 — Financial Intelligence (horizontal dashboard) ──────
          Property Details Completion (2026-07-17) originally placed this
          data in a second full-width card stacked beneath the price card;
          the 2026-07-22 IA pass moved it into a sidebar column instead. This
          pass keeps that IA decision (same data, same grouping, same
          reading position right after Property Pricing) but rejects both
          prior *layouts* — full-width dashboard of equal-weight tiles,
          neither a tall vertical stack nor a sidebar. */}
      {hasFinancialDetail && (
        <div className="space-y-4">
          <SectionHeader title={t('financial.title')} subtitle={t('financial.subtitle')} />
          <FinancialDetailGrid clusters={detailClusters} investmentOpportunity={investmentOpportunity} />
        </div>
      )}
    </section>
  )
}

// ── FreshnessStat ────────────────────────────────────────────────────────────

function FreshnessStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className="text-[12.5px] font-bold text-foreground/75 tabular-nums">{value}</span>
    </div>
  )
}

// ── Financial Detail grid ────────────────────────────────────────────────────

// IA Sprint 3 (2026-07-18). Previously one flat grid of up to 13 fields
// mixing negotiation range, tax facts, and 4 independent conditional
// pairs (e.g. "Investment Opportunity: Yes" next to "Expected Rental
// Price: €X" read as two unrelated facts instead of one relationship).
// Grouped into 3 labeled clusters — same data, no fields added or removed,
// each conditional pair reads together. Investment Refinement pass
// (2026-07-26) split Investment Opportunity out of the conditionalTerms
// Row[] list into its own typed field (see financial.viewmodel.ts's note).
//
// Structural layout pass (2026-07-26, same day). All of the above used to
// live stacked inside one shared vertical card — Investment Opportunity as
// a tinted badge at the top, each cluster below it separated by a
// `border-t` divider, the whole thing then absolutely positioned as a
// sidebar beside the price card (see FinancialIntelligenceOS's own comment
// for why that was reworked). Rebuilt as a horizontal dashboard: every
// cluster, plus Investment Opportunity, is now its own equal-weight tile
// (FinancialTile) in a responsive grid — up to 4 tiles, matching the up to
// 4 independent facts this data actually is (never more than one
// relationship's worth of Row[] per tile), not one long column pretending
// they're a single narrative.
//
// Container-width breakpoints, not viewport ones (`@[..]`, not `sm:`/`xl:`):
// this grid's parent column is full page width below `xl` but narrows to
// ~62% beside Command Hub's sticky aside at `xl`+ (see PropertyDetailView's
// own grid comment) — a viewport breakpoint would misjudge the space
// actually available here. Same reasoning this exact cluster-grid's own
// prior comment already documented for an identical problem, just applied
// to the outer grid too now instead of only DefinitionList's inner one.
// 560px / 900px are real content floors, not round numbers: a tile reads
// comfortably at 2-up from (560 − 16px gap) / 2 ≈ 272px, at 4-up from
// (900 − 3×16px gap) / 4 ≈ 213px — DefinitionList's own rows need roughly
// that much to avoid wrapping.
function FinancialDetailGrid({
  clusters, investmentOpportunity,
}: {
  clusters: FinancialDetailCluster[]
  investmentOpportunity: InvestmentOpportunity | null
}) {
  const { t } = useTranslation('properties')
  if (clusters.length === 0 && !investmentOpportunity) return null

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @[560px]:grid-cols-2 @[900px]:grid-cols-4">
        {investmentOpportunity && (
          <FinancialTile label={t('financial.rows.investmentOpportunity')}>
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                <TrendingUp className="size-3.5" />
              </span>
              <span className="text-sm font-black text-foreground">
                {investmentOpportunity.expectedRentAmount != null
                  ? t('financial.rows.investmentYesRent', { price: investmentOpportunity.expectedRentAmount })
                  : t('financial.rows.investmentYes')}
              </span>
            </div>
          </FinancialTile>
        )}

        {clusters.map(cluster => (
          <FinancialTile key={cluster.key} label={t(`financial.clusters.${cluster.key}`)}>
            <DefinitionList rows={cluster.rows} />
          </FinancialTile>
        ))}
      </div>
    </div>
  )
}

// Every tile — Investment Opportunity and the three data clusters alike —
// shares this exact chrome so all four read as one equal-weight family at a
// glance, per the explicit "similar visual weight" brief; only what's
// inside (`children`) differs. `rounded-xl`, one radius tier below
// Property Pricing's own `rounded-2xl` card, matches this page's existing
// hierarchy convention for a tile nested one level down (see
// PropertySpecsBar's own spec-item tiles for the same pattern).
function FinancialTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/40 bg-card p-5 shadow-design-xs">
      <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      {children}
    </div>
  )
}
