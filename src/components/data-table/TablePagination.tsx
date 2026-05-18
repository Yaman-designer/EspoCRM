'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TablePaginationProps {
  page: number
  pageSize: number
  total: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  className?: string
}

export function TablePagination({
  page,
  pageSize,
  total,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to = Math.min(page * pageSize, total)
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-t border-border/50 bg-card px-5 py-3',
        className,
      )}
    >
      {/* Count */}
      <p className="text-[12px] text-muted-foreground">
        {total === 0 ? 'No records' : `${from}–${to} of ${total.toLocaleString('en-US')}`}
      </p>

      <div className="flex items-center gap-3">
        {/* Page size */}
        <div className="hidden items-center gap-2 sm:flex">
          <span className="text-[12px] text-muted-foreground">Per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => {
              onPageSizeChange(Number(v))
              onPageChange(1)
            }}
          >
            <SelectTrigger className="h-7 w-[68px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page indicator */}
        {totalPages > 1 && (
          <span className="hidden text-[12px] text-muted-foreground md:block">
            Page {page} of {totalPages}
          </span>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-1">
          {(
            [
              { icon: ChevronsLeft, onClick: () => onPageChange(1), disabled: !canPrev, label: 'First' },
              { icon: ChevronLeft, onClick: () => onPageChange(page - 1), disabled: !canPrev, label: 'Previous' },
              { icon: ChevronRight, onClick: () => onPageChange(page + 1), disabled: !canNext, label: 'Next' },
              { icon: ChevronsRight, onClick: () => onPageChange(totalPages), disabled: !canNext, label: 'Last' },
            ] as const
          ).map(({ icon: Icon, onClick, disabled, label }) => (
            <Button
              key={label}
              variant="outline"
              size="icon"
              onClick={onClick}
              disabled={disabled}
              aria-label={label}
              className="h-7 w-7 border-border/60"
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
