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
    <div className="overflow-hidden rounded-2xl border border-border/40 bg-card shadow-[0_1px_4px_0_rgb(0,0,0,0.04)]">
      {hasHeader && (
        <div className="flex items-center gap-3 border-b border-border/30 bg-muted/30 px-5 py-3.5">
          {Icon && (
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/15">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </div>
          )}
          <div>
            {title && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {title}
              </p>
            )}
            {description && (
              <p className="mt-0.5 text-[11px] text-muted-foreground/60">{description}</p>
            )}
          </div>
        </div>
      )}
      <div className={`grid gap-x-5 gap-y-5 p-5 ${GRID_COLS[columns]}`}>
        {children}
      </div>
    </div>
  )
}
