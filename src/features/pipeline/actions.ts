import { Eye, Pencil, Trash2, Download } from 'lucide-react'
import type { RowAction, BulkAction } from '@/components/data-table'
import type { Pipeline } from './types'

// ── Per-row actions ────────────────────────────────────────────────────────────

export const pipelineRowActions: RowAction<Pipeline>[] = [
  {
    label: 'View deal',
    icon: Eye,
    onClick: (row) => console.log('view', row.id),
  },
  {
    label: 'Edit deal',
    icon: Pencil,
    onClick: (row) => console.log('edit', row.id),
  },
  {
    label: 'Delete deal',
    icon: Trash2,
    variant: 'destructive',
    onClick: (row) => console.log('delete', row.id),
  },
]

// ── Bulk actions ───────────────────────────────────────────────────────────────

export const pipelineBulkActions: BulkAction<Pipeline>[] = [
  {
    label: 'Export CSV',
    icon: Download,
    onClick: (rows) => console.log('export', rows.length, 'deals'),
  },
  {
    label: 'Delete selected',
    icon: Trash2,
    variant: 'destructive',
    onClick: (rows) => console.log('bulk delete', rows.length, 'deals'),
  },
]
