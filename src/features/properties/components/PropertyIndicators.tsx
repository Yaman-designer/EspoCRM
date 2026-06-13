'use client'

import { Star, BadgeCheck, Gem, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ComponentType } from 'react'
import type { RealEstateProperty } from '../types/property.types'

// ── IndicatorPill ─────────────────────────────────────────────────────────────
// Reusable listing quality chip. Used on cards, list rows, detail pages, and
// the details sheet. Two sizes: 'sm' (cards/list) and 'md' (detail pages).

export function IndicatorPill({
  icon: Icon,
  label,
  colorClass,
  size = 'sm',
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  colorClass: string
  size?: 'sm' | 'md'
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border whitespace-nowrap font-semibold leading-none',
      size === 'sm'
        ? 'h-4.5 px-1.5 text-[9.5px]'
        : 'h-5 px-2 text-[10px]',
      colorClass,
    )}>
      <Icon className={cn('shrink-0', size === 'sm' ? 'size-2.5' : 'size-3')} />
      {label}
    </span>
  )
}

// ── PropertyIndicatorPills ─────────────────────────────────────────────────────
// Renders the full set of listing quality indicators for a property.
// Pass size='md' on detail pages where slightly larger chips are appropriate.

type IndicatorProps = Pick<
  RealEstateProperty,
  'isFeatured' | 'isVerified' | 'isPremium' | 'isNewListing'
>

export function PropertyIndicatorPills({
  isFeatured,
  isVerified,
  isPremium,
  isNewListing,
  size = 'sm',
}: IndicatorProps & { size?: 'sm' | 'md' }) {
  if (!isFeatured && !isVerified && !isPremium && !isNewListing) return null

  return (
    <>
      {isFeatured   && <IndicatorPill icon={Star}       label="Featured" size={size} colorClass="border-amber-200/70 bg-amber-50 text-amber-600" />}
      {isVerified   && <IndicatorPill icon={BadgeCheck} label="Verified" size={size} colorClass="border-emerald-200/70 bg-emerald-50 text-emerald-600" />}
      {isPremium    && <IndicatorPill icon={Gem}        label="Premium"  size={size} colorClass="border-violet-200/70 bg-violet-50 text-violet-600" />}
      {isNewListing && <IndicatorPill icon={Sparkles}   label="New"      size={size} colorClass="border-primary/15 bg-primary/8 text-primary" />}
    </>
  )
}
