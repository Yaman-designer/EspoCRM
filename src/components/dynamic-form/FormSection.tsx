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
    <div className="overflow-hidden rounded-xl border border-border/30 bg-muted/15 shadow-sm">
      {hasHeader && (
        <div className="border-b border-border/20 bg-background/60 px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/10">
                <Icon className="h-3 w-3 text-primary" />
              </div>
            )}
            <div>
              {title && (
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60">
                  {title}
                </p>
              )}
              {description && (
                <p className="mt-0.5 text-[11px] text-muted-foreground/70">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className={`grid gap-x-4 gap-y-4 p-4 ${GRID_COLS[columns]}`}>
        {children}
      </div>
    </div>
  )
}
