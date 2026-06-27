import { PropertyLocationCard } from '../PropertyLocationCard'
import type { RealEstateProperty } from '../../types/property.types'

interface PropertyLocationSectionProps {
  property:           RealEstateProperty
  locationNarrative?: string | null
}

export function PropertyLocationSection({ property, locationNarrative }: PropertyLocationSectionProps) {
  return (
    <div className="mt-8 border-t border-border/12 pt-6">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
        Location Intelligence
      </p>

      {locationNarrative && (
        <p className="mb-5 max-w-165 text-[14px] font-light leading-[1.65] text-foreground/65">
          {locationNarrative}
        </p>
      )}

      <PropertyLocationCard property={property} />
    </div>
  )
}
