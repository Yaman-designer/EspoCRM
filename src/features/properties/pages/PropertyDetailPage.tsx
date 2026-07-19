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
import { presentApiError } from '@/lib/errors/presentApiError'
import { deleteProperty } from '../repositories/property.repository'
import { PropertyDetailView } from '../components/PropertyDetailView'
import { usePropertyDeletePermission } from '../hooks/usePropertyDeletePermission'
import { getWebAssetUrl, resolvePropertyImageId } from '@/lib/image-url'
import type { RealEstateProperty } from '../types/property.types'

interface PropertyDetailPageProps {
  property: RealEstateProperty
}

export function PropertyDetailPage({ property: initialProperty }: PropertyDetailPageProps) {
  const router = useRouter()

  // Local copy so edits reflect immediately without a full page reload
  const [property] = useState(initialProperty)

  const [deleteOpen, setDeleteOpen] = useState(false)

  // Edit now navigates to the shared Property wizard in edit mode (per the
  // approved Wizard-for-both ADR) instead of opening the legacy dialog.
  const handleEdit = () => {
    const slug = (property.propertyCode ?? property.id).toLowerCase()
    router.push(`/properties/${encodeURIComponent(slug)}/edit`)
  }

  // Permission policy: shared with PropertyListRenderer.tsx's delete action
  // via usePropertyDeletePermission — the ACL check exists in exactly one
  // place, not re-implemented per delete entry point.
  const { denied: deleteDenied } = usePropertyDeletePermission()
  const handleDeleteRequest = () => {
    if (deleteDenied) {
      toast.error("You don't have permission to delete properties.")
      return
    }
    setDeleteOpen(true)
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProperty(id),
    onSuccess: () => {
      toast.success('Property deleted')
      router.push('/properties')
      router.refresh()
    },
    onError: (error) => {
      presentApiError(error, {
        entityLabel: 'property',
        onRetry: () => deleteMutation.mutate(property.id),
        onRecover: () => router.push('/properties'),
        recoveryLabel: 'Back to properties',
      })
    },
  })

  const imgSrc = getWebAssetUrl(
    resolvePropertyImageId(property.mainImageId, property.imagesIds),
  )
  const displayName = property.title || property.name

  return (
    <>
      <PropertyDetailView
        property={property}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
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
              disabled={deleteMutation.isPending || deleteDenied}
              onClick={() => {
                if (deleteDenied) return
                deleteMutation.mutate(property.id)
              }}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Property'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
