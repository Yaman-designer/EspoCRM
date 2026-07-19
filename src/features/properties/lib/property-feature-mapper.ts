import type { RealEstateProperty } from '../types/property.types'
import { isFurnished } from '../domain/predicates'

export interface FeatureGroup {
  id:       string
  label:    string
  features: string[]
}

/**
 * Resolves a string/boolean field value to a display label, or null if absent/negative.
 *
 * - null / undefined → null
 * - boolean false → null; true → ifYes
 * - 'No' / 'False' / '' → null
 * - 'Yes' / 'True' → ifYes
 * - any other string → ifValue(v) if provided, else ifYes
 */
function resolveFeature(
  value:    string | boolean | null | undefined,
  ifYes:    string,
  ifValue?: (v: string) => string,
): string | null {
  if (value == null) return null
  if (typeof value === 'boolean') return value ? ifYes : null
  const v = value.trim()
  if (!v || /^(no|false|none|0)$/i.test(v)) return null
  if (/^(yes|true)$/i.test(v)) return ifYes
  return ifValue ? ifValue(v) : ifYes
}

function push(arr: string[], value: string | null | undefined) {
  if (value) arr.push(value)
}

// ── Value maps ─────────────────────────────────────────────────────────────────
// Keys match the live enum values in domain/options.ts (HEATING_MEDIUM_OPTIONS,
// FRAMES_OPTIONS, SWIMMING_POOL_OPTIONS, ACCESS_FROM_OPTIONS) and DOOR_OPTIONS'
// values in property.types.ts — not the pre-migration Title-Case vocabulary.

const HEATING: Record<string, string> = {
  petrol:               'Petrol Heating System',
  natural_gas:          'Natural Gas Heating System',
  gas:                  'Gas Heating System',
  current:              'Electric Heating System',
  stove:                'Wood-Stove Heating',
  thermal_accumulator:  'Thermal Accumulator Heating',
  pellet:               'Pellet Heating System',
  infrared:             'Infrared Heating System',
  fan_coil:             'Fan Coil Climate System',
  wood:                 'Wood Heating System',
  teleheating:          'District Heating',
  geothermal_energy:    'Geothermal Heating System',
  heatpump:             'Heat Pump Climate Control',
  // 'thermopompos' deliberately left unmapped — its exact real-world meaning
  // relative to 'heatpump' is unconfirmed; falls through to the generic
  // "<value> Heating System" fallback below rather than guessing.
  // Legacy Title-Case values kept as a safety net: `cHeatingMedium` is not
  // exposed by the legacy Edit dialog (fields.ts has no entry for it), so
  // these were never confirmed to be real stored values, but are kept in
  // case any record was seeded directly in EspoCRM before this vocabulary existed.
  'Heat Pump': 'Heat Pump Climate Control',
  Gas:         'Gas Heating System',
  Electric:    'Electric Heating System',
  Solar:       'Solar Climate System',
  Oil:         'Oil Central Heating',
}

const FRAMES: Record<string, string> = {
  wooden:    'Timber Window Frames',
  aluminium: 'Aluminium Window Frames',
  synthetic: 'Synthetic Window Frames',
  // Legacy safety net — see HEATING's comment above; same caveat applies.
  PVC:           'PVC Window Frames',
  Aluminium:     'Aluminium Window Frames',
  Wood:          'Timber Window Frames',
  'Double Glazed': 'Double-Glazed Window Frames',
}

// 'No' is excluded via resolveFeature's built-in negative-value check below.
const POOL: Record<string, string> = {
  External: 'Private Outdoor Swimming Pool',
  Interior: 'Indoor Swimming Pool',
  indoors:  'Indoor Swimming Pool',
  // Legacy safety net — see HEATING's comment above; same caveat applies.
  Yes:     'Private Swimming Pool',
  Private: 'Private Swimming Pool',
  Indoor:  'Indoor Swimming Pool',
  Outdoor: 'Outdoor Swimming Pool',
}

// 'No access' is a valid real value meaning the opposite of a feature —
// deliberately excluded from this map and from the mapper below.
const ACCESS: Record<string, string> = {
  Road:          'Direct Road Access',
  Pedestrian:    'Pedestrian Access',
  Paved:         'Paved Road Access',
  'Dirt road':   'Dirt Road Access',
  Sea:           'Sea-Access Property',
  Other:         'Private Access',
  // Legacy safety net — see HEATING's comment above; same caveat applies.
  'Private Road': 'Exclusive Private Road Access',
}

// 'No' is excluded via resolveFeature's built-in negative-value check below.
const DOOR: Record<string, string> = {
  Security: 'Security Entry Door',
  Simple:   'Standard Entry Door',
  // Legacy safety net — see HEATING's comment above; same caveat applies.
  Armored: 'Armored Security Door',
  Steel:   'Reinforced Steel Door',
  Oak:     'Solid Oak Entry Door',
  Wood:    'Wooden Entry Door',
}

// ── Mapper ─────────────────────────────────────────────────────────────────────

export function mapPropertyFeatures(p: RealEstateProperty): FeatureGroup[] {
  const interior:   string[] = []
  const exterior:   string[] = []
  const security:   string[] = []
  const technology: string[] = []
  const community:  string[] = []

  // ── Interior ──────────────────────────────────────────────────────────────
  if (isFurnished(p.furnished)) interior.push('Fully Furnished')
  if (p.cHeatingMedium) push(interior, HEATING[p.cHeatingMedium] ?? `${p.cHeatingMedium} Heating System`)
  if (p.frames)         push(interior, FRAMES[p.frames]          ?? `${p.frames} Window Frames`)
  push(interior, resolveFeature(p.doubleGlass,   'Double-Glazed Windows'))
  push(interior, resolveFeature(p.cStorageSpace, 'Dedicated Storage Areas', v => `${v} Storage`))

  // ── Exterior ──────────────────────────────────────────────────────────────
  push(exterior, resolveFeature(p.swimmingPool, 'Private Swimming Pool', v => POOL[v] ?? `${v} Swimming Pool`))
  push(exterior, resolveFeature(p.balcony,      'Private Balcony',       v => `${v} Balcony`))
  push(exterior, resolveFeature(p.garage,       'Private Garage',        v => `${v} Garage`))
  if (p.accessFrom && !/^no(\s+access)?$/i.test(p.accessFrom.trim())) {
    push(exterior, ACCESS[p.accessFrom] ?? `${p.accessFrom} Access`)
  }

  // ── Security ──────────────────────────────────────────────────────────────
  push(security, resolveFeature(p.door, 'Entry Door', v => DOOR[v] ?? `${v} Entry Door`))

  // ── Technology ────────────────────────────────────────────────────────────
  if (p.energyClass) technology.push(`Energy Class ${p.energyClass}`)

  // ── Community ─────────────────────────────────────────────────────────────
  push(community, resolveFeature(p.buildingElevator, 'Building Elevator', v => `${v} Elevator`))

  return [
    { id: 'interior',   label: 'Interior',   features: interior   },
    { id: 'exterior',   label: 'Exterior',   features: exterior   },
    { id: 'security',   label: 'Security',   features: security   },
    { id: 'technology', label: 'Technology', features: technology },
    { id: 'community',  label: 'Community',  features: community  },
  ].filter(g => g.features.length > 0)
}
