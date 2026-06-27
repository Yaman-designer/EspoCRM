import { CheckCircle2, UserCheck, Star, Clock, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmtDate } from '../../lib/display'
import { TimelineEvent } from './TimelineEvent'
import type { RealEstateProperty } from '../../types/property.types'

export function PropertyTimelineSection({ property }: { property: RealEstateProperty }) {
  const { createdAt, modifiedAt, assignedUserName, createdByName, isFeatured, isPremium } = property

  if (!createdAt && !modifiedAt && !assignedUserName) return null

  return (
    <div className={cn(
      'mt-4 rounded-[24px] bg-card',
      'border border-border/20',
      'shadow-[0_1px_3px_rgba(0,0,0,0.03),0_4px_14px_rgba(0,0,0,0.05)]',
      'p-5',
    )}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-3.5 text-muted-foreground/52" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/58">
            Activity
          </p>
        </div>
        <span className="text-[10.5px] font-medium text-muted-foreground/40">
          {[createdAt, modifiedAt, assignedUserName, (isFeatured || isPremium)].filter(Boolean).length} events
        </span>
      </div>

      <div className="space-y-0">
        {createdAt && (
          <TimelineEvent
            icon={CheckCircle2}
            title="Property listed"
            subtitle={createdByName ? `by ${createdByName}` : undefined}
            date={fmtDate(createdAt, 'long')}
            variant="primary"
          />
        )}
        {assignedUserName && (
          <TimelineEvent
            icon={UserCheck}
            title="Agent assigned"
            subtitle={assignedUserName}
            variant="success"
          />
        )}
        {(isFeatured || isPremium) && (
          <TimelineEvent
            icon={Star}
            title="Promoted to premium listing"
            subtitle="Elevated to featured portfolio"
            variant="warning"
          />
        )}
        {modifiedAt && (
          <TimelineEvent
            icon={Clock}
            title="Last updated"
            date={fmtDate(modifiedAt, 'long')}
            isLast
          />
        )}
      </div>
    </div>
  )
}
