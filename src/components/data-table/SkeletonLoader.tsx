import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonLoaderProps {
  rows?: number
  columns?: number
  hasCheckbox?: boolean
  hasActions?: boolean
}

export function SkeletonLoader({
  rows = 8,
  columns = 5,
  hasCheckbox = false,
  hasActions = true,
}: SkeletonLoaderProps) {
  const dataCols = Math.max(1, columns - (hasActions ? 1 : 0))

  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-border/25 last:border-0">
          {hasCheckbox && (
            <td className="w-10 pl-4 pr-2 py-4">
              <Skeleton className="h-4 w-4 rounded-sm" />
            </td>
          )}

          {/* First data column — avatar-style skeleton */}
          <td className="py-4 pl-5 pr-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-3 w-28 rounded" />
                <Skeleton className="h-2.5 w-20 rounded" />
              </div>
            </div>
          </td>

          {/* Remaining data columns */}
          {Array.from({ length: dataCols - 1 }).map((_, ci) => (
            <td key={ci} className="px-4 py-4">
              <Skeleton
                className="h-3 rounded"
                style={{ width: `${[72, 56, 88, 64, 80][ci % 5]}px` }}
              />
            </td>
          ))}

          {/* Actions column */}
          {hasActions && (
            <td className="py-4 pl-2 pr-4">
              <div className="flex justify-end">
                <Skeleton className="h-7 w-7 rounded-md" />
              </div>
            </td>
          )}
        </tr>
      ))}
    </>
  )
}
