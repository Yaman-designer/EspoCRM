import type { RealEstateProperty } from '../types/property.types'
import { buildOptionalRows, type Row, type PillTone } from '@/shared/detail-view'

// Semantic keys replace icon-component references — icon resolution (key →
// lucide component) is a presentation concern and lives in
// ConstructionSystemsCard.tsx now, not this ViewModel.
export type ConditionBadgeKey = 'needs-renovation' | 'renovated' | 'under-construction'
export type ClimateRowKey = 'heating-medium' | 'heating-type'

export interface ConditionBadgeViewModel {
  key: ConditionBadgeKey
  labelKey: string
  // Only the 'renovated' badge (when yearOfRenovation is known) needs
  // interpolation — ConstructionSystemsCard.tsx passes this straight
  // through to t(labelKey, labelParams).
  labelParams?: { year: number }
  tone: PillTone
}

export interface ClimateRowViewModel {
  key: ClimateRowKey
  labelKey: string
  value: string
}

export interface ConstructionViewModel {
  conditionBadges: ConditionBadgeViewModel[]
  furnishedRow: Row | null
  furnitureChips: string[]
  hasCondition: boolean
  climateRows: ClimateRowViewModel[]
  climateChips: string[]
  hasClimate: boolean
  materialsRows: Row[]
  hasDoubleGlass: boolean
  hasMaterials: boolean
  structuralRows: Row[]
  hasElectricalDevices: boolean
  hasStructural: boolean
  hasSecondaryRow: boolean
  isEmpty: boolean
}

type ConstructionFields = Pick<RealEstateProperty,
  | 'cUnderConstriction' | 'itNeedsRenovation' | 'renovated' | 'yearOfRenovation'
  | 'furnished' | 'cFurnitureElectricalAppliances'
  | 'cHeatingMedium' | 'cHeatingController' | 'cAdditionalheating'
  | 'frames' | 'door' | 'doubleGlass'
  | 'floorType' | 'bedroomsFloorType' | 'cStorageSpace' | 'cGarage' | 'hasElectricalDevices'
>

/**
 * Shapes ConstructionSystemsCard's four groups (Condition / Climate /
 * Materials / Structural). Boolean-flag visibility rules (every flag here
 * renders ONLY when true — see the component's original BOOLEAN STRATEGY
 * note) and the mutual-exclusivity of renovated/needs-renovation used to
 * live inline in the component.
 */
export function buildConstructionViewModel(property: ConstructionFields): ConstructionViewModel {
  const conditionBadges: ConditionBadgeViewModel[] = ([
    property.itNeedsRenovation === true && { key: 'needs-renovation' as const, labelKey: 'construction.badges.needsRenovation', tone: 'attention' as const },
    property.renovated === true && {
      key: 'renovated' as const,
      labelKey: property.yearOfRenovation != null ? 'construction.badges.renovatedInYear' : 'construction.badges.renovated',
      labelParams: property.yearOfRenovation != null ? { year: property.yearOfRenovation } : undefined,
      tone: 'positive' as const,
    },
    property.cUnderConstriction === true && { key: 'under-construction' as const, labelKey: 'construction.badges.underConstruction', tone: 'attention' as const },
  ] as Array<ConditionBadgeViewModel | false>).filter((b): b is ConditionBadgeViewModel => b !== false)

  const furnishedRow = property.furnished ? { labelKey: 'construction.rows.furnished', value: property.furnished } : null
  const furnitureChips = property.cFurnitureElectricalAppliances ?? []
  const hasCondition = conditionBadges.length > 0 || !!furnishedRow || furnitureChips.length > 0

  const climateRows: ClimateRowViewModel[] = [
    property.cHeatingMedium     && { key: 'heating-medium' as const, labelKey: 'construction.rows.heatingMedium', value: property.cHeatingMedium },
    property.cHeatingController && { key: 'heating-type' as const,   labelKey: 'construction.rows.heatingType',   value: property.cHeatingController },
  ].filter((r): r is ClimateRowViewModel => !!r)
  const climateChips = property.cAdditionalheating ?? []
  const hasClimate = climateRows.length > 0 || climateChips.length > 0

  const materialsRows = buildOptionalRows([
    !!property.frames             && { labelKey: 'construction.rows.frames',              value: property.frames },
    !!property.door                && { labelKey: 'construction.rows.door',                value: property.door },
    !!property.floorType            && { labelKey: 'construction.rows.floorType',          value: property.floorType },
    !!property.bedroomsFloorType     && { labelKey: 'construction.rows.bedroomsFloorType', value: property.bedroomsFloorType },
  ])
  const hasDoubleGlass = property.doubleGlass === true
  const hasMaterials = materialsRows.length > 0 || hasDoubleGlass

  const structuralRows = buildOptionalRows([
    !!property.cStorageSpace && { labelKey: 'construction.rows.warehouse',    value: property.cStorageSpace },
    !!property.cGarage        && { labelKey: 'construction.rows.parkingType', value: property.cGarage },
  ])
  const hasElectricalDevices = property.hasElectricalDevices === true
  const hasStructural = structuralRows.length > 0 || hasElectricalDevices

  return {
    conditionBadges,
    furnishedRow,
    furnitureChips,
    hasCondition,
    climateRows,
    climateChips,
    hasClimate,
    materialsRows,
    hasDoubleGlass,
    hasMaterials,
    structuralRows,
    hasElectricalDevices,
    hasStructural,
    hasSecondaryRow: hasMaterials || hasStructural,
    isEmpty: !hasCondition && !hasClimate && !hasMaterials && !hasStructural,
  }
}
