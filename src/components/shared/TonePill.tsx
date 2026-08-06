import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PillTone } from '@/shared/detail-view'

export type { PillTone }

interface TonePillProps {
  icon: LucideIcon
  label: string
  tone: PillTone
  compact?: boolean
}

// Semantic icon+label pill — extracted after verifying the Property details
// page's `ConditionBadge` (ConstructionSystemsCard) and `FeatureBadge`
// (FeaturesAmenitiesCard) against real source: identical base classes and
// an identical `positive` tone (byte-for-byte `bg-brand-emerald/5
// border-brand-emerald/20 text-brand-emerald`) in both; ConditionBadge adds
// an `attention` tone FeatureBadge never had, FeatureBadge adds a `neutral`
// tone and a `compact` size ConditionBadge never had. All three real
// treatments are preserved here exactly — nothing was invented to make
// them "consistent."
export function TonePill({ icon: Icon, label, tone, compact }: TonePillProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-lg border font-bold',
      compact ? 'px-2.5 py-1 text-[10.5px]' : 'px-3 py-1.5 text-[11px]',
      tone === 'positive' && 'bg-brand-emerald/5 border-brand-emerald/20 text-brand-emerald',
      tone === 'attention' && 'bg-amber-500/8 border-amber-500/25 text-amber-700',
      tone === 'neutral'   && 'bg-muted/30 border-border/40 text-foreground/70',
    )}>
      <Icon className="size-3.5 shrink-0" />
      {label}
    </span>
  )
}
