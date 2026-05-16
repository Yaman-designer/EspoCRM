import Link from 'next/link'
import { Building2, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Building2 className="h-8 w-8 text-primary" />
      </div>

      <div className="space-y-2">
        <p className="text-6xl font-bold tracking-tight text-primary">404</p>
        <h1 className="text-xl font-semibold text-foreground">Page not found</h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Button asChild size="sm" className="gap-2">
        <Link href="/dashboard">
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
    </main>
  )
}
