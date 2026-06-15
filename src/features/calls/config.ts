import { z } from 'zod'
import { Phone, Settings2 } from 'lucide-react'
import type { ColumnConfig } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── Type ──────────────────────────────────────────────────────────────────────

export interface Call {
  id: string
  name: string
  status?: string
  direction?: string
  dateStart?: string
  dateEnd?: string
  description?: string
  assignedUserId?: string
  assignedUserName?: string
  createdAt?: string
  modifiedAt?: string
}

// ── Schema ────────────────────────────────────────────────────────────────────

const callSchema = z.object({
  name:           z.string().min(1, 'Subject is required'),
  status:         z.string().optional(),
  direction:      z.string().optional(),
  dateStart:      z.string().optional(),
  assignedUserId: z.string().optional(),
  description:    z.string().max(2000).optional(),
})

// ── Form sections ─────────────────────────────────────────────────────────────

const callSections: FormSectionConfig[] = [
  {
    key:     'details',
    title:   'Call Details',
    icon:    Phone,
    columns: 2,
    fields: [
      {
        name:        'name',
        label:       'Subject',
        type:        'text',
        required:    true,
        placeholder: 'Call subject',
        colSpan:     2,
      },
      {
        name:  'status',
        label: 'Status',
        type:  'select',
        options: [
          { value: 'Planned',  label: 'Planned'  },
          { value: 'Held',     label: 'Held'     },
          { value: 'Not Held', label: 'Not Held' },
        ],
      },
      {
        name:  'direction',
        label: 'Direction',
        type:  'select',
        options: [
          { value: 'Outbound', label: 'Outbound' },
          { value: 'Inbound',  label: 'Inbound'  },
        ],
      },
      {
        name:  'dateStart',
        label: 'Date & Time',
        type:  'date',
      },
    ],
  },
  {
    key:     'crm',
    title:   'Assignment & Notes',
    icon:    Settings2,
    columns: 2,
    fields: [
      {
        name:        'assignedUserId',
        label:       'Assigned To',
        type:        'select',
        resource:    'users',
        placeholder: 'Select team member…',
      },
      {
        name:        'description',
        label:       'Description',
        type:        'textarea',
        rows:        3,
        colSpan:     2,
        placeholder: 'Notes about this call…',
      },
    ],
  },
]

// ── Columns ───────────────────────────────────────────────────────────────────

const callColumns: ColumnConfig<Call>[] = [
  {
    key:      'name',
    label:    'Subject',
    type:     'text',
    sortable: true,
  },
  {
    key:      'status',
    label:    'Status',
    type:     'badge',
    badgeMap: {
      'Planned':  'info',
      'Held':     'success',
      'Not Held': 'cancelled',
    },
  },
  {
    key:   'direction',
    label: 'Direction',
    type:  'text',
  },
  {
    key:        'dateStart',
    label:      'Date',
    type:       'date',
    responsive: 'md',
  },
  {
    key:        'assignedUserName',
    label:      'Assigned To',
    type:       'text',
    responsive: 'lg',
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

export const callsConfig: ResourceConfig<Call> = {
  endpoint: '/Call',
  queryKey: 'calls',

  columns:      callColumns,
  formSections: callSections,
  schema:       callSchema,

  viewFields: [
    { key: 'name',             label: 'Subject'    },
    {
      key:      'status',
      label:    'Status',
      type:     'badge',
      badgeMap: { 'Planned': 'info', 'Held': 'success', 'Not Held': 'cancelled' },
    },
    { key: 'direction',        label: 'Direction'   },
    { key: 'dateStart',        label: 'Date',        type: 'datetime' },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'description',      label: 'Description' },
  ],

  getEntityName: (c) => c.name || c.id,

  title:           'Calls',
  subtitle:        'Manage your CRM calls',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Calls' },
  ],
  icon:            Phone,
  entitySingular:  'Call',
  assignedUserKey: 'assignedUserName',

  quickFilters: [
    { label: 'All',      value: null },
    { label: 'Planned',  column: 'status', value: 'Planned',  badgeVariant: 'info'      },
    { label: 'Held',     column: 'status', value: 'Held',     badgeVariant: 'success'   },
    { label: 'Not Held', column: 'status', value: 'Not Held', badgeVariant: 'cancelled' },
  ],

  searchPlaceholder: 'Search calls...',
  addLabel:          'Log Call',
  emptyTitle:        'No calls logged',
  emptyDescription:  'Log your first call to get started.',
}
