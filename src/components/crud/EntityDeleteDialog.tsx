'use client'

import type { ReactNode } from 'react'
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

interface EntityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entityName: string
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  description?: ReactNode
  cancelLabel?: string
  confirmLabel?: string
  confirmingLabel?: string
}

export function EntityDeleteDialog({
  open,
  onOpenChange,
  entityName,
  isPending,
  onCancel,
  onConfirm,
  title = 'Delete Record',
  description,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete',
  confirmingLabel = 'Deleting…',
}: EntityDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? `Are you sure you want to permanently delete "${entityName}"? This action cannot be undone.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? confirmingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
