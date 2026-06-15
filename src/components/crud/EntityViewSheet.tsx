'use client'

import type { ComponentType, ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface EntityViewSheetProps {
  open: boolean
  onClose: () => void
  icon: ComponentType<{ className?: string }>
  title: string
  subtitle?: string
  onEdit: () => void
  onDelete: () => void
  editLabel?: string
  deleteLabel?: string
  children: ReactNode
}

export function EntityViewSheet({
  open,
  onClose,
  icon: Icon,
  title,
  subtitle,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
  children,
}: EntityViewSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
        <SheetHeader className="border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-semibold">
                {title}
              </SheetTitle>
              {subtitle && (
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        <div className="border-t border-border/50 bg-muted/20 px-5 py-4">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted/60 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              {editLabel}
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-3 py-1.5 text-[12px] font-medium text-destructive hover:bg-destructive/8 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleteLabel}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
