import type { Metadata } from 'next'
import { UsersRound } from 'lucide-react'

export const metadata: Metadata = { title: 'Teams · Company' }

export default function CompanyTeamsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <UsersRound className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Teams</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Organise agents into specialised teams, assign leads and track performance.
      </p>
    </div>
  )
}
