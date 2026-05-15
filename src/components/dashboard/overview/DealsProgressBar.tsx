import { ChevronRight } from 'lucide-react'
import { dealsProgress } from './data'

export function DealsProgressBar() {
  const { closed, onProgress } = dealsProgress
  const total = closed.count + onProgress.count
  const closedPct  = Math.round((closed.count  / total) * 100)
  const progressPct = 100 - closedPct

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Deals</h3>
        <button
          aria-label="View all deals"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Closed deals bar */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">{closed.label}</span>
          <span className="text-sm font-bold text-foreground">{closed.count}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${closedPct}%` }}
          />
        </div>
      </div>

      {/* On progress bar — striped pattern */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">{onProgress.label}</span>
          <span className="text-sm font-bold text-foreground">{onProgress.count}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: `repeating-linear-gradient(
                45deg,
                var(--primary) 0px,
                var(--primary) 4px,
                color-mix(in oklab, var(--primary) 25%, transparent) 4px,
                color-mix(in oklab, var(--primary) 25%, transparent) 10px
              )`,
            }}
          />
        </div>
      </div>

    </div>
  )
}
