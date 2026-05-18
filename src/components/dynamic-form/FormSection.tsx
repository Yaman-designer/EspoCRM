import type { ReactNode, ElementType } from 'react'

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
    <div className="space-y-4">
      {hasHeader && (
        <div className="flex items-start gap-2.5">
          {Icon && (
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <div>
            {title && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {title}
              </p>
            )}
            {description && (
              <p className="mt-0.5 text-[12px] text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className={`grid gap-4 ${GRID_COLS[columns]}`}>
        {children}
      </div>
    </div>
  )
}
