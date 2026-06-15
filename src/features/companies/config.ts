import { z } from 'zod'
import { Building2, Settings2 } from 'lucide-react'
import type { ColumnConfig } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form/types'
import type { ResourceConfig } from '@/components/crud/resource-config'

// ── Type ──────────────────────────────────────────────────────────────────────

export interface Company {
  id: string
  name: string
  type?: string
  phoneNumber?: string
  website?: string
  emailAddress?: string
  description?: string
  assignedUserId?: string
  assignedUserName?: string
  createdAt?: string
  modifiedAt?: string
}

// ── Schema ────────────────────────────────────────────────────────────────────

const companySchema = z.object({
  name:           z.string().min(1, 'Company name is required'),
  type:           z.string().optional(),
  phoneNumber:    z.string().optional(),
  website:        z.string().optional(),
  emailAddress:   z.string().optional(),
  description:    z.string().max(2000).optional(),
  assignedUserId: z.string().optional(),
})

// ── Form sections ─────────────────────────────────────────────────────────────

const companySections: FormSectionConfig[] = [
  {
    key:     'identity',
    title:   'Company Details',
    icon:    Building2,
    columns: 2,
    fields: [
      {
        name:        'name',
        label:       'Company Name',
        type:        'text',
        required:    true,
        placeholder: 'Company name',
        colSpan:     2,
      },
      {
        name:    'type',
        label:   'Type',
        type:    'select',
        options: [
          { value: 'Customer', label: 'Customer' },
          { value: 'Partner',  label: 'Partner'  },
          { value: 'Investor', label: 'Investor' },
          { value: 'Reseller', label: 'Reseller' },
        ],
        placeholder: 'Select type…',
      },
      {
        name:        'website',
        label:       'Website',
        type:        'text',
        placeholder: 'https://…',
      },
      {
        name:        'phoneNumber',
        label:       'Phone',
        type:        'text',
        placeholder: '+1 234 567 890',
      },
      {
        name:        'emailAddress',
        label:       'Email',
        type:        'text',
        placeholder: 'contact@company.com',
      },
    ],
  },
  {
    key:     'crm',
    title:   'CRM',
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
        label:       'Notes',
        type:        'textarea',
        rows:        4,
        colSpan:     2,
        placeholder: 'Company notes…',
      },
    ],
  },
]

// ── Columns ───────────────────────────────────────────────────────────────────

const TYPE_BADGE_MAP = {
  Customer: 'success',
  Partner:  'info',
  Investor: 'warning',
  Reseller: 'secondary',
} as const

const companyColumns: ColumnConfig<Company>[] = [
  {
    key:         'name',
    label:       'Company',
    type:        'avatar',
    subtitleKey: 'type',
    sortable:    true,
  },
  {
    key:      'type',
    label:    'Type',
    type:     'badge',
    badgeMap: TYPE_BADGE_MAP,
  },
  {
    key:        'phoneNumber',
    label:      'Phone',
    type:       'text',
    responsive: 'md',
  },
  {
    key:        'website',
    label:      'Website',
    type:       'text',
    responsive: 'lg',
  },
  {
    key:        'assignedUserName',
    label:      'Assigned To',
    type:       'text',
    responsive: 'xl',
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

export const companiesConfig: ResourceConfig<Company> = {
  endpoint: '/Account',
  queryKey: 'companies',

  columns:      companyColumns,
  formSections: companySections,
  schema:       companySchema,

  viewFields: [
    { key: 'name',             label: 'Company Name' },
    { key: 'type',             label: 'Type',        type: 'badge', badgeMap: TYPE_BADGE_MAP },
    { key: 'phoneNumber',      label: 'Phone'        },
    { key: 'website',          label: 'Website'      },
    { key: 'emailAddress',     label: 'Email'        },
    { key: 'assignedUserName', label: 'Assigned To'  },
    { key: 'createdAt',        label: 'Created',     type: 'datetime' },
    { key: 'description',      label: 'Notes'        },
  ],

  getEntityName: (c) => c.name || c.id,

  title:          'Companies',
  subtitle:       'Manage your CRM companies and accounts',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Companies' },
  ],
  icon:            Building2,
  entitySingular:  'Company',
  assignedUserKey: 'assignedUserName',

  quickFilters: [
    { label: 'All',      value: null },
    { label: 'Customer', column: 'type', value: 'Customer', badgeVariant: 'success'   },
    { label: 'Partner',  column: 'type', value: 'Partner',  badgeVariant: 'info'      },
    { label: 'Investor', column: 'type', value: 'Investor', badgeVariant: 'warning'   },
    { label: 'Reseller', column: 'type', value: 'Reseller', badgeVariant: 'secondary' },
  ],

  searchPlaceholder: 'Search companies...',
  addLabel:          'Add Company',
  emptyTitle:        'No companies yet',
  emptyDescription:  'Add your first company to get started.',
}
