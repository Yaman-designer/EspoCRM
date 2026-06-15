import type { ReactNode } from 'react'

export function EntityViewField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/20 last:border-0">
      <span className="shrink-0 text-[12px] text-muted-foreground">{label}</span>
      <div className="text-right text-[13px] text-foreground">{children}</div>
    </div>
  )
}
