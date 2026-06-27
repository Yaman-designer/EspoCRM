'use client'

import { MessageSquare, Activity } from 'lucide-react'
import { fmtDate, fmtPrice } from '../../lib/display'
import type { RealEstateProperty } from '../../types/property.types'

// ── Types ──────────────────────────────────────────────────────────────────────

type EventKind = 'agent' | 'system'

interface StreamMeta {
  label:       string
  value:       string
  statusLabel: string
  statusType:  'success' | 'warning' | 'info'
}

interface StreamEvent {
  id:      string
  type:    EventKind
  title:   string
  role:    string
  time:    string
  content: string
  meta?:   StreamMeta
}

// ── Relative timestamp ────────────────────────────────────────────────────────

function relTime(iso: string | undefined): string {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  if (diffMs < 0) return 'Just now'
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30)  return `${days}d ago`
  return fmtDate(iso)
}

// ── Build real lifecycle events from backend ──────────────────────────────────

function buildEvents(property: RealEstateProperty): StreamEvent[] {
  const {
    createdAt, modifiedAt, status, type, purpose,
    imagesIds, assignedUserName, propertyCode, price,
    locationName, regionLocationName,
  } = property

  const locationLabel = locationName?.trim() || regionLocationName?.trim() || null
  const events: StreamEvent[] = []

  // ── Agent entry (most recent — if property is assigned) ──────────────────
  if (assignedUserName) {
    events.push({
      id:      'agent-assigned',
      type:    'agent',
      title:   assignedUserName,
      role:    'Listing Agent',
      time:    relTime(modifiedAt || createdAt),
      content: `${assignedUserName} is managing this listing as the primary agent.${status ? ` Current status: ${status}.` : ''}`,
      meta:    price != null ? {
        label:       'Asking Price',
        value:       fmtPrice(price, false),
        statusLabel: status ?? 'Active',
        statusType:  status === 'Available' ? 'success'
                   : (status === 'Sold' || status === 'Rented') ? 'info'
                   : 'warning',
      } : undefined,
    })
  }

  // ── Gallery entry (if images are attached) ───────────────────────────────
  if (imagesIds && imagesIds.length > 0) {
    events.push({
      id:      'gallery-published',
      type:    'system',
      title:   'Listing Media',
      role:    'Media Published',
      time:    relTime(modifiedAt || createdAt),
      content: `${imagesIds.length} photo${imagesIds.length !== 1 ? 's' : ''} attached to this listing. Gallery is ready for buyer review.`,
      meta:    {
        label:       'Photo Count',
        value:       `${imagesIds.length} photos`,
        statusLabel: 'Published',
        statusType:  'success',
      },
    })
  }

  // ── Listing created (oldest — always present) ────────────────────────────
  const createdBody = [
    'Property record created and indexed.',
    type,
    locationLabel,
    purpose && `For ${purpose}`,
  ].filter(Boolean).join(' · ')

  events.push({
    id:      'listing-created',
    type:    'system',
    title:   'Property Registry',
    role:    'Listing Created',
    time:    relTime(createdAt),
    content: createdBody,
    meta:    propertyCode ? {
      label:       'Property Code',
      value:       `#${propertyCode}`,
      statusLabel: 'Indexed',
      statusType:  'info',
    } : undefined,
  })

  return events.slice(0, 3)
}

// ── Status dot colour ─────────────────────────────────────────────────────────

function statusDotCls(type: StreamMeta['statusType']): string {
  return type === 'success' ? 'bg-brand-emerald'
       : type === 'warning' ? 'bg-amber-500'
       : 'bg-brand-azure'
}

// ── Component ─────────────────────────────────────────────────────────────────

interface PropertyIntelligenceStreamProps {
  property: RealEstateProperty
}

export function PropertyIntelligenceStream({ property }: PropertyIntelligenceStreamProps) {
  const events = buildEvents(property)

  return (
    // Stitch: <section className="space-y-4">
    <section className="space-y-4">

      {/* Stitch: <div className="flex items-center justify-between"> */}
      <div className="flex items-center justify-between">
        {/* Stitch: text-xl font-black text-text-main tracking-tight font-headline */}
        <h2 className="text-xl font-black text-foreground tracking-tight font-heading">
          Intelligence Stream
        </h2>
        {/* Stitch: text-[10px] font-black text-text-muted uppercase tracking-widest px-2.5 py-1 bg-border/50 rounded-full */}
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2.5 py-1 bg-border/50 rounded-full">
          Live Ops
        </span>
      </div>

      {/* Stitch: bg-white border border-border rounded-[24px] overflow-hidden shadow-sm */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">

        {/* Stitch: <div className="divide-y divide-border"> */}
        <div className="divide-y divide-border">
          {events.map(item => (
            // Stitch: p-6 relative timeline-node group hover:bg-slate-50/40 transition-colors
            <div key={item.id} className="p-6 relative timeline-node group hover:bg-muted/20 transition-colors duration-200">
              {/* Stitch: <div className="flex items-start gap-4"> */}
              <div className="flex items-start gap-4">

                {/* Stitch: <div className="relative z-10 timeline-line shrink-0"> */}
                <div className="relative z-10 timeline-line shrink-0">
                  {/* Stitch: w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md
                               agent → bg-primary, system → bg-navy (Ebla: bg-foreground) */}
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-md ${
                    item.type === 'agent' ? 'bg-primary' : 'bg-foreground'
                  }`}>
                    {item.type === 'agent'
                      ? <MessageSquare className="w-4 h-4" />
                      : <Activity className="w-4 h-4" />
                    }
                  </div>
                </div>

                {/* Stitch: <div className="flex-1"> */}
                <div className="flex-1">

                  {/* Stitch: <div className="flex justify-between items-center mb-1"> */}
                  <div className="flex justify-between items-center mb-1">
                    {/* Stitch: <div className="flex items-center gap-2"> */}
                    <div className="flex items-center gap-2">
                      {/* Stitch: text-sm font-bold text-text-main */}
                      <span className="text-sm font-bold text-foreground">{item.title}</span>
                      {/* Stitch: px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight
                                   agent → bg-primary/5 text-primary, system → bg-slate-100 text-slate-600 */}
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight ${
                        item.type === 'agent'
                          ? 'bg-primary/5 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.role}
                      </span>
                    </div>
                    {/* Stitch: text-[9px] font-bold text-text-muted/60 uppercase tracking-widest */}
                    <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                      {item.time}
                    </span>
                  </div>

                  {/* Stitch: <p className="text-sm text-slate-700 leading-relaxed font-medium"> */}
                  <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                    {item.content}
                  </p>

                  {/* Stitch meta block — two-column layout with vertical divider */}
                  {item.meta && (
                    // Stitch: flex items-center gap-8 bg-background/60 p-3 rounded-xl border border-border w-fit shadow-xs mt-3
                    <div className="flex items-center gap-8 bg-background/60 p-3 rounded-xl border border-border w-fit shadow-xs mt-3">
                      <div>
                        {/* Stitch: text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-0.5 */}
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                          {item.meta.label}
                        </span>
                        {/* Stitch: text-base font-black text-text-main tracking-tight */}
                        <span className="text-base font-black text-foreground tracking-tight">
                          {item.meta.value}
                        </span>
                      </div>
                      {/* Stitch: <div className="w-px h-8 bg-border" /> */}
                      <div className="w-px h-8 bg-border" />
                      <div>
                        {/* Stitch: text-[8px] font-bold text-text-muted uppercase tracking-widest block mb-0.5 */}
                        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest block mb-0.5">
                          Status
                        </span>
                        {/* Stitch: flex items-center gap-1.5 + status dot + label */}
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${statusDotCls(item.meta.statusType)}`} />
                          <span className="text-[10px] font-black text-foreground uppercase">
                            {item.meta.statusLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
