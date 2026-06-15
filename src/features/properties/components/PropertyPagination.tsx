'use client'

import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { PAGE_SIZE_OPTIONS, type PageSizeOption } from '../domain/constants'

// Returns the list of page numbers (and 'ellipsis' sentinels) to render.
// Always yields at most 7 items so the row never wraps on mobile.
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
  if (totalCount === 0) return null

  const startItem = (page - 1) * pageSize + 1
  const endItem   = Math.min(page * pageSize, totalCount)
  const pageRange = getPageRange(page, totalPages)

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">

      {/* Left: summary + page-size picker */}
      <div className="flex items-center gap-3">
        <p
          className={cn(
            'text-[13px] text-muted-foreground transition-opacity duration-150',
            isFetching && 'opacity-50',
          )}
        >
          Showing{' '}
          <span className="font-medium text-foreground tabular-nums">
            {startItem}–{endItem}
          </span>{' '}
          of{' '}
          <span className="font-medium text-foreground tabular-nums">
            {totalCount.toLocaleString()}
          </span>{' '}
          {totalCount === 1 ? 'property' : 'properties'}
        </p>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-card',
                'px-2.5 text-[12px] font-medium text-foreground',
                'transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
              )}
            >
              {pageSize} / page
              <ChevronDown className="size-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-28">
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

      {/* Right: page controls */}
      <nav aria-label="Pagination" className="flex items-center gap-1">

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          aria-label="Previous page"
          className="h-8 gap-1 px-2.5 text-[12px]"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-0.5">
          {pageRange.map((item, idx) =>
            item === 'ellipsis' ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-8 w-8 items-center justify-center text-[13px] text-muted-foreground"
                aria-hidden
              >
                …
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
                  'flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-medium',
                  'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
                  item === page
                    ? 'bg-primary text-primary-foreground shadow-design-sm'
                    : 'text-foreground hover:bg-muted disabled:opacity-50',
                )}
              >
                {item}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          aria-label="Next page"
          className="h-8 gap-1 px-2.5 text-[12px]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </nav>
    </div>
  )
}
