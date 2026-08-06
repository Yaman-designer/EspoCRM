import { describe, it, expect } from 'vitest'
import { buildOperationsViewModel } from './operations.viewmodel'
import { buildProperty } from '@/test/builders/property'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.

describe('buildOperationsViewModel — null/edge cases (Rule 3)', () => {
  it('bare minimal property (only required fields): no crash, safe fallbacks throughout', () => {
    const vm = buildOperationsViewModel(buildProperty({}))
    expect(vm.isAvailable).toBe(false)
    expect(vm.propertyInfoParts).toEqual([])
    expect(vm.assignedAgentName).toBeUndefined()
    expect(vm.assignedAgentInitial).toBeNull()
    expect(vm.hasActivity).toBe(false)
    expect(vm.callCount).toBe(0)
    expect(vm.meetingCount).toBe(0)
    expect(vm.taskCount).toBe(0)
  })

  it('keys/cSold: true/false/null-undefined all three render distinct, correct values — false is never confused with "unset"', () => {
    // Enterprise Localization pass (2026-07-24): this ViewModel now emits
    // the raw tri-state instead of a hardcoded 'Yes'/'No'/'' string —
    // translating a boolean into display text is OperationsCommandHub.tsx's
    // job (via t()), not this data-only file's.
    const trueVm  = buildOperationsViewModel(buildProperty({ keys: true, cSold: true }))
    const falseVm = buildOperationsViewModel(buildProperty({ keys: false, cSold: false }))
    const unsetVm = buildOperationsViewModel(buildProperty({}))

    expect(trueVm.listingInfo.keysHeld).toBe(true)
    expect(trueVm.listingInfo.sold).toBe(true)

    expect(falseVm.listingInfo.keysHeld).toBe(false)
    expect(falseVm.listingInfo.sold).toBe(false)

    expect(unsetVm.listingInfo.keysHeld).toBeNull()
    expect(unsetVm.listingInfo.sold).toBeNull()
  })

  it('assignedUserName empty string vs undefined: both produce no agent, no crash on charAt', () => {
    const emptyVm = buildOperationsViewModel(buildProperty({ assignedUserName: '' }))
    const undefinedVm = buildOperationsViewModel(buildProperty({ assignedUserName: undefined }))
    expect(emptyVm.assignedAgentInitial).toBeNull()
    expect(undefinedVm.assignedAgentInitial).toBeNull()
  })

  it('teamsNames empty object: teams string is empty, not "undefined" or a crash on Object.values', () => {
    const vm = buildOperationsViewModel(buildProperty({ teamsNames: {} }))
    expect(vm.listingInfo.teams).toBe('')
  })

  it('unknown/unmapped status value: does not crash, statusSub falls back to empty string', () => {
    const vm = buildOperationsViewModel(buildProperty({ status: 'SomeFutureStatusNotYetMapped' }))
    expect(vm.statusValue).toBe('SomeFutureStatusNotYetMapped')
    expect(vm.statusSub).toBe('')
    expect(vm.statusDotClass).toBeTruthy() // has SOME fallback class, not undefined/empty
  })
})

describe('buildOperationsViewModel — conditional branch matrix (Rule 4)', () => {
  it('propertyInfoParts: only populates entries for fields that are actually set, in type/category/cAssignment order', () => {
    expect(buildOperationsViewModel(buildProperty({ type: 'apartment' })).propertyInfoParts).toEqual(['apartment'])
    expect(buildOperationsViewModel(buildProperty({ category: 'Land' })).propertyInfoParts).toEqual(['Land'])
    expect(buildOperationsViewModel(buildProperty({ cAssignment: 'Exclusive' })).propertyInfoParts).toEqual(['Exclusive'])
    expect(buildOperationsViewModel(buildProperty({
      type: 'apartment', category: 'Residential', cAssignment: 'Simple',
    })).propertyInfoParts).toEqual(['apartment', 'Residential', 'Simple'])
  })

  it('isAvailable is true iff status is exactly "Active" — every other real status value is false', () => {
    const activeVm = buildOperationsViewModel(buildProperty({ status: 'Active' }))
    expect(activeVm.isAvailable).toBe(true)
    for (const status of ['Under Approval', 'Not Approved', 'Under negotiation', 'Received payment', 'Rented', 'Sold', 'Inactive']) {
      expect(buildOperationsViewModel(buildProperty({ status })).isAvailable, `status=${status}`).toBe(false)
    }
  })

  it('hasActivity: false when all 3 activity arrays are empty/absent, true if ANY one has an entry', () => {
    expect(buildOperationsViewModel(buildProperty({})).hasActivity).toBe(false)
    expect(buildOperationsViewModel(buildProperty({ calls: [] , meetings: [], tasks: [] })).hasActivity).toBe(false)
    expect(buildOperationsViewModel(buildProperty({
      calls: [{ id: 'c1', name: 'Call', status: 'Held', dateStart: null }],
    })).hasActivity).toBe(true)
    expect(buildOperationsViewModel(buildProperty({
      meetings: [{ id: 'm1', name: 'Meeting', status: 'Held', dateStart: null, dateEnd: null }],
    })).hasActivity).toBe(true)
    expect(buildOperationsViewModel(buildProperty({
      tasks: [{ id: 't1', name: 'Task', status: 'Not Started', dateEnd: null }],
    })).hasActivity).toBe(true)
  })

  it('officeNotes/aiEvaluatorNotes: pass through undefined vs a real string distinctly, never coerced to empty string', () => {
    const unset = buildOperationsViewModel(buildProperty({}))
    const set = buildOperationsViewModel(buildProperty({ cOfficeNotes: 'Internal note', cPropertyEvaluatorAI: 'AI note' }))
    expect(unset.officeNotes).toBeUndefined()
    expect(unset.aiEvaluatorNotes).toBeUndefined()
    expect(set.officeNotes).toBe('Internal note')
    expect(set.aiEvaluatorNotes).toBe('AI note')
  })
})
