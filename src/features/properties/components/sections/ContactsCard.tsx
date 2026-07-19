import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { RealEstateProperty } from '../../types/property.types'

// Property Details Completion (2026-07-17). contactsIds is a required
// linkMultiple field in the Location & Zoning Wizard step with no prior
// representation anywhere in the Details page. contactsNames/contactsColumns
// arrive on the standard entity GET response — no separate relation fetch
// needed, unlike documents/calls/meetings/tasks (see property.types.ts).
//
// No per-contact detail route exists in this app (only /contact, the list
// page) — "quick navigation" links there rather than inventing a deep link
// that doesn't exist.

interface ContactsCardProps {
  property: Pick<RealEstateProperty, 'contactsIds' | 'contactsNames' | 'contactsColumns'>
}

export function ContactsCard({ property }: ContactsCardProps) {
  const { contactsIds = [], contactsNames = {}, contactsColumns = {} } = property

  if (contactsIds.length === 0) return null

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Contacts
        </h2>
        <p className="text-xs text-muted-foreground font-semibold mt-0.5">
          People related to this listing
        </p>
      </div>

      <div className="bg-card border border-border rounded-[24px] p-4 shadow-sm divide-y divide-border/50">
        {contactsIds.map(id => {
          const name = contactsNames[id] ?? 'Unnamed Contact'
          const role = contactsColumns[id]?.role
          return (
            <div key={id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/28 to-primary/10 ring-2 ring-primary/14">
                <span className="text-sm font-black text-primary">{name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">{name}</p>
                {role && (
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">{role}</p>
                )}
              </div>
              {/* Interaction Design Sprint 4: "View" previously gave no hint
                  of where it goes — this app has no per-contact profile
                  route, only the shared Contacts list, which reads as a
                  surprising destination on click. A tooltip sets that
                  expectation before the click instead of after it. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/contact"
                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded"
                  >
                    View <ArrowUpRight className="size-3" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">Open in Contacts list</TooltipContent>
              </Tooltip>
            </div>
          )
        })}
      </div>
    </section>
  )
}
