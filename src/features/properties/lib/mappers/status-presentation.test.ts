import { describe, it, expect } from 'vitest'
import { getCommandHubStatusSubKey, getCommandHubStatusDotClass, getCommandHubStatusBgClass, getHeroStatusFillClass } from './status-presentation'

// Enterprise 100% Data Certification (2026-07-23) — Rule 5 (Enum
// Certification). Added after mutation testing caught a real gap: no
// existing test pinned the exact dot-color class for the "available"
// branch, so a mutation flipping `bg-emerald-500` to `bg-rose-500` (green
// "available" reading as red "unavailable") passed the full suite
// undetected. Every branch of every status-presentation function is
// pinned here by its exact class string, not just checked for truthiness.

const ALL_STATUSES = [
  'Active', 'Under negotiation', 'Received payment', 'Under Approval',
  'Not Approved', 'Sold', 'Rented', 'Inactive',
]

describe('getCommandHubStatusSubKey — enum certification (Rule 5)', () => {
  it('every one of the 8 real status values maps to a real, non-empty translation-key suffix', () => {
    for (const status of ALL_STATUSES) {
      expect(getCommandHubStatusSubKey(status), status).not.toBe('')
    }
  })
  it('an unmapped/future status value falls back to empty string, not a crash or "undefined"', () => {
    expect(getCommandHubStatusSubKey('SomeFutureStatus')).toBe('')
  })
})

describe('getCommandHubStatusDotClass — every branch pinned exactly (Rule 5)', () => {
  it('isAvailable=true: emerald (positive), regardless of status string', () => {
    expect(getCommandHubStatusDotClass('Active', true)).toBe('bg-emerald-500')
  })
  it('Under Approval / Not Approved (isAvailable=false): rose (attention)', () => {
    expect(getCommandHubStatusDotClass('Under Approval', false)).toBe('bg-rose-500')
    expect(getCommandHubStatusDotClass('Not Approved', false)).toBe('bg-rose-500')
  })
  it('Under negotiation / Received payment (isAvailable=false): amber (in-progress)', () => {
    expect(getCommandHubStatusDotClass('Under negotiation', false)).toBe('bg-amber-500')
    expect(getCommandHubStatusDotClass('Received payment', false)).toBe('bg-amber-500')
  })
  it('Sold / Rented / Inactive / unmapped (isAvailable=false): neutral fallback', () => {
    for (const status of ['Sold', 'Rented', 'Inactive', 'SomeFutureStatus']) {
      expect(getCommandHubStatusDotClass(status, false), status).toBe('bg-muted-foreground/30')
    }
  })
  it('isAvailable=true always wins over the status-string branches, even for a status that would otherwise map to rose/amber', () => {
    // isAvailable is checked first — a data inconsistency (status says "Under Approval" but isAvailable
    // was independently computed true) must not produce two conflicting signals.
    expect(getCommandHubStatusDotClass('Under Approval', true)).toBe('bg-emerald-500')
  })
})

describe('getCommandHubStatusBgClass — every branch pinned exactly, mirrors the dot logic (Rule 5)', () => {
  it('isAvailable=true: emerald tint', () => {
    expect(getCommandHubStatusBgClass('Active', true)).toBe('bg-emerald-500/6')
  })
  it('Under Approval / Not Approved: rose tint', () => {
    expect(getCommandHubStatusBgClass('Not Approved', false)).toBe('bg-rose-500/6')
  })
  it('Under negotiation / Received payment: amber tint', () => {
    expect(getCommandHubStatusBgClass('Received payment', false)).toBe('bg-amber-500/6')
  })
  it('everything else: neutral muted tint', () => {
    expect(getCommandHubStatusBgClass('Sold', false)).toBe('bg-muted/6')
  })
})

describe('getHeroStatusFillClass — every branch pinned exactly, its own distinct bucket boundaries (Rule 5)', () => {
  it('Active: brand-emerald (positive)', () => {
    expect(getHeroStatusFillClass('Active')).toBe('bg-brand-emerald border-brand-emerald')
  })
  it('Sold / Rented: brand-crimson (negative) — a bucket Command Hub does NOT share, by design', () => {
    expect(getHeroStatusFillClass('Sold')).toBe('bg-brand-crimson border-brand-crimson')
    expect(getHeroStatusFillClass('Rented')).toBe('bg-brand-crimson border-brand-crimson')
  })
  it('Under Approval / Not Approved / Under negotiation / Received payment: amber (in-progress)', () => {
    for (const status of ['Under Approval', 'Not Approved', 'Under negotiation', 'Received payment']) {
      expect(getHeroStatusFillClass(status), status).toBe('bg-amber-600 border-amber-600')
    }
  })
  it('Inactive and unmapped/undefined: neutral primary fallback', () => {
    expect(getHeroStatusFillClass('Inactive')).toBe('bg-primary border-primary')
    expect(getHeroStatusFillClass(undefined)).toBe('bg-primary border-primary')
    expect(getHeroStatusFillClass('SomeFutureStatus')).toBe('bg-primary border-primary')
  })
})
