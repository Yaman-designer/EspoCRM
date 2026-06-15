import { z } from 'zod'
import { ClipboardList, Settings2 } from 'lucide-react'
import type { ColumnConfig } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── Type ──────────────────────────────────────────────────────────────────────

export interface Request {
  id: string
  name: string
  status?: string
  description?: string
  assignedUserId?: string
  assignedUserName?: string
  createdAt?: string
  modifiedAt?: string
}

// ── Schema ────────────────────────────────────────────────────────────────────

const requestSchema = z.object({
  name:           z.string().min(1, 'Title is required'),
  status:         z.string().optional(),
  assignedUserId: z.string().optional(),
  description:    z.string().max(2000).optional(),
})

// ── Form sections ─────────────────────────────────────────────────────────────

const requestSections: FormSectionConfig[] = [
  {
    key:     'details',
    title:   'Request Details',
    icon:    ClipboardList,
    columns: 2,
    fields: [
      {
        name:        'name',
        label:       'Title',
        type:        'text',
        required:    true,
        placeholder: 'Request title',
        colSpan:     2,
      },
      {
        name:  'status',
        label: 'Status',
        type:  'select',
        options: [
          { value: 'New',        label: 'New'        },
          { value: 'Assigned',   label: 'Assigned'   },
          { value: 'In Process', label: 'In Process' },
          { value: 'Converted',  label: 'Converted'  },
          { value: 'Recycled',   label: 'Recycled'   },
          { value: 'Dead',       label: 'Dead'       },
        ],
      },
      {
        name:        'assignedUserId',
        label:       'Assigned To',
        type:        'select',
        resource:    'users',
        placeholder: 'Select team member…',
      },
    ],
  },
  {
    key:     'notes',
    title:   'Notes',
    icon:    Settings2,
    columns: 1,
    fields: [
      {
        name:        'description',
        label:       'Description',
        type:        'textarea',
        rows:        4,
        placeholder: 'Request details or notes…',
      },
    ],
  },
]

// ── Columns ───────────────────────────────────────────────────────────────────

const requestColumns: ColumnConfig<Request>[] = [
  {
    key:      'name',
    label:    'Title',
    type:     'text',
    sortable: true,
  },
  {
    key:      'status',
    label:    'Status',
    type:     'badge',
    badgeMap: {
      'New':        'info',
      'Assigned':   'warning',
      'In Process': 'on-process',
      'Converted':  'success',
      'Recycled':   'secondary',
      'Dead':       'cancelled',
    },
  },
  {
    key:        'assignedUserName',
    label:      'Assigned To',
    type:       'text',
    responsive: 'md',
  },
  {
    key:        'createdAt',
    label:      'Created',
    type:       'date',
    responsive: 'lg',
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

export const requestsConfig: ResourceConfig<Request> = {
  endpoint: '/RealEstateRequest',
  queryKey: 'requests',

  columns:      requestColumns,
  formSections: requestSections,
  schema:       requestSchema,

  viewFields: [
    { key: 'name',   label: 'Title' },
    {
      key:      'status',
      label:    'Status',
      type:     'badge',
      badgeMap: {
        'New':        'info',
        'Assigned':   'warning',
        'In Process': 'on-process',
        'Converted':  'success',
        'Recycled':   'secondary',
        'Dead':       'cancelled',
      },
    },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'createdAt',        label: 'Created',     type: 'datetime' },
    { key: 'description',      label: 'Description' },
  ],

  getEntityName: (r) => r.name || r.id,

  title:           'Requests',
  subtitle:        'Manage your CRM requests',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Requests' },
  ],
  icon:            ClipboardList,
  entitySingular:  'Request',
  assignedUserKey: 'assignedUserName',

  quickFilters: [
    { label: 'All',        value: null },
    { label: 'New',        column: 'status', value: 'New',        badgeVariant: 'info'       },
    { label: 'Assigned',   column: 'status', value: 'Assigned',   badgeVariant: 'warning'    },
    { label: 'In Process', column: 'status', value: 'In Process', badgeVariant: 'on-process' },
    { label: 'Converted',  column: 'status', value: 'Converted',  badgeVariant: 'success'    },
  ],

  searchPlaceholder: 'Search requests...',
  addLabel:          'New Request',
  emptyTitle:        'No requests yet',
  emptyDescription:  'Create your first request to get started.',
}
