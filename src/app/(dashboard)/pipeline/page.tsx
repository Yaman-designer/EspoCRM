'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Eye, Pencil, Trash2, Users } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { DataTable } from '@/components/data-table'
import { StatusBadge } from '@/components/data-table/StatusBadge'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { pipelineColumns } from '@/features/pipeline/columns'
import { PipelineForm } from '@/features/pipeline/PipelineForm'
import { STAGE_LABEL_MAP, STATUS_BADGE_MAP, CONTACT_TYPE_BADGE_MAP } from '@/features/pipeline/fields'
import type { Pipeline, KanbanResponse, PipelineFormValues } from '@/features/pipeline/types'
import type { QuickFilter, BadgeVariant, FormProps } from '@/components/data-table'
import type { ComponentType } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ── EspoCRM attribute select ───────────────────────────────────────────────────

const ATTRIBUTE_SELECT = [
  'contactsIds', 'contactsNames',
  'realEstatePropertiesIds', 'realEstatePropertiesNames',
  'contactType', 'status', 'status2', 'description',
  'assignedUserId', 'assignedUserName',
  'teamsIds', 'teamsNames',
].join(',')

// ── View panel helpers ─────────────────────────────────────────────────────────

function formatDate(raw: string | null | undefined): string {
  if (!raw) return '—'
  const d = new Date(raw.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ViewField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/20 last:border-0">
      <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
      <div className="text-right text-[13px] text-foreground">{children}</div>
    </div>
  )
}

function PipelineViewPanel({ row }: { row: Pipeline }) {
  const contactName = Object.values(row.contactsNames ?? {})[0] ?? '—'
  const teams = Object.values(row.teamsNames ?? {}).join(', ') || '—'
  const properties = Object.values(row.realEstatePropertiesNames ?? {}).join(', ') || '—'
  const stageLabel = row.status2 && row.status2 !== 'none' ? (STAGE_LABEL_MAP[row.status2] ?? row.status2) : '—'
  const contactTypeLabel = row.contactType === 'κλήση'
    ? 'κλήση / follow up'
    : row.contactType === 'ραντεβού'
    ? 'ραντεβού / meeting'
    : row.contactType || '—'

  return (
    <div className="px-5 py-2">
      <ViewField label="Contact">
        <span className="font-medium">{contactName}</span>
      </ViewField>
      <ViewField label="Assigned User">
        <span>{row.assignedUserName || '—'}</span>
      </ViewField>
      <ViewField label="Status">
        {row.status
          ? <StatusBadge value={row.status} badgeMap={STATUS_BADGE_MAP as Record<string, BadgeVariant>} />
          : <span className="text-muted-foreground">—</span>}
      </ViewField>
      <ViewField label="Stage">
        <span>{stageLabel}</span>
      </ViewField>
      <ViewField label="Contact Type">
        {row.contactType
          ? <StatusBadge value={contactTypeLabel} badgeMap={CONTACT_TYPE_BADGE_MAP as Record<string, BadgeVariant>} />
          : <span className="text-muted-foreground">—</span>}
      </ViewField>
      <ViewField label="Date Start">
        <span className="tabular-nums">{formatDate(row.dateStart)}</span>
      </ViewField>
      <ViewField label="Date End">
        <span className="tabular-nums">{formatDate(row.dateEnd)}</span>
      </ViewField>
      <ViewField label="Teams">
        <span>{teams}</span>
      </ViewField>
      <ViewField label="Properties">
        <span>{properties}</span>
      </ViewField>
      {row.description && (
        <ViewField label="Description">
          <span className="whitespace-pre-wrap text-left">{row.description}</span>
        </ViewField>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const { t } = useTranslation('dashboard')

  // ── Data fetch ──────────────────────────────────────────────────────────────
  const { data, isFetching, isError, refetch } = useQuery<KanbanResponse>({
    queryKey: ['pipeline'],
    queryFn: () =>
      axiosClient
        .get<KanbanResponse>('/Kanban/CPipeline', {
          params: {
            maxSize: 200,
            offset: 0,
            orderBy: 'dateStart',
            order: 'desc',
            attributeSelect: ATTRIBUTE_SELECT,
          },
        })
        .then((res) => res.data),
    staleTime: 30_000,
  })

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<Pipeline | undefined>()

  const handleEdit = useCallback((row: Pipeline) => {
    setEditRow(row)
    setEditOpen(true)
  }, [])

  const handleEditClose = useCallback(() => {
    setEditOpen(false)
    setEditRow(undefined)
  }, [])

  // Build form-compatible initialData from the row — contactsIds is a string[]
  // in Pipeline but the form select works with a single string value.
  const editInitialData = useMemo((): PipelineFormValues | undefined => {
    if (!editRow) return undefined
    return {
      id: editRow.id,
      assignedUserId: editRow.assignedUserId || undefined,
      teamsIds: editRow.teamsIds ?? [],
      contactsIds: editRow.contactsIds?.[0] ?? '',
      contactType: editRow.contactType || '',
      status2: editRow.status2 && editRow.status2 !== 'none' ? editRow.status2 : '',
      dateStart: editRow.dateStart?.substring(0, 10) ?? '',
      description: editRow.description ?? '',
    }
  }, [editRow])

  // ── View state ──────────────────────────────────────────────────────────────
  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<Pipeline | undefined>()

  const handleView = useCallback((row: Pipeline) => {
    setViewRow(row)
    setViewOpen(true)
  }, [])

  // ── Single delete ───────────────────────────────────────────────────────────
  const [deleteRow, setDeleteRow] = useState<Pipeline | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/CPipeline/${id}`),
    onSuccess: () => {
      toast.success(t('pipeline.actions.deleteSuccess'))
      setDeleteOpen(false)
      setDeleteRow(undefined)
      refetch()
    },
    onError: () => {
      toast.error(t('pipeline.actions.deleteError'))
    },
  })

  const handleDelete = useCallback((row: Pipeline) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  // ── Bulk delete ─────────────────────────────────────────────────────────────
  const bulkDeleteMutation = useMutation({
    mutationFn: (rows: Pipeline[]) =>
      Promise.all(rows.map((row) => axiosClient.delete(`/CPipeline/${row.id}`))),
    onSuccess: (_, rows) => {
      toast.success(
        rows.length === 1
          ? t('pipeline.actions.deleteSuccess')
          : t('pipeline.actions.bulkDeleteSuccess', { count: rows.length }),
      )
      refetch()
    },
    onError: () => {
      toast.error(t('pipeline.actions.deleteError'))
      refetch()
    },
  })

  // ── Row actions ─────────────────────────────────────────────────────────────
  const rowActions = useMemo(() => [
    {
      label: t('pipeline.actions.view'),
      icon: Eye,
      onClick: handleView,
    },
    {
      label: t('pipeline.actions.edit'),
      icon: Pencil,
      onClick: handleEdit,
    },
    {
      label: t('pipeline.actions.delete'),
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: handleDelete,
    },
  ], [t, handleView, handleEdit, handleDelete])

  const bulkActions = useMemo(() => [
    {
      label: t('pipeline.actions.deleteSelected'),
      icon: Trash2,
      variant: 'destructive' as const,
      onClick: (rows: Pipeline[]) => bulkDeleteMutation.mutate(rows),
    },
  ], [t, bulkDeleteMutation])

  const quickFilters = useMemo<QuickFilter[]>(() => [
    { label: 'All',      value: null },
    { label: 'Planned',  column: 'status', value: 'Planned',  badgeVariant: 'info' },
    { label: 'Held',     column: 'status', value: 'Held',     badgeVariant: 'success' },
    { label: 'Not Held', column: 'status', value: 'Not Held', badgeVariant: 'cancelled' },
  ], [])

  const contactName = viewRow ? (Object.values(viewRow.contactsNames ?? {})[0] ?? '') : ''

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
        data={data?.list ?? []}
        totalRows={data?.total ?? 0}
        columns={pipelineColumns}
        rowActions={rowActions}
        bulkActions={bulkActions}
        form={PipelineForm as ComponentType<FormProps<Pipeline>>}
        isLoading={isFetching && !data}
        isError={isError}
        onRefetch={refetch}
        quickFilters={quickFilters}
        showRowNumbers
        showViewToggle
        searchable
        searchPlaceholder={t('pipeline.form.search')}
        addable
        addLabel={t('pipeline.form.addLabel')}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        emptyTitle={t('pipeline.form.emptyTitle')}
        emptyDescription={t('pipeline.form.emptyDesc')}
      />

      {/* ── Edit Form ── */}
      <PipelineForm
        open={editOpen}
        onClose={handleEditClose}
        onSuccess={() => { handleEditClose(); refetch() }}
        initialData={editInitialData}
        mode="edit"
      />

      {/* ── View Sheet ── */}
      <Sheet open={viewOpen} onOpenChange={(v) => !v && setViewOpen(false)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
          <SheetHeader className="border-b border-border/50 px-5 py-4">
            <div className="flex items-center gap-3 pr-8">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-[15px] font-semibold">
                  {contactName || t('pipeline.view.title')}
                </SheetTitle>
                {viewRow?.assignedUserName && (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {viewRow.assignedUserName}
                  </p>
                )}
              </div>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            {viewRow && <PipelineViewPanel row={viewRow} />}
          </div>
          <div className="border-t border-border/50 bg-muted/20 px-5 py-4">
            <div className="flex gap-2">
              <button
                onClick={() => { setViewOpen(false); if (viewRow) handleEdit(viewRow) }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('pipeline.actions.edit')}
              </button>
              <button
                onClick={() => { setViewOpen(false); if (viewRow) handleDelete(viewRow) }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/8 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('pipeline.actions.delete')}
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('pipeline.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pipeline.delete.description', {
                name: deleteRow
                  ? (Object.values(deleteRow.contactsNames ?? {})[0] ?? deleteRow.id)
                  : '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteRow(undefined)}>
              {t('pipeline.delete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRow && deleteMutation.mutate(deleteRow.id)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('pipeline.delete.deleting') : t('pipeline.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
