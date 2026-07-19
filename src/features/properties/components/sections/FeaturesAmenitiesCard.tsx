import type { RealEstateProperty } from '../../types/property.types'

// Property Details Completion (2026-07-17). The Outdoor, Building &
// Amenities Wizard step's 14 fields — the largest category with zero prior
// representation and no existing card themed for amenities/features.

interface FeaturesAmenitiesCardProps {
  property: Pick<RealEstateProperty,
    | 'balcony' | 'swimmingPool' | 'accessFrom' | 'cOrientation' | 'garage'
    | 'buildingElevator' | 'buildingElevatorRooms' | 'internalElevator' | 'hasDisabledAccess'
    | 'idealForStudents' | 'idealForEmployees'
    | 'cPlacement' | 'features' | 'additionalBenefits'
  >
}

export function FeaturesAmenitiesCard({ property }: FeaturesAmenitiesCardProps) {
  const flagRows: Array<{ label: string; value?: boolean }> = [
    { label: 'Balcony',              value: property.balcony },
    { label: 'Building Elevator',    value: property.buildingElevator },
    { label: 'Elevator in Rooms',    value: property.buildingElevatorRooms },
    { label: 'Internal Elevator',    value: property.internalElevator },
    { label: 'Disabled Access',      value: property.hasDisabledAccess },
    { label: 'Ideal for Students',   value: property.idealForStudents },
    { label: 'Ideal for Employees',  value: property.idealForEmployees },
  ].filter((r): r is { label: string; value: boolean } => r.value != null)

  const textRows: Array<{ label: string; value?: string }> = [
    { label: 'Swimming Pool', value: property.swimmingPool },
    { label: 'Access From',   value: property.accessFrom },
    { label: 'Orientation',   value: property.cOrientation },
    { label: 'Garage',        value: property.garage },
  ].filter((r): r is { label: string; value: string } => !!r.value)

  const multiEnumRows: Array<{ label: string; values?: string[] }> = [
    { label: 'Features',             values: property.features },
    { label: 'Additional Benefits',  values: property.additionalBenefits },
    { label: 'Placement',            values: property.cPlacement },
  ].filter(r => r.values && r.values.length > 0)

  if (flagRows.length === 0 && textRows.length === 0 && multiEnumRows.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Features &amp; Amenities
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          Outdoor space, building amenities, and lifestyle fit
        </p>
      </div>

      <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm space-y-6">
        {textRows.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {textRows.map(row => (
              <div key={row.label}>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                <div className="text-sm font-black text-foreground capitalize">{row.value}</div>
              </div>
            ))}
          </div>
        )}

        {multiEnumRows.length > 0 && (
          <div className="space-y-3 border-t border-border/40 pt-5">
            {multiEnumRows.map(row => (
              <div key={row.label}>
                <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">{row.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {row.values!.map(v => (
                    <span key={v} className="px-2 py-0.5 bg-muted/30 rounded-md border border-border/40 text-[10px] font-bold text-foreground/70 capitalize">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {flagRows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-5">
            {flagRows.map(row => (
              <span key={row.label} className="px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70">
                {row.label}: {row.value ? 'Yes' : 'No'}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
