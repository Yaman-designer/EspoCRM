import { describe, it, expect } from 'vitest'
import { buildHeroViewModel } from './hero.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 5 (Enum).
// This ViewModel's `statusFillClass` is exactly what mutation testing
// caught as under-protected in status-presentation.ts — pinned exactly
// here too, since this is the actual consumer.

describe('buildHeroViewModel — pass-through fields (Rule 3)', () => {
  it('imageIds/title/location pass through byte-for-byte exactly as given — this ViewModel does not recompute them', () => {
    const vm = buildHeroViewModel(buildProperty({}), ['a', 'b'], 'My Title', 'My Location')
    expect(vm.imageIds).toEqual(['a', 'b'])
    expect(vm.title).toBe('My Title')
    expect(vm.location).toBe('My Location')
  })

  it('empty imageIds array: passes through as empty, not fabricated', () => {
    const vm = buildHeroViewModel(buildProperty({}), [], 'T', 'L')
    expect(vm.imageIds).toEqual([])
  })

  it('all 4 quality-indicator booleans pass through independently — proven with only 2 of 4 true, none coerced or dropped', () => {
    const vm = buildHeroViewModel(buildProperty({ isFeatured: true, isVerified: false, isPremium: true, isNewListing: undefined }), [], 'T', 'L')
    expect(vm.isFeatured).toBe(true)
    expect(vm.isVerified).toBe(false)
    expect(vm.isPremium).toBe(true)
    expect(vm.isNewListing).toBeUndefined()
  })
})

describe('buildHeroViewModel — statusFillClass enum certification (Rule 5)', () => {
  it('Active: brand-emerald', () => {
    expect(buildHeroViewModel(buildProperty({ status: 'Active' }), [], 'T', 'L').statusFillClass)
      .toBe('bg-brand-emerald border-brand-emerald')
  })
  it('Sold / Rented: brand-crimson', () => {
    expect(buildHeroViewModel(buildProperty({ status: 'Sold' }), [], 'T', 'L').statusFillClass)
      .toBe('bg-brand-crimson border-brand-crimson')
    expect(buildHeroViewModel(buildProperty({ status: 'Rented' }), [], 'T', 'L').statusFillClass)
      .toBe('bg-brand-crimson border-brand-crimson')
  })
  it('the 4 "in progress" statuses: amber', () => {
    for (const status of ['Under Approval', 'Not Approved', 'Under negotiation', 'Received payment']) {
      expect(buildHeroViewModel(buildProperty({ status }), [], 'T', 'L').statusFillClass, status)
        .toBe('bg-amber-600 border-amber-600')
    }
  })
  it('Inactive and any unmapped future status: neutral primary fallback, not a crash', () => {
    expect(buildHeroViewModel(buildProperty({ status: 'Inactive' }), [], 'T', 'L').statusFillClass)
      .toBe('bg-primary border-primary')
    expect(buildHeroViewModel(buildProperty({ status: 'SomeFutureStatus' }), [], 'T', 'L').statusFillClass)
      .toBe('bg-primary border-primary')
  })
})
