import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
}

// Extracted from the Property details page's `AssetEmptyState` (Data
// Completeness Sprint 5.1, 2026-07). That pass already consolidated 4
// independent empty-state implementations (Photos/Floor Plans/Drone/Legal)
// into one recipe within a single file; this promotes that same recipe to
// a shared primitive so any future Details page's read-only "nothing here
// yet" tab can reuse it verbatim, without a call-to-action (this is a
// read-only page; editing happens elsewhere).
//
// Enterprise architecture pass (2026-07-23): this is the ONE empty-state
// recipe on the Property details page safe to promote without changing any
// pixel — it already had 2+ byte-identical internal instances. Several
// other "empty state"-shaped blocks elsewhere on the page (Financial's "No
// historical price trend," Location's "No location intelligence available,"
// Command Hub's "No agent assigned") are visually *similar* but not
// identical (different icon shapes/sizes, inline-row vs. full-card layout,
// single-line vs. title+description) — consolidating those into this same
// primitive would mean either silently normalizing their pixels (a real
// visual change, out of scope for a behavior-preserving pass) or growing
// this component's prop surface just to reproduce three more distinct
// treatments. Left as-is, flagged as a follow-up requiring an explicit
// design decision, not merged here.
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs h-full flex flex-col items-center justify-center gap-4 text-center p-6">
      <div className="w-16 h-16 bg-primary/5 text-primary border border-primary/10 rounded-full flex items-center justify-center shadow-sm">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h4 className="font-heading font-bold text-lg text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
