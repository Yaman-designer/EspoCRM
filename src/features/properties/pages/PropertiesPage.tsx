'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProperties } from '../hooks/useProperties'
import { PropertyToolbar } from '../components/PropertyToolbar'
import { PropertyGrid } from '../components/PropertyGrid'
import { PropertyDetailsSheet } from '../components/PropertyDetailsSheet'
import { PropertyForm } from '../components/PropertyForm'
import { PropertyPagination } from '../components/PropertyPagination'
import type { RealEstateProperty } from '../types/property.types'

export function PropertiesPage() {
  // ── All data / filter / pagination logic lives in the hook ──────────
  const {
    properties, isLoading, isFetching,
    page, pageSize, totalCount, totalPages,
    filters, viewMode, hasFilters,
    onSearchChange, onStatusChange, onTypeChange,
    onSortChange, onClearFilters, onViewModeChange,
    onPageChange, onPageSizeChange,
    refetch, deleteMutation,
  } = useProperties()

  // ── UI panel state ──────────────────────────────────────────────────
  const [viewTarget, setViewTarget]     = useState<RealEstateProperty | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)
  const [editTarget, setEditTarget]     = useState<RealEstateProperty | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RealEstateProperty | null>(null)
  const [deleteOpen, setDeleteOpen]     = useState(false)

  const handleView   = (p: RealEstateProperty) => setViewTarget(p)
  const handleEdit   = (p: RealEstateProperty) => setEditTarget(p)
  const handleDelete = (p: RealEstateProperty) => { setDeleteTarget(p); setDeleteOpen(true) }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    const wasViewing = viewTarget?.id === deleteTarget.id
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteOpen(false)
        setDeleteTarget(null)
        if (wasViewing) setViewTarget(null)
      },
    })
  }

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">

      <PropertyToolbar
        search={filters.search}
        onSearchChange={onSearchChange}
        statusFilter={filters.status}
        onStatusChange={onStatusChange}
        typeFilter={filters.type}
        onTypeChange={onTypeChange}
        sortBy={filters.sortBy}
        onSortChange={onSortChange}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        totalCount={totalCount}
        onAddProperty={() => setCreateOpen(true)}
      />

      <PropertyGrid
        properties={properties}
        viewMode={viewMode}
        isLoading={isLoading}
        hasActiveFilters={hasFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClearFilters={onClearFilters}
        onAddProperty={() => setCreateOpen(true)}
      />

      <PropertyPagination
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        totalPages={totalPages}
        isFetching={isFetching}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />

      <PropertyDetailsSheet
        property={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <PropertyForm
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => { setCreateOpen(false); refetch() }}
        mode="create"
      />

      <PropertyForm
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => { setEditTarget(null); refetch() }}
        initialData={editTarget ?? undefined}
        mode="edit"
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget?.name}</strong>?{' '}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
