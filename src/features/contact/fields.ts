import { User, Building2, Settings2 } from 'lucide-react'
import type { FormSectionConfig } from '@/components/dynamic-form'

export const contactSections: FormSectionConfig[] = [
  {
    key: 'basic',
    title: 'Basic Information',
    icon: User,
    columns: 2,
    fields: [
      {
        name: 'firstName',
        label: 'First Name',
        type: 'text',
        required: true,
        placeholder: 'First name',
      },
      {
        name: 'lastName',
        label: 'Last Name',
        type: 'text',
        required: true,
        placeholder: 'Last name',
      },
      {
        name: 'emailAddress',
        label: 'Email Address',
        type: 'email',
        placeholder: 'email@example.com',
      },
      {
        name: 'phoneNumber',
        label: 'Phone Number',
        type: 'phone',
        placeholder: '+1 (555) 000-0000',
      },
    ],
  },
  {
    key: 'organization',
    title: 'Organization',
    icon: Building2,
    columns: 2,
    fields: [
      {
        name: 'accountId',
        label: 'Company',
        type: 'select',
        resource: 'companies',
        placeholder: 'Select company…',
      },
      {
        name: 'title',
        label: 'Job Title',
        type: 'text',
        placeholder: 'e.g. Sales Manager',
      },
    ],
  },
  {
    key: 'crm',
    title: 'CRM Settings',
    icon: Settings2,
    columns: 2,
    fields: [
      {
        name: 'assignedUserId',
        label: 'Assigned To',
        type: 'select',
        resource: 'users',
        placeholder: 'Select team member…',
      },
      {
        name: 'description',
        label: 'Notes',
        type: 'textarea',
        placeholder: 'Internal notes…',
        rows: 3,
        colSpan: 2,
      },
    ],
  },
]