'use client'

import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import { pipelineSchema } from './schema'
import { STAGE_OPTIONS, CONTACT_TYPE_OPTIONS } from './fields'
import type { FormProps } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form'
import type { PipelineFormValues } from './types'

export function PipelineForm({ open, onClose, onSuccess, initialData, mode }: FormProps<PipelineFormValues>) {
  const { t } = useTranslation('dashboard')

  // ── Form sections — options loaded via resource registry (deduped, cached) ───
  const sections = useMemo<FormSectionConfig[]>(() => [
    {
      key: 'agent',
      title: t('pipeline.form.sectionAgent'),
      columns: 2,
      fields: [
        {
          name: 'assignedUserId',
          label: t('pipeline.form.assignedUser'),
          type: 'select',
          resource: 'users',
          placeholder: t('pipeline.form.selectUser'),
        },
        {
          name: 'teamsIds',
          label: t('pipeline.form.teams'),
          type: 'multi-select',
          resource: 'departments',
          placeholder: t('pipeline.form.selectTeams'),
        },
      ],
    },
    {
      key: 'pipeline',
      title: t('pipeline.form.sectionPipeline'),
      columns: 2,
      fields: [
        {
          name: 'contactsIds',
          label: t('pipeline.form.contact'),
          type: 'select',
          required: true,
          resource: 'contacts',
          placeholder: t('pipeline.form.selectContact'),
        },
        {
          name: 'contactType',
          label: t('pipeline.form.contactType'),
          type: 'select',
          required: true,
          options: CONTACT_TYPE_OPTIONS,
          placeholder: t('pipeline.form.selectContactType'),
        },
        {
          name: 'status2',
          label: t('pipeline.form.stage'),
          type: 'select',
          options: STAGE_OPTIONS,
          placeholder: t('pipeline.form.selectStage'),
        },
        {
          name: 'dateStart',
          label: t('pipeline.form.dateStart'),
          type: 'date',
          required: true,
        },
        {
          name: 'description',
          label: t('pipeline.form.description'),
          type: 'textarea',
          colSpan: 2,
          rows: 3,
        },
      ],
    },
  ], [t])

  // ── Payload transformer ───────────────────────────────────────────────────────
  const transformSubmit = useCallback((values: Record<string, unknown>) => {
    const contactType = (values.contactType as string) || 'pipeline'
    const rawDate = values.dateStart as string | undefined
    const dateStart = rawDate ? `${rawDate.substring(0, 10)} 00:00:00` : undefined
    return {
      ...values,
      name: `${contactType} - ${new Date().toLocaleDateString('en-US')}`,
      status: 'Planned',
      dateStart,
      assignedUserId: (values.assignedUserId as string) || undefined,
      contactsIds: values.contactsIds ? [values.contactsIds] : undefined,
      teamsIds:
        Array.isArray(values.teamsIds) && values.teamsIds.length > 0
          ? values.teamsIds
          : undefined,
    }
  }, [])

  return (
    <DynamicForm<PipelineFormValues>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? t('pipeline.form.editTitle') : t('pipeline.form.addTitle')}
      description={mode === 'edit' ? t('pipeline.form.editDesc') : t('pipeline.form.addDesc')}
      icon={TrendingUp}
      sections={sections}
      schema={pipelineSchema}
      endpoint="/CPipeline"
      initialData={initialData}
      mode={mode}
      maxWidth="2xl"
      transformSubmit={transformSubmit}
    />
  )
}
