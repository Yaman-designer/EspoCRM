import {
  Compass, Accessibility as AccessibilityIcon, Sun, Zap, TreePine,
  GraduationCap, Briefcase, Waves, Car, ArrowUpDown,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SectionHeader, TonePill } from '@/components/shared'
import type {
  AmenityKey, EnergyKey, FeaturesViewModel, OutdoorKey, SuitabilityKey,
} from '../../view-models/features.viewmodel'

// Property Details Completion (2026-07-17). The Outdoor, Building &
// Amenities Wizard step's 14 fields — the largest category with zero prior
// representation and no existing card themed for amenities/features.
//
// ── Features Intelligence UX Architecture pass (2026-07-20) ─────────────────
// FIX — real business groups, each rendered only when it has real data:
//  - Orientation, Building Amenities, Accessibility, Energy & Sustainability
//    are PRIMARY — badge/tile treatment, matching Construction & Systems'
//    badge language for visual-system consistency.
//  - Property Placement, Suitability, Outdoor Features are SECONDARY —
//    share a responsive row, lighter treatment.
//  - Lifestyle Features (the general features/additionalBenefits chip
//    cloud, minus the 2 values reclassified into Energy) is TERTIARY.
//
// Enterprise architecture pass (2026-07-23). Enum-code→label translation,
// the energy/lifestyle feature split, and every group's visibility rule
// used to live inline in this component; all of it now arrives pre-shaped
// via `FeaturesViewModel` (see view-models/features.viewmodel.ts).
// `FeatureBadge` is now the shared `TonePill` (verified identical markup
// against ConstructionSystemsCard's `ConditionBadge`) — icon resolution
// (key → lucide component) stays here.

const AMENITY_ICON: Record<AmenityKey, LucideIcon> = {
  'garage': Car,
  'building-elevator': ArrowUpDown,
  'elevator-rooms': ArrowUpDown,
  'internal-elevator': ArrowUpDown,
}

const ENERGY_ICON: Record<EnergyKey, LucideIcon> = { solar: Sun, other: Zap }

const OUTDOOR_ICON: Record<OutdoorKey, LucideIcon> = {
  'balcony': TreePine,
  'swimming-pool': Waves,
  'access-from': Compass,
}

const SUITABILITY_ICON: Record<SuitabilityKey, LucideIcon> = { students: GraduationCap, employees: Briefcase }

interface FeaturesAmenitiesCardProps {
  viewModel: FeaturesViewModel
}

export function FeaturesAmenitiesCard({ viewModel }: FeaturesAmenitiesCardProps) {
  const { t } = useTranslation('properties')
  const {
    orientationLabel, amenityBadges, hasAccessibility, energyBadges, placementChips,
    suitabilityBadges, outdoorRows, lifestyleChips,
    hasOrientation, hasAmenities, hasEnergy, hasPlacement, hasSuitability, hasOutdoor, hasLifestyle,
    hasPrimaryRow, hasSecondaryRow, isEmpty,
  } = viewModel

  if (isEmpty) return null

  return (
    <section className="space-y-4">
      <SectionHeader title={t('features.title')} subtitle={t('features.subtitle')} />

      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6 space-y-6">

        {/* PRIMARY — Orientation, Building Amenities, Accessibility, Energy
            & Sustainability. Each is its own labeled group, kept visually
            compact — a flex-wrap of small labeled clusters, not 4
            full-width rows. */}
        {hasPrimaryRow && (
          <div className="flex flex-wrap gap-x-8 gap-y-4">
            {hasOrientation && (
              <FactGroup heading={t('features.orientation')}>
                <TonePill icon={Compass} label={orientationLabel!} tone="neutral" />
              </FactGroup>
            )}
            {hasAmenities && (
              <FactGroup heading={t('features.buildingAmenities')}>
                <div className="flex flex-wrap gap-2">
                  {amenityBadges.map(b => <TonePill key={b.key} icon={AMENITY_ICON[b.key]} label={t(b.labelKey, b.labelParams)} tone="neutral" />)}
                </div>
              </FactGroup>
            )}
            {hasAccessibility && (
              <FactGroup heading={t('features.accessibility')}>
                <TonePill icon={AccessibilityIcon} label={t('features.disabledAccess')} tone="positive" />
              </FactGroup>
            )}
            {hasEnergy && (
              <FactGroup heading={t('features.energySustainability')}>
                <div className="flex flex-wrap gap-2">
                  {energyBadges.map(b => <TonePill key={b.label} icon={ENERGY_ICON[b.key]} label={b.label} tone="positive" />)}
                </div>
              </FactGroup>
            )}
          </div>
        )}

        {/* SECONDARY — Property Placement, Suitability, Outdoor Features.
            Capped at 2 columns (never 3): a fixed 3-column template with
            only 1-2 of these groups populated (the common case) reserves a
            permanently empty third column with visible dead space. */}
        {hasSecondaryRow && (
          <div className={cn(
            'grid grid-cols-1 sm:grid-cols-2 gap-6',
            hasPrimaryRow && 'border-t border-border/40 pt-5',
          )}>
            {hasPlacement && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t('features.propertyPlacement')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {placementChips.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-muted/30 rounded-md border border-border/40 text-[10px] font-bold text-foreground/70">{v}</span>
                  ))}
                </div>
              </div>
            )}
            {hasSuitability && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t('features.suitability')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suitabilityBadges.map(b => (
                    <TonePill key={b.key} icon={SUITABILITY_ICON[b.key]} label={t(b.labelKey)} tone="neutral" compact />
                  ))}
                </div>
              </div>
            )}
            {hasOutdoor && (
              <div>
                <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
                  {t('features.outdoorFeatures')}
                </p>
                <div className="space-y-2">
                  {outdoorRows.map(row => {
                    const Icon = OUTDOOR_ICON[row.key]
                    return (
                      <div key={row.key} className="flex items-center gap-2 text-[12px] font-bold text-foreground/80">
                        <Icon className="size-3.5 text-muted-foreground/50 shrink-0" />
                        <span className="text-muted-foreground/60 font-semibold">{t(row.labelKey)}:</span>
                        {row.value}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TERTIARY — Lifestyle Features. The one place a large chip
            collection remains — a tag cloud of minor amenities is exactly
            the case chips exist for. */}
        {hasLifestyle && (
          <div className={cn(
            (hasPrimaryRow || hasSecondaryRow) && 'border-t border-border/40 pt-5',
          )}>
            <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-3">
              {t('features.lifestyleFeatures')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {lifestyleChips.map(v => (
                <span key={v} className="px-2 py-0.5 bg-muted/20 rounded-md border border-border/30 text-[10px] font-semibold text-foreground/60">{v}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

// ── FactGroup — a small, self-contained labeled cluster ─────────────────────
// Content-hugging width (w-fit via the flex-wrap parent, not a stretched
// grid column). Kept local: used 4x within this one file, but no other
// section currently has a byte-identical instance to prove cross-file
// duplication.

function FactGroup({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
        {heading}
      </p>
      {children}
    </div>
  )
}
