'use client'

import { useState, useCallback, useRef, useEffect, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UseFormReturn } from 'react-hook-form'
import type { SectionSchema, FieldSchema, FieldOption } from './types'
import { isFieldVisible } from './VisibilityEngine'
import { GridEngine } from './GridEngine'
import { getSectionCompletion, SectionCompletionBadge } from './section-primitives'

/* ── Collapse phase state machine ────────────────────────────────────
   collapsed  ──[expand click]──►  expanding  ──[280 ms]──►  expanded
   expanded   ──[collapse click]►  collapsing ──[220 ms]──►  collapsed

   Intermediate phases give CSS animations time to finish before React
   unmounts / mounts the card vs. bar elements.
────────────────────────────────────────────────────────────────────── */
type CollapsePhase = 'collapsed' | 'expanding' | 'expanded' | 'collapsing'

interface SectionRendererProps {
  section:       SectionSchema
  form:          UseFormReturn<any>
  watchedValues: Record<string, unknown>
  fieldOptions:  Record<string, FieldOption[]>
  /** True per field key while its `reload-options` dependency is in flight — see useDynamicForm.ts. */
  fieldOptionsLoading?: Record<string, boolean>
  permissions?:  string[]
  hideHeader?:   boolean
  sectionIndex?: number
  /**
   * Presentation-only override of the section body: same fields, same
   * GridEngine-driven visibility/disabled/readOnly/dependency resolution,
   * just a different internal layout (e.g. sub-grouped clusters instead of
   * one flat grid). Defaults to the plain `<GridEngine fields={section.fields}
   * .../>` below, so every existing caller (the generic DynamicForm, every
   * other wizard step) is byte-for-byte unaffected. Callers that use this
   * are responsible for still rendering every field in `section.fields`.
   */
  renderBody?: (fields: FieldSchema[]) => ReactNode
}

/* ─── SectionRenderer ────────────────────────────────────────────── */

export function SectionRenderer({
  section,
  form,
  watchedValues,
  fieldOptions,
  fieldOptionsLoading,
  permissions,
  hideHeader,
  sectionIndex = 0,
  renderBody,
}: SectionRendererProps) {

  /* ── All hooks declared before any conditional return ── */

  const { t } = useTranslation('properties')
  const [phase, setPhase] = useState<CollapsePhase>(
    section.defaultCollapsed ? 'collapsed' : 'expanded',
  )
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  /* Suppresses entrance animation on initial page load. State, not a ref —
     it's read from the className expression below, and a ref's `.current`
     can't be read during render. Every place this is set already calls
     setPhase in the same tick, which re-renders regardless, so this adds
     no additional render. */
  const [hasToggled, setHasToggled] = useState(false)

  useEffect(
    () => () => { if (timerRef.current) clearTimeout(timerRef.current) },
    [],
  )

  const expand = useCallback(() => {
    if (phase !== 'collapsed') return
    setHasToggled(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('expanding')
    timerRef.current = setTimeout(() => setPhase('expanded'), 280)
  }, [phase])

  const collapse = useCallback(() => {
    if (phase !== 'expanded') return
    setHasToggled(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('collapsing')
    timerRef.current = setTimeout(() => setPhase('collapsed'), 220)
  }, [phase])

  /* ── Section-level visibility ── */
  if (!isFieldVisible(section.visibility, watchedValues)) return null

  /* ── Derived ── */
  const Icon          = section.icon
  const bg            = section.background
  const title         = section.titleKey ? t(section.titleKey) : ''
  const description   = section.descriptionKey ? t(section.descriptionKey) : ''
  const hasHeader      = !hideHeader && (title || description || Icon)
  const isCollapsible = Boolean(section.collapsible)
  const isTransitioning = phase === 'expanding' || phase === 'collapsing'
  const isExpanded      = phase === 'expanded' || phase === 'expanding' || phase === 'collapsing'

  const { visibleCount, filledCount, isComplete } = getSectionCompletion(section, watchedValues)

  /* ══════════════════════════════════════════════════════════════════
     PATH A — Collapsed summary bar
     Compact single-row interactive button. Only rendered when
     phase === 'collapsed' (not during transitions).
  ══════════════════════════════════════════════════════════════════ */
  if (isCollapsible && !isExpanded) {
    const filledAndComplete = filledCount > 0 && isComplete

    return (
      <button
        type="button"
        onClick={expand}
        className={cn(
          'group w-full rounded-2xl border px-5 py-4 sm:py-3.5 text-left',
          'transition-[border-color,background-color,box-shadow] duration-200 ease-out',
          'hover:border-border/50 hover:bg-muted/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          filledAndComplete
            ? 'border-brand-emerald/20 bg-brand-emerald-soft/30'
            : 'border-border/30 bg-muted/20',
          !hasToggled ? 'ff-section-card-in' : 'ff-section-bar-appear',
        )}
        style={{ '--section-i': sectionIndex } as CSSProperties}
        aria-expanded={false}
        aria-controls={`section-${section.id}-body`}
      >
        <div className="flex items-center gap-3">
          {Icon && (
            <Icon
              className="h-3.75 w-3.75 shrink-0 text-muted-foreground/45 transition-colors duration-200 group-hover:text-muted-foreground/65"
              aria-hidden
            />
          )}

          <span className={cn(
            'text-[14px] font-bold tracking-tight transition-colors duration-200',
            filledCount > 0 ? 'text-foreground/85' : 'text-foreground/70',
          )}>
            {title}
          </span>

          {filledAndComplete && (
            <Check
              className="h-3.5 w-3.5 shrink-0 text-brand-emerald"
              strokeWidth={2.5}
              aria-label={t('wizard.common.sectionComplete')}
            />
          )}

          <div className="flex-1" aria-hidden />

          {filledCount > 0 ? (
            <span className="shrink-0 tabular-nums text-[11px] font-medium text-muted-foreground/50">
              {filledCount}/{visibleCount}
            </span>
          ) : (
            <span className="shrink-0 text-[11px] text-muted-foreground/35">
              {t('wizard.common.fieldCount', { count: visibleCount })}
            </span>
          )}

          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-all duration-220 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:text-muted-foreground/60 group-hover:translate-y-0.5"
            aria-hidden
          />
        </div>

        {description && (
          <p className={cn(
            'mt-1 text-[12px] leading-snug text-muted-foreground/40 line-clamp-1',
            Icon ? 'pl-6' : '',
          )}>
            {description}
          </p>
        )}
      </button>
    )
  }

  /* ══════════════════════════════════════════════════════════════════
     PATH B — Collapsible expanded (active during transitions too)
     Tinted card surface with header and collapse toggle.
  ══════════════════════════════════════════════════════════════════ */
  if (isCollapsible) {
    return (
      <div
        className={cn(
          'rounded-2xl border p-4 sm:p-6',
          'transition-[border-color,box-shadow] duration-200 ease-out',
          bg === 'muted'  ? 'border-border/45 bg-muted/50' :
          bg === 'accent' ? 'border-primary/12 bg-accent/45' :
                            'border-border/30 bg-muted/25',
          phase === 'expanding'  && 'ff-section-expand',
          phase === 'collapsing' && 'ff-section-collapse pointer-events-none',
          phase === 'expanded'   && !hasToggled && 'ff-section-card-in',
        )}
        style={{ '--section-i': sectionIndex } as CSSProperties}
        data-section-id={section.id}
      >
        {hasHeader && (
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3.5">
              {Icon && (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10 sm:h-10 sm:w-10"
                  aria-hidden
                >
                  <Icon className="h-4.5 w-4.5" />
                </div>
              )}
              <div className="min-w-0 space-y-0.5 pt-0.5">
                <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                  {title}
                </h3>
                {description && (
                  <p className="text-[12.5px] leading-relaxed text-muted-foreground/60">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-0.5 flex shrink-0 items-center gap-2">
              <SectionCompletionBadge visibleCount={visibleCount} filledCount={filledCount} isComplete={isComplete} />

              <button
                type="button"
                onClick={collapse}
                disabled={isTransitioning}
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                  'text-muted-foreground/40 transition-colors duration-200 ease-out',
                  'hover:bg-background/60 hover:text-muted-foreground/70',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'disabled:pointer-events-none',
                )}
                aria-expanded={true}
                aria-controls={`section-${section.id}-body`}
                aria-label={t('wizard.common.collapseSection', { title: title || t('wizard.common.sectionFallback') })}
              >
                <ChevronDown
                  className="h-4 w-4 rotate-180 transition-transform duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  aria-hidden
                />
              </button>
            </div>
          </div>
        )}

        <div id={`section-${section.id}-body`}>
          {renderBody ? renderBody(section.fields) : (
            <GridEngine
              fields={section.fields}
              form={form}
              watchedValues={watchedValues}
              fieldOptions={fieldOptions}
              fieldOptionsLoading={fieldOptionsLoading}
              permissions={permissions}
            />
          )}
        </div>
      </div>
    )
  }

  /* ══════════════════════════════════════════════════════════════════
     PATH C — Non-collapsible sections

     Two sub-variants based on section.background:
       • muted / accent  → tinted editorial block, larger title, open header
       • default (none)  → premium white elevated card, inset header/body zones
  ══════════════════════════════════════════════════════════════════ */

  /* Tinted background variants ──────────────────────────────────── */
  if (bg === 'muted' || bg === 'accent') {
    const tintCls = bg === 'muted'
      ? 'rounded-2xl bg-muted/40 p-4 sm:p-6'
      : 'rounded-2xl bg-accent/50 p-4 sm:p-6'

    return (
      <div
        className={cn(tintCls, 'ff-section-card-in')}
        style={{ '--section-i': sectionIndex } as CSSProperties}
        data-section-id={section.id}
      >
        {section.divider && <hr className="mb-8 border-border/20" />}

        {hasHeader && (
          <div className="mb-5 flex items-start justify-between gap-3 sm:mb-7 sm:gap-4">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              {Icon && (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10 sm:h-10 sm:w-10"
                  aria-hidden
                >
                  {/* Larger icon for tinted variants — serves as sub-section landmark */}
                  <Icon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 space-y-1 pt-0.5">
                <h3 className="text-[18px] font-bold tracking-tight text-foreground">
                  {title}
                </h3>
                {description && (
                  <p className="text-[13px] leading-relaxed text-muted-foreground/65">
                    {description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-0.5 shrink-0">
              <SectionCompletionBadge visibleCount={visibleCount} filledCount={filledCount} isComplete={isComplete} />
            </div>
          </div>
        )}

        {renderBody ? renderBody(section.fields) : (
          <GridEngine
            fields={section.fields}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={permissions}
          />
        )}
      </div>
    )
  }

  /* Premium white elevated card ────────────────────────────────────
     No padding on the outer wrapper — overflow-hidden clips to the
     rounded corners cleanly. Content lives in header zone + body zone,
     each with responsive inset padding (px-4 mobile → px-8 desktop).
  ─────────────────────────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border border-border/30 bg-card',
        'shadow-[0_1px_2px_rgba(16,24,40,0.04),0_3px_16px_rgba(16,24,40,0.05)]',
        'transition-[border-color,box-shadow] duration-200 ease-out',
        'hover:border-border/45',
        'hover:shadow-[0_2px_6px_rgba(16,24,40,0.06),0_8px_28px_rgba(16,24,40,0.08)]',
        'ff-section-card-in',
      )}
      style={{ '--section-i': sectionIndex } as CSSProperties}
      data-section-id={section.id}
    >
      {section.divider && <hr className="border-border/20" />}

      {/* ── Header zone ── */}
      {hasHeader && (
        <>
          <div className="px-4 pb-4 pt-5 sm:px-8 sm:pb-5 sm:pt-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                {Icon && (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary ring-1 ring-primary/10 sm:h-10 sm:w-10"
                    aria-hidden
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="min-w-0 space-y-1.5 pt-1">
                  <h3 className="text-[15px] font-bold tracking-tight text-foreground">
                    {title}
                  </h3>
                  {description && (
                    <p className="text-[12.5px] leading-relaxed text-muted-foreground/60">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-1 shrink-0">
                <SectionCompletionBadge visibleCount={visibleCount} filledCount={filledCount} isComplete={isComplete} />
              </div>
            </div>
          </div>

          <div className="mx-4 border-b border-border/20 sm:mx-8" />
        </>
      )}

      {/* ── Body zone ── */}
      <div className={cn(hasHeader ? 'px-4 pb-5 pt-4 sm:px-8 sm:pb-8 sm:pt-6' : 'p-4 sm:p-8')}>
        {renderBody ? renderBody(section.fields) : (
          <GridEngine
            fields={section.fields}
            form={form}
            watchedValues={watchedValues}
            fieldOptions={fieldOptions}
            fieldOptionsLoading={fieldOptionsLoading}
            permissions={permissions}
          />
        )}
      </div>
    </div>
  )
}
