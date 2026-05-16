import { Phone, ChevronRight, Flame, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { contacts, type Contact, type LeadTemp } from './data'

// ── Lead temp config ──────────────────────────────────────────────────────────

const TEMP_CFG: Record<LeadTemp, { bg: string; text: string; label: string; icon: React.ElementType }> = {
  hot:  { bg: 'bg-brand-crimson-soft', text: 'text-brand-crimson', label: 'Hot',  icon: Flame  },
  warm: { bg: 'bg-chart-4/10',         text: 'text-chart-4',        label: 'Warm', icon: Minus  },
  cold: { bg: 'bg-primary/10',         text: 'text-primary',        label: 'Cold', icon: Minus  },
}

const AVATAR_PALETTE = [
  'bg-primary/10 text-primary',
  'bg-chart-3/10 text-chart-3',
  'bg-chart-4/10 text-chart-4',
  'bg-brand-teal/10 text-brand-teal',
  'bg-brand-crimson/10 text-brand-crimson',
]

// ── Contact item ──────────────────────────────────────────────────────────────

function LeadItem({ contact, index }: { contact: Contact; index: number }) {
  const cfg = TEMP_CFG[contact.temp]
  const Icon = cfg.icon

  return (
    <div className="group flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-muted/35">
      {/* Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
          AVATAR_PALETTE[index % AVATAR_PALETTE.length],
        )}
      >
        {contact.initials}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[13px] font-semibold text-foreground">{contact.name}</p>
          <span className={cn(
            'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold',
            cfg.bg, cfg.text,
          )}>
            <Icon className="h-2.5 w-2.5" />
            {cfg.label}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{contact.location}</p>
      </div>

      {/* Call button */}
      <Button
        variant="outline"
        size="icon-xs"
        aria-label={`Call ${contact.name}`}
        className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Phone className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeadsContactList() {
  const hotCount = contacts.filter((c) => c.temp === 'hot').length

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md">

      <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-6 py-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Active Leads</h3>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {hotCount} hot leads need follow-up
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" aria-label="View all leads" className="text-muted-foreground hover:text-foreground">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col overflow-auto p-3">
        {contacts.map((c, i) => (
          <LeadItem key={c.id} contact={c} index={i} />
        ))}
      </div>

      <div className="border-t border-border/50 px-4 py-2.5">
        <button className="flex w-full items-center justify-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80">
          View all {contacts.length} leads
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

    </div>
  )
}
