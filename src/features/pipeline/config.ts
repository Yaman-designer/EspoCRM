import { TrendingUp, Users } from 'lucide-react'
import { pipelineSchema } from './schema'
import { pipelineColumns } from './columns'
import { STAGE_OPTIONS, CONTACT_TYPE_OPTIONS } from './fields'
import { PipelineViewRenderer } from './extensions/PipelineViewRenderer'
import type { Pipeline } from './types'
import type { ResourceConfig } from '@/components/crud/resource-config'
import type { FormSectionConfig } from '@/components/dynamic-form/types'

// ── Form sections ─────────────────────────────────────────────────────────────
// Mirrors PipelineForm's section/field structure exactly.
// Field types, options, resources, required flags, column spans are preserved.

const pipelineSections: FormSectionConfig[] = [
  {
    key:     'agent',
    title:   'Agent',
    columns: 2,
    fields: [
      {
        name:        'assignedUserId',
        label:       'Assigned User',
        type:        'select',
        resource:    'users',
        placeholder: 'Select user…',
      },
      {
        name:        'teamsIds',
        label:       'Teams',
        type:        'multi-select',
        resource:    'departments',
        placeholder: 'Select teams…',
      },
    ],
  },
  {
    key:     'pipeline',
    title:   'Pipeline',
    columns: 2,
    fields: [
      {
        name:        'contactsIds',
        label:       'Contact',
        type:        'select',
        required:    true,
        resource:    'contacts',
        placeholder: 'Select contact…',
      },
      {
        name:        'contactType',
        label:       'Contact Type',
        type:        'select',
        required:    true,
        options:     CONTACT_TYPE_OPTIONS,
        placeholder: 'Select type…',
      },
      {
        name:        'status2',
        label:       'Stage',
        type:        'select',
        options:     STAGE_OPTIONS,
        placeholder: 'Select stage…',
      },
      {
        name:     'dateStart',
        label:    'Date',
        type:     'date',
        required: true,
      },
      {
        name:    'description',
        label:   'Description',
        type:    'textarea',
        colSpan: 2,
        rows:    3,
      },
    ],
  },
]

// ── Config ────────────────────────────────────────────────────────────────────

export const pipelineConfig: ResourceConfig<Pipeline> = {
  endpoint: '/CPipeline',
  queryKey: 'pipeline',

  queryParams: {
    orderBy: 'dateStart',
    order:   'desc',
  },

  columns:      pipelineColumns,
  formSections: pipelineSections,
  schema:       pipelineSchema,

  // Verbatim logic from usePipeline.ts editInitialData.
  // Flattens contactsIds array → single string for the select field,
  // strips 'none' from status2, and truncates datetime to date-only.
  editDataTransform: (row) => ({
    id:             row.id,
    assignedUserId: row.assignedUserId || undefined,
    teamsIds:       row.teamsIds ?? [],
    contactsIds:    row.contactsIds?.[0] ?? '',
    contactType:    row.contactType || '',
    status2:        row.status2 && row.status2 !== 'none' ? row.status2 : '',
    dateStart:      row.dateStart?.substring(0, 10) ?? '',
    description:    row.description ?? '',
  }),

  // Verbatim logic from PipelineForm.tsx transformSubmit.
  // Auto-generates name, forces status to Planned, re-wraps contactsIds,
  // and reformats dateStart to the datetime format EspoCRM expects.
  formTransformSubmit: (values) => {
    const contactType = (values.contactType as string) || 'pipeline'
    const rawDate     = values.dateStart as string | undefined
    const dateStart   = rawDate ? `${rawDate.substring(0, 10)} 00:00:00` : undefined
    return {
      ...values,
      name:           `${contactType} - ${new Date().toLocaleDateString('en-US')}`,
      status:         'Planned',
      dateStart,
      assignedUserId: (values.assignedUserId as string) || undefined,
      contactsIds:    values.contactsIds ? [values.contactsIds] : undefined,
      teamsIds:
        Array.isArray(values.teamsIds) && values.teamsIds.length > 0
          ? values.teamsIds
          : undefined,
    }
  },

  viewFields: [],  // unused — viewRenderer owns the view sheet

  getEntityName: (p) => Object.values(p.contactsNames ?? {})[0] ?? p.id,

  title:          'Pipeline',
  subtitle:       'Track and manage your sales pipeline',
  breadcrumbs: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Pipeline' },
  ],
  icon:            Users,
  formIcon:        TrendingUp,
  entitySingular:  'Pipeline Entry',
  assignedUserKey: 'assignedUserName',

  quickFilters: [
    { label: 'All',      value: null },
    { label: 'Planned',  column: 'status', value: 'Planned',  badgeVariant: 'info'      },
    { label: 'Held',     column: 'status', value: 'Held',     badgeVariant: 'success'   },
    { label: 'Not Held', column: 'status', value: 'Not Held', badgeVariant: 'cancelled' },
  ],

  showRowNumbers:    true,
  showViewToggle:    true,
  searchPlaceholder: 'Search pipeline…',
  addLabel:          'Add Entry',
  pageSize:          10,
  pageSizeOptions:   [10, 20, 50],
  emptyTitle:        'No pipeline entries',
  emptyDescription:  'Add your first pipeline entry to get started.',

  extensions: {
    viewRenderer: PipelineViewRenderer,
  },
}
