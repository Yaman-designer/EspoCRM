'use client'

import { TrendingUp } from 'lucide-react'
import { DynamicForm } from '@/components/dynamic-form'
import { pipelineSchema } from './schema'
import { pipelineSections } from './sections'
import type { FormProps } from '@/components/data-table'
import type { Pipeline } from './types'

export function PipelineForm({ open, onClose, onSuccess, initialData, mode }: FormProps<Pipeline>) {
  return (
    <DynamicForm<Pipeline>
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      title={mode === 'edit' ? 'Edit Deal' : 'Add New Deal'}
      description={
        mode === 'edit'
          ? 'Update deal information in your pipeline.'
          : 'Create a new deal and add it to your pipeline.'
      }
      icon={TrendingUp}
      sections={pipelineSections}
      schema={pipelineSchema}
      endpoint="/api/pipeline"
      initialData={initialData}
      mode={mode}
      maxWidth="2xl"
    />
  )
}
