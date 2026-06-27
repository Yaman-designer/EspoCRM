import { fmtPrice } from './display'
import type { RealEstateProperty } from '../types/property.types'

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

const ORIENTATION_HIGHLIGHTS: Record<string, string> = {
  'SW': 'South-West Natural Light Exposure',
  'SE': 'South-East Natural Light Exposure',
  'S':  'South-Facing Natural Light',
  'N':  'North-Facing Aspect',
  'NE': 'North-East Natural Light',
  'NW': 'North-West Natural Light',
  'E':  'East-Facing Morning Light',
  'W':  'West-Facing Evening Light',
}

const HEATING_HIGHLIGHTS: Record<string, string> = {
  'Heat Pump': 'Advanced Climate Control System',
  'Gas':       'Natural Gas Heating',
  'Electric':  'Electric Heating System',
  'Solar':     'Solar-Powered Climate System',
  'Oil':       'Central Oil Heating',
}

const DOOR_HIGHLIGHTS: Record<string, string> = {
  'Security': 'Premium Security Entrance',
  'Armored':  'Armored Security Door',
  'Steel':    'Reinforced Steel Entrance',
  'Oak':      'Solid Oak Entry Door',
  'Wood':     'Timber Entry Door',
}

const FRAMES_HIGHLIGHTS: Record<string, string> = {
  'PVC':           'High-Performance PVC Window Frames',
  'Aluminium':     'Architectural Aluminium Frames',
  'Wood':          'Premium Timber Window Frames',
  'Double Glazed': 'Double-Glazed Insulation Frames',
}

const POOL_HIGHLIGHTS: Record<string, string> = {
  'Yes':     'Private Swimming Pool',
  'Private': 'Private Swimming Pool',
  'Heated':  'Heated Private Swimming Pool',
  'Indoor':  'Indoor Swimming Pool',
  'Outdoor': 'Outdoor Swimming Pool',
}

const ACCESS_HIGHLIGHTS: Record<string, string> = {
  'Road':         'Direct Road Access',
  'Private Road': 'Exclusive Private Road Access',
  'Sea':          'Rare Sea-Access Property',
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
  if (p.door)           push(result, DOOR_HIGHLIGHTS[p.door]                  ?? `${p.door} Entry Door`)
  if (p.frames)         push(result, FRAMES_HIGHLIGHTS[p.frames]              ?? `${p.frames} Window Frames`)

  if (isPresent(p.cStorageSpace)) {
    const v = (p.cStorageSpace as string).trim()
    result.push(/^yes$/i.test(v) ? 'Dedicated Storage Areas' : `${v} Storage`)
  }

  if (isPresent(p.swimmingPool)) {
    const v = (p.swimmingPool as string).trim()
    result.push(POOL_HIGHLIGHTS[v] ?? `${v} Swimming Pool`)
  }

  if (p.accessFrom) push(result, ACCESS_HIGHLIGHTS[p.accessFrom] ?? `${p.accessFrom} Access`)

  return result
}

function buildLifestyleBenefits(p: RealEstateProperty): LifestyleBenefit[] {
  const result: LifestyleBenefit[] = []

  if (p.furnished === true) {
    result.push({ id: 'furnished', label: 'Move-in ready with full furnishings included' })
  }

  if (p.cOrientation && ['SW', 'SE', 'S'].includes(p.cOrientation)) {
    result.push({ id: 'light', label: 'Exceptional natural light throughout the day' })
  }

  if (isPresent(p.swimmingPool)) {
    const isHeated = /heated/i.test(p.swimmingPool as string)
    result.push({
      id:    'pool',
      label: isHeated
        ? 'Heated pool for year-round outdoor living'
        : 'Resort-style outdoor living with private pool',
    })
  }

  if (isPresent(p.balcony)) {
    result.push({ id: 'balcony', label: 'Private outdoor retreat with dedicated terrace space' })
  }

  if (p.cHeatingMedium === 'Heat Pump') {
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
    const label = /heated/i.test(p.swimmingPool as string) ? 'Heated Pool' : 'Swimming Pool'
    result.push({ id: 'pool',          label, variant: 'default' })
  }

  if (p.accessFrom === 'Sea') {
    result.push({ id: 'sea-access',    label: 'Sea Access',          variant: 'default' })
  }

  if (p.accessFrom === 'Private Road') {
    result.push({ id: 'private-road',  label: 'Private Road',        variant: 'default' })
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
