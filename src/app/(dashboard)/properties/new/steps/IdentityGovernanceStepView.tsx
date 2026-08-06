'use client'

import { useState, useCallback, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { useWatch, type UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import {
  GridEngine,
  SectionRenderer,
  SectionRow,
  isFieldVisible,
  getSectionCompletion,
  SectionCompletionBadge,
  type StepSchema,
  type SectionSchema,
  type FieldOption,
} from '@/framework/form-engine'
import { DynamicFormContext } from '@/framework/form-engine/DynamicForm'
import { useDependencyEngine } from '@/framework/form-engine/useDynamicForm'

// Presentation-only redesign of Step 1 (Identity & Governance) — Principal
// Product Design pass, 2026-07-26. Renders the exact same StepSchema as the
// generic <DynamicForm/> (same fields, validation, dependencies, visibility),
// just with bespoke premium chrome: Classification + Governance sit in a
// dense two-column row of compact cards instead of three full-width stacked
// sections, cutting the step's vertical footprint substantially. Office Use
// keeps the existing collapsible SectionRenderer untouched (Path A/B already
// reads as a slim, elegant utility strip - no reason to reinvent it).
//
// This file intentionally reimplements DynamicForm's ~15 lines of context/
// dependency-engine wiring rather than modifying DynamicForm/SectionRenderer
// themselves, so the other 7 wizard steps (which still render through the
// generic engine) are pixel-for-pixel unaffected by this redesign.

interface IdentityGovernanceStepViewProps {
  schema: StepSchema
  form: UseFormReturn<Record<string, unknown>>
}

interface CompactSectionCardProps {
  section: SectionSchema
  form: UseFormReturn<Record<string, unknown>>
  watchedValues: Record<string, unknown>
  fieldOptions: Record<string, FieldOption[]>
  fieldOptionsLoading: Record<string, boolean>
  sectionIndex: number
}

function CompactSectionCard({ section, form, watchedValues, fieldOptions, fieldOptionsLoading, sectionIndex }: CompactSectionCardProps) {
  const { t } = useTranslation('properties')
  if (!isFieldVisible(section.visibility, watchedValues)) return null

  const Icon = section.icon
  const title = section.titleKey ? t(section.titleKey) : ''
  const description = section.descriptionKey ? t(section.descriptionKey) : ''
  const completion = getSectionCompletion(section, watchedValues)

  return (
    <div
      className={cn(
        // Final polish pass: border/shadow now match SectionRenderer's
        // default card exactly (was border/60 hover:/80 with a single-layer
        // shadow and no hover escalation — the one premium card surface in
        // the wizard with different border weight/shadow depth than every
        // other step's cards). transition-[border-color,box-shadow], not
        // transition-colors, so the hover shadow actually animates instead
        // of snapping — same property list SectionRenderer's card uses.
        'rounded-2xl border border-border/30 bg-card p-5 sm:p-6',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        'hover:border-border/45',
        'hover:shadow-[0_2px_6px_rgba(16,24,40,0.06),0_8px_28px_rgba(16,24,40,0.08)]',
        'ff-section-card-in',
      )}
      style={{ '--section-i': sectionIndex } as CSSProperties}
      data-section-id={section.id}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/12 bg-primary/7 text-primary"
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold tracking-tight text-foreground">{title}</h3>
            {description && (
              <p className="truncate text-[11.5px] leading-snug text-muted-foreground/65">{description}</p>
            )}
          </div>
        </div>

        <SectionCompletionBadge {...completion} />
      </div>

      <GridEngine
        fields={section.fields}
        form={form}
        watchedValues={watchedValues}
        fieldOptions={fieldOptions}
        fieldOptionsLoading={fieldOptionsLoading}
      />
    </div>
  )
}

export function IdentityGovernanceStepView({ schema, form }: IdentityGovernanceStepViewProps) {
  const [fieldOptions, setFieldOptionsState] = useState<Record<string, FieldOption[]>>({})
  const setFieldOptions = useCallback((key: string, options: FieldOption[]) => {
    setFieldOptionsState(prev => ({ ...prev, [key]: options }))
  }, [])

  const [fieldOptionsLoading, setFieldOptionsLoadingState] = useState<Record<string, boolean>>({})
  const setFieldOptionsLoading = useCallback((key: string, loading: boolean) => {
    setFieldOptionsLoadingState(prev => ({ ...prev, [key]: loading }))
  }, [])

  const watchedValues = useWatch({ control: form.control }) as Record<string, unknown>
  useDependencyEngine(schema, form, setFieldOptions, setFieldOptionsLoading)

  const sections = schema.sections ?? []
  const classification = sections.find(s => s.id === 'classification')
  const governance = sections.find(s => s.id === 'governance')
  const rest = sections.filter(s => s.id !== 'classification' && s.id !== 'governance')

  return (
    <DynamicFormContext.Provider value={{ permissions: [], fieldOptions, setFieldOptions, fieldOptionsLoading, setFieldOptionsLoading }}>
      <div className="space-y-5">
        {/* SectionRow tier="md" (@2xl, ~672px container) — the same "peer
            cards, equal weight" row Location & Zoning uses for
            Zoning|Proximity, so both steps agree on when two cards get
            enough room to sit side by side instead of picking their own
            breakpoint. items-start (built into SectionRow), not the grid
            default (stretch): Classification and Governance rarely have
            identical content height (e.g. Title and Reference Code each
            carry a helper-text line Governance's fields don't), so stretch
            was forcing the shorter card to inherit the taller one's height,
            leaving a dead gap at its bottom instead of ending where its own
            last field does. */}
        <SectionRow tier="md">
          {classification && (
            <CompactSectionCard
              section={classification}
              form={form}
              watchedValues={watchedValues}
              fieldOptions={fieldOptions}
              fieldOptionsLoading={fieldOptionsLoading}
              sectionIndex={0}
            />
          )}
          {governance && (
            <CompactSectionCard
              section={governance}
              form={form}
              watchedValues={watchedValues}
              fieldOptions={fieldOptions}
              fieldOptionsLoading={fieldOptionsLoading}
              sectionIndex={1}
            />
          )}
        </SectionRow>

        {rest.map((section, i) => (
          <SectionRenderer
            key={section.id}
            section={section}
            sectionIndex={i + 2}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={[]}
          />
        ))}
      </div>
    </DynamicFormContext.Provider>
  )
}
