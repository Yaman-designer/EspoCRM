'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error]', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-7 w-7 text-destructive" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          An unexpected error occurred loading this page. Please try again.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/60">
            Error ID: <code className="font-mono">{error.digest}</code>
          </p>
        )}
      </div>

      <Button type="button" onClick={reset} size="sm" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  )
}
