import { describe, it, expect } from 'vitest'
import { buildContactsViewModel } from './contacts.viewmodel'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.

describe('buildContactsViewModel — null/edge cases (Rule 3)', () => {
  it('all three fields absent: empty contacts, isEmpty=true, no crash', () => {
    const vm = buildContactsViewModel({})
    expect(vm.contacts).toEqual([])
    expect(vm.isEmpty).toBe(true)
  })

  it('contactsIds present but contactsNames/contactsColumns absent: falls back safely per contact, no crash on undefined lookup', () => {
    const vm = buildContactsViewModel({ contactsIds: ['c1'], contactsNames: undefined, contactsColumns: undefined })
    expect(vm.contacts).toEqual([{ id: 'c1', name: 'Unnamed Contact', role: undefined }])
  })

  it('a contactsIds entry with no matching contactsNames key: "Unnamed Contact" fallback, not "undefined"', () => {
    const vm = buildContactsViewModel({ contactsIds: ['c1', 'c2'], contactsNames: { c1: 'Real Name' } })
    expect(vm.contacts[0].name).toBe('Real Name')
    expect(vm.contacts[1].name).toBe('Unnamed Contact')
  })

  it('role is null in contactsColumns (real API shape): normalized to undefined, not passed through as null', () => {
    const vm = buildContactsViewModel({
      contactsIds: ['c1'], contactsNames: { c1: 'Name' }, contactsColumns: { c1: { role: null } },
    })
    expect(vm.contacts[0].role).toBeUndefined()
  })

  it('role is a real string: passes through unchanged', () => {
    const vm = buildContactsViewModel({
      contactsIds: ['c1'], contactsNames: { c1: 'Name' }, contactsColumns: { c1: { role: 'Owner' } },
    })
    expect(vm.contacts[0].role).toBe('Owner')
  })

  it('contactsIds empty array (not absent): still empty/isEmpty=true, same as absent', () => {
    const vm = buildContactsViewModel({ contactsIds: [], contactsNames: { c1: 'Ghost' } })
    expect(vm.contacts).toEqual([])
    expect(vm.isEmpty).toBe(true)
  })
})

describe('buildContactsViewModel — multi-contact ordering (Rule 4)', () => {
  it('preserves contactsIds array order exactly, does not resort by name', () => {
    const vm = buildContactsViewModel({
      contactsIds: ['c3', 'c1', 'c2'],
      contactsNames: { c1: 'Alice', c2: 'Bob', c3: 'Carol' },
    })
    expect(vm.contacts.map(c => c.name)).toEqual(['Carol', 'Alice', 'Bob'])
  })
})
