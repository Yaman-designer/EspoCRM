import { fmtPrice } from './display'
import type { RealEstateProperty } from '../types/property.types'
import { isFurnished } from '../domain/predicates'

// ── Public types ──────────────────────────────────────────────────────────────

export interface PropertyIntelligence {
  /** Aspirational lifestyle phrases derived from API field values. */
  highlights:        string[]
  /** Buyer-outcome statements: what living here actually means. */
  lifestyleBenefits: LifestyleBenefit[]
  /** Short selling propositions derived from specs and property flags. */
  sellingPoints:     SellingPoint[]
  /** Quantitative investment metrics, fully formatted for direct rendering. */
  investmentSignals: InvestmentSignal[]
}

export interface LifestyleBenefit {
  id:    string
  label: string
}

export type SellingPointVariant = 'premium' | 'verified' | 'new' | 'default'

export interface SellingPoint {
  id:      string
  label:   string
  variant: SellingPointVariant
}

export interface InvestmentSignal {
  id:    string
  label: string
  value: string
  note?: string
}

// ── Translation maps ──────────────────────────────────────────────────────────

// Keys match cOrientation's PDF-exact lowercase short codes.
const ORIENTATION_HIGHLIGHTS: Record<string, string> = {
  'sw': 'South-West Natural Light Exposure',
  'se': 'South-East Natural Light Exposure',
  's':  'South-Facing Natural Light',
  'n':  'North-Facing Aspect',
  'ne': 'North-East Natural Light',
  'nw': 'North-West Natural Light',
  'e':  'East-Facing Morning Light',
  'w':  'West-Facing Evening Light',
}

// Keys match the live enum values in domain/options.ts, not the pre-migration
// Title-Case vocabulary.
const HEATING_HIGHLIGHTS: Record<string, string> = {
  petrol:              'Petrol Heating',
  natural_gas:         'Natural Gas Heating',
  gas:                 'Natural Gas Heating',
  current:             'Electric Heating System',
  stove:               'Wood-Stove Heating',
  thermal_accumulator: 'Thermal Accumulator Heating',
  pellet:              'Pellet Heating System',
  infrared:            'Infrared Heating System',
  fan_coil:            'Fan Coil Climate System',
  wood:                'Wood Heating System',
  teleheating:         'District Heating',
  geothermal_energy:   'Geothermal Heating System',
  heatpump:            'Advanced Climate Control System',
  // 'thermopompos' deliberately left unmapped — see property-narrative.ts.
  // Legacy Title-Case values kept as a safety net — see property-feature-mapper.ts's
  // HEATING map comment for why (never confirmed real, cost-free to keep).
  'Heat Pump': 'Advanced Climate Control System',
  Gas:         'Natural Gas Heating',
  Electric:    'Electric Heating System',
  Solar:       'Solar-Powered Climate System',
  Oil:         'Central Oil Heating',
}

// 'No' is excluded by the bare-truthy-check removal below.
const DOOR_HIGHLIGHTS: Record<string, string> = {
  Security: 'Premium Security Entrance',
  Simple:   'Standard Entry Door',
  // Legacy safety net — see HEATING_HIGHLIGHTS's comment above.
  Armored: 'Armored Security Door',
  Steel:   'Reinforced Steel Entrance',
  Oak:     'Solid Oak Entry Door',
  Wood:    'Timber Entry Door',
}

const FRAMES_HIGHLIGHTS: Record<string, string> = {
  wooden:    'Premium Timber Window Frames',
  aluminium: 'Architectural Aluminium Frames',
  synthetic: 'Synthetic Window Frames',
  // Legacy safety net — see HEATING_HIGHLIGHTS's comment above.
  PVC:             'High-Performance PVC Window Frames',
  Aluminium:       'Architectural Aluminium Frames',
  Wood:            'Premium Timber Window Frames',
  'Double Glazed': 'Double-Glazed Insulation Frames',
}

// 'No' is already excluded by the isPresent() check at every call site below.
const POOL_HIGHLIGHTS: Record<string, string> = {
  External: 'Private Outdoor Swimming Pool',
  Interior: 'Indoor Swimming Pool',
  indoors:  'Indoor Swimming Pool',
  // Legacy safety net — see HEATING_HIGHLIGHTS's comment above.
  Yes:     'Private Swimming Pool',
  Private: 'Private Swimming Pool',
  Indoor:  'Indoor Swimming Pool',
  Outdoor: 'Outdoor Swimming Pool',
}

// 'No access' is a valid real value meaning the opposite of a feature —
// deliberately excluded from this map and from every call site below.
const ACCESS_HIGHLIGHTS: Record<string, string> = {
  Road:       'Direct Road Access',
  Pedestrian: 'Pedestrian Access',
  Paved:      'Paved Road Access',
  'Dirt road': 'Dirt Road Access',
  Sea:        'Rare Sea-Access Property',
  Other:      'Private Access',
  // Legacy safety net — see HEATING_HIGHLIGHTS's comment above.
  'Private Road': 'Exclusive Private Road Access',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function push<T>(arr: T[], value: T | null | undefined) {
  if (value != null) arr.push(value)
}

/** Returns false for null/undefined/empty/'No'/'False' string values. */
function isPresent(value: string | boolean | null | undefined): boolean {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  const v = value.trim()
  return Boolean(v) && !/^(no|false|0|none)$/i.test(v)
}

// ── Section builders ──────────────────────────────────────────────────────────

function buildHighlights(p: RealEstateProperty): string[] {
  const result: string[] = []

  if (p.energyClass)    result.push(`${p.energyClass} Energy Efficiency`)
  if (p.cOrientation)   push(result, ORIENTATION_HIGHLIGHTS[p.cOrientation]   ?? `${p.cOrientation} Orientation`)
  if (p.cHeatingMedium) push(result, HEATING_HIGHLIGHTS[p.cHeatingMedium]     ?? `${p.cHeatingMedium} Heating`)
  // Real door options are 'Security' | 'Simple' | 'yes' | 'no' (confirmed live
  // entityDefs) — case-insensitive check, not a literal 'No' match, so the
  // real lowercase 'no' value is actually excluded (Wave 1 reconciliation fix).
  if (p.door && !/^no$/i.test(p.door)) push(result, DOOR_HIGHLIGHTS[p.door] ?? `${p.door} Entry Door`)
  if (p.frames)         push(result, FRAMES_HIGHLIGHTS[p.frames]              ?? `${p.frames} Window Frames`)

  if (isPresent(p.cStorageSpace)) {
    const v = (p.cStorageSpace as string).trim()
    result.push(/^yes$/i.test(v) ? 'Dedicated Storage Areas' : `${v} Storage`)
  }

  if (isPresent(p.swimmingPool)) {
    const v = (p.swimmingPool as string).trim()
    result.push(POOL_HIGHLIGHTS[v] ?? `${v} Swimming Pool`)
  }

  if (p.accessFrom && !/^no(\s+access)?$/i.test(p.accessFrom.trim())) {
    push(result, ACCESS_HIGHLIGHTS[p.accessFrom] ?? `${p.accessFrom} Access`)
  }

  return result
}

function buildLifestyleBenefits(p: RealEstateProperty): LifestyleBenefit[] {
  const result: LifestyleBenefit[] = []

  if (isFurnished(p.furnished)) {
    result.push({ id: 'furnished', label: 'Move-in ready with full furnishings included' })
  }

  if (p.cOrientation && ['sw', 'se', 's'].includes(p.cOrientation)) {
    result.push({ id: 'light', label: 'Exceptional natural light throughout the day' })
  }

  if (isPresent(p.swimmingPool)) {
    // The live swimmingPool enum (No/External/Interior/indoors) carries no
    // heated/unheated signal — do not infer one.
    result.push({ id: 'pool', label: 'Resort-style outdoor living with private pool' })
  }

  if (isPresent(p.balcony)) {
    result.push({ id: 'balcony', label: 'Private outdoor retreat with dedicated terrace space' })
  }

  if (p.cHeatingMedium === 'heatpump') {
    result.push({ id: 'climate', label: 'Year-round comfort with advanced heat pump system' })
  }

  if (p.energyClass && /^A/.test(p.energyClass)) {
    result.push({ id: 'energy', label: 'Low energy bills with a top-rated efficiency rating' })
  }

  if (isPresent(p.garage)) {
    result.push({ id: 'parking', label: 'Secure private parking on-site' })
  }

  if (isPresent(p.buildingElevator)) {
    result.push({ id: 'elevator', label: 'Step-free building access throughout' })
  }

  if (p.accessFrom === 'Sea') {
    result.push({ id: 'sea', label: 'Exclusive sea-access setting — a rare opportunity' })
  }

  return result
}

function buildSellingPoints(p: RealEstateProperty): SellingPoint[] {
  const result: SellingPoint[] = []

  if (p.yearBuilt && p.yearBuilt >= 2015) {
    result.push({ id: 'modern',        label: `Built ${p.yearBuilt}`, variant: 'default' })
  }

  if (p.energyClass && /^A[+]?$/.test(p.energyClass)) {
    result.push({ id: 'energy-class',  label: `Energy Class ${p.energyClass}`, variant: 'default' })
  }

  if (isPresent(p.swimmingPool)) {
    result.push({ id: 'pool', label: 'Swimming Pool', variant: 'default' })
  }

  if (p.accessFrom === 'Sea') {
    result.push({ id: 'sea-access',    label: 'Sea Access',          variant: 'default' })
  }

  if (isPresent(p.balcony)) {
    result.push({ id: 'balcony',       label: 'Private Balcony',     variant: 'default' })
  }

  if (isPresent(p.buildingElevator)) {
    result.push({ id: 'elevator',      label: 'Elevator',            variant: 'default' })
  }

  return result
}

function buildInvestmentSignals(p: RealEstateProperty): InvestmentSignal[] {
  const result: InvestmentSignal[] = []

  if (p.price != null && p.square != null) {
    result.push({
      id:    'price-per-sqm',
      label: 'Price per m²',
      value: fmtPrice(Math.round(p.price / p.square)),
    })
  }

  if (p.price != null) {
    result.push({
      id:    'mortgage',
      label: 'Est. Monthly',
      value: fmtPrice(Math.round(p.price * 0.8 * 0.006653)),
      note:  '80% LTV · 30yr at 7%',
    })
  }

  return result
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function buildPropertyIntelligence(p: RealEstateProperty): PropertyIntelligence {
  return {
    highlights:        buildHighlights(p),
    lifestyleBenefits: buildLifestyleBenefits(p),
    sellingPoints:     buildSellingPoints(p),
    investmentSignals: buildInvestmentSignals(p),
  }
}
