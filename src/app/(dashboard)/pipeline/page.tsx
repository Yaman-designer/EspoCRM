import type { Metadata } from 'next'
import { GitBranch } from 'lucide-react'

export const metadata: Metadata = { title: 'Pipeline' }

export default function PipelinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <GitBranch className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Pipeline</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Visualize and manage your deals through every stage of the sales pipeline.
      </p>
    </div>
  )
}
