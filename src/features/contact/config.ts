import { Users } from 'lucide-react'
import { contactSchema } from './schema'
import { contactSections } from './fields'
import { contactColumns } from './columns'
import type { Contact } from './types'
import type { ResourceConfig } from '@/components/crud/resource-config'

export const contactsConfig: ResourceConfig<Contact> = {
  // ── API ────────────────────────────────────────────────────────────────────
  endpoint:  '/Contact',
  queryKey:  'contacts',

  // ── Table ──────────────────────────────────────────────────────────────────
  columns:      contactColumns,

  // ── Form ───────────────────────────────────────────────────────────────────
  formSections: contactSections,
  schema:       contactSchema,

  // ── View panel ─────────────────────────────────────────────────────────────
  viewFields: [
    { key: 'name',             label: 'Full Name'   },
    { key: 'emailAddress',     label: 'Email'       },
    { key: 'phoneNumber',      label: 'Phone'       },
    { key: 'accountName',      label: 'Company'     },
    { key: 'title',            label: 'Job Title'   },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'createdAt',        label: 'Created',    type: 'datetime' },
    { key: 'description',      label: 'Notes'       },
  ],

  // ── Entity identity ────────────────────────────────────────────────────────
  getEntityName: (c) => c.name || `${c.firstName} ${c.lastName}`.trim() || c.id,

  // ── Page metadata ──────────────────────────────────────────────────────────
  title:           'Contacts',
  subtitle:        'Manage your CRM contacts',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Contacts' },
  ],
  icon:            Users,
  entitySingular:  'Contact',
  assignedUserKey: 'assignedUserName',

  // ── DataTable defaults ─────────────────────────────────────────────────────
  searchPlaceholder: 'Search contacts...',
  addLabel:          'Add Contact',
  emptyTitle:        'No contacts yet',
  emptyDescription:  'Add your first contact to get started.',
}
