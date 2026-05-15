import { ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { dealsProgress } from './data'

export function DealsProgressBar() {
  const { closed, onProgress } = dealsProgress
  const total       = closed.count + onProgress.count
  const closedPct   = Math.round((closed.count  / total) * 100)
  const progressPct = 100 - closedPct

  return (
    <Card className="gap-4 p-0 pb-7">

      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Deals</h3>
        <Button variant="ghost" size="icon-xs" aria-label="View all deals">
          <ChevronRight />
        </Button>
      </div>

      <CardContent className="flex flex-col gap-4">
        {/* Closed deals */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{closed.label}</span>
            <span className="text-sm font-bold text-foreground">{closed.count}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${closedPct}%` }}
            />
          </div>
        </div>

        {/* On progress — striped */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{onProgress.label}</span>
            <span className="text-sm font-bold text-foreground">{onProgress.count}</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
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
      </CardContent>

    </Card>
  )
}
