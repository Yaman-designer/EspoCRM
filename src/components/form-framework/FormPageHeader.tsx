'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useFormFramework } from './context'

export function FormPageHeader({ className }: { className?: string }) {
  const { config } = useFormFramework()
  const { title, subtitle, breadcrumbs, mode, entityLabel } = config

  const modeLabel = mode === 'edit'
    ? `Edit ${entityLabel ?? ''}`
    : `New ${entityLabel ?? ''}`

  return (
    <header className={cn('px-6 pb-6 pt-8', className)}>
      <div className="mx-auto max-w-[720px]">

        {/* Breadcrumb */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-foreground/70 font-medium">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}

        {/* Title block */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[26px] font-semibold leading-tight tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Mode badge */}
          {entityLabel && (
            <span className="mt-1 shrink-0 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground shadow-design-xs">
              {modeLabel.trim() || (mode === 'edit' ? 'Edit' : 'New')}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
