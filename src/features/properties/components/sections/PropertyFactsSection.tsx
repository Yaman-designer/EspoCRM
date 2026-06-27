import { Fragment } from 'react'
import { BedDouble, Bath, Maximize2, Car, Ruler, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SectionPlaceholder } from '../PropertyPlaceholders'
import type { FeatureGroup } from '../../lib/property-feature-mapper'
import type { RealEstateProperty } from '../../types/property.types'

type IconComp = React.ComponentType<{ className?: string }>

interface PropertyFactsSectionProps {
  property:           RealEstateProperty
  displayName:        string
  narrativeHeadline?: string | null
  displayLocation:    string
  featureGroups:      FeatureGroup[]
  onEdit:             () => void
}

export function PropertyFactsSection({
  property,
  displayName,
  narrativeHeadline,
  displayLocation,
  featureGroups,
  onEdit,
}: PropertyFactsSectionProps) {
  const { type, purpose, yearBuilt, floor, furnished, addressCity, bedroomCount, bathroomCount, square, parkingCount } = property

  type StatEntry = { icon: IconComp; value: string | number; label: string }
  const physicalStats: StatEntry[] = []
  if (bedroomCount  != null) physicalStats.push({ icon: BedDouble, value: bedroomCount,                    label: 'Bedrooms'    })
  if (bathroomCount != null) physicalStats.push({ icon: Bath,      value: bathroomCount,                   label: 'Bathrooms'   })
  if (square        != null) physicalStats.push({ icon: Maximize2, value: `${square.toLocaleString()} m²`, label: 'Living Area' })
  if (parkingCount  != null) physicalStats.push({ icon: Car,       value: parkingCount,                    label: 'Parking'     })

  const secondaryAttrs = [
    type,
    purpose,
    yearBuilt != null ? `Built ${yearBuilt}` : null,
    floor     != null ? `Floor ${floor}`      : null,
    furnished != null ? (furnished ? 'Furnished' : 'Unfurnished') : null,
    addressCity        || null,
  ].filter((v): v is string => Boolean(v))

  return (
    <>
      {/* ── Property identity header ── */}
      <div className="mt-12 px-1">
        <h2 className="text-[22px] font-semibold leading-[1.15] tracking-tight text-foreground">
          {displayName}
        </h2>

        {narrativeHeadline && (
          <p className="mt-1 text-[13px] font-light italic tracking-wide text-foreground/55">
            {narrativeHeadline}
          </p>
        )}

        {displayLocation && (
          <p className={cn('text-[11px] font-normal uppercase tracking-[0.18em] text-muted-foreground/55', narrativeHeadline ? 'mt-1.5' : 'mt-2')}>
            {displayLocation}
          </p>
        )}

        <div className="my-5 h-px bg-border/18" />

        {physicalStats.length > 0 ? (
          <div className="flex flex-wrap items-start gap-x-8 gap-y-4 md:gap-x-12">
            {physicalStats.map((stat, i) => (
              <Fragment key={stat.label}>
                {i > 0 && (
                  <div className="mt-1.5 hidden h-6 w-px self-start bg-border/22 md:block" />
                )}
                <div>
                  <p className="text-[26px] font-black leading-none tabular-nums tracking-[-0.03em] text-foreground">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.22em] text-muted-foreground/55">
                    {stat.label}
                  </p>
                </div>
              </Fragment>
            ))}
          </div>
        ) : (
          <SectionPlaceholder
            icon={Ruler}
            label="No specifications available"
            hint="Add bedrooms, bathrooms, and area to complete this listing."
            action="Add specifications"
            onAction={onEdit}
          />
        )}

        {secondaryAttrs.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
            {secondaryAttrs.map((val, i) => (
              <Fragment key={val}>
                {i > 0 && (
                  <span className="text-[11px] text-muted-foreground/30">·</span>
                )}
                <span className="text-[12px] font-medium text-muted-foreground/58">{val}</span>
              </Fragment>
            ))}
          </div>
        )}

        <div className="mt-5 h-px bg-border/18" />
      </div>

      {/* ── Features & Amenities ── */}
      <div className="mt-6 px-1">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
          Features &amp; Amenities
        </p>

        {featureGroups.length > 0 ? (
          <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-12">
            {featureGroups.map(group => (
              <div key={group.id}>
                <p className="mb-2.5 text-[9.5px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                  {group.label}
                </p>
                <ul className="space-y-2">
                  {group.features.map(f => (
                    <li key={f} className="flex items-baseline gap-2.5">
                      <span className="shrink-0 text-[11px] text-foreground/30">—</span>
                      <span className="text-[13px] font-light text-foreground/75">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <SectionPlaceholder
            icon={Home}
            label="No features recorded"
            hint="Add amenities and features to help buyers understand what's included."
            action="Add features"
            onAction={onEdit}
          />
        )}
      </div>
    </>
  )
}
