import { describe, it, expect } from 'vitest'
import {
  canTransition, canPublish, validateStatusChange, requiresOwner,
  PROPERTY_STATUS_TRANSITIONS, MIN_COMPLETENESS_TO_PUBLISH,
} from './property-lifecycle.rules'
import { buildProperty } from '@/test/builders/property'

describe('canTransition', () => {
  it('always allows a new record (from undefined)', () => {
    expect(canTransition(undefined, 'Active')).toEqual({ allowed: true })
  })

  it('always allows a no-op transition (from === to)', () => {
    expect(canTransition('Active', 'Active')).toEqual({ allowed: true })
  })

  it('allows every transition declared in PROPERTY_STATUS_TRANSITIONS', () => {
    for (const [from, allowedNext] of Object.entries(PROPERTY_STATUS_TRANSITIONS)) {
      for (const to of allowedNext) {
        expect(canTransition(from, to)).toEqual({ allowed: true })
      }
    }
  })

  it('blocks a transition out of the terminal Sold status', () => {
    const result = canTransition('Sold', 'Active')
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/Sold.*Active/)
    expect(result.reason).toMatch(/none — this status is final/)
  })

  it('blocks an transition not in the allowed-next list', () => {
    const result = canTransition('Under Approval', 'Sold')
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain('Active, Not Approved')
  })

  it('does not block an unrecognized prior status (future EspoCRM value this app does not know)', () => {
    expect(canTransition('SomeFutureStatus', 'Active')).toEqual({ allowed: true })
  })
})

describe('canPublish', () => {
  it('allows publishing a property at or above the completeness threshold', () => {
    const complete = buildProperty({
      mainImageId: 'img-1',
      price: 250000,
      addressCity: 'Athens',
      bedroomCount: 2,
      type: 'apartment',
      assignedUserName: 'Agent',
      requestType: 'Sale',
    })
    expect(canPublish(complete)).toEqual({ allowed: true })
  })

  it('blocks publishing a property below the completeness threshold, naming what is missing', () => {
    const bare = buildProperty({ price: 250000 })
    const result = canPublish(bare)
    expect(result.allowed).toBe(false)
    expect(result.reason).toContain(`needs ${MIN_COMPLETENESS_TO_PUBLISH}%`)
    expect(result.reason).toMatch(/Photos/)
  })
})

describe('validateStatusChange', () => {
  it('rejects an illegal transition before ever checking completeness', () => {
    const result = validateStatusChange('Sold', 'Active', buildProperty())
    expect(result.allowed).toBe(false)
    expect(result.reason).toMatch(/Cannot move from/)
  })

  it('applies the completeness gate only when moving into Active', () => {
    const incomplete = buildProperty()
    expect(validateStatusChange('Under Approval', 'Active', incomplete).allowed).toBe(false)
    // Same incomplete record, but the target status isn't Active — no gate.
    expect(validateStatusChange('Under Approval', 'Not Approved', incomplete)).toEqual({ allowed: true })
  })
})

describe('requiresOwner', () => {
  it('is unconditionally true regardless of status (assignedUser is always required live)', () => {
    expect(requiresOwner('Under Approval')).toBe(true)
    expect(requiresOwner('Sold')).toBe(true)
    expect(requiresOwner('')).toBe(true)
  })
})
