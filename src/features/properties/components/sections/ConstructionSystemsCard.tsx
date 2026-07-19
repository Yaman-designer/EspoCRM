import type { RealEstateProperty } from '../../types/property.types'

// Property Details Completion (2026-07-17). The Construction & Systems
// Wizard step's 17 fields (heating, frames, doors, flooring, storage,
// parking type, renovation state...) had no representation anywhere in the
// Details page and no existing card themed for construction/systems to
// extend. New minimal card matching the existing visual language.

interface ConstructionSystemsCardProps {
  property: Pick<RealEstateProperty,
    | 'cUnderConstriction' | 'itNeedsRenovation' | 'renovated' | 'yearOfRenovation'
    | 'furnished' | 'cFurnitureElectricalAppliances'
    | 'cHeatingMedium' | 'cHeatingController' | 'cAdditionalheating'
    | 'frames' | 'door' | 'doubleGlass'
    | 'floorType' | 'bedroomsFloorType' | 'cStorageSpace' | 'cGarage' | 'hasElectricalDevices'
  >
}

type TextRow = { label: string; value: string }

// IA Sprint 3 (2026-07-18). Previously one flat 10-field grid with no
// sub-grouping between heating, finishes, and storage/parking facts — the
// card's own logic already separated text/multi-enum/flag rows but never
// surfaced that structure to the reader. Now split into 3 labeled
// clusters; same fields, no data added or removed.
export function ConstructionSystemsCard({ property }: ConstructionSystemsCardProps) {
  const heatingRows: TextRow[] = [
    { label: 'Heating Medium', value: property.cHeatingMedium },
    { label: 'Heating Type',   value: property.cHeatingController },
  ].filter((r): r is TextRow => !!r.value)
  const heatingChips = property.cAdditionalheating ?? []

  const finishesRows: TextRow[] = [
    { label: 'Frames',              value: property.frames },
    { label: 'Door',                value: property.door },
    { label: 'Floor Type',          value: property.floorType },
    { label: 'Bedrooms Floor Type', value: property.bedroomsFloorType },
    { label: 'Warehouse',           value: property.cStorageSpace },
    { label: 'Parking Type',        value: property.cGarage },
  ].filter((r): r is TextRow => !!r.value)
  const finishesFlags: Array<{ label: string; value?: boolean }> = [
    { label: 'Double Glass',       value: property.doubleGlass },
    { label: 'Electrical Devices', value: property.hasElectricalDevices },
  ].filter(r => r.value != null)

  const conditionRows: TextRow[] = [
    { label: 'Furnished',          value: property.furnished },
    { label: 'Year of Renovation', value: property.yearOfRenovation != null ? String(property.yearOfRenovation) : undefined },
  ].filter((r): r is TextRow => !!r.value)
  const conditionFlags: Array<{ label: string; value?: boolean }> = [
    { label: 'Under Construction', value: property.cUnderConstriction },
    { label: 'Needs Renovation',   value: property.itNeedsRenovation },
    { label: 'Renovated',          value: property.renovated },
  ].filter(r => r.value != null)
  const conditionChips = property.cFurnitureElectricalAppliances ?? []

  const hasHeating   = heatingRows.length > 0 || heatingChips.length > 0
  const hasFinishes  = finishesRows.length > 0 || finishesFlags.length > 0
  const hasCondition = conditionRows.length > 0 || conditionFlags.length > 0 || conditionChips.length > 0

  if (!hasHeating && !hasFinishes && !hasCondition) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Construction &amp; Systems
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          Heating, finishes, and structural systems
        </p>
      </div>

      <div className="bg-card border border-border rounded-[24px] p-6 shadow-sm space-y-6">

        {hasHeating && (
          <div>
            <p className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">Heating &amp; Climate</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {heatingRows.map(row => (
                <div key={row.label}>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                  <div className="text-sm font-black text-foreground capitalize">{row.value}</div>
                </div>
              ))}
            </div>
            {heatingChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {heatingChips.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-muted/30 rounded-md border border-border/40 text-[10px] font-bold text-foreground/70 capitalize">{v}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {hasFinishes && (
          <div className={hasHeating ? 'border-t border-border/40 pt-5' : ''}>
            <p className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">Finishes</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {finishesRows.map(row => (
                <div key={row.label}>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                  <div className="text-sm font-black text-foreground capitalize">{row.value}</div>
                </div>
              ))}
            </div>
            {finishesFlags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {finishesFlags.map(row => (
                  <span key={row.label} className="px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70">
                    {row.label}: {row.value ? 'Yes' : 'No'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {hasCondition && (
          <div className={hasHeating || hasFinishes ? 'border-t border-border/40 pt-5' : ''}>
            <p className="text-[8px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-3">Condition</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {conditionRows.map(row => (
                <div key={row.label}>
                  <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{row.label}</div>
                  <div className="text-sm font-black text-foreground capitalize">{row.value}</div>
                </div>
              ))}
            </div>
            {conditionChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {conditionChips.map(v => (
                  <span key={v} className="px-2 py-0.5 bg-muted/30 rounded-md border border-border/40 text-[10px] font-bold text-foreground/70 capitalize">{v}</span>
                ))}
              </div>
            )}
            {conditionFlags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {conditionFlags.map(row => (
                  <span key={row.label} className="px-2.5 py-1 bg-muted/30 rounded-lg border border-border/40 text-[10px] font-bold text-foreground/70">
                    {row.label}: {row.value ? 'Yes' : 'No'}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
