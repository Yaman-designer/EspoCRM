'use client'

import { MapPinOff, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDistance } from '../../services/geocoding.service'
import type { NearbyPlace } from '../../hooks/usePropertyLocation'

// Enterprise architecture pass (2026-07-23): split out of
// LocationIntelligenceCenter.tsx (was 568 lines) into its own file — same
// components, same behavior, no visual change.

// ── Overview sentence ─────────────────────────────────────────────────────
// Map/Intelligence Transition pass (2026-07-26). Was rendered twice inside
// this file — once in NeighborhoodPanel (has-data layout), once in
// LocationSummaryEmptyState (no-data layout) — both beside/below the map
// rather than before it. On any viewport under `lg`, the map (col-span-12,
// first in DOM order) rendered above both, so the one sentence that orients
// a reader ("Downtown Athens — Apartment for sale, currently Active.") was
// read *after* a 500px+ map, not before it. Promoted to a single instance
// in LocationIntelligenceCenter's own section header — same real sentence,
// same fields, now the map's one lead-in line in every layout at every
// breakpoint instead of a duplicated, subordinate side-note. Exported for
// that one caller; no longer used by either component in this file.

export function OverviewSentence({
  locationDisplay, propertyType, propertyStatus, propertyRequestType,
}: {
  locationDisplay:      string
  propertyType?:        string
  propertyStatus?:      string
  propertyRequestType?: string
}) {
  const { t } = useTranslation('properties')
  // propertyType/propertyStatus/propertyRequestType are real API enum
  // values (just lowercased for prose) — never translated, per this pass's
  // own rule. Only the connective words around them ("for", ", currently",
  // the "property" fallback) are static UI copy.
  return (
    <p className="text-[13px] text-foreground/80 font-medium leading-relaxed">
      {locationDisplay} —{' '}
      <span className="text-foreground font-bold">
        {propertyType?.toLowerCase() ?? t('location.propertyTypeFallback')}
        {propertyRequestType ? ` ${t('common.for').toLowerCase()} ${propertyRequestType.toLowerCase()}` : ''}
      </span>
      {propertyStatus ? (
        <>
          {`${t('location.overviewCurrentlyPrefix')} `}
          <span className="font-bold text-primary/80">{propertyStatus.toLowerCase()}</span>
        </>
      ) : null}
      {'.'}
    </p>
  )
}

// ── No location data state ───────────────────────────────────────────────────
// One elegant empty state instead of iterating five empty "None found"
// cards. Covers both real causes: no coordinates to search from at all, or
// coordinates that resolved but returned zero real nearby results in any
// category — the message is the only thing that changes.
//
// Product Polish pass (2026-07-20): matches this page's own established
// "premium empty state" recipe (FinancialIntelligenceOS's "No historical
// price trend available" block) — same dashed card nested inside a solid-
// border parent, same icon chip, same type scale. Layout adapted rather
// than copied verbatim: the headline stays beside the icon, the explanation
// drops to its own full-width line beneath. Not merged into the shared
// `EmptyState` primitive — see EmptyState.tsx's own note on why this
// "inline dashed-row" family of empty states (also used by Financial and
// Command Hub, each with its own icon size/shape) isn't pixel-identical
// across its instances and wasn't force-consolidated.

function NoLocationDataState({ computable }: { computable: boolean }) {
  const { t } = useTranslation('properties')
  return (
    <div className="rounded-xl border border-dashed border-border/30 bg-muted/3 px-5 py-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/50">
          <MapPinOff className="size-4 text-muted-foreground/40" />
        </div>
        <p className="text-[11.5px] font-bold text-foreground/70">{t('location.noIntelTitle')}</p>
      </div>
      <p className="text-[11px] font-medium text-muted-foreground/50 leading-relaxed">
        {computable ? t('location.noIntelWithData') : t('location.noIntelNoCoords')}
      </p>
    </div>
  )
}

// ── Location summary + empty state (adaptive, single-column layout) ────────
// Adaptive Layout pass (2026-07-20). Rendered instead of the map+panel grid
// when there is confirmed zero nearby data anywhere. One full-width card
// holding the same real Overview sentence the has-data panel shows, beside
// the same honest empty state. Two peers side by side on medium+ screens,
// stacked on narrow ones.

export function LocationSummaryEmptyState({ computable }: { computable: boolean }) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6">
      <NoLocationDataState computable={computable} />
    </div>
  )
}

// ── Neighborhood panel (right column) ──────────────────────────────────────────
// UX Architecture / Adaptive Layout passes (2026-07-20). Fully data-driven
// and height-adaptive: no fixed sections, no placeholder cards. Only
// rendered at all while there's real content for it — the main component
// renders this alongside the map exactly when `nearbyPending || hasAnyData`
// is true, so once loading is done, `activeConfig`/`activeNearby` are
// guaranteed populated here; the "zero data anywhere" case is handled by
// `LocationSummaryEmptyState` instead of a branch inside this panel. There
// is no location score, safety index, or investment outlook anywhere here,
// because no such data exists in this stack; inventing one would be
// exactly the "fake statistics" the original audit pass exists to remove.

export function NeighborhoodPanel({
  activeNearby,
  activeConfig,
  loading,
}: {
  activeNearby: NearbyPlace[]
  activeConfig: { id: string; icon: LucideIcon } | null
  loading:      boolean
}) {
  const { t } = useTranslation('properties')
  return (
    <div className="col-span-12 lg:col-span-4 bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 flex flex-col gap-5">

      {/* Active filter detail — the selected tab's real results. A tab only
          ever appears in the filter bar above if it has ≥1 real result, so
          this list is never empty when rendered — no "no X found" tile. */}
      {loading ? (
        <div className="space-y-2">
          {[0, 1].map(i => <div key={i} className="h-11 rounded-xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : activeConfig && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <activeConfig.icon className="size-3.5 text-primary/70" />
            <h4 className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
              {t(`location.radiusLabels.${activeConfig.id}`)}
            </h4>
          </div>
          <div className="space-y-1">
            {activeNearby.map(place => (
              <div key={place.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-muted/8">
                <span className="text-[12.5px] font-bold text-foreground truncate">{place.name}</span>
                <span className="text-[10px] font-black text-muted-foreground/55 uppercase shrink-0 tabular-nums">
                  {formatDistance(place.distance)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
