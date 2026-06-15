import type { ColumnConfig } from '@/components/data-table'
import type { Contact } from './types'

export const contactColumns: ColumnConfig<Contact>[] = [
  {
    key:         'name',
    label:       'Name',
    type:        'avatar',
    subtitleKey: 'emailAddress',
    sortable:    true,
  },
  {
    key:        'phoneNumber',
    label:      'Phone',
    type:       'text',
    responsive: 'md',
  },
  {
    key:        'accountName',
    label:      'Company',
    type:       'text',
    sortable:   true,
  },
  {
    key:        'title',
    label:      'Job Title',
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
