import type { ReactNode, ElementType } from 'react'
import { cn } from '@/lib/utils'

interface FormSectionProps {
  title?: string
  description?: string
  icon?: ElementType
  children: ReactNode
  columns?: 1 | 2 | 3
}

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
}

export function FormSection({ title, description, icon: Icon, children, columns = 2 }: FormSectionProps) {
  const hasHeader = !!(title || Icon)
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border border-border/30 bg-card',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        'hover:border-border/45',
        'hover:shadow-[0_2px_6px_rgba(16,24,40,0.06),0_8px_28px_rgba(16,24,40,0.08)]',
      )}
    >
      {hasHeader && (
        <>
          <div className="px-4 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
            <div className="flex items-start gap-4">
              {Icon && (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/12 bg-primary/7 text-primary sm:h-10 sm:w-10">
                  <Icon className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="min-w-0 space-y-1.5 pt-1">
                {title && (
                  <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground/60">{description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="mx-4 border-b border-border/20 sm:mx-8" />
        </>
      )}
      <div className={`grid gap-x-6 gap-y-7 px-4 pb-5 pt-4 sm:gap-y-6 sm:px-8 sm:pb-8 sm:pt-6 ${GRID_COLS[columns]}`}>
        {children}
      </div>
    </div>
  )
}
