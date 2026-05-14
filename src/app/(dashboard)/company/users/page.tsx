import type { Metadata } from 'next'
import { UserSquare2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Users · Company' }

export default function CompanyUsersPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <UserSquare2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Users</h1>
      <p className="text-sm text-muted-foreground max-w-xs">
        Create and manage user accounts, roles, and access permissions.
      </p>
    </div>
  )
}
