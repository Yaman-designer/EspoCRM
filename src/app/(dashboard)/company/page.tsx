import type { Metadata } from 'next'
import Link from 'next/link'
import { Briefcase, UserSquare2, UsersRound } from 'lucide-react'

export const metadata: Metadata = { title: 'Company' }

const sections = [
  { label: 'Users', description: 'Manage user accounts and permissions', href: '/company/users', icon: UserSquare2 },
  { label: 'Teams', description: 'Organise agents into teams and territories', href: '/company/teams', icon: UsersRound },
]

export default function CompanyPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Company</h1>
          <p className="text-sm text-muted-foreground">Manage your organisation structure</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-design-xs hover:border-primary/40 hover:shadow-design-sm transition-all duration-200"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <s.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{s.label}</p>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
