'use client'

import { Users } from 'lucide-react'
import { EntityViewSheet } from '@/components/crud/EntityViewSheet'
import { PipelineViewPanel } from '../PipelineViewPanel'
import type { ViewRendererProps } from '@/components/crud/resource-extensions'
import type { Pipeline } from '../types'

export function PipelineViewRenderer({
  row,
  onClose,
  onEdit,
  onDelete,
}: ViewRendererProps<Pipeline>) {
  const contactName = row ? (Object.values(row.contactsNames ?? {})[0] ?? '') : ''

  return (
    <EntityViewSheet
      open={!!row}
      onClose={onClose}
      icon={Users}
      title={contactName || 'Pipeline Entry'}
      subtitle={row?.assignedUserName}
      onEdit={() => row && onEdit(row)}
      onDelete={() => row && onDelete(row)}
    >
      {row && <PipelineViewPanel row={row} />}
    </EntityViewSheet>
  )
}
