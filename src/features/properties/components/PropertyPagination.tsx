'use client'

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '../domain/constants'

function getPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', total]
  }
  if (current >= total - 3) {
    return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total]
  }
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total]
}

interface PropertyPaginationProps {
  page: number
  pageSize: PageSizeOption
  totalCount: number
  totalPages: number
  isFetching?: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeOption) => void
}

export function PropertyPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  isFetching = false,
  onPageChange,
  onPageSizeChange,
}: PropertyPaginationProps) {
  if (totalCount === 0 || totalPages <= 1) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem   = Math.min(page * pageSize, totalCount)
  const pageRange = getPageRange(page, totalPages)

  return (
    <div className="border-t border-border/20 pt-4">

      {/* Mobile: page nav centered, then meta row below */}
      {/* Desktop: three columns — [summary] [page nav] [page size] */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-0">

        {/* ── LEFT — record count (hidden on mobile) ───────────────────── */}
        <div className="hidden sm:block sm:flex-1">
          <p
            className={cn(
              'text-[12.5px] text-muted-foreground/70 transition-opacity duration-150',
              isFetching && 'opacity-40',
            )}
          >
            Showing{' '}
            <span className="font-medium text-foreground tabular-nums">
              {startItem}–{endItem}
            </span>
            {' '}of{' '}
            <span className="font-medium text-foreground tabular-nums">
              {totalCount.toLocaleString()}
            </span>
            {' '}{totalCount === 1 ? 'property' : 'properties'}
          </p>
        </div>

        {/* ── CENTER — page navigation ──────────────────────────────────── */}
        <nav aria-label="Pagination" className="flex items-center gap-0.5">

          {/* Previous */}
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isFetching}
            aria-label="Previous page"
            className={cn(
              'flex h-7 items-center gap-1 rounded-lg px-2',
              'text-[12px] font-medium text-muted-foreground',
              'transition-colors duration-150',
              'hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
            )}
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-0.5 px-1">
            {pageRange.map((item, idx) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-7 w-7 items-center justify-center text-[12px] text-muted-foreground/35"
                  aria-hidden
                >
                  ···
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  disabled={isFetching}
                  aria-label={`Page ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg text-[12.5px]',
                    'transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
                    item === page
                      ? [
                          'bg-primary font-semibold text-primary-foreground',
                          'shadow-[0_1px_3px_rgba(0,97,188,0.22),0_2px_8px_rgba(0,97,188,0.10)]',
                        ]
                      : [
                          'font-medium text-muted-foreground',
                          'hover:bg-muted hover:text-foreground',
                          'disabled:opacity-30',
                        ],
                  )}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isFetching}
            aria-label="Next page"
            className={cn(
              'flex h-7 items-center gap-1 rounded-lg px-2',
              'text-[12px] font-medium text-muted-foreground',
              'transition-colors duration-150',
              'hover:bg-muted hover:text-foreground',
              'disabled:pointer-events-none disabled:opacity-30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
            )}
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="size-3.5" />
          </button>
        </nav>

        {/* ── RIGHT — page size picker + mobile compact summary ─────────── */}
        <div className="flex w-full items-center justify-between sm:w-auto sm:flex-1 sm:justify-end">

          {/* Mobile only: compact record count */}
          <p
            className={cn(
              'text-[12px] text-muted-foreground/55 transition-opacity duration-150 sm:hidden',
              isFetching && 'opacity-40',
            )}
          >
            {startItem}–{endItem}{' '}
            <span className="text-muted-foreground/35">of</span>{' '}
            {totalCount.toLocaleString()}
          </p>

          {/* Page size dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex h-7 items-center gap-1 rounded-lg px-2',
                  'text-[12px] font-medium text-muted-foreground/70',
                  'transition-colors duration-150',
                  'hover:bg-muted hover:text-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
                )}
              >
                {pageSize} / page
                <ChevronDown className="size-3 opacity-45" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" collisionPadding={12} className="min-w-28">
              {PAGE_SIZE_OPTIONS.map(size => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                  className={cn(
                    'text-[13px]',
                    size === pageSize && 'font-semibold text-primary',
                  )}
                >
                  {size} per page
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </div>
  )
}
