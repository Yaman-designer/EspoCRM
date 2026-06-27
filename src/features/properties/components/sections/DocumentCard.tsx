import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconComp = React.ComponentType<{ className?: string }>

export function DocumentCard({
  icon: Icon,
  label,
  meta,
  type,
}: {
  icon:  IconComp
  label: string
  meta?: string
  type:  string
}) {
  return (
    <div className={cn(
      'group relative flex aspect-[3/4] flex-col overflow-hidden rounded-[20px] border border-border/14 bg-card',
      'shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
      'transition-[colors,box-shadow] duration-200 hover:border-border/26 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]',
    )}>
      <div className="relative min-h-0 flex-1 overflow-hidden bg-muted/12">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(0,0,0,0.022) 11px, rgba(0,0,0,0.022) 12px)',
            backgroundPosition: '0 18px',
          }}
        />
        <div className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
          <Icon className="size-4 text-primary/48" />
        </div>
        <div className="absolute left-5 top-5 space-y-1.5">
          <div className="h-px w-10 rounded-full bg-border/30" />
          <div className="h-px w-7 rounded-full bg-border/18" />
          <div className="h-px w-9 rounded-full bg-border/18" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-card to-transparent" />
      </div>

      <div className="shrink-0 p-4 pt-3">
        <p className="text-[13px] font-bold text-foreground">{label}</p>
        {meta && <p className="mt-0.5 text-[11px] text-muted-foreground/42">{meta}</p>}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">{type}</span>
          <span className={cn(
            'flex items-center gap-1 text-[10.5px] font-semibold text-primary',
            'opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          )}>
            <Download className="size-3" />
            Download
          </span>
        </div>
      </div>
    </div>
  )
}
