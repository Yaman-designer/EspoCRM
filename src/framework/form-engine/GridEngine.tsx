'use client'

import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import type { UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import type { FieldSchema, FieldOption } from './types'
import { isFieldVisible, evaluateCondition } from './VisibilityEngine'
import { getGridClasses } from './utils'
import { FieldRenderer } from './FieldRenderer'
import { GroupCaption } from './section-primitives'

interface GridEngineProps {
  fields: FieldSchema[]
  form: UseFormReturn<any>
  watchedValues: Record<string, unknown>
  fieldOptions: Record<string, FieldOption[]>
  /** True per field key while its `reload-options` dependency is in flight — see useDynamicForm.ts. */
  fieldOptionsLoading?: Record<string, boolean>
  permissions?: string[]
}

interface GroupMarker {
  startsNewGroup: boolean
  showDivider: boolean
}

/**
 * Pure helper, not a component — computes, for each field that will actually
 * render, whether it opens a new `groupLabelKey` run and whether that run
 * needs a leading divider (every new group after the first). Kept outside
 * GridEngine itself so its internal bookkeeping is ordinary sequential
 * logic, not mutation inside a component's render body.
 */
function computeGroupMarkers(renderableFields: FieldSchema[]): Map<string, GroupMarker> {
  const markers = new Map<string, GroupMarker>()
  let previousGroupKey: string | undefined
  let sawAnyGroup = false
  for (const field of renderableFields) {
    const startsNewGroup = !!field.groupLabelKey && field.groupLabelKey !== previousGroupKey
    const showDivider = startsNewGroup && sawAnyGroup
    if (startsNewGroup) {
      previousGroupKey = field.groupLabelKey
      sawAnyGroup = true
    }
    markers.set(field.key, { startsNewGroup, showDivider })
  }
  return markers
}

/**
 * Renders a 12-column responsive grid of fields.
 * Handles: visibility evaluation, disabled/readOnly resolution, span classes.
 *
 * `@container` makes column counts react to THIS grid's own rendered width
 * (see getGridClasses/SchemaBuilder.ts) rather than the browser viewport —
 * the same field schema renders correctly whether its section card is
 * full-width or shares a row with another card (e.g. Identity & Governance's
 * side-by-side Classification/Governance cards), instead of assuming
 * "viewport is wide" means "this particular grid has room."
 */
export function GridEngine({
  fields,
  form,
  watchedValues,
  fieldOptions,
  fieldOptionsLoading = {},
  permissions = [],
}: GridEngineProps) {
  const { t } = useTranslation('properties')

  // Grouping-caption boundaries — a field's `groupLabelKey` (see types.ts)
  // is presentation-only: it never affects which fields render, only
  // whether a caption + divider precedes a run of them. Computed once,
  // ahead of the render map below, over the same fields that will actually
  // render (same hidden/permission/visibility predicate as the map).
  const renderableFields = fields.filter(field => {
    if (field.type === 'hidden') return false
    if (field.permissions?.read?.length) {
      const hasRead = field.permissions.read.some(p => permissions.includes(p))
      if (!hasRead) return false
    }
    return isFieldVisible(field.visibility, watchedValues)
  })
  const groupMarkers = computeGroupMarkers(renderableFields)

  return (
    // gap-x-2, not a flat gap-x-6: a 12-column grid always pays for 11
    // column gaps in its track definition, *regardless of whether any field
    // actually spans across them* — every field here is col-span-something,
    // never dividing the row into 12 visible parts. At gap-x-6 (24px) that's
    // 11 × 24px = 264px of fixed gap alone, before any column gets a single
    // px of content — which is wider than a narrow section card (e.g. the
    // Identity step's side-by-side Classification/Governance cards, ~208px
    // at their narrowest) has available at all, an unconditional overflow no
    // amount of field-level responsiveness can fix. Below @sm nothing is
    // ever side-by-side yet (see SchemaBuilder.ts's half()/third()/
    // quarter()), so the gap isn't visually load-bearing there either way —
    // it only needs to be small enough to not overflow on its own. Once a
    // container actually has room for 2+ columns (@sm+), gap widens back to
    // the original, already-verified spacing.
    <div className="@container grid grid-cols-12 gap-x-2 @sm:gap-x-6 gap-y-5 @sm:gap-y-6">
      {fields.map(field => {
        // Hidden fields render nothing visible but stay in the DOM for form registration
        if (field.type === 'hidden') {
          return (
            <div key={field.key} className="hidden">
              <FieldRenderer field={field} form={form} options={[]} />
            </div>
          )
        }

        // Permission check (read access)
        if (field.permissions?.read?.length) {
          const hasRead = field.permissions.read.some(p => permissions.includes(p))
          if (!hasRead) return null
        }

        // Visibility condition
        if (!isFieldVisible(field.visibility, watchedValues)) return null

        // C2 fix (Enterprise Production Certification, Critical): a field fed
        // by a `reload-options` dependency must stay disabled until that
        // fetch resolves — readOnlyWhen below only knows about the parent's
        // *value*, not whether this field's own options have actually
        // arrived yet, which is what previously let a field open with a
        // false-empty "No options found" while a real fetch was still in
        // flight (live-measured at 1.5-3s against the real EspoCRM API).
        const isLoadingOptions = fieldOptionsLoading[field.key] ?? false

        // Resolve disabled / readOnly (supports static, function, and declarative *When forms)
        const isDisabled = (typeof field.disabled === 'function'
          ? field.disabled(watchedValues)
          : (field.disabled ?? false)) ||
          (field.disabledWhen ? evaluateCondition(field.disabledWhen, watchedValues) : false) ||
          isLoadingOptions

        const isReadOnly = (typeof field.readOnly === 'function'
          ? field.readOnly(watchedValues)
          : (field.readOnly ?? false)) ||
          (field.readOnlyWhen ? evaluateCondition(field.readOnlyWhen, watchedValues) : false)

        // Write permission check
        const hasWrite = !field.permissions?.write?.length ||
          field.permissions.write.some(p => permissions.includes(p))
        const effectiveReadOnly = isReadOnly || !hasWrite

        // A caption precedes the first VISIBLE field of each new group — a
        // divider precedes every such caption except the very first group in
        // this grid (nothing to divide from yet).
        const marker = groupMarkers.get(field.key)
        const startsNewGroup = marker?.startsNewGroup ?? false
        const showDivider = marker?.showDivider ?? false

        return (
          <Fragment key={field.key}>
            {startsNewGroup && (
              <div className={cn('col-span-12', showDivider && 'border-t border-border/15 pt-6')}>
                <GroupCaption text={t(field.groupLabelKey as string)} />
              </div>
            )}
            <div className={getGridClasses(field.span)}>
              <FieldRenderer
                field={field}
                form={form}
                disabled={isDisabled}
                readOnly={effectiveReadOnly}
                options={fieldOptions[field.key]}
                optionsLoading={isLoadingOptions}
              />
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}
