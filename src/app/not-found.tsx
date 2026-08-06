import { FeedbackState } from '@/components/shared'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <FeedbackState
        variant="empty"
        icon="building"
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved. It may have been renamed, or the listing behind it was removed."
        primaryAction={{ label: 'Back to Dashboard', icon: 'home', href: '/dashboard' }}
        secondaryAction={{ label: 'Browse Properties', icon: 'search', href: '/properties' }}
        className="w-full max-w-md"
      />
    </main>
  )
}
