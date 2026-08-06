import { describe, it, expect } from 'vitest'
import { isAclActionDenied } from './espo-acl'
import type { EspoAclData } from './espo-acl'

// Regression coverage for the "Missing Delete ACL" root cause confirmed
// live against EspoCRM (scripts/investigate-403.mjs): the "Real Estate
// Agent" role has no ACL scope entry at all for RealEstateProperty, and a
// real DELETE against it returns 403 with X-Status-Reason: "No delete
// access." isAclActionDenied must treat that missing-entry case as denied
// so the app's delete gate blocks it client-side instead of only finding
// out after the server rejects the request.

describe('isAclActionDenied', () => {
  it('denies when the entity scope is entirely absent from acl.data (missing ACL scope)', () => {
    const acl: EspoAclData = {} // exactly what /App/user returned for "Real Estate Agent"
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(true)
  })

  it('denies when acl itself is undefined (e.g. session still loading)', () => {
    expect(isAclActionDenied(undefined, 'RealEstateProperty', 'delete')).toBe(true)
  })

  it('denies when the action is explicitly "no"', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: 'no' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(true)
  })

  it('denies when the action is explicitly false', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: false } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(true)
  })

  it('allows when the action is explicitly granted ("all")', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: 'all' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(false)
  })

  it('allows when the action is explicitly granted ("own")', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: 'own' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(false)
  })

  it('allows when the action is explicitly granted ("team")', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: 'team' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(false)
  })

  it('allows when the action is explicitly granted (true)', () => {
    const acl: EspoAclData = { RealEstateProperty: { delete: true } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(false)
  })

  it('scopes the check to the given entity type — a sibling scope missing delete does not affect it', () => {
    const acl: EspoAclData = { Contact: { delete: 'all' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(true)
  })

  it('scopes the check to the given action — read being granted does not imply delete is granted', () => {
    const acl: EspoAclData = { RealEstateProperty: { read: 'all' } }
    expect(isAclActionDenied(acl, 'RealEstateProperty', 'delete')).toBe(true)
  })
})
