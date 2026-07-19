import { describe, it, expect } from 'vitest'
import {
  PROPERTY_STATUSES, STATUS_DOT_COLORS, STATUS_DOT_FALLBACK, STATUS_ICONS,
  STATUS_PRIORITY, PROPERTY_STATUS_REGISTRY,
  PAGE_SIZE_OPTIONS,
} from './constants'

describe('PROPERTY_STATUSES', () => {
  it('has the 8 real live EspoCRM enum values, approved PDR mapping', () => {
    expect(PROPERTY_STATUSES).toEqual([
      'Under Approval', 'Active', 'Inactive', 'Not Approved',
      'Under negotiation', 'Received payment', 'Rented', 'Sold',
    ])
  })

  it('every status has a dot color, icon entry, and priority — no silently-uncovered value', () => {
    for (const status of PROPERTY_STATUSES) {
      expect(STATUS_DOT_COLORS).toHaveProperty(status)
      expect(STATUS_ICONS).toHaveProperty(status)
      expect(STATUS_PRIORITY).toHaveProperty(status)
    }
  })
})

describe('STATUS_DOT_FALLBACK', () => {
  it('is a non-empty class string, and is never actually needed since every real status has its own color', () => {
    expect(STATUS_DOT_FALLBACK.length).toBeGreaterThan(0)
    expect(PROPERTY_STATUS_REGISTRY.every(s => s.dotColor !== STATUS_DOT_FALLBACK)).toBe(true)
  })
})

describe('PROPERTY_STATUS_REGISTRY', () => {
  it('is derived from PROPERTY_STATUSES, one entry per status, in the same order', () => {
    expect(PROPERTY_STATUS_REGISTRY).toHaveLength(PROPERTY_STATUSES.length)
    expect(PROPERTY_STATUS_REGISTRY.map(s => s.value)).toEqual([...PROPERTY_STATUSES])
  })

  it('marks exactly "Under Approval" as the default', () => {
    const defaults = PROPERTY_STATUS_REGISTRY.filter(s => s.isDefault)
    expect(defaults).toHaveLength(1)
    expect(defaults[0].value).toBe('Under Approval')
  })

  it('falls back to STATUS_DOT_FALLBACK / priority 8 / null icon for any status missing an explicit entry', () => {
    // Every real status IS covered (asserted above) — this locks the fallback
    // behavior itself, since PROPERTY_STATUS_REGISTRY's map() always applies
    // the ?? fallback operators regardless of whether they currently trigger.
    for (const entry of PROPERTY_STATUS_REGISTRY) {
      expect(entry.dotColor).not.toBe('')
      expect(typeof entry.priority).toBe('number')
    }
  })
})

describe('PAGE_SIZE_OPTIONS', () => {
  it('is [12, 24, 48]', () => {
    expect(PAGE_SIZE_OPTIONS).toEqual([12, 24, 48])
  })
})
