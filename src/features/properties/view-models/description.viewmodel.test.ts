import { describe, it, expect } from 'vitest'
import { buildDescriptionViewModel } from './description.viewmodel'

// Enterprise 100% Data Certification (2026-07-23) — Rule 3.

describe('buildDescriptionViewModel — null/edge cases', () => {
  it('both fields absent: isEmpty=true, both undefined (not null, not empty string)', () => {
    const vm = buildDescriptionViewModel({ description: undefined, cDescriptionGr: undefined })
    expect(vm.isEmpty).toBe(true)
    expect(vm.description).toBeUndefined()
    expect(vm.descriptionGr).toBeUndefined()
  })

  it('description is explicitly null (a real API shape, not just undefined): normalized to undefined, isEmpty=true', () => {
    const vm = buildDescriptionViewModel({ description: null, cDescriptionGr: undefined })
    expect(vm.description).toBeUndefined()
    expect(vm.isEmpty).toBe(true)
  })

  it('only description set: isEmpty=false, descriptionGr stays undefined', () => {
    const vm = buildDescriptionViewModel({ description: 'English text', cDescriptionGr: undefined })
    expect(vm.isEmpty).toBe(false)
    expect(vm.description).toBe('English text')
    expect(vm.descriptionGr).toBeUndefined()
  })

  it('only cDescriptionGr set: isEmpty=false', () => {
    const vm = buildDescriptionViewModel({ description: undefined, cDescriptionGr: 'Greek text' })
    expect(vm.isEmpty).toBe(false)
    expect(vm.descriptionGr).toBe('Greek text')
  })

  it('both set: isEmpty=false, both pass through independently', () => {
    const vm = buildDescriptionViewModel({ description: 'EN', cDescriptionGr: 'GR' })
    expect(vm.isEmpty).toBe(false)
    expect(vm.description).toBe('EN')
    expect(vm.descriptionGr).toBe('GR')
  })

  it('empty string description (not null/undefined, a real falsy string): treated as absent for isEmpty', () => {
    const vm = buildDescriptionViewModel({ description: '', cDescriptionGr: undefined })
    expect(vm.isEmpty).toBe(true)
  })
})
