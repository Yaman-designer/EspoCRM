import type { RealEstateProperty } from '../types/property.types'
import { ORIENTATION_OPTIONS, SWIMMING_POOL_OPTIONS } from '../domain/options'

// ── Vocabulary — Mapper-layer concern (business labels), not presentation ──
// Features Intelligence pass (2026-07-20). cOrientation stores raw short
// codes ('e', 'ew', 'em', 'wm'…) — ORIENTATION_OPTIONS/SWIMMING_POOL_OPTIONS
// are the SAME {value,label} maps the property Wizard's own form already
// uses for these exact fields (domain/options.ts) — imported, not
// reinvented, so the label shown here is guaranteed to match what an agent
// actually selected.
const ORIENTATION_LABELS = Object.fromEntries(ORIENTATION_OPTIONS.map(o => [o.value, o.label]))
const SWIMMING_POOL_LABELS = Object.fromEntries(SWIMMING_POOL_OPTIONS.map(o => [o.value, o.label]))

// cPlacement / features / additionalBenefits option labels aren't exported
// as standalone constants — they're defined inline in the Wizard's own
// outdoor-building-amenities.schema.ts field builder. Copied verbatim here
// (same values, same labels, same language, same intentional
// inconsistencies like 'accessbility'/'holidayHome' — that file's own
// comment is explicit: "do not normalize, correct, or reorder") rather than
// editing that business-logic/form-definition file, which this task's
// rules put off-limits. Read-only duplication of already-approved display
// strings, not new data.
const PLACEMENT_LABELS: Record<string, string> = {
  airy: 'Διαμπερές', painted: 'Βαμμένο', corner: 'Γωνιακό', Facade: 'Πρόσοψης',
  Interior: 'Εσωτερικό', forCommercialUse: 'Για επαγγελματική χρήση', Side: 'Πλαϊνό',
  Clear: 'Διαμπερές', bright: 'Φωτεινό', 'Three-sided': 'Τριών Όψεων', 'Four-sided': 'Τεσσάρων Όψεων',
}
const FEATURE_LABELS: Record<string, string> = {
  Veranda: 'Veranda', petsAllowed: 'Pets Allowed', solarWaterHeating: 'Solar Water Heating',
  Garden: 'Garden', nightPower: 'Night Power', luxHome: 'Lux Home',
  'In a central point': 'In a central point', Alarm: 'Alarm', Playroom: 'Playroom',
  Painted: 'Painted', 'For professional use': 'For professional use', 'For employees': 'For employees',
  familyHome: 'Family Home', 'For students': 'For students', 'Sewer network': 'Sewer network',
  preserved: 'Preserved', satelliteReceiver: 'Satellite Receiver', holidayHome: 'holiday Home',
  InternalStairs: 'Internal Stairs', unfinished: 'Unfinished', cableReady: 'Cable Ready',
  equipped: 'Equipped', neoclassic: 'Neoclassic', 'Residential area': 'Residential area',
  awning: 'Awning', pestNet: 'Pest Net', furredCeiling: 'Furred Ceiling', Tent: 'Tent',
  'False ceiling': 'False ceiling', attic: 'Attic', accessbility: 'Access For People with Disabilities',
  funnel: 'funnel', 'for sanitary use': 'for sanitary use', 'security rollers': 'security rollers',
  'freight elevator': 'freight elevator', 'unloading ramp': 'unloading ramp',
  'structured cabling': 'structured cabling', 'suitable for medical office': 'suitable for medical office',
  'Building elevator': 'Building elevator',
}
// The 2 features values that are genuinely energy/utility facts, not
// general lifestyle amenities — pulled into their own Energy &
// Sustainability group rather than lost in the general chip cloud.
const ENERGY_FEATURE_VALUES = new Set(['solarWaterHeating', 'nightPower'])

// Semantic keys replace icon-component references — icon resolution lives
// in FeaturesAmenitiesCard.tsx now, not this ViewModel.
export type AmenityKey = 'garage' | 'building-elevator' | 'elevator-rooms' | 'internal-elevator'
export type OutdoorKey = 'balcony' | 'swimming-pool' | 'access-from'
export type SuitabilityKey = 'students' | 'employees'
export type EnergyKey = 'solar' | 'other'

export interface FeaturesViewModel {
  // Enterprise Localization pass (2026-07-24): every `label` below that was
  // static UI text (naming what a fact IS) became `labelKey` — see Row's
  // own note in shared/detail-view/rows.ts for the same pattern. `garage`'s
  // badge is the one with a dynamic suffix (the raw garage type string from
  // the API), carried via `labelParams` instead of baked into the key.
  // orientationLabel/placementChips/lifestyleChips/outdoorRows[].value stay
  // untouched strings — genuine enum-derived business data (some already
  // Greek in PLACEMENT_LABELS, per that const's own note), never translated.
  orientationLabel: string | null
  amenityBadges: Array<{ key: AmenityKey; labelKey: string; labelParams?: { type: string } }>
  hasAccessibility: boolean
  energyBadges: Array<{ key: EnergyKey; label: string }>
  placementChips: string[]
  suitabilityBadges: Array<{ key: SuitabilityKey; labelKey: string }>
  outdoorRows: Array<{ key: OutdoorKey; labelKey: string; value: string }>
  lifestyleChips: string[]
  hasOrientation: boolean
  hasAmenities: boolean
  hasEnergy: boolean
  hasPlacement: boolean
  hasSuitability: boolean
  hasOutdoor: boolean
  hasLifestyle: boolean
  hasPrimaryRow: boolean
  hasSecondaryRow: boolean
  isEmpty: boolean
}

type FeaturesFields = Pick<RealEstateProperty,
  | 'balcony' | 'swimmingPool' | 'accessFrom' | 'cOrientation' | 'garage'
  | 'buildingElevator' | 'buildingElevatorRooms' | 'internalElevator' | 'hasDisabledAccess'
  | 'idealForStudents' | 'idealForEmployees'
  | 'cPlacement' | 'features' | 'additionalBenefits'
>

/**
 * Shapes FeaturesAmenitiesCard's 7 groups. Enum-code→label translation
 * (orientation, swimming pool, placement, general features), the
 * energy-vs-lifestyle feature-value split, and every group's visibility
 * rule used to live inline in the component.
 */
export function buildFeaturesViewModel(property: FeaturesFields): FeaturesViewModel {
  const orientationLabel = property.cOrientation ? (ORIENTATION_LABELS[property.cOrientation] ?? property.cOrientation) : null

  type AmenityBadge = { key: AmenityKey; labelKey: string; labelParams?: { type: string } }
  const amenityBadges: AmenityBadge[] = ([
    property.garage && property.garage !== 'No' && {
      key: 'garage' as const,
      labelKey: property.garage !== 'Yes' ? 'features.garageWithType' : 'features.garage',
      labelParams: property.garage !== 'Yes' ? { type: property.garage } : undefined,
    },
    property.buildingElevator      === true && { key: 'building-elevator' as const, labelKey: 'features.buildingElevator' },
    property.buildingElevatorRooms === true && { key: 'elevator-rooms' as const,    labelKey: 'features.elevatorInRooms' },
    property.internalElevator      === true && { key: 'internal-elevator' as const, labelKey: 'features.internalElevator' },
  ] as Array<AmenityBadge | false>).filter((b): b is AmenityBadge => !!b)

  const hasAccessibility = property.hasDisabledAccess === true

  const featureValues = property.features ?? []
  const energyBadges: Array<{ key: EnergyKey; label: string }> = featureValues
    .filter(v => ENERGY_FEATURE_VALUES.has(v))
    .map(v => ({ key: (v === 'solarWaterHeating' ? 'solar' : 'other') as EnergyKey, label: FEATURE_LABELS[v] ?? v }))

  const placementChips = (property.cPlacement ?? []).map(v => PLACEMENT_LABELS[v] ?? v)

  const suitabilityBadges: Array<{ key: SuitabilityKey; labelKey: string }> = [
    property.idealForStudents  === true && { key: 'students' as const,  labelKey: 'features.idealForStudents' },
    property.idealForEmployees === true && { key: 'employees' as const, labelKey: 'features.idealForEmployees' },
  ].filter((v): v is { key: SuitabilityKey; labelKey: string } => !!v)

  const outdoorRows: Array<{ key: OutdoorKey; labelKey: string; value: string }> = [
    property.balcony === true && { key: 'balcony' as const, labelKey: 'features.balcony', value: 'Yes' },
    property.swimmingPool && property.swimmingPool !== 'No'
      && { key: 'swimming-pool' as const, labelKey: 'features.swimmingPool', value: SWIMMING_POOL_LABELS[property.swimmingPool] ?? property.swimmingPool },
    property.accessFrom && { key: 'access-from' as const, labelKey: 'features.accessFrom', value: property.accessFrom },
  ].filter((r): r is { key: OutdoorKey; labelKey: string; value: string } => !!r)

  const lifestyleChips = [
    ...featureValues.filter(v => !ENERGY_FEATURE_VALUES.has(v)).map(v => FEATURE_LABELS[v] ?? v),
    ...(property.additionalBenefits ?? []),
  ]

  const hasOrientation   = !!orientationLabel
  const hasAmenities     = amenityBadges.length > 0
  const hasEnergy        = energyBadges.length > 0
  const hasPlacement     = placementChips.length > 0
  const hasSuitability   = suitabilityBadges.length > 0
  const hasOutdoor       = outdoorRows.length > 0
  const hasLifestyle     = lifestyleChips.length > 0
  const hasPrimaryRow    = hasOrientation || hasAmenities || hasAccessibility || hasEnergy
  const hasSecondaryRow  = hasPlacement || hasSuitability || hasOutdoor

  return {
    orientationLabel, amenityBadges, hasAccessibility, energyBadges, placementChips,
    suitabilityBadges, outdoorRows, lifestyleChips,
    hasOrientation, hasAmenities, hasEnergy, hasPlacement, hasSuitability, hasOutdoor, hasLifestyle,
    hasPrimaryRow, hasSecondaryRow,
    isEmpty: !hasPrimaryRow && !hasSecondaryRow && !hasLifestyle,
  }
}
