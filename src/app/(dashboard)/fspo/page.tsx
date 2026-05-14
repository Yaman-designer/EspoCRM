import type { Metadata } from 'next'
import { Home } from 'lucide-react'

export const metadata: Metadata = { title: 'FSPO' }

export default function FspoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Home className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">FSPO</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        For Sale by Private Owner — manage private seller listings and inquiries.
      </p>
    </div>
  )
}
