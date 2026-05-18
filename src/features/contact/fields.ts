import { User, Building2, Settings2 } from 'lucide-react'
import type { FormSectionConfig } from '@/components/dynamic-form'

export const contactSections: FormSectionConfig[] = [
  {
    key: 'basic',
    title: 'Basic Information',
    description: 'Contact name and primary communication details',
    icon: User,
    columns: 2,
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g. Sarah Johnson',
        colSpan: 2,
      },
      {
        name: 'email',
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'sarah@company.com',
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'phone',
        placeholder: '+1 (555) 000-0000',
      },
    ],
  },
  {
    key: 'organization',
    title: 'Organization',
    description: 'Company affiliation and job role',
    icon: Building2,
    columns: 2,
    fields: [
      {
        name: 'company',
        label: 'Company',
        type: 'select',
        resource: 'companies',
        placeholder: 'Select company…',
      },
      {
        name: 'role',
        label: 'Role / Title',
        type: 'select',
        placeholder: 'Select role…',
        options: [
          { label: 'Buyer',    value: 'Buyer' },
          { label: 'Seller',   value: 'Seller' },
          { label: 'Investor', value: 'Investor' },
          { label: 'Agent',    value: 'Agent' },
          { label: 'Tenant',   value: 'Tenant' },
          { label: 'Other',    value: 'Other' },
        ],
      },
    ],
  },
  {
    key: 'crm',
    title: 'CRM Settings',
    description: 'Status, ownership and categorisation',
    icon: Settings2,
    columns: 2,
    fields: [
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { label: 'Active',   value: 'Active' },
          { label: 'Lead',     value: 'Lead' },
          { label: 'On Hold',  value: 'On Hold' },
          { label: 'Inactive', value: 'Inactive' },
        ],
      },
      {
        name: 'assignedTo',
        label: 'Assigned To',
        type: 'select',
        resource: 'users',
        placeholder: 'Select team member…',
      },
      {
        name: 'tags',
        label: 'Tags',
        type: 'tags',
        placeholder: 'Add tag and press Enter…',
        colSpan: 2,
      },
      {
        name: 'notes',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Internal notes, context, next steps…',
        description: 'Visible only to your team',
        rows: 3,
        colSpan: 2,
      },
    ],
  },
]
