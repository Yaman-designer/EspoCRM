import { ChevronRight, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { contacts, type Contact } from './data'

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
  'bg-chart-1/10 text-chart-1',
  'bg-chart-5/10 text-chart-5',
]

function ContactItem({ contact, index }: { contact: Contact; index: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        AVATAR_PALETTE[index % AVATAR_PALETTE.length],
      )}>
        {contact.initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{contact.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{contact.location}</p>
      </div>
      <button
        aria-label={`Call ${contact.name}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
      >
        <Phone className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function LeadsContactList() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-design-sm">

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Leads Contact</h3>
        <button
          aria-label="View all contacts"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="divide-y divide-border">
        {contacts.map((c, i) => (
          <ContactItem key={c.id} contact={c} index={i} />
        ))}
      </div>
    </div>
  )
}
