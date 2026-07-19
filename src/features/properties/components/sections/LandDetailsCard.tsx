import { LandPlot } from 'lucide-react'
import type { RealEstateProperty } from '../../types/property.types'

// Property Details Completion (2026-07-17). The 14-field Land Details
// cluster from location-zoning.schema.ts — visible only when category =
// 'Land', same visibility rule as the Wizard's own LAND_CATEGORY condition
// (see domain/visibility.ts). No existing Details card has a zoning/parcel
// theme to extend, so this is a new, minimal card matching the existing
// visual language, rendered only for Land-category listings.

interface LandDetailsCardProps {
  property: Pick<RealEstateProperty,
    | 'category'
    | 'cBuildingBlocks' | 'cFrontLength' | 'cHeightFactor' | 'cRemainingBuild' | 'cBuildingFactor'
    | 'cCoverageFactor' | 'cStructureFactor'
    | 'cCityplan' | 'cResidentialArea' | 'cFacade' | 'cBuildingPermit' | 'cAgriculturalUse' | 'cContainsBuilding'
    | 'cSlope'
  >
}

export function LandDetailsCard({ property }: LandDetailsCardProps) {
  if (property.category !== 'Land') return null

  const numberRows: Array<{ label: string; value: number | undefined }> = [
    { label: 'Building Blocks',  value: property.cBuildingBlocks },
    { label: 'Front Length',     value: property.cFrontLength },
    { label: 'Height Factor',    value: property.cHeightFactor },
    { label: 'Remaining Build',  value: property.cRemainingBuild },
    { label: 'Building Factor',  value: property.cBuildingFactor },
    { label: 'Coverage Factor',  value: property.cCoverageFactor },
    { label: 'Structure Factor', value: property.cStructureFactor },
  ].filter(r => r.value != null)

  const flagRows: Array<{ label: string; value: boolean | undefined }> = [
    { label: 'City Plan',         value: property.cCityplan },
    { label: 'Residential Area',  value: property.cResidentialArea },
    { label: 'Facade',            value: property.cFacade },
    { label: 'Building Permit',   value: property.cBuildingPermit },
    { label: 'Agricultural Use',  value: property.cAgriculturalUse },
    { label: 'Contains Building', value: property.cContainsBuilding },
  ].filter(r => r.value != null)

  if (numberRows.length === 0 && flagRows.length === 0 && !property.cSlope) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Land Details
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          Zoning and parcel facts specific to this Land listing
        </p>
      </div>

      <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm space-y-6">
        {(numberRows.length > 0 || property.cSlope) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {numberRows.map(row => (
              <div key={row.label}>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                <div className="text-sm font-black text-foreground">{row.value}</div>
              </div>
            ))}
            {property.cSlope && (
              <div>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Slope</div>
                <div className="text-sm font-black text-foreground capitalize">{property.cSlope}</div>
              </div>
            )}
          </div>
        )}

        {flagRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-5">
            {flagRows.map(row => (
              <span
                key={row.label}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70"
              >
                <LandPlot className="size-2.5 text-muted-foreground/50" />
                {row.label}: {row.value ? 'Yes' : 'No'}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
