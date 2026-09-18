import { CalendarPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarEmptyStateProps {
  label: string
  onAddSchedule?: () => void
  canCreate?: boolean
}

// Same visual recipe as the shared EmptyState primitive (icon circle over a
// card) but with a CTA — EmptyState's own header comment documents that it's
// deliberately read-only-only and other pages needing an action button build
// their own rather than growing its prop surface; this follows that same
// precedent instead of forcing Calendar's actionable empty state through it.
export function CalendarEmptyState({ label, onAddSchedule, canCreate = true }: CalendarEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary shadow-sm">
        <CalendarPlus className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-[14px] font-semibold text-foreground">Nothing scheduled</h4>
        <p className="mt-1 text-[12px] text-muted-foreground">No meetings, calls, or visits for {label}.</p>
      </div>
      {canCreate && onAddSchedule && (
        <Button size="sm" onClick={onAddSchedule}>
          <CalendarPlus className="h-3.5 w-3.5" />
          Add Schedule
        </Button>
      )}
    </div>
  )
}
