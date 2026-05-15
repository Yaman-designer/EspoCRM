import { ChevronRight, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <div className="flex items-center gap-2 py-2.5 first:pt-0 last:pb-0">
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
      <Button variant="outline" size="icon-xs" aria-label={`Call ${contact.name}`} className="shrink-0">
        <Phone className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function LeadsContactList() {
  return (
    <Card className="gap-0 p-0">

      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h3 className="text-sm font-semibold text-foreground">Leads Contact</h3>
        <Button variant="ghost" size="icon-xs" aria-label="View all contacts">
          <ChevronRight />
        </Button>
      </div>

      <div className="divide-y divide-border px-5 py-2">
        {contacts.map((c, i) => (
          <ContactItem key={c.id} contact={c} index={i} />
        ))}
      </div>

    </Card>
  )
}
