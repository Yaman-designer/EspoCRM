'use client'

import { useState, useEffect } from 'react'
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
  // React Query in-memory cache causes isLoading=false on SPA re-navigation; defer to after mount so hydration sees the skeleton on both server and client.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // ── All data / filter / pagination logic lives in the hook ──────────
  const {
    properties, isLoading, isFetching,
    page, pageSize, totalCount, totalPages,
    filters, viewMode, hasFilters,
    onSearchChange, onStatusChange, onTypeChange,
    onSortChange, onPriceRangeChange, onAreaRangeChange,
    onClearFilters, onViewModeChange,
    onPageChange, onPageSizeChange,
    refetch, deleteMutation,
  } = useProperties()

  // ── UI panel state ──────────────────────────────────────────────────
  const [viewTarget, setViewTarget]     = useState<RealEstateProperty | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)
  const [editTarget, setEditTarget]     = useState<RealEstateProperty | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RealEstateProperty | null>(null)
  const [deleteOpen, setDeleteOpen]     = useState(false)

  const handleView      = (p: RealEstateProperty) => setViewTarget(p)
  const handleEdit      = (p: RealEstateProperty) => setEditTarget(p)
  const handleDelete    = (p: RealEstateProperty) => { setDeleteTarget(p); setDeleteOpen(true) }
  const handleDuplicate = (p: RealEstateProperty) => { setEditTarget({ ...p, id: '' }) }

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
    <div className="flex flex-col">

      {/* Sticky toolbar — blurs page content scrolling beneath it */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/30 px-4 sm:px-6 pt-4 sm:pt-6 pb-4">
        <PropertyToolbar
          search={filters.search}
          onSearchChange={onSearchChange}
          statusFilter={filters.status}
          onStatusChange={onStatusChange}
          typeFilter={filters.type}
          onTypeChange={onTypeChange}
          sortBy={filters.sortBy}
          onSortChange={onSortChange}
          priceRange={filters.priceRange}
          onPriceRangeChange={onPriceRangeChange}
          areaRange={filters.areaRange}
          onAreaRangeChange={onAreaRangeChange}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          totalCount={totalCount}
          onAddProperty={() => setCreateOpen(true)}
          hasActiveFilters={hasFilters}
          onClearFilters={onClearFilters}
        />
      </div>

      {/* Scrollable content area */}
      <div className="flex flex-col gap-4 px-4 sm:px-6 py-4 sm:py-5">
        <PropertyGrid
          properties={properties}
          viewMode={viewMode}
          isLoading={!mounted || isLoading}
          hasActiveFilters={hasFilters}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
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
      </div>

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
