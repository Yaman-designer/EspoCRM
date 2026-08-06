'use client'

import { Flame, Thermometer, HardHat, Sparkles, Wrench, Layers, Zap, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SectionHeader, TonePill } from '@/components/shared'
import type {
  ClimateRowKey, ClimateRowViewModel, ConditionBadgeKey, ConditionBadgeViewModel, ConstructionViewModel,
} from '../../view-models/construction.viewmodel'

// Property Details Completion (2026-07-17). The Construction & Systems
// Wizard step's 17 fields (heating, frames, doors, flooring, storage,
// parking type, renovation state...) had no representation anywhere in the
// Details page and no existing card themed for construction/systems to
// extend. New minimal card matching the existing visual language.
//
// ── Construction & Systems UX Architecture pass (2026-07-20) ────────────────
// PROBLEM: every field got the identical label/value treatment, an equally-
// sized grid cell no matter how load-bearing the fact was to a buyer.
// FIX — real hierarchy, not just restyling: Construction Condition and
// Climate Systems (the facts a buyer decides on) are PRIMARY — semantic
// status badges for condition, icon tiles for heating. Building Materials
// and Structural Features (frames, floor type, storage, parking) are
// SECONDARY — compact definition-list rows.
//
// BOOLEAN STRATEGY: every boolean flag in this card renders ONLY when true —
// a property that is NOT mid-construction, does NOT need renovation, and
// has NO double glazing is the ordinary, unremarkable case for real
// listings. Renovated and Needs Renovation are mutually exclusive in this
// data model, so at most one condition-status badge from that pair ever
// renders.
//
// Enterprise architecture pass (2026-07-23). Badge/row visibility rules and
// field selection used to live inline in this component; all of it now
// arrives pre-shaped via `ConstructionViewModel` (see
// view-models/construction.viewmodel.ts). `ConditionBadge` is now the
// shared `TonePill` (verified identical markup against FeaturesAmenitiesCard's
// `FeatureBadge`) — icon resolution (key → lucide component) stays here.

const CONDITION_ICON: Record<ConditionBadgeKey, LucideIcon> = {
  'needs-renovation': Wrench,
  'renovated': Sparkles,
  'under-construction': HardHat,
}

const CLIMATE_ICON: Record<ClimateRowKey, LucideIcon> = {
  'heating-medium': Flame,
  'heating-type': Thermometer,
}

interface ConstructionSystemsCardProps {
  viewModel: ConstructionViewModel
}

export function ConstructionSystemsCard({ viewModel }: ConstructionSystemsCardProps) {
  const { t } = useTranslation('properties')
  const {
    conditionBadges, furnishedRow, furnitureChips, hasCondition,
    climateRows, climateChips, hasClimate,
    materialsRows, hasDoubleGlass, hasMaterials,
    structuralRows, hasElectricalDevices, hasStructural,
    hasSecondaryRow, isEmpty,
  } = viewModel

  if (isEmpty) return null

  return (
    <section className="space-y-4">
      <SectionHeader title={t('construction.title')} subtitle={t('construction.subtitle')} />

      {/* Enterprise Product Review pass (2026-07-23): card recipe migrated
          from the legacy `rounded-[24px] border-border shadow-sm` "Stitch"
          scaffold to the recipe shared by every other card on this page. */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 space-y-6">

        {/* PRIMARY — Construction Condition. Semantic status badges, not
            equal-weight text rows: a reader should clock "Renovated in
            2022" or "Needs Renovation" the instant they scan the card. */}
        {hasCondition && (
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
              {t('construction.constructionCondition')}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              {conditionBadges.map((badge: ConditionBadgeViewModel) => (
                <TonePill key={badge.key} icon={CONDITION_ICON[badge.key]} label={t(badge.labelKey, badge.labelParams)} tone={badge.tone} />
              ))}
              {/* Attribute chips — deliberately `rounded-full` (a tag shape)
                  where status badges above are `rounded-lg` (TonePill's
                  badge shape): status vs. attribute reads from silhouette
                  alone, not just tone/icon, so it still holds for anyone
                  who can't rely on color. */}
              {furnishedRow && (
                <span className="px-3 py-1.5 bg-muted/25 rounded-full border border-border/35 text-[11px] font-semibold text-foreground/70">
                  {t(furnishedRow.labelKey)}: <span className="font-bold text-foreground/85">{furnishedRow.value}</span>
                </span>
              )}
              {furnitureChips.map(v => (
                <span key={v} className="px-3 py-1.5 bg-muted/25 rounded-full border border-border/35 text-[11px] font-semibold text-foreground/70 capitalize">
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* PRIMARY — Climate Systems. Icon tiles, same icon-chip/quiet-label/
            bold-value recipe as Financial Intelligence's SnapshotKpi so this
            reads as part of the same dashboard system — see SystemTile's own
            comment below for why the hover lift that recipe originally
            carried doesn't apply here. */}
        {hasClimate && (
          <div className={hasCondition ? 'border-t border-border/40 pt-5' : ''}>
            <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
              {t('construction.climateSystems')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
              {climateRows.map((row: ClimateRowViewModel) => (
                <SystemTile key={row.key} icon={CLIMATE_ICON[row.key]} label={t(row.labelKey)} value={row.value} />
              ))}
            </div>
            {climateChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {climateChips.map(v => (
                  <span key={v} className="px-2.5 py-0.5 bg-muted/25 rounded-full border border-border/35 text-[10px] font-semibold text-foreground/70 capitalize">{v}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECONDARY — Building Materials + Structural Features. Compact
            definition-list rows, grouped inside one soft recessed surface
            per group (bg-muted/20, no shadow) — deliberately lighter weight
            than Condition/Climate above, which get real elevation (badges,
            shadow-design-xs tiles). Not the shared `InfoRow` primitive:
            verified against Land Details/Specs' row recipe and this one
            uses a different value treatment (13.5px/black/capitalize vs.
            sm/black) — a real, checked difference, not merged away. */}
        {hasSecondaryRow && (
          <div className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-6',
            (hasCondition || hasClimate) && 'border-t border-border/40 pt-5',
          )}>
            {hasMaterials && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t('construction.buildingMaterials')}
                </p>
                {/* Grouped, recessed surface — not per-row cards (would add
                    clutter for a SECONDARY tier) and not bare floating text
                    (read as a spreadsheet). One soft tinted container per
                    group is the minimum treatment that makes each group
                    read as intentional. */}
                <div className="rounded-xl border border-border/25 bg-muted/20 p-4">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                    {materialsRows.map(row => (
                      <div key={row.labelKey}>
                        <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">{t(row.labelKey)}</div>
                        <div className="text-[13.5px] font-black text-foreground capitalize leading-snug">{row.value}</div>
                      </div>
                    ))}
                  </div>
                  {hasDoubleGlass && (
                    <IconFact icon={Layers} label={t('construction.doubleGlass')} className="mt-3.5" />
                  )}
                </div>
              </div>
            )}

            {hasStructural && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t('construction.structuralFeatures')}
                </p>
                <div className="rounded-xl border border-border/25 bg-muted/20 p-4">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
                    {structuralRows.map(row => (
                      <div key={row.labelKey}>
                        <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">{t(row.labelKey)}</div>
                        <div className="text-[13.5px] font-black text-foreground capitalize leading-snug">{row.value}</div>
                      </div>
                    ))}
                  </div>
                  {hasElectricalDevices && (
                    <IconFact icon={Zap} label={t('construction.electricalDevicesIncluded')} className="mt-3.5" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  )
}

// ── SystemTile — primary-weight icon/label/value tile ───────────────────────
// Deliberately the same recipe as Financial Intelligence's price/m² cluster
// so Construction & Systems reads as the same dashboard system. Kept local:
// no other file currently has a byte-identical instance of this exact tile
// shape to prove cross-file duplication (OperationsCommandHub's
// `ActivityStat` is a different, vertical icon/count/label shape) — see the
// framework completion report's primitive-extraction notes.
//
// Visual-hierarchy pass (2026-07-25): these tiles are read-only facts — no
// onClick, no href, nothing to activate — so the hover lift + one-off
// `shadow-[0_4px_16px...]` this used to carry are gone, per this pass's own
// interaction rule (informational-only cards don't get hover effects).
// Perceived quality now comes from a static `shadow-design-xs` (a real
// token, not an arbitrary value) plus a touch more icon prominence
// (size-8→9 chip, text-primary/70→primary), not from a lift-on-hover cue
// for interaction that never actually happens.
function SystemTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0 rounded-xl border border-border/40 bg-card shadow-design-xs px-4 py-3.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="size-4.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-muted-foreground/55 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-[14px] font-black tracking-tight text-foreground capitalize leading-snug">{value}</p>
      </div>
    </div>
  )
}

// ── IconFact — a single true boolean surfaced as an icon + label ───────────

function IconFact({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 text-[11.5px] font-bold text-foreground/80', className)}>
      <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-emerald/10">
        <Icon className="size-3.5 text-brand-emerald" />
      </div>
      {label}
    </div>
  )
}
