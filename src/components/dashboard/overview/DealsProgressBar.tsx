import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { dealsProgress } from './data'

export function DealsProgressBar() {
  const total = dealsProgress.closed.count + dealsProgress.onProgress.count
  const pct = total > 0 ? (dealsProgress.closed.count / total) * 100 : 0

  return (
    <div className="flex flex-col justify-center rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Deals</h3>
        <Button variant="ghost" size="icon-xs" aria-label="View pipeline" className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Segmented bar */}
      <div className="h-4 w-full overflow-hidden rounded-md bg-muted/50 mb-2 relative flex">
        {/* Closed Deals (Blue part) */}
        <div 
          className="bg-primary h-full transition-all duration-700 rounded-md"
          style={{ width: `${pct}%` }} 
        />
        {/* On Progress (Striped part) - usually done with SVG or CSS pattern, but we can just use a lighter bg for now or a repeating linear gradient */}
        <div 
          className="flex-1 h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(0,0,0,0.03)_4px,rgba(0,0,0,0.03)_8px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(255,255,255,0.03)_4px,rgba(255,255,255,0.03)_8px)]"
        />
      </div>

      {/* Labels */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-foreground leading-none">{dealsProgress.closed.count}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{dealsProgress.closed.label}</p>
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold text-foreground leading-none">{dealsProgress.onProgress.count}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{dealsProgress.onProgress.label}</p>
        </div>
      </div>
    </div>
  )
}
