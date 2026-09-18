import { AlertTriangle, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CalendarErrorStateProps {
  onRetry: () => void
}

export function CalendarErrorState({ onRetry }: CalendarErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-destructive/15 bg-destructive/8 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-[14px] font-semibold text-foreground">Couldn&apos;t load your schedule</h4>
        <p className="mt-1 text-[12px] text-muted-foreground">Something went wrong reaching the calendar. Try again.</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RotateCw className="h-3.5 w-3.5" />
        Try again
      </Button>
    </div>
  )
}
