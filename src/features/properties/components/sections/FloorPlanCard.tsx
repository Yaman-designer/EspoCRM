import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export function FloorPlanCard() {
  return (
    <div className={cn(
      'group relative col-span-2 h-44 overflow-hidden rounded-[20px] border border-border/14 bg-card',
      'shadow-[0_1px_4px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]',
      'transition-shadow duration-200 hover:shadow-[0_6px_28px_rgba(0,0,0,0.10)]',
    )}>
      <div className="absolute inset-y-0 left-0 w-[55%] overflow-hidden bg-[#EAF2FF] dark:bg-primary/8">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(0,97,188,0.38) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-5">
          <svg
            viewBox="0 0 180 130"
            className="h-full max-h-28 w-auto text-primary/50"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <rect x="12" y="12" width="156" height="106" rx="1" />
            <line x1="88" y1="12" x2="88" y2="75" />
            <line x1="12" y1="75" x2="168" y2="75" />
            <line x1="88" y1="75" x2="88" y2="118" />
            <line x1="12" y1="46" x2="55" y2="46" />
            <path d="M 12 50 Q 28 50 28 66" strokeWidth="1" opacity="0.45" />
            <path d="M 92 75 Q 92 91 108 91" strokeWidth="1" opacity="0.45" />
            <path d="M 55 46 Q 55 30 69 30" strokeWidth="1" opacity="0.45" />
          </svg>
        </div>
        <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-r from-transparent to-card" />
      </div>

      <div className="absolute bottom-0 right-0 top-0 flex w-[48%] flex-col justify-between p-5">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-[0.22em] text-muted-foreground/35">
            Floor Plan
          </p>
          <p className="mt-1.5 text-[19px] font-bold tracking-tight text-foreground">
            Ground Floor
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground/45">Full architectural layout</p>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex gap-3 text-[10px] text-muted-foreground/40">
            <span>PDF</span>
            <span>·</span>
            <span>DWG</span>
          </div>
          <button
            type="button"
            aria-label="Download Floor Plan"
            className={cn(
              'flex items-center gap-1.5 rounded-xl border border-border/20 bg-muted/30 px-3.5 py-2',
              'text-[11px] font-semibold text-foreground/58',
              'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
              'hover:border-primary/28 hover:bg-primary/6 hover:text-primary',
            )}
          >
            <Download className="size-3.5" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}
