import type { FormSectionConfig } from '@/components/dynamic-form'

export const pipelineSections: FormSectionConfig[] = [
  {
    key: 'assignment',
    columns: 1,
    fields: [
      {
        name: 'assignedUserId',
        label: 'Assigned User',
        type: 'select',
        resource: 'users',
        placeholder: 'Select user…',
      },
    ],
  },
]
