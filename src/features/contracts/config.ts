import { z } from 'zod'
import { FileText, Settings2 } from 'lucide-react'
import type { ColumnConfig } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── Type ──────────────────────────────────────────────────────────────────────

export interface Contract {
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

const contractSchema = z.object({
  name:           z.string().min(1, 'Contract name is required'),
  status:         z.string().optional(),
  assignedUserId: z.string().optional(),
  description:    z.string().max(2000).optional(),
})

// ── Form sections ─────────────────────────────────────────────────────────────

const contractSections: FormSectionConfig[] = [
  {
    key:     'details',
    title:   'Contract Details',
    icon:    FileText,
    columns: 2,
    fields: [
      {
        name:        'name',
        label:       'Contract Name',
        type:        'text',
        required:    true,
        placeholder: 'Contract name',
        colSpan:     2,
      },
      {
        name:  'status',
        label: 'Status',
        type:  'select',
        options: [
          { value: 'Draft',     label: 'Draft'     },
          { value: 'Active',    label: 'Active'    },
          { value: 'Completed', label: 'Completed' },
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
        placeholder: 'Contract notes or details…',
      },
    ],
  },
]

// ── Columns ───────────────────────────────────────────────────────────────────

const contractColumns: ColumnConfig<Contract>[] = [
  {
    key:      'name',
    label:    'Name',
    type:     'text',
    sortable: true,
  },
  {
    key:      'status',
    label:    'Status',
    type:     'badge',
    badgeMap: {
      'Draft':     'secondary',
      'Active':    'success',
      'Completed': 'won',
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

export const contractsConfig: ResourceConfig<Contract> = {
  endpoint: '/EblaContractParty',
  queryKey: 'contracts',

  columns:      contractColumns,
  formSections: contractSections,
  schema:       contractSchema,

  viewFields: [
    { key: 'name',             label: 'Contract Name' },
    {
      key:      'status',
      label:    'Status',
      type:     'badge',
      badgeMap: { 'Draft': 'secondary', 'Active': 'success', 'Completed': 'won' },
    },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'createdAt',        label: 'Created',      type: 'datetime' },
    { key: 'description',      label: 'Description'  },
  ],

  getEntityName: (c) => c.name || c.id,

  title:           'Contracts',
  subtitle:        'Manage your CRM contracts',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Contracts' },
  ],
  icon:            FileText,
  entitySingular:  'Contract',
  assignedUserKey: 'assignedUserName',

  quickFilters: [
    { label: 'All',       value: null },
    { label: 'Draft',     column: 'status', value: 'Draft',     badgeVariant: 'secondary' },
    { label: 'Active',    column: 'status', value: 'Active',    badgeVariant: 'success'   },
    { label: 'Completed', column: 'status', value: 'Completed', badgeVariant: 'won'       },
  ],

  searchPlaceholder: 'Search contracts...',
  addLabel:          'New Contract',
  emptyTitle:        'No contracts yet',
  emptyDescription:  'Create your first contract to get started.',
}
