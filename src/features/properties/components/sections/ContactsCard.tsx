import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SectionHeader, AvatarInitial } from '@/components/shared'
import type { ContactsViewModel } from '../../view-models/contacts.viewmodel'

// Property Details Completion (2026-07-17). contactsIds is a required
// linkMultiple field in the Location & Zoning Wizard step with no prior
// representation anywhere in the Details page. contactsNames/contactsColumns
// arrive on the standard entity GET response — no separate relation fetch
// needed, unlike documents/calls/meetings/tasks (see property.types.ts).
//
// No per-contact detail route exists in this app (only /contact, the list
// page) — "quick navigation" links there rather than inventing a deep link
// that doesn't exist.
//
// Enterprise architecture pass (2026-07-23). id→name/role lookup used to
// live inline in this component's `.map()`; now arrives pre-shaped via
// `ContactsViewModel` (see view-models/contacts.viewmodel.ts). The avatar
// circle is now the shared `AvatarInitial` (size="lg" — this file's own
// exact original markup, verified distinct from Command Hub's smaller
// "Assigned Agent" circle, not silently unified).

interface ContactsCardProps {
  viewModel: ContactsViewModel
}

export function ContactsCard({ viewModel }: ContactsCardProps) {
  const { t } = useTranslation('properties')
  const { contacts, isEmpty } = viewModel

  if (isEmpty) return null

  return (
    <section className="space-y-4">
      <SectionHeader title={t('contacts.title')} subtitle={t('contacts.subtitle')} />

      {/* Card recipe migrated off the legacy "Stitch" scaffold to match
          Financial Intelligence et al. — see ConstructionSystemsCard's own
          note on this same pass for the full rationale. */}
      <div className="bg-card border border-border/40 rounded-2xl shadow-design-xs p-4 divide-y divide-border/50">
        {contacts.map(contact => (
          <div key={contact.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
            <AvatarInitial name={contact.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{contact.name}</p>
              {contact.role && (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">{contact.role}</p>
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
                  {t('contacts.view')} <ArrowUpRight className="size-3" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top">{t('contacts.openInContactsList')}</TooltipContent>
            </Tooltip>
          </div>
        ))}
      </div>
    </section>
  )
}
