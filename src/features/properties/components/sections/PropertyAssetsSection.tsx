import { Upload, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PropertyAssetsSection() {
  return (
    <div className="mt-6 border-t border-border/12 pt-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
          Property Assets
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/55 transition-colors hover:text-foreground focus-visible:outline-none"
        >
          <Upload className="size-3" />
          Upload
        </button>
      </div>

      <div className={cn(
        'mt-4 flex items-center gap-3',
        'rounded-xl border border-dashed border-border/25 bg-muted/6',
        'px-4 py-3.5',
      )}>
        <FolderOpen className="size-4 shrink-0 text-muted-foreground/35" />
        <div className="min-w-0">
          <p className="text-[12.5px] font-medium text-foreground/55">No assets uploaded</p>
          <p className="text-[11px] text-muted-foreground/40">Floor plans, brochures, and documents</p>
        </div>
      </div>
    </div>
  )
}
