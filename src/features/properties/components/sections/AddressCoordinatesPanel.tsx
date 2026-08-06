'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { SectionHeader } from '@/components/shared'
import type { AddressCoordinatesViewModel } from '../../view-models/location.viewmodel'

// Property Details Completion (2026-07-17). Distinct from the map on
// LocationIntelligenceCenter: the map plots geocoded coordinates derived
// from location NAMES (usePropertyLocation), while this panel shows the
// Wizard's own stored addressLatitude/addressLongitude fields directly — the
// two can differ, and this is the only place either the raw address
// components or the stored coordinates are exposed at all. "Open in Google
// Maps" and "Copy Coordinates" both act on the stored fields, not the
// derived ones.
//
// IA Sprint 3 (2026-07-18): split out of LocationIntelligenceCenter.tsx into
// its own top-level card in PropertyDetailView. The two serve different
// reading modes — spatial/exploratory (the map) versus factual/scannable
// (address, coordinates, distances) — and had grown into the single tallest
// scroll segment on the page as one combined card.
//
// Enterprise architecture pass (2026-07-23). Now its own file (was a second
// component living inside LocationIntelligenceCenter.tsx) with field
// selection, the address-garbage filter, and distances/facts row-building
// moved to `buildAddressCoordinatesViewModel` (view-models/location.viewmodel.ts).
// Also retrofitted to the container-builds-ViewModel pattern: this component
// takes the already-built `AddressCoordinatesViewModel`, never
// `RealEstateProperty` — PropertyDetailView.tsx now owns the
// `buildAddressCoordinatesViewModel(property)` call, consistent with
// Financial/Timeline/Operations/Assets.

export function AddressCoordinatesPanel({ data }: { data: AddressCoordinatesViewModel }) {
  const { t } = useTranslation('properties')
  const { addressLine, hasCoords, latitude, longitude, geocodeType, distances, facts, isEmpty } = data
  const { copied, copy } = useCopyToClipboard()

  function copyCoordinates() {
    if (!hasCoords) return
    void copy(`${latitude}, ${longitude}`)
  }

  if (isEmpty) return null

  return (
    <section className="space-y-4">
      <SectionHeader title={t('location.addressCoordinates.title')} subtitle={t('location.addressCoordinates.subtitle')} />

      {/* Card recipe migrated off the legacy "Stitch" scaffold to match
          Financial Intelligence et al. — see ConstructionSystemsCard's own
          note on this same pass for the full rationale. */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-6">

      {/* UX Architecture pass (2026-07-20): grid column count now follows
          what's actually there. Distances is the one genuinely optional
          slot of the three (a variable-length list, not a single fact) —
          a fixed 3-column grid left a whole empty column's width of dead
          space beside Address/Coordinates whenever a property had no
          distance data at all. Address and Coordinates still always
          occupy their own slot (with a neutral placeholder when empty,
          matching this page's Required-field pattern), they just split 2
          columns instead of 3 when Distances isn't rendering one.
          Typography aligned to the same 9px/font-semibold/tracking-widest
          label convention Financial Intelligence and Location
          Intelligence already use elsewhere on this exact page. */}
      <div className={cn('grid grid-cols-1 gap-6', distances.length > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>

        {/* Address */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">{t('location.addressCoordinates.address')}</p>
          {addressLine ? (
            <p className="text-sm font-bold text-foreground leading-snug">{addressLine}</p>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground/40">{t('common.notProvided')}</p>
          )}
        </div>

        {/* Coordinates — deliberately the same visual weight as Address,
            not louder: supporting metadata, not the headline fact. */}
        <div>
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">
            {t('location.addressCoordinates.coordinates')}{geocodeType ? ` · ${geocodeType}` : ''}
          </p>
          {hasCoords ? (
            <>
              <p className="text-sm font-bold text-foreground tabular-nums mb-2">
                {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-wide text-primary hover:underline"
                >
                  {t('location.addressCoordinates.openInGoogleMaps')}
                </a>
                <span className="text-border">·</span>
                <button
                  type="button"
                  onClick={copyCoordinates}
                  className="text-[10px] font-black uppercase tracking-wide text-muted-foreground hover:text-foreground"
                >
                  {copied ? t('common.copied') : t('location.addressCoordinates.copyCoordinates')}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm font-semibold text-muted-foreground/40">{t('common.notProvided')}</p>
          )}
        </div>

        {/* Distances */}
        {distances.length > 0 && (
          <div>
            <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2">{t('location.addressCoordinates.distances')}</p>
            <div className="space-y-1">
              {distances.map(d => (
                <p key={d.labelKey} className="text-xs font-semibold text-foreground/80">
                  {t(d.labelKey)}: <span className="tabular-nums">{d.value}</span> {t('location.addressCoordinates.km')}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zoning / view facts — a real label above the chip row so it reads
          as its own grouped section instead of an orphaned row of tags
          under an unrelated divider. flex-wrap already lets chips wrap
          naturally at any width; nothing here can clip or overflow. */}
      {facts.length > 0 && (
        <div className="mt-5 pt-5 border-t border-border/40">
          <p className="text-[9px] font-semibold text-muted-foreground/50 uppercase tracking-widest mb-2.5">
            {t('location.addressCoordinates.additionalDetails')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {facts.map(f => (
              <span key={f.labelKey} className="px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70">
                {t(f.labelKey)}: {f.value}
              </span>
            ))}
          </div>
        </div>
      )}
      </div>
    </section>
  )
}
