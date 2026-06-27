'use client'

import {
  Settings, Building2, MapPin, Hash,
  CheckCircle2, XCircle, Layers, Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataCompleteness } from '../../lib/data-completeness'
import type { RealEstateProperty } from '../../types/property.types'

// ── Props ─────────────────────────────────────────────────────────────────────

interface OperationsCommandHubProps {
  property: RealEstateProperty
  onEdit:   () => void
  onDelete: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

// Auto-size font by value length so long status strings stay inside the MetricRow
function getValueFont(value: string): string {
  if (value.length <= 3)  return 'text-[34px]'
  if (value.length <= 6)  return 'text-[26px]'
  if (value.length <= 10) return 'text-[20px]'
  return 'text-[16px]'
}

function getStatusSub(status: string): string {
  switch (status) {
    case 'Available':      return 'Open for offers'
    case 'Reserved':       return 'Hold placed'
    case 'Pending':        return 'Awaiting completion'
    case 'Under Approval': return 'In approval'
    case 'Sold':           return 'Transaction complete'
    case 'Rented':         return 'Lease active'
    case 'Draft':          return 'Not yet published'
    default:               return ''
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────

// 5-segment thresholds — match original Negotiation Velocity bar exactly
const COMPLETENESS_STEPS = [20, 40, 60, 80, 100]

// Fields tracked in getDataCompleteness missing[]
const TOTAL_TRACKED = 7

// ── Component ─────────────────────────────────────────────────────────────────

export function OperationsCommandHub({ property, onEdit }: OperationsCommandHubProps) {
  const completeness   = getDataCompleteness(property)
  const isAvailable    = property.status === 'Available'
  const statusValue    = property.status ?? '—'
  const typeValue      = property.type   ?? '—'
  const availValue     = isAvailable ? 'Yes' : 'No'
  const populatedCount = TOTAL_TRACKED - completeness.missing.length
  const remainingCount = completeness.missing.length

  const galleryCount = property.imagesIds?.length ?? 0

  return (
    <div className="space-y-4 lg:sticky lg:top-20">

      {/* ═══════════════════════════════════════════════════════════
          Card 1 — Property Status + Property Information
      ════════════════════════════════════════════════════════════ */}
      <div className={cn(
        'overflow-hidden rounded-2xl bg-card',
        'border border-border/15',
        'shadow-md',
      )}>

        {/* ── Top accent line ── */}
        <div className="h-1 bg-linear-to-r from-primary via-primary/55 to-transparent" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/8">
              <Settings className="size-4.5 text-primary" />
            </div>
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.26em] text-muted-foreground/38">
                Operations
              </p>
              <p className="text-[15px] font-black leading-tight text-foreground">
                Command Hub
              </p>
            </div>
          </div>
          {/* Pulse only when actively available */}
          <div className={cn(
            'size-2.5 rounded-full',
            isAvailable ? 'animate-pulse bg-emerald-500' : 'bg-muted-foreground/20',
          )} />
        </div>

        {/* ── Status rows + Property Information ── */}
        <div className="divide-y divide-border/8 border-t border-border/8">

          {/* Row 1 — Property Status */}
          <MetricRow
            label="Property Status"
            value={statusValue}
            sub={getStatusSub(statusValue)}
            icon={<CheckCircle2 className={cn(
              'size-3.75',
              isAvailable ? 'text-emerald-500' : 'text-muted-foreground/38',
            )} />}
            warn={statusValue === 'Draft'}
            valueFont={getValueFont(statusValue)}
          />

          {/* Row 2 — Property Type */}
          <MetricRow
            label="Property Type"
            value={typeValue}
            sub={property.purpose ?? ''}
            icon={<Building2 className="size-3.75 text-muted-foreground/38" />}
            warn={!property.type}
            valueFont={getValueFont(typeValue)}
          />

          {/* Row 3 — Availability */}
          <MetricRow
            label="Availability"
            value={availValue}
            sub={isAvailable ? 'Accepting offers' : 'Not currently available'}
            icon={isAvailable
              ? <CheckCircle2 className="size-3.75 text-emerald-500" />
              : <XCircle className="size-3.75 text-muted-foreground/38" />
            }
            valueFont="text-[34px]"
          />

          {/* Property Information */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[7px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">
              Property Information
            </p>

            {/* Property code pill */}
            {property.propertyCode && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/12 bg-muted/4 px-3 py-2">
                <Hash className="size-3 shrink-0 text-muted-foreground/35" />
                <span className="text-[7px] font-bold uppercase tracking-[0.18em] text-muted-foreground/40">
                  Ref
                </span>
                <span className="ml-auto text-[12px] font-black tabular-nums text-foreground/80">
                  {property.propertyCode}
                </span>
              </div>
            )}

            {/* Agent card — if user is assigned, show avatar + name + real dates */}
            {property.assignedUserName ? (
              <div className="overflow-hidden rounded-xl border border-border/12 bg-muted/4">
                <div className="flex gap-3 p-4">

                  {/* Avatar */}
                  <div className="shrink-0">
                    <div className={cn(
                      'flex size-11 items-center justify-center rounded-full',
                      'bg-linear-to-br from-primary/28 to-primary/10',
                      'ring-2 ring-primary/14',
                    )}>
                      <span className="text-[17px] font-black text-primary">
                        {property.assignedUserName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-black leading-tight text-foreground">
                      {property.assignedUserName}
                    </p>
                    <p className="mt-0.5 text-[7.5px] font-bold uppercase tracking-[0.13em] text-primary">
                      Listing Agent
                    </p>

                    {/* Real dates */}
                    <div className="mt-2.5 flex items-center gap-5">
                      <div>
                        <p className="text-[7px] font-medium text-muted-foreground/38">Created:</p>
                        <p className="text-[11.5px] font-black text-foreground/70">
                          {formatDate(property.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[7px] font-medium text-muted-foreground/38">Modified:</p>
                        <p className="text-[11.5px] font-black text-foreground/70">
                          {formatDate(property.modifiedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* No agent — show dates inline */
              <div className="flex items-center gap-5 rounded-xl border border-border/12 bg-muted/4 px-4 py-3">
                <div>
                  <p className="text-[7px] font-medium text-muted-foreground/38">Created:</p>
                  <p className="text-[11.5px] font-black text-foreground/70">
                    {formatDate(property.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-[7px] font-medium text-muted-foreground/38">Modified:</p>
                  <p className="text-[11.5px] font-black text-foreground/70">
                    {formatDate(property.modifiedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Card 2 — Property Details + Completeness + CTA
      ════════════════════════════════════════════════════════════ */}
      <div className={cn(
        'overflow-hidden rounded-2xl bg-card',
        'border border-border/15',
        'shadow-sm',
      )}>

        {/* Property Details header */}
        <div className="flex items-center gap-2 border-b border-border/8 px-5 py-4">
          <span className="text-[13px] leading-none text-muted-foreground/38">✳</span>
          <p className="text-[7.5px] font-black uppercase tracking-[0.24em] text-muted-foreground/40">
            Property Details
          </p>
        </div>

        {/* Detail rows */}
        <div className="divide-y divide-border/8 px-5">
          <EntityRow
            icon={<MapPin className="size-3.5 text-muted-foreground/38" />}
            label="Location"
            value={property.locationName ?? ''}
          />
          <EntityRow
            icon={<MapPin className="size-3.5 text-muted-foreground/38" />}
            label="Region"
            value={property.regionLocationName ?? ''}
          />
          <EntityRow
            icon={<MapPin className="size-3.5 text-muted-foreground/38" />}
            label="Sub-Region"
            value={property.subRegionLocationName ?? ''}
          />
          <EntityRow
            icon={<ImageIcon className="size-3.5 text-muted-foreground/38" />}
            label="Main Image"
            value={property.mainImageId ? 'Available' : 'Missing'}
          />
          <EntityRow
            icon={<Layers className="size-3.5 text-muted-foreground/38" />}
            label="Gallery"
            value={galleryCount > 0
              ? `${galleryCount} photo${galleryCount === 1 ? '' : 's'}`
              : 'None'
            }
          />
        </div>

        {/* Property Completeness — same 5-segment bar as original Velocity */}
        <div className="border-t border-border/8 px-5 py-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[7px] font-black uppercase tracking-[0.24em] text-muted-foreground/38">
              Property Completeness
            </p>
            <span className="text-[9.5px] font-black text-primary">
              {completeness.score}% Complete
            </span>
          </div>
          {/* 5-segment progress bar — identical structure to original */}
          <div className="flex gap-1.5">
            {COMPLETENESS_STEPS.map(step => (
              <div
                key={step}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-500',
                  completeness.score >= step ? 'bg-primary' : 'bg-muted/20',
                )}
              />
            ))}
          </div>
          {/* Field counts */}
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[9px] font-semibold text-muted-foreground/40">
              {populatedCount} of {TOTAL_TRACKED} fields populated
            </span>
            {remainingCount > 0 && (
              <span className="text-[9px] font-semibold text-amber-600/70">
                {remainingCount} remaining
              </span>
            )}
          </div>
        </div>

        {/* Edit CTA */}
        <div className="px-5 pb-4 pt-0">
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'w-full rounded-xl bg-foreground py-4',
              'text-[8.5px] font-black uppercase tracking-[0.18em] text-white',
              'shadow-[0_2px_12px_rgba(0,0,0,0.20)]',
              'transition-opacity hover:opacity-88 focus-visible:outline-none',
            )}
          >
            Edit Property
          </button>
        </div>

      </div>
    </div>
  )
}

// ── MetricRow ─────────────────────────────────────────────────────────────────

function MetricRow({
  label,
  value,
  sub,
  icon,
  warn = false,
  valueFont,
}: {
  label:      string
  value:      string
  sub?:       string
  icon:       React.ReactNode
  warn?:      boolean
  valueFont?: string
}) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-3 px-5 py-4',
      warn && 'bg-rose-50/55',
    )}>
      <div className="min-w-0">
        <p className={cn(
          'mb-2 text-[7px] font-black uppercase tracking-[0.22em]',
          warn ? 'text-rose-700/45' : 'text-muted-foreground/35',
        )}>
          {label}
        </p>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cn(
            'font-black leading-none',
            valueFont ?? 'text-[34px]',
            warn ? 'text-rose-600' : 'text-foreground',
          )}>
            {value}
          </span>
          {sub && (
            <span className={cn(
              'text-[9.5px] font-semibold leading-tight',
              warn ? 'text-rose-600/75' : 'text-muted-foreground/40',
            )}>
              {sub}
            </span>
          )}
        </div>
      </div>
      <div className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-xl',
        'border border-border/12 bg-muted/8',
        warn && 'border-rose-100 bg-rose-50/70',
      )}>
        {icon}
      </div>
    </div>
  )
}

// ── EntityRow ─────────────────────────────────────────────────────────────────

function EntityRow({
  icon,
  label,
  value,
}: {
  icon:  React.ReactNode
  label: string
  value: string
}) {
  const isEmpty = !value
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[12px] text-foreground/60">{label}</span>
      </div>
      <span className={cn(
        'max-w-30 truncate text-right text-[11.5px] font-black',
        !isEmpty ? 'text-foreground/75' : 'text-muted-foreground/35',
      )}>
        {isEmpty ? '—' : value}
      </span>
    </div>
  )
}
