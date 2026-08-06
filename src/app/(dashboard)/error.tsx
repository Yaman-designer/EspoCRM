'use client'

import { useEffect } from 'react'
import { FeedbackState } from '@/components/shared'

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
    <div className="flex min-h-[60vh] items-center justify-center">
      <FeedbackState
        variant="error"
        icon="alert"
        eyebrow="Server Error"
        code="500"
        title="Something went wrong"
        description="An unexpected error occurred while loading this page. Please try again."
        note="Your data is safe. Nothing has been lost."
        primaryAction={{ label: 'Try again', icon: 'refresh', onClick: reset }}
        secondaryAction={{ label: 'Go to Dashboard', icon: 'home', href: '/dashboard' }}
        details={error.digest ? `Error ID: ${error.digest}` : undefined}
        className="w-full max-w-md"
      />
    </div>
  )
}
