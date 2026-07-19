'use client'

import { useMemo } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllFields, isFieldVisible, evaluateCondition,
  type StepSchema, type FieldSchema,
} from '@/framework/form-engine'
import { getDataCompleteness } from '@/features/properties/lib/data-completeness'
import { buildPropertyHealth } from '@/features/properties/lib/property-health'
import type { RealEstateProperty } from '@/features/properties/types/property.types'

// ── Step 7: Review ───────────────────────────────────────────────────────────
// No new form fields — reads the live form snapshot and reuses the EXISTING
// completeness/health scorers (both already null-guard sparse input, so a
// partial in-progress draft cast as RealEstateProperty is safe) rather than
// building a third scoring system. The business-rule-violation list is new,
// but it reuses the form-engine's own getAllFields/isFieldVisible/
// evaluateCondition primitives instead of a bespoke validator.

interface ReviewStepProps {
  form: UseFormReturn<Record<string, unknown>>
  steps: StepSchema[]
}

function isCurrentlyRequired(field: FieldSchema, values: Record<string, unknown>): boolean {
  return !!field.required || (field.requiredWhen ? evaluateCondition(field.requiredWhen, values) : false)
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' ||
    (Array.isArray(value) && value.length === 0)
}

export function ReviewStep({ form, steps }: ReviewStepProps) {
  const values = useWatch({ control: form.control }) as Record<string, unknown>

  // Cast through `unknown`: this is a deliberately sparse, in-progress draft,
  // not a full RealEstateProperty — safe because both scorers null-guard
  // every field access internally (confirmed by reading their source).
  const draft = values as unknown as RealEstateProperty

  const completeness = useMemo(() => getDataCompleteness(draft), [draft])
  const health = useMemo(() => buildPropertyHealth(draft), [draft])

  const violations = useMemo(() => {
    const out: string[] = []
    for (const step of steps) {
      const fields = getAllFields(step) as FieldSchema[]
      for (const field of fields) {
        if (field.type === 'hidden') continue
        if (!isFieldVisible(field.visibility, values)) continue
        if (!isCurrentlyRequired(field, values)) continue
        if (isEmpty(values[field.key])) out.push(field.label)
      }
    }
    return out
  }, [steps, values])

  const attentionFactors = health.factors.filter(f => f.status !== 'pass')

  return (
    <div className="flex flex-col gap-5">
      {/* Scores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreCard
          title="Data Completeness"
          score={completeness.score}
          badge={completeness.level}
        />
        <ScoreCard
          title="Listing Health"
          score={health.score}
          badge={`Grade ${health.grade} · ${health.label}`}
        />
      </div>

      {/* Missing fields (from the completeness scorer) */}
      {completeness.missing.length > 0 && (
        <SummaryList
          icon={AlertTriangle}
          tone="warning"
          title="Missing information"
          items={completeness.missing}
        />
      )}

      {/* Business-rule violations (currently-required-but-empty fields) */}
      {violations.length > 0 && (
        <SummaryList
          icon={XCircle}
          tone="destructive"
          title="Required fields not yet filled"
          items={violations}
        />
      )}

      {/* Health factors needing attention */}
      {attentionFactors.length > 0 && (
        <SummaryList
          icon={AlertTriangle}
          tone="warning"
          title="Needs attention"
          items={attentionFactors.map(f => f.note ?? f.label)}
        />
      )}

      {violations.length === 0 && completeness.missing.length === 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200/60 bg-emerald-50/60 px-4 py-3.5 text-[13px] font-medium text-emerald-700">
          <CheckCircle2 className="size-4 shrink-0" />
          Ready to publish — all required information is complete.
        </div>
      )}
    </div>
  )
}

function ScoreCard({ title, score, badge }: { title: string; score: number; badge: string }) {
  return (
    <div className="rounded-[24px] border border-border/20 bg-card p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/55">
        {title}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-[28px] font-bold leading-none tracking-tight text-foreground">{score}</span>
        <span className="text-[13px] text-muted-foreground/50">/ 100</span>
      </div>
      <p className="mt-1.5 text-[12px] capitalize text-muted-foreground/60">{badge}</p>
    </div>
  )
}

function SummaryList({
  icon: Icon, tone, title, items,
}: {
  icon: React.ComponentType<{ className?: string }>
  tone: 'warning' | 'destructive'
  title: string
  items: string[]
}) {
  return (
    <div className={cn(
      'rounded-2xl border p-4',
      tone === 'warning' ? 'border-amber-200/60 bg-amber-50/50' : 'border-destructive/25 bg-destructive/5',
    )}>
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4 shrink-0', tone === 'warning' ? 'text-amber-600' : 'text-destructive')} />
        <p className="text-[12.5px] font-semibold text-foreground">{title}</p>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map(item => (
          <li
            key={item}
            className="rounded-lg border border-border/30 bg-card px-2.5 py-1 text-[11.5px] text-muted-foreground/80"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
