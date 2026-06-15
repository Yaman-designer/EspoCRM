'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, Building2, Eye, Pencil, Trash2 } from 'lucide-react'
import axiosClient from '@/api/axiosClient'
import { DataTable } from '@/components/data-table'
import { DynamicForm } from '@/components/dynamic-form/DynamicForm'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { EntityViewSheet } from './EntityViewSheet'
import { EntityDeleteDialog } from './EntityDeleteDialog'
import { ConfiguredViewPanel } from './ConfiguredViewPanel'
import type { ComponentType } from 'react'
import type { EspoListResponse } from '@/api/espocrm/entityService'
import type { FormProps } from '@/components/data-table'
import type { ResourceConfig } from './resource-config'

// ── CRMResourcePage ───────────────────────────────────────────────────────────

/**
 * Thin orchestration layer for standard and extended CRUD entity pages.
 *
 * Standard mode — wires DataTable + DynamicForm + EntityViewSheet +
 * EntityDeleteDialog using a single ResourceConfig object.
 *
 * Extension mode — when config.extensions.listRenderer is provided, the
 * framework skips DataTable and PageHeader and lets the renderer supply its
 * own toolbar, filters, data fetching, and card/grid display. When
 * config.extensions.viewRenderer is provided, it replaces EntityViewSheet.
 *
 * In both modes the framework retains ownership of: DynamicForm (add/edit),
 * EntityDeleteDialog, and all CRUD mutations. Extensions receive action
 * callbacks (onView / onEdit / onDelete / onAdd) that open these dialogs.
 */
export function CRMResourcePage<T extends { id: string }>({
  config,
}: {
  config: ResourceConfig<T>
}) {
  const queryClient = useQueryClient()

  const singular =
    config.entitySingular ??
    (config.title.endsWith('s') ? config.title.slice(0, -1) : config.title)

  const hasListRenderer = !!config.extensions?.listRenderer
  const hasViewRenderer = !!config.extensions?.viewRenderer

  // ── Data ────────────────────────────────────────────────────────────────────
  // Disabled when listRenderer manages its own server-side-filtered data.

  const { data, isFetching, isError, refetch } = useQuery<EspoListResponse<T>>({
    queryKey: [config.queryKey],
    queryFn: () =>
      axiosClient
        .get<EspoListResponse<T>>(config.endpoint, {
          params: {
            maxSize: config.queryParams?.maxSize  ?? 200,
            offset:  0,
            orderBy: config.queryParams?.orderBy  ?? 'createdAt',
            order:   config.queryParams?.order    ?? 'desc',
          },
        })
        .then((r) => r.data),
    staleTime: 30_000,
    enabled: !hasListRenderer,
  })

  // True only in standard mode once the query resolves and EspoCRM reports more
  // records than were fetched. Extensions manage their own data and their own limits.
  const isTruncated = !hasListRenderer && !!data && data.total > data.list.length

  // ── Edit state ───────────────────────────────────────────────────────────────

  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<T | undefined>()
  const handleEdit = useCallback((row: T) => { setEditRow(row); setEditOpen(true) }, [])
  const handleEditClose = useCallback(() => { setEditOpen(false); setEditRow(undefined) }, [])

  // ── View state ───────────────────────────────────────────────────────────────

  const [viewOpen, setViewOpen] = useState(false)
  const [viewRow, setViewRow] = useState<T | undefined>()

  // Ref keeps a non-stale copy of viewRow for use inside mutation callbacks.
  const viewRowRef = useRef<T | undefined>(undefined)
  useEffect(() => { viewRowRef.current = viewRow }, [viewRow])

  const handleView = useCallback((row: T) => { setViewRow(row); setViewOpen(true) }, [])

  // ── Add state (listRenderer mode only) ──────────────────────────────────────
  // In standard mode DataTable manages the add dialog via its `form` prop.

  const [addOpen, setAddOpen] = useState(false)
  const handleAddClose = useCallback(() => setAddOpen(false), [])

  // ── Delete state ─────────────────────────────────────────────────────────────

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState<T | undefined>()
  const handleDelete = useCallback((row: T) => { setDeleteRow(row); setDeleteOpen(true) }, [])

  // ── Mutations ────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation<void, Error, T>({
    mutationFn: (row) => axiosClient.delete(`${config.endpoint}/${row.id}`).then(() => void 0),
    onSuccess: (_, deletedRow) => {
      toast.success(`${config.getEntityName(deletedRow)} deleted`)
      setDeleteOpen(false)
      setDeleteRow(undefined)
      // Close the view sheet/renderer if it was showing the now-deleted row.
      if (viewRowRef.current?.id === deletedRow.id) {
        setViewOpen(false)
        setViewRow(undefined)
      }
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
    onError: () => toast.error('Failed to delete record'),
  })

  const bulkDeleteMutation = useMutation<void, Error, T[]>({
    mutationFn: (rows) =>
      Promise.all(rows.map((r) => axiosClient.delete(`${config.endpoint}/${r.id}`))).then(() => void 0),
    onSuccess: (_, rows) => {
      toast.success(
        rows.length === 1
          ? `${config.getEntityName(rows[0])} deleted`
          : `${rows.length} records deleted`,
      )
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
    onError: () => {
      toast.error('Failed to delete records')
      queryClient.invalidateQueries({ queryKey: [config.queryKey] })
    },
  })

  // ── Row / bulk actions (DataTable only) ─────────────────────────────────────

  const rowActions = useMemo(() => [
    { label: 'View',   icon: Eye,    onClick: handleView },
    { label: 'Edit',   icon: Pencil, onClick: handleEdit },
    { label: 'Delete', icon: Trash2, variant: 'destructive' as const, onClick: handleDelete },
  ], [handleView, handleEdit, handleDelete])

  const bulkActions = useMemo(() => [
    {
      label:   'Delete Selected',
      icon:    Trash2,
      variant: 'destructive' as const,
      onClick: (rows: T[]) => bulkDeleteMutation.mutate(rows),
    },
  ], [bulkDeleteMutation])

  // ── Add form wrapper (DataTable only) ───────────────────────────────────────
  //
  // DataTable's `form` prop expects a stable ComponentType<FormProps<T>>. We
  // create it once via useMemo with empty deps — safe because `config` is
  // always a module-level constant.

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ResourceForm = useMemo((): ComponentType<FormProps<T>> => {
    function ResourceFormComponent({ open, onClose, onSuccess, initialData, mode }: FormProps<T>) {
      const s = config.title.endsWith('s') ? config.title.slice(0, -1) : config.title
      return (
        <DynamicForm
          open={open}
          onClose={onClose}
          onSuccess={onSuccess}
          title={mode === 'edit' ? `Edit ${s}` : (config.addLabel ?? `Add ${s}`)}
          icon={config.formIcon}
          sections={config.formSections}
          schema={config.schema}
          endpoint={config.endpoint}
          initialData={initialData as Partial<Record<string, unknown>>}
          mode={mode}
          transformSubmit={config.formTransformSubmit}
        />
      )
    }
    return ResourceFormComponent
  }, [])

  // ── Derived display values ────────────────────────────────────────────────────

  const viewEntityName = viewRow ? config.getEntityName(viewRow) : ''
  const viewSubtitle =
    viewRow && config.assignedUserKey
      ? (String((viewRow as Record<string, unknown>)[config.assignedUserKey] ?? '') || undefined)
      : undefined
  const deleteEntityName = deleteRow ? config.getEntityName(deleteRow) : ''

  // ── Extension components ──────────────────────────────────────────────────────

  const ListRenderer = config.extensions?.listRenderer
  const ViewRenderer = config.extensions?.viewRenderer

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className={hasListRenderer ? 'flex flex-col' : 'flex flex-col gap-5 p-6'}>

      {/* PageHeader — omitted when listRenderer supplies its own toolbar/title */}
      {!hasListRenderer && (
        <PageHeader
          title={config.title}
          subtitle={config.subtitle}
          breadcrumbs={config.breadcrumbs}
        />
      )}

      {/* Truncation warning — shown when EspoCRM has more records than the fetch limit */}
      {isTruncated && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-amber-700">
            Showing {data!.list.length.toLocaleString()} of {data!.total.toLocaleString()} records —
            results may be incomplete. Contact your administrator to adjust the data limit.
          </p>
        </div>
      )}

      {/* Standard DataTable — omitted when listRenderer supplies the list UI */}
      {!hasListRenderer && (
        <DataTable<T>
          data={data?.list ?? []}
          totalRows={data?.total ?? 0}
          columns={config.columns}
          rowActions={rowActions}
          bulkActions={bulkActions}
          form={ResourceForm}
          isLoading={isFetching && !data}
          isError={isError}
          onRefetch={refetch}
          quickFilters={config.quickFilters}
          showRowNumbers={config.showRowNumbers ?? true}
          showViewToggle={config.showViewToggle ?? true}
          searchable
          searchPlaceholder={config.searchPlaceholder ?? `Search ${config.title.toLowerCase()}...`}
          addable
          addLabel={config.addLabel ?? `Add ${singular}`}
          pageSize={config.pageSize ?? 10}
          pageSizeOptions={config.pageSizeOptions ?? [10, 20, 50]}
          emptyTitle={config.emptyTitle ?? `No ${config.title.toLowerCase()} found`}
          emptyDescription={config.emptyDescription ?? `Add a new ${singular.toLowerCase()} to get started.`}
        />
      )}

      {/* Extension: custom list renderer */}
      {hasListRenderer && ListRenderer && (
        <ListRenderer
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => setAddOpen(true)}
        />
      )}

      {/* Edit form — always present; rendered outside DataTable so editRow can be injected */}
      <DynamicForm
        open={editOpen}
        onClose={handleEditClose}
        onSuccess={() => {
          handleEditClose()
          queryClient.invalidateQueries({ queryKey: [config.queryKey] })
        }}
        title={`Edit ${singular}`}
        icon={config.formIcon}
        sections={config.formSections}
        schema={config.schema}
        endpoint={config.endpoint}
        initialData={
          editRow
            ? (config.editDataTransform ? config.editDataTransform(editRow) : (editRow as Partial<Record<string, unknown>>))
            : undefined
        }
        mode="edit"
        transformSubmit={config.formTransformSubmit}
      />

      {/* Add form — listRenderer mode only; DataTable handles add in standard mode */}
      {hasListRenderer && (
        <DynamicForm
          open={addOpen}
          onClose={handleAddClose}
          onSuccess={() => {
            handleAddClose()
            queryClient.invalidateQueries({ queryKey: [config.queryKey] })
          }}
          title={config.addLabel ?? `Add ${singular}`}
          icon={config.formIcon}
          sections={config.formSections}
          schema={config.schema}
          endpoint={config.endpoint}
          mode="create"
          transformSubmit={config.formTransformSubmit}
        />
      )}

      {/* Standard view sheet — omitted when viewRenderer supplies its own sheet */}
      {!hasViewRenderer && (
        <EntityViewSheet
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          icon={config.icon ?? Building2}
          title={viewEntityName}
          subtitle={viewSubtitle}
          onEdit={() => { setViewOpen(false); if (viewRow) handleEdit(viewRow) }}
          onDelete={() => { setViewOpen(false); if (viewRow) handleDelete(viewRow) }}
        >
          {viewRow && <ConfiguredViewPanel row={viewRow} fields={config.viewFields} />}
        </EntityViewSheet>
      )}

      {/* Extension: custom view renderer (manages its own <Sheet> open state) */}
      {hasViewRenderer && ViewRenderer && (
        <ViewRenderer
          row={viewRow}
          onClose={() => { setViewOpen(false); setViewRow(undefined) }}
          onEdit={(row) => { setViewRow(undefined); setViewOpen(false); handleEdit(row) }}
          onDelete={(row) => { setViewRow(undefined); setViewOpen(false); handleDelete(row) }}
        />
      )}

      <EntityDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={deleteEntityName}
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteRow(undefined)}
        onConfirm={() => { if (deleteRow) deleteMutation.mutate(deleteRow) }}
      />
    </div>
  )
}
