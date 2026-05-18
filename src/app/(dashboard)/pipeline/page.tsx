'use client'

import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { pipelineColumns } from '@/features/pipeline/columns'
import { PipelineForm } from '@/features/pipeline/PipelineForm'
import type { Pipeline } from '@/features/pipeline/types'
import type { QuickFilter } from '@/components/data-table'

// ── Mock data (replace with endpoint="/api/pipeline" for production) ──────────

const mockPipelines: Pipeline[] = [
  {
    id: '1',
    title: 'Enterprise CRM Upgrade',
    company: 'Acme Corp',
    owner: 'Sarah Johnson',
    ownerEmail: 'sarah.j@acmecorp.com',
    stage: 'Negotiation',
    status: 'Open',
    value: 285000,
    probability: 70,
    closingDate: '2025-03-31',
    createdAt: '2024-11-01',
    updatedAt: '2025-01-10',
  },
  {
    id: '2',
    title: 'Flagship Tower — Presale Bundle',
    company: 'Global Tech SA',
    owner: 'James Whitfield',
    ownerEmail: 'j.whitfield@pinnacle.co',
    stage: 'Proposal',
    status: 'Open',
    value: 1560000,
    probability: 50,
    closingDate: '2025-04-15',
    createdAt: '2024-10-18',
    updatedAt: '2025-01-08',
  },
  {
    id: '3',
    title: 'Horizon Suite Lease',
    company: 'Horizon.io',
    owner: 'Layla Hassan',
    ownerEmail: 'layla.h@visionprop.ae',
    stage: 'Closing',
    status: 'Won',
    value: 640000,
    probability: 100,
    closingDate: '2025-01-20',
    createdAt: '2024-09-05',
    updatedAt: '2025-01-19',
  },
  {
    id: '4',
    title: 'Data Centre Expansion — Phase 2',
    company: 'Pinnacle Co',
    owner: 'Rania Khalil',
    ownerEmail: 'rania.k@luxuryspaces.eg',
    stage: 'Qualification',
    status: 'Open',
    value: 3200000,
    probability: 25,
    closingDate: '2025-07-30',
    createdAt: '2025-01-03',
    updatedAt: '2025-01-15',
  },
  {
    id: '5',
    title: 'Downtown Office Block Acquisition',
    company: 'Vision Properties',
    owner: 'Thomas Becker',
    ownerEmail: 't.becker@bremencapital.de',
    stage: 'Negotiation',
    status: 'Open',
    value: 4800000,
    probability: 65,
    closingDate: '2025-05-01',
    createdAt: '2024-12-11',
    updatedAt: '2025-01-12',
  },
  {
    id: '6',
    title: 'Retail Units — Marina Walk',
    company: 'Acme Corp',
    owner: 'Sarah Johnson',
    ownerEmail: 'sarah.j@acmecorp.com',
    stage: 'Proposal',
    status: 'On Hold',
    value: 920000,
    probability: 40,
    closingDate: '2025-06-15',
    createdAt: '2024-11-28',
    updatedAt: '2025-01-07',
  },
  {
    id: '7',
    title: 'Co-Working Space Buildout',
    company: 'Horizon.io',
    owner: 'James Whitfield',
    ownerEmail: 'j.whitfield@pinnacle.co',
    stage: 'Closing',
    status: 'Open',
    value: 380000,
    probability: 85,
    closingDate: '2025-02-28',
    createdAt: '2024-10-30',
    updatedAt: '2025-01-14',
  },
  {
    id: '8',
    title: 'Smart Campus Infrastructure',
    company: 'Nova Assets',
    owner: 'Rania Khalil',
    ownerEmail: 'rania.k@luxuryspaces.eg',
    stage: 'Negotiation',
    status: 'Lost',
    value: 2100000,
    probability: 0,
    closingDate: '2025-01-05',
    createdAt: '2024-08-20',
    updatedAt: '2025-01-05',
  },
  {
    id: '9',
    title: 'Residential Towers — Block C',
    company: 'Global Tech SA',
    owner: 'Thomas Becker',
    ownerEmail: 't.becker@bremencapital.de',
    stage: 'Post-Sale',
    status: 'Won',
    value: 5500000,
    probability: 100,
    closingDate: '2024-12-01',
    createdAt: '2024-07-15',
    updatedAt: '2024-12-15',
  },
  {
    id: '10',
    title: 'Logistics Warehouse — Zone A',
    company: 'Pinnacle Co',
    owner: 'Layla Hassan',
    ownerEmail: 'layla.h@visionprop.ae',
    stage: 'Qualification',
    status: 'Open',
    value: 1750000,
    probability: 20,
    closingDate: '2025-09-30',
    createdAt: '2025-01-10',
    updatedAt: '2025-01-16',
  },
  {
    id: '11',
    title: 'Healthcare Hub Fitout',
    company: 'Vision Properties',
    owner: 'Sarah Johnson',
    ownerEmail: 'sarah.j@acmecorp.com',
    stage: 'Proposal',
    status: 'Open',
    value: 870000,
    probability: 55,
    closingDate: '2025-05-30',
    createdAt: '2024-12-20',
    updatedAt: '2025-01-09',
  },
  {
    id: '12',
    title: 'Hotel Conversion — Old Quarter',
    company: 'Nova Assets',
    owner: 'James Whitfield',
    ownerEmail: 'j.whitfield@pinnacle.co',
    stage: 'Negotiation',
    status: 'On Hold',
    value: 3900000,
    probability: 45,
    closingDate: '2025-08-01',
    createdAt: '2024-11-05',
    updatedAt: '2025-01-11',
  },
  {
    id: '13',
    title: 'Airport Cargo Terminal',
    company: 'Acme Corp',
    owner: 'Rania Khalil',
    ownerEmail: 'rania.k@luxuryspaces.eg',
    stage: 'Closing',
    status: 'Open',
    value: 7200000,
    probability: 90,
    closingDate: '2025-02-14',
    createdAt: '2024-09-18',
    updatedAt: '2025-01-13',
  },
  {
    id: '14',
    title: 'Tech Park Phase 1',
    company: 'Horizon.io',
    owner: 'Thomas Becker',
    ownerEmail: 't.becker@bremencapital.de',
    stage: 'Qualification',
    status: 'Open',
    value: 6100000,
    probability: 15,
    closingDate: '2025-12-31',
    createdAt: '2025-01-14',
    updatedAt: '2025-01-17',
  },
  {
    id: '15',
    title: 'Luxury Villa Complex — Phase 3',
    company: 'Global Tech SA',
    owner: 'Layla Hassan',
    ownerEmail: 'layla.h@visionprop.ae',
    stage: 'Post-Sale',
    status: 'Won',
    value: 9300000,
    probability: 100,
    closingDate: '2024-11-30',
    createdAt: '2024-04-02',
    updatedAt: '2024-12-03',
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { t } = useTranslation('dashboard')

  const rowActions = useMemo(() => [
    { label: t('pipeline.actions.view'),   icon: Eye,    onClick: (row: Pipeline) => console.log('view', row.id) },
    { label: t('pipeline.actions.edit'),   icon: Pencil, onClick: (row: Pipeline) => console.log('edit', row.id) },
    { label: t('pipeline.actions.delete'), icon: Trash2, variant: 'destructive' as const, onClick: (row: Pipeline) => console.log('delete', row.id) },
  ], [t])

  const bulkActions = useMemo(() => [
    { label: t('pipeline.actions.deleteSelected'), icon: Trash2, variant: 'destructive' as const, onClick: (rows: Pipeline[]) => console.log('bulk delete', rows.length) },
  ], [t])

  const quickFilters = useMemo<QuickFilter[]>(() => [
    { label: t('pipeline.filter.open'),          column: 'status', value: 'Open',          badgeVariant: 'info' },
    { label: t('pipeline.filter.won'),            column: 'status', value: 'Won',           badgeVariant: 'success' },
    { label: t('pipeline.filter.lost'),           column: 'status', value: 'Lost',          badgeVariant: 'destructive' },
    { label: t('pipeline.filter.onHold'),         column: 'status', value: 'On Hold',       badgeVariant: 'warning' },
    { label: t('pipeline.filter.qualification'),  column: 'stage',  value: 'Qualification', badgeVariant: 'ghost' },
    { label: t('pipeline.filter.negotiation'),    column: 'stage',  value: 'Negotiation',   badgeVariant: 'negotiating' },
    { label: t('pipeline.filter.closing'),        column: 'stage',  value: 'Closing',       badgeVariant: 'new-lead' },
  ], [t])

  return (
    <div className="flex flex-col gap-5 p-6">
      <PageHeader
        title={t('pipeline.page.title')}
        subtitle={t('pipeline.page.subtitle')}
        breadcrumbs={[
          { label: t('pipeline.breadcrumb.dashboard'), href: '/dashboard' },
          { label: t('pipeline.page.title') },
        ]}
      />

      <DataTable<Pipeline>
        data={mockPipelines}
        columns={pipelineColumns}
        rowActions={rowActions}
        bulkActions={bulkActions}
        form={PipelineForm}
        quickFilters={quickFilters}
        showRowNumbers
        showViewToggle
        rowDetails
        searchable
        searchPlaceholder={t('pipeline.form.search')}
        addable
        addLabel={t('pipeline.form.addLabel')}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        emptyTitle={t('pipeline.form.emptyTitle')}
        emptyDescription={t('pipeline.form.emptyDesc')}
      />
    </div>
  )
}
