/**
 * Deterministic editorial narrative generator.
 *
 * All output is derived from structured property fields via rule-based clause
 * selection and template assembly. No AI, no randomness — same input always
 * produces the same output.
 *
 * Tone reference: Compass · Sotheby's International Realty · Airbnb Luxe
 */

import type { RealEstateProperty } from '../types/property.types'

// ── Public types ──────────────────────────────────────────────────────────────

export interface PropertyNarrative {
  /** 4-8 word marketing headline derived from the most distinctive attribute. */
  headline:           string | null
  /** 1-2 sentence editorial hook. Data-driven, aspiration-led. */
  summary:            string | null
  /** 2-3 sentence lifestyle paragraph. Sensory, experience-focused. */
  lifestyleNarrative: string | null
  /** 1-2 sentence location description. Grounded in actual fields. */
  locationNarrative:  string | null
  /** 1-2 sentence value proposition. Investment and desirability-focused. */
  sellingNarrative:   string | null
}

// ── Internal signal model ─────────────────────────────────────────────────────

interface Signals {
  typeLabel:      string
  location?:      string
  city?:          string
  orientation?:   string
  hasPool:        boolean
  isHeatedPool:   boolean
  hasSea:         boolean
  hasPrivateRoad: boolean
  hasBalcony:     boolean
  hasGarage:      boolean
  hasElevator:    boolean
  isFurnished:    boolean
  energyClass?:   string
  isEnergyA:      boolean
  hasHeatPump:    boolean
  heatingLabel?:  string
  yearBuilt?:     number
  isModern:       boolean
  hasSouthLight:  boolean
}

const TYPE_LABELS: Record<string, string> = {
  'Villa':      'villa',
  'House':      'residence',
  'Apartment':  'apartment',
  'Penthouse':  'penthouse',
  'Townhouse':  'townhouse',
  'Office':     'space',
  'Land':       'parcel',
}

const HEATING_LABELS: Record<string, string> = {
  'Heat Pump': 'heat pump climate system',
  'Gas':       'natural gas heating',
  'Electric':  'electric heating',
  'Solar':     'solar climate system',
  'Oil':       'oil central heating',
}

function isFieldPresent(value: string | boolean | null | undefined): boolean {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  const v = value.trim()
  return Boolean(v) && !/^(no|false|0|none)$/i.test(v)
}

function extractSignals(p: RealEstateProperty): Signals {
  const orientation = p.cOrientation?.trim()
  const hasPool     = isFieldPresent(p.swimmingPool)

  return {
    typeLabel:      TYPE_LABELS[p.type ?? ''] ?? 'residence',
    location:       p.locationName?.trim()   || undefined,
    city:           p.addressCity?.trim()    || undefined,
    orientation,
    hasPool,
    isHeatedPool:   hasPool && /heated/i.test(p.swimmingPool as string),
    hasSea:         p.accessFrom === 'Sea',
    hasPrivateRoad: p.accessFrom === 'Private Road',
    hasBalcony:     isFieldPresent(p.balcony),
    hasGarage:      isFieldPresent(p.garage),
    hasElevator:    isFieldPresent(p.buildingElevator),
    isFurnished:    p.furnished === true,
    energyClass:    p.energyClass?.trim() || undefined,
    isEnergyA:      Boolean(p.energyClass && /^A/.test(p.energyClass)),
    hasHeatPump:    p.cHeatingMedium === 'Heat Pump',
    heatingLabel:   p.cHeatingMedium ? (HEATING_LABELS[p.cHeatingMedium] ?? undefined) : undefined,
    yearBuilt:      p.yearBuilt ?? undefined,
    isModern:       Boolean(p.yearBuilt && p.yearBuilt >= 2015),
    hasSouthLight:  Boolean(orientation && ['SW', 'SE', 'S'].includes(orientation)),
  }
}

// ── Shared vocabulary helpers ─────────────────────────────────────────────────

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Returns a one-word light quality adjective for the given orientation code. */
function lightAdjective(orientation: string): string {
  const map: Record<string, string> = {
    'S':  'Sun-Drenched',
    'SW': 'Sun-Drenched',
    'SE': 'Luminous',
    'W':  'Golden-Hour',
    'E':  'Morning-Light',
  }
  return map[orientation] ?? 'Light-Filled'
}

/** Returns the full directional phrase for in-sentence use. */
function orientationFull(orientation: string): string {
  const map: Record<string, string> = {
    'S':  'south-facing',
    'SW': 'south-west-facing',
    'SE': 'south-east-facing',
    'W':  'west-facing',
    'E':  'east-facing',
    'N':  'north-facing',
    'NW': 'north-west-facing',
    'NE': 'north-east-facing',
  }
  return map[orientation] ?? orientation.toLowerCase() + '-facing'
}

// ── Headline ──────────────────────────────────────────────────────────────────

function buildHeadline(s: Signals): string | null {
  const t = s.typeLabel

  if (s.hasSea) {
    return `Sea-Access ${cap(t)}`
  }

  if (s.hasPool && s.hasSouthLight && s.orientation) {
    return `${lightAdjective(s.orientation)} ${cap(t)} with Private Pool`
  }

  if (s.isEnergyA && s.isModern && s.yearBuilt) {
    return `Contemporary ${cap(t)}, Built ${s.yearBuilt}`
  }

  if (s.hasPool) {
    return s.isHeatedPool ? `${cap(t)} with Heated Pool` : `${cap(t)} with Private Pool`
  }

  if (s.hasSouthLight && s.orientation) {
    return `${lightAdjective(s.orientation)} ${cap(t)}`
  }

  if (s.isEnergyA && s.energyClass) {
    return `Energy Class ${s.energyClass} ${cap(t)}`
  }

  if (s.hasPrivateRoad) {
    return `Private-Access ${cap(t)}`
  }

  if (s.location || s.city) {
    return `${cap(t)} in ${s.location ?? s.city}`
  }

  if (t !== 'residence') {
    return `Premium ${cap(t)}`
  }

  return null
}

// ── Summary ───────────────────────────────────────────────────────────────────

function buildSummary(s: Signals): string | null {
  const t = s.typeLabel

  // Track which primary signals drove the opening sentence
  let openedWithPool  = false
  let openedWithLight = false
  let openedWithEnergy = false

  // ── First sentence — lead with the most distinctive attribute ──────────────

  let first = ''

  if (s.hasSea) {
    first = `Offering rare direct sea access, this ${t} occupies a setting that is genuinely difficult to replicate.`
  } else if (s.hasPool && s.hasSouthLight) {
    openedWithPool  = true
    openedWithLight = true
    first = `Designed for bright, comfortable living, this ${t} combines exceptional natural light with resort-style outdoor space.`
  } else if (s.isEnergyA && s.hasSouthLight) {
    openedWithEnergy = true
    openedWithLight  = true
    first = `Combining strong energy performance with exceptional natural light, this ${t} is built for quality of life.`
  } else if (s.hasPool) {
    openedWithPool = true
    const poolType = s.isHeatedPool ? 'heated ' : ''
    first = `Centred on a private ${poolType}pool, this ${t} is conceived for relaxed, resort-inspired living.`
  } else if (s.hasSouthLight && s.orientation) {
    openedWithLight = true
    first = `Bathed in ${orientationFull(s.orientation)} light, this ${t} offers a bright, uplifting atmosphere throughout the day.`
  } else if (s.isEnergyA && s.energyClass) {
    openedWithEnergy = true
    first = `Rated ${s.energyClass} for energy efficiency, this ${t} brings responsible design and refined residential comfort together.`
  } else if (s.isFurnished) {
    first = `Offered fully furnished to a high standard, this ${t} is prepared for immediate, effortless occupation.`
  } else if (s.isModern && s.yearBuilt) {
    first = `Completed in ${s.yearBuilt}, this ${t} reflects contemporary residential standards throughout.`
  } else if (s.location || s.city) {
    first = `A well-appointed ${t} in ${s.location ?? s.city}, the property offers comfortable living in an established setting.`
  } else {
    first = `A refined residential offering, this ${t} delivers quality and comfort in equal measure.`
  }

  // ── Second sentence — secondary signal, no repeat of the first ─────────────

  let second = ''

  if (!openedWithPool && s.hasPool) {
    const poolType = s.isHeatedPool ? 'heated private pool' : 'private pool'
    second = `The ${t} is defined by a ${poolType} at its heart.`
  } else if (!openedWithLight && s.hasSouthLight && s.orientation) {
    second = `A ${lightAdjective(s.orientation).toLowerCase()} orientation ensures exceptional light quality through every room.`
  } else if (!openedWithEnergy && s.isEnergyA && s.energyClass) {
    second = `An ${s.energyClass} energy rating underlines a commitment to long-term efficiency.`
  } else if (s.hasBalcony && !openedWithPool) {
    second = `The private terrace extends the living space seamlessly into the open air.`
  } else if (s.hasHeatPump) {
    second = `Advanced climate control ensures complete comfort regardless of season.`
  } else if (s.isFurnished && !first.includes('furnished')) {
    second = `Offered fully furnished, the ${t} is ready for immediate occupation.`
  }

  return second ? `${first} ${second}` : first
}

// ── Lifestyle narrative ───────────────────────────────────────────────────────

function buildLifestyleNarrative(s: Signals): string | null {
  const sentences: string[] = []

  // Outdoor living — lead with the most visual signal
  if (s.hasPool && s.hasBalcony) {
    const poolType = s.isHeatedPool ? 'heated ' : ''
    sentences.push(
      `Step outside to a private ${poolType}pool and a dedicated terrace — spaces conceived for unhurried outdoor living.`,
    )
  } else if (s.hasPool) {
    const poolType = s.isHeatedPool ? 'heated ' : ''
    sentences.push(
      `The private ${poolType}pool anchors an outdoor environment designed for warmth and retreat, drawing the home's living outward through the seasons.`,
    )
  } else if (s.hasBalcony) {
    sentences.push(
      `A private terrace extends the home's living space into the open air, offering a natural setting for morning coffee or evening relaxation.`,
    )
  }

  // Climate and comfort
  if (s.hasHeatPump) {
    sentences.push(
      `Advanced heat pump climate control delivers year-round comfort with consistent, quiet precision — adapting to the season without intervention.`,
    )
  } else if (s.heatingLabel && !s.hasHeatPump) {
    sentences.push(`${cap(s.heatingLabel)} provides dependable warmth throughout the colder months.`)
  }

  // Light quality
  if (s.hasSouthLight && s.orientation && sentences.length < 2) {
    sentences.push(
      `The ${orientationFull(s.orientation)} orientation delivers generous natural light — bright through the morning, settling into a warm evening glow.`,
    )
  }

  // Furnished
  if (s.isFurnished && sentences.length < 3) {
    sentences.push(`Offered fully furnished and move-in ready, the residence removes the friction of settling in.`)
  }

  // Energy efficiency
  if (s.isEnergyA && s.energyClass && sentences.length < 3) {
    sentences.push(
      `An ${s.energyClass} energy rating reflects a home that performs as well as it looks — with materially lower running costs day to day.`,
    )
  }

  // Parking
  if (s.hasGarage && sentences.length < 3) {
    sentences.push(`Secure private parking is included, a considered convenience that compounds the overall quality of the setting.`)
  }

  return sentences.length > 0 ? sentences.slice(0, 3).join(' ') : null
}

// ── Location narrative ────────────────────────────────────────────────────────

function buildLocationNarrative(s: Signals): string | null {
  const sentences: string[] = []

  if (s.hasSea) {
    const place = s.location ?? s.city
    if (place) {
      sentences.push(
        `Positioned with direct sea access in ${place}, the setting is among the most coveted in the region — a vantage point that few properties can offer.`,
      )
    } else {
      sentences.push(
        `The property's direct sea access places it in a category of its own — a setting that is both rare and irreplaceable.`,
      )
    }
  } else if (s.location && s.city) {
    sentences.push(
      `Located in ${s.location}, ${s.city}, the property sits within a well-established residential address served by the full infrastructure of the broader market.`,
    )
  } else if (s.location) {
    sentences.push(
      `Situated in ${s.location}, the residence benefits from a recognised neighbourhood with strong residential character.`,
    )
  } else if (s.city) {
    sentences.push(
      `Set in ${s.city}, the property occupies a well-connected position within the metropolitan market.`,
    )
  }

  if (sentences.length > 0) {
    if (s.hasPrivateRoad) {
      sentences.push(`Private road access adds a layer of discretion and exclusivity that distinguishes the approach.`)
    } else if (s.hasElevator) {
      sentences.push(`Building elevator access ensures the address remains effortlessly practical for all residents.`)
    }
  }

  return sentences.length > 0 ? sentences.join(' ') : null
}

// ── Selling narrative ─────────────────────────────────────────────────────────

function buildSellingNarrative(s: Signals): string | null {
  const sentences: string[] = []

  // Lead with the strongest convergence of value signals
  if (s.hasSea && s.isEnergyA && s.energyClass) {
    sentences.push(
      `Sea access paired with an ${s.energyClass} energy rating represents a convergence of lifestyle aspiration and long-term value that is seldom found in a single listing.`,
    )
  } else if (s.hasPool && s.isEnergyA && s.hasSouthLight && s.energyClass) {
    sentences.push(
      `The combination of ${s.energyClass} energy performance, a ${orientationFull(s.orientation ?? 'south')}-facing aspect, and a private pool makes this an offering of rare and lasting appeal.`,
    )
  } else if (s.hasSea) {
    sentences.push(
      `Direct sea access is among the most enduring drivers of residential value — difficult to find, and impossible to replicate through renovation or repositioning.`,
    )
  } else if (s.hasPool && s.hasSouthLight) {
    sentences.push(
      `Natural light and private outdoor living are perennial drivers of residential desirability — this ${s.typeLabel} delivers both without compromise.`,
    )
  } else if (s.isEnergyA && s.isModern && s.energyClass) {
    sentences.push(
      `For the considered buyer, an ${s.energyClass} energy rating and modern construction translate directly into lower running costs and reduced maintenance over the life of the investment.`,
    )
  } else if (s.hasPool) {
    sentences.push(
      `A private pool remains one of the most consistent drivers of residential appeal — here, it forms the centrepiece of a well-composed outdoor setting.`,
    )
  } else if (s.isEnergyA && s.energyClass) {
    sentences.push(
      `In an environment of rising energy costs, an ${s.energyClass} efficiency rating is a tangible and lasting advantage that accrues with every passing year.`,
    )
  } else if (s.isModern && s.yearBuilt) {
    sentences.push(
      `Constructed in ${s.yearBuilt}, the property carries the practical advantages of modern building standards — reduced maintenance burden and improved material quality throughout.`,
    )
  } else if (s.isFurnished) {
    sentences.push(
      `Offered fully furnished, the residence presents a straightforward and immediately habitable investment.`,
    )
  }

  // Closing line — only for properties with multiple strong signals
  const strongSignalCount = [s.hasSea, s.hasPool, s.isEnergyA, s.hasSouthLight, s.isModern].filter(Boolean).length
  if (sentences.length > 0 && strongSignalCount >= 2) {
    sentences.push(`Opportunities of this calibre invite early consideration.`)
  }

  return sentences.length > 0 ? sentences.join(' ') : null
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function buildPropertyNarrative(p: RealEstateProperty): PropertyNarrative {
  const s = extractSignals(p)
  return {
    headline:           buildHeadline(s),
    summary:            buildSummary(s),
    lifestyleNarrative: buildLifestyleNarrative(s),
    locationNarrative:  buildLocationNarrative(s),
    sellingNarrative:   buildSellingNarrative(s),
  }
}
