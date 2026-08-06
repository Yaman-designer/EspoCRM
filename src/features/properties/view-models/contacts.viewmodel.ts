import type { RealEstateProperty } from '../types/property.types'

export interface ContactRowViewModel {
  id: string
  name: string
  role?: string
}

export interface ContactsViewModel {
  contacts: ContactRowViewModel[]
  isEmpty: boolean
}

type ContactsFields = Pick<RealEstateProperty, 'contactsIds' | 'contactsNames' | 'contactsColumns'>

/**
 * Shapes ContactsCard's per-contact rows — the id→name/role lookup (from
 * EspoCRM's parallel-array linkMultiple shape) used to happen inline inside
 * the component's `.map()`.
 */
export function buildContactsViewModel(property: ContactsFields): ContactsViewModel {
  const { contactsIds = [], contactsNames = {}, contactsColumns = {} } = property

  const contacts: ContactRowViewModel[] = contactsIds.map(id => ({
    id,
    name: contactsNames[id] ?? 'Unnamed Contact',
    role: contactsColumns[id]?.role ?? undefined,
  }))

  return { contacts, isEmpty: contacts.length === 0 }
}
