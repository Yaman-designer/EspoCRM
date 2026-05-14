import type { Metadata } from 'next'
import { ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Requests' }

export default function RequestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ClipboardList className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Requests</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Track and manage client property requests and requirements.
      </p>
    </div>
  )
}
