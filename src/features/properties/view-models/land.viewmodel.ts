import type { RealEstateProperty } from '../types/property.types'
import { buildOptionalRows, type Row } from '@/shared/detail-view'

export interface LandViewModel {
  numberRows: Row[]
  slopeValue: string | null
  // Enterprise Localization pass (2026-07-24): was `flagLabels: string[]`
  // (literal display text) — these name what a true boolean flag MEANS
  // ("City Plan", "Building Permit"...), static UI copy, not API data, so
  // they became i18next keys instead; LandDetailsCard.tsx resolves them.
  flagKeys: string[]
  isVisible: boolean
  isEmpty: boolean
}

type LandFields = Pick<RealEstateProperty,
  | 'category'
  | 'cBuildingBlocks' | 'cFrontLength' | 'cHeightFactor' | 'cRemainingBuild' | 'cBuildingFactor'
  | 'cCoverageFactor' | 'cStructureFactor'
  | 'cCityplan' | 'cResidentialArea' | 'cFacade' | 'cBuildingPermit' | 'cAgriculturalUse' | 'cContainsBuilding'
  | 'cSlope'
>

/**
 * Shapes LandDetailsCard — visible only for Land-category listings, same
 * visibility rule as the Wizard's own LAND_CATEGORY condition
 * (domain/visibility.ts). Every boolean flag renders ONLY when true (a
 * property that simply isn't on a city plan is the ordinary case, not
 * worth a "No" badge — same BOOLEAN STRATEGY Construction & Systems uses).
 */
export function buildLandViewModel(property: LandFields): LandViewModel {
  if (property.category !== 'Land') {
    return { numberRows: [], slopeValue: null, flagKeys: [], isVisible: false, isEmpty: true }
  }

  const numberRows = buildOptionalRows([
    property.cBuildingBlocks  != null && { labelKey: 'land.rows.buildingBlocks',  value: String(property.cBuildingBlocks) },
    property.cFrontLength     != null && { labelKey: 'land.rows.frontLength',     value: String(property.cFrontLength) },
    property.cHeightFactor    != null && { labelKey: 'land.rows.heightFactor',    value: String(property.cHeightFactor) },
    property.cRemainingBuild  != null && { labelKey: 'land.rows.remainingBuild',  value: String(property.cRemainingBuild) },
    property.cBuildingFactor  != null && { labelKey: 'land.rows.buildingFactor',  value: String(property.cBuildingFactor) },
    property.cCoverageFactor  != null && { labelKey: 'land.rows.coverageFactor',  value: String(property.cCoverageFactor) },
    property.cStructureFactor != null && { labelKey: 'land.rows.structureFactor', value: String(property.cStructureFactor) },
  ])

  const flagKeys = ([
    property.cCityplan         === true && 'land.flags.cityPlan',
    property.cResidentialArea  === true && 'land.flags.residentialArea',
    property.cFacade           === true && 'land.flags.facade',
    property.cBuildingPermit   === true && 'land.flags.buildingPermit',
    property.cAgriculturalUse  === true && 'land.flags.agriculturalUse',
    property.cContainsBuilding === true && 'land.flags.containsBuilding',
  ] as Array<string | false>).filter((v): v is string => !!v)

  const slopeValue = property.cSlope ?? null

  return {
    numberRows,
    slopeValue,
    flagKeys,
    isVisible: true,
    isEmpty: numberRows.length === 0 && flagKeys.length === 0 && !slopeValue,
  }
}
