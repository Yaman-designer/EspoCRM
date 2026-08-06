import type { RealEstateProperty } from '../types/property.types'
import { buildOptionalRows, type Row } from '@/shared/detail-view'

// Semantic keys replace icon-component references that used to live inline
// in the strip's `specs` array — icon *resolution* (key → lucide component)
// is a presentation concern and lives in PropertySpecsBar.tsx now.
export type SpecKey = 'bedrooms' | 'bathrooms' | 'area' | 'floor' | 'yearBuilt' | 'energyClass' | 'condition'

export interface SpecItemViewModel {
  key: SpecKey
  // Enterprise Localization pass (2026-07-24): `value` templates (e.g. "3
  // Bedrooms", "Floor 2 of 5") are NOT translated in this pass — flagged as
  // a follow-up, not guessed at here. Doing it correctly means
  // PropertySpecsBar.tsx building each string via t() with the right
  // interpolation per key (count/floor/total), a bigger reshape of this
  // interface than this pass's time budget covers; `sub` below (a pure
  // static label, no interpolation) is fixed now since it's the
  // straightforward case.
  value: string
  subKey: string
  /** Only the Energy Class tile gets the emerald "stands out" treatment. */
  emphasize?: boolean
}

export interface SpecGroupViewModel {
  headingKey: string
  rows: Row[]
}

export interface SpecsViewModel {
  items: SpecItemViewModel[]
  fullSpecGroups: SpecGroupViewModel[]
  isEmpty: boolean
}

type SpecsFields = Pick<RealEstateProperty,
  | 'bedroomCount' | 'bathroomCount' | 'square' | 'floor' | 'floorCount' | 'yearBuilt' | 'energyClass' | 'cCondition'
  | 'plotArea' | 'balconyArea' | 'facadeLength' | 'livingRooms' | 'additionalLivingRooms' | 'kitchens'
  | 'cMasterrooms' | 'cLivingkitchens' | 'cHalfBathrooms' | 'floorKey' | 'lastFloor' | 'penthouse' | 'parkingSpaces'
>

/**
 * Shapes both the visible Quick Specifications strip and the Full
 * Specifications modal's grouped rows. Field selection, the combined
 * "Floor X of Y" display rule, and the 4-group taxonomy (Dimensions/Rooms/
 * Building & Construction/Parking) all used to live inline in the component.
 */
export function buildSpecsViewModel(property: SpecsFields): SpecsViewModel {
  const { bedroomCount, bathroomCount, square, floor, floorCount, yearBuilt, energyClass, cCondition } = property

  const floorValue =
    floor != null && floorCount != null ? `Floor ${floor} of ${floorCount}` :
    floor != null                       ? `Floor ${floor}` :
    floorCount != null                  ? `${floorCount} Floors` :
    null

  const items: SpecItemViewModel[] = ([
    bedroomCount != null && { key: 'bedrooms' as const,  value: `${bedroomCount} Bedrooms`, subKey: 'specs.items.bedrooms.sub' },
    bathroomCount != null && { key: 'bathrooms' as const, value: `${bathroomCount} Baths`,   subKey: 'specs.items.bathrooms.sub' },
    square != null && { key: 'area' as const, value: `${square.toLocaleString('en-US')} m²`, subKey: 'specs.items.area.sub' },
    !!floorValue && { key: 'floor' as const, value: floorValue, subKey: 'specs.items.floor.sub' },
    yearBuilt != null && { key: 'yearBuilt' as const, value: String(yearBuilt), subKey: 'specs.items.yearBuilt.sub' },
    energyClass ? { key: 'energyClass' as const, value: energyClass, subKey: 'specs.items.energyClass.sub', emphasize: true } : false,
    cCondition != null && { key: 'condition' as const, value: `${cCondition} / 5`, subKey: 'specs.items.condition.sub' },
  ] as Array<SpecItemViewModel | false>).filter((s): s is SpecItemViewModel => s !== false)

  const {
    plotArea, balconyArea, facadeLength, cHalfBathrooms, livingRooms,
    additionalLivingRooms, kitchens, cMasterrooms, cLivingkitchens, parkingSpaces,
    floorKey, lastFloor, penthouse,
  } = property

  const fullSpecGroups: SpecGroupViewModel[] = [
    {
      headingKey: 'specs.groups.dimensions',
      rows: buildOptionalRows([
        plotArea     != null && { labelKey: 'specs.rows.plotArea',     value: `${plotArea.toLocaleString('en-US')} m²` },
        balconyArea  != null && { labelKey: 'specs.rows.balconyArea',  value: `${balconyArea.toLocaleString('en-US')} m²` },
        facadeLength != null && { labelKey: 'specs.rows.facadeLength', value: String(facadeLength) },
      ]),
    },
    {
      headingKey: 'specs.groups.rooms',
      rows: buildOptionalRows([
        livingRooms           != null && { labelKey: 'specs.rows.livingRooms',            value: String(livingRooms) },
        additionalLivingRooms != null && { labelKey: 'specs.rows.additionalLivingRooms', value: String(additionalLivingRooms) },
        kitchens               != null && { labelKey: 'specs.rows.kitchens',               value: String(kitchens) },
        cMasterrooms            != null && { labelKey: 'specs.rows.masterRooms',           value: String(cMasterrooms) },
        cLivingkitchens          != null && { labelKey: 'specs.rows.livingKitchens',        value: String(cLivingkitchens) },
        cHalfBathrooms            != null && { labelKey: 'specs.rows.halfBathrooms',   value: String(cHalfBathrooms) },
      ]),
    },
    {
      headingKey: 'specs.groups.buildingConstruction',
      rows: buildOptionalRows([
        floorKey  != null && { labelKey: 'specs.rows.floorKey',  value: String(floorKey) },
        lastFloor != null && { labelKey: 'specs.rows.lastFloor', value: lastFloor ? 'Yes' : 'No' },
        penthouse != null && { labelKey: 'specs.rows.penthouse',  value: penthouse ? 'Yes' : 'No' },
      ]),
    },
    {
      headingKey: 'specs.groups.parking',
      rows: buildOptionalRows([
        parkingSpaces != null && { labelKey: 'specs.rows.parkingSpaces', value: String(parkingSpaces) },
      ]),
    },
  ].filter(g => g.rows.length > 0)

  return { items, fullSpecGroups, isEmpty: items.length === 0 }
}
