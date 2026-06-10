'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import axiosClient from '@/api/axiosClient'
import { PropertyDetailView } from '../components/PropertyDetailView'
import { PropertyForm } from '../components/PropertyForm'
import { getWebAssetUrl, resolvePropertyImageId } from '@/lib/image-url'
import type { RealEstateProperty } from '../types/property.types'

interface PropertyDetailPageProps {
  property: RealEstateProperty
}

export function PropertyDetailPage({ property: initialProperty }: PropertyDetailPageProps) {
  const router = useRouter()

  // Local copy so edits reflect immediately without a full page reload
  const [property, setProperty] = useState(initialProperty)

  const [editOpen, setEditOpen]     = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/RealEstateProperty/${id}`),
    onSuccess: () => {
      toast.success('Property deleted')
      router.push('/properties')
      router.refresh()
    },
    onError: () => toast.error('Failed to delete property'),
  })

  const imgSrc = getWebAssetUrl(
    resolvePropertyImageId(property.mainImageId, property.imagesIds),
  )
  const displayName = property.title || property.name

  return (
    <>
      <PropertyDetailView
        property={property}
        onEdit={() => setEditOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      {/* Edit form */}
      <PropertyForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false)
          // Refresh to get updated data from server
          router.refresh()
        }}
        initialData={property}
        mode="edit"
      />

      {/* Delete confirmation — shows property context so user knows exactly what they're deleting */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>

            {/* Property context: thumbnail + name + ref */}
            <div className="mb-1 flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3">
              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={imgSrc}
                  alt={displayName || 'Property'}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {displayName || 'Untitled Property'}
                </p>
                {property.propertyCode && (
                  <p className="text-[11px] tabular-nums text-muted-foreground/60">
                    Ref #{property.propertyCode}
                  </p>
                )}
              </div>
            </div>

            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Property</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this property?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(property.id)}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Property'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
