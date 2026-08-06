import { describe, it, expect } from 'vitest'
import { buildBriefingViewModel } from './briefing.viewmodel'
import type { PropertyNarrative } from '../lib/property-narrative'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.

function narrative(summary: string | null): PropertyNarrative {
  return { headline: null, summary, lifestyleNarrative: null, locationNarrative: null, sellingNarrative: null }
}
const emptyNarrative = narrative(null)
const baseProperty = { status: 'Active', type: undefined, locationName: undefined, regionLocationName: undefined, requestType: undefined, propertyCode: undefined }

describe('buildBriefingViewModel — null/edge cases (Rule 3)', () => {
  it('narrative has no summary: falls back to the templated sentence, no crash', () => {
    const vm = buildBriefingViewModel(emptyNarrative, baseProperty, 'Test Property')
    expect(vm.insight.length).toBeGreaterThan(0)
  })

  it('narrative HAS a real summary: that summary drives insight/supporting, not the fallback template', () => {
    const vm = buildBriefingViewModel(narrative('A real generated narrative sentence about this listing.'), baseProperty, 'Test Property')
    expect(vm.insight + vm.supporting).toContain('real generated narrative')
  })

  it('requestType absent/empty: requestTypeLabel is null, not an empty "For " string', () => {
    expect(buildBriefingViewModel(emptyNarrative, { ...baseProperty, requestType: undefined }, 'X').requestTypeLabel).toBeNull()
    expect(buildBriefingViewModel(emptyNarrative, { ...baseProperty, requestType: '  ' }, 'X').requestTypeLabel).toBeNull()
  })

  it('requestType present: requestTypeLabel is "For {type}", trimmed', () => {
    expect(buildBriefingViewModel(emptyNarrative, { ...baseProperty, requestType: ' Rent ' }, 'X').requestTypeLabel).toBe('For Rent')
  })

  it('locationName absent, regionLocationName present: fallback template uses region as the location', () => {
    const vm = buildBriefingViewModel(emptyNarrative, {
      ...baseProperty, locationName: undefined, regionLocationName: 'North Region', type: 'apartment',
    }, 'Test Property')
    expect(vm.insight + vm.supporting).toContain('North Region')
  })

  it('neither locationName nor regionLocationName: fallback template omits the location clause entirely, no "in undefined"', () => {
    const vm = buildBriefingViewModel(emptyNarrative, {
      ...baseProperty, locationName: undefined, regionLocationName: undefined, type: 'apartment',
    }, 'Test Property')
    expect(vm.insight + vm.supporting).not.toContain('undefined')
    expect(vm.insight + vm.supporting).not.toContain('null')
  })

  it('type absent: fallback template uses the generic word "property", not "undefined"', () => {
    const vm = buildBriefingViewModel(emptyNarrative, { ...baseProperty, type: undefined }, 'Test Property')
    expect(vm.insight + vm.supporting).toContain('property')
    expect(vm.insight + vm.supporting).not.toContain('undefined')
  })
})

describe('buildBriefingViewModel — sentence-split conditional matrix (Rule 4)', () => {
  it('short narrative (no real sentence boundary in range): insight holds the whole cut, supporting may be empty', () => {
    const vm = buildBriefingViewModel(narrative('Short.'), baseProperty, 'X')
    expect(vm.insight).toBeTruthy()
  })

  it('a long two-sentence narrative splits at the real sentence boundary, not mid-word', () => {
    const vm = buildBriefingViewModel(
      narrative('This is the first complete sentence of the narrative text. This is the second supporting clause that follows it.'),
      baseProperty, 'X',
    )
    expect(vm.insight.endsWith('.')).toBe(true)
    expect(vm.supporting.length).toBeGreaterThan(0)
    // Neither half should end or start mid-word (no dangling partial word split by a hard cut).
    expect(vm.insight.endsWith(' ')).toBe(false)
  })
})
