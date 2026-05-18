import { Skeleton } from '@/components/ui/skeleton'

interface FormSkeletonProps {
  sections?: number
  fieldsPerSection?: number
}

export function FormSkeleton({ sections = 2, fieldsPerSection = 4 }: FormSkeletonProps) {
  return (
    <div className="space-y-8 px-6 py-6">
      {Array.from({ length: sections }).map((_, si) => (
        <div key={si} className="space-y-4">
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: fieldsPerSection }).map((_, fi) => (
              <div key={fi} className="space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
