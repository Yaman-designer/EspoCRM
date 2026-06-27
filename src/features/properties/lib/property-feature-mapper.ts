import type { RealEstateProperty } from '../types/property.types'

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

const HEATING: Record<string, string> = {
  'Heat Pump': 'Heat Pump Climate Control',
  'Gas':       'Gas Heating System',
  'Electric':  'Electric Heating System',
  'Solar':     'Solar Climate System',
  'Oil':       'Oil Central Heating',
}

const FRAMES: Record<string, string> = {
  'PVC':           'PVC Window Frames',
  'Aluminium':     'Aluminium Window Frames',
  'Wood':          'Timber Window Frames',
  'Double Glazed': 'Double-Glazed Window Frames',
}

const POOL: Record<string, string> = {
  'Yes':     'Private Swimming Pool',
  'Private': 'Private Swimming Pool',
  'Heated':  'Heated Swimming Pool',
  'Indoor':  'Indoor Swimming Pool',
  'Outdoor': 'Outdoor Swimming Pool',
}

const ACCESS: Record<string, string> = {
  'Road':         'Direct Road Access',
  'Private Road': 'Exclusive Private Road Access',
  'Sea':          'Sea-Access Property',
}

const DOOR: Record<string, string> = {
  'Security': 'Security Entry Door',
  'Armored':  'Armored Security Door',
  'Steel':    'Reinforced Steel Door',
  'Oak':      'Solid Oak Entry Door',
  'Wood':     'Wooden Entry Door',
}

// ── Mapper ─────────────────────────────────────────────────────────────────────

export function mapPropertyFeatures(p: RealEstateProperty): FeatureGroup[] {
  const interior:   string[] = []
  const exterior:   string[] = []
  const security:   string[] = []
  const technology: string[] = []
  const community:  string[] = []

  // ── Interior ──────────────────────────────────────────────────────────────
  if (p.furnished === true) interior.push('Fully Furnished')
  if (p.cHeatingMedium) push(interior, HEATING[p.cHeatingMedium] ?? `${p.cHeatingMedium} Heating System`)
  if (p.frames)         push(interior, FRAMES[p.frames]          ?? `${p.frames} Window Frames`)
  push(interior, resolveFeature(p.doubleGlass,   'Double-Glazed Windows'))
  push(interior, resolveFeature(p.cStorageSpace, 'Dedicated Storage Areas', v => `${v} Storage`))

  // ── Exterior ──────────────────────────────────────────────────────────────
  push(exterior, resolveFeature(p.swimmingPool, 'Private Swimming Pool', v => POOL[v] ?? `${v} Swimming Pool`))
  push(exterior, resolveFeature(p.balcony,      'Private Balcony',       v => `${v} Balcony`))
  push(exterior, resolveFeature(p.garage,       'Private Garage',        v => `${v} Garage`))
  if (p.accessFrom) push(exterior, ACCESS[p.accessFrom] ?? `${p.accessFrom} Access`)

  // ── Security ──────────────────────────────────────────────────────────────
  if (p.door) push(security, DOOR[p.door] ?? `${p.door} Entry Door`)

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
