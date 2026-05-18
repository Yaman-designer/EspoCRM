'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import { pipelineSchema } from './schema'
import type { FormProps } from '@/components/data-table'
import type { FormSectionConfig } from '@/components/dynamic-form'
import type { Pipeline } from './types'

export function PipelineForm({ open, onClose, onSuccess, initialData, mode }: FormProps<Pipeline>) {
  const { t } = useTranslation('dashboard')

  const sections = useMemo<FormSectionConfig[]>(() => [
    {
      key: 'assignment',
      columns: 1,
      fields: [
        {
          name: 'assignedUserId',
          label: t('pipeline.form.assignedUser'),
          type: 'select',
          resource: 'users',
          placeholder: t('pipeline.form.selectUser'),
        },
      ],
    },
  ], [t])

  return (
    <DynamicForm<Pipeline>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? t('pipeline.form.editTitle') : t('pipeline.form.addTitle')}
      description={
        mode === 'edit'
          ? t('pipeline.form.editDesc')
          : t('pipeline.form.addDesc')
      }
      icon={TrendingUp}
      sections={sections}
      schema={pipelineSchema}
      endpoint="/api/pipeline"
      initialData={initialData}
      mode={mode}
      maxWidth="2xl"
    />
  )
}
