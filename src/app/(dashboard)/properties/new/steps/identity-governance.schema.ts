import { Building2, ShieldCheck, Archive } from 'lucide-react'
import { field, section } from '@/framework/form-engine'
import type { StepSchema, FieldOption, FieldSchema } from '@/framework/form-engine'
import { validateStatusChange, requiresOwner } from '@/features/properties/domain/property-lifecycle.rules'
import { isPropertyCodeTaken } from '@/features/properties/repositories/property.repository'
import { getTypeOptionsForCategory } from '@/features/properties/domain/property-type.registry'
import { getAssignmentForCategory } from '@/features/properties/domain/assignment-rules'
import { REQUEST_TYPE_OPTIONS, CATEGORY_OPTIONS, ASSIGNMENT_OPTIONS } from '@/features/properties/domain/options'
import { PROPERTY_CODE_MAX_LENGTH } from '@/features/properties/domain/validation'

// ── Step 1: Identity & Governance ───────────────────────────────────────────
// Property Wizard Engineering Execution Plan, Phase 2. Implements the 13
// fields the Final Implementation UX Specification §01 assigns to this step,
// migrated verbatim from identity.schema.ts's 24-field Classification +
// Status & Assignment sections — every required/visibleWhen/dependency/
// default/validation rule below is copied unchanged, only relocated and
// regrouped into 3 sections (Classification → Governance → Office Use,
// collapsed) per the approved Blueprint. The 11 fields NOT listed here
// (cBanner, withinCityPlan, investment, withinMonthlyUtilities,
// idealForStudents, idealForEmployees, cOfficeNotes, cPropertyEvaluatorAI,
// cDescriptionGr, description, penthouse) relocate to their own new step
// files in later phases (3, 4, 5, 6) — they remain untouched in
// identity.schema.ts until this file is wired in at cutover (Phase 7).

export function buildIdentityGovernanceStep(
  statusOptions: FieldOption[],
  userOptions: FieldOption[],
  // Edit mode passes the record's real current status and id here so the
  // status-transition guard and the propertyCode uniqueness check behave
  // correctly against an existing record instead of assuming a fresh create.
  // Both default to undefined, which reproduces identity.schema.ts's
  // original create-only behavior exactly.
  previousStatus?: string,
  currentPropertyId?: string,
): StepSchema {
  return {
    sections: [
      section({
        id: 'classification',
        title: 'Classification',
        description: 'What kind of asset is this, and what is it for?',
        icon: Building2,
      }).fields([
        // Enterprise Phase 3.2, Finding B first resolved this as "keep
        // required — title is the entity's only human-readable identifier."
        // Superseded by Phase 3.3/3.4's live evidence: two independent live
        // tests (a Create and, separately, an Update on an already-saved
        // record) both proved the live server unconditionally overwrites
        // `title` with `propertyCode` on every single save, regardless of
        // what's submitted — not just an auto-numbering fallback for a
        // blank value. Whatever the user types here is never actually
        // persisted as entered. `.required()` removed: forcing entry of a
        // value that's guaranteed to be silently discarded server-side is
        // no longer defensible now that this is proven, not assumed. Kept
        // editable (not disabled) since propertyCode itself isn't known
        // until save, so there's nothing meaningful to show read-only here
        // yet, and because it isn't confirmed whether EspoCRM's own native
        // UI disables this field too (no browser access to verify) — this
        // app should not overclaim more certainty than the evidence
        // supports. The helper text below discloses the override instead.
        field.text('title', 'Title')
          .full()
          .placeholder('e.g. Skyline Corporate Plaza')
          .helperText('EspoCRM replaces this with the Reference Code below when the listing is saved.')
          .build(),
        // Enterprise Phase 3.2, Finding A (resolved). Live entityDefs:
        // { type: 'varchar', maxLength: 10 } — previously unenforced client-
        // side; a value longer than 10 characters used to pass validation
        // here and fail only server-side (or be silently truncated).
        field.text('propertyCode', 'Reference Code')
          .half()
          .maxLength(PROPERTY_CODE_MAX_LENGTH)
          .placeholder('Auto-generated if left empty')
          .helperText('Short internal reference code, e.g. REF-001.')
          // Duplicate detection: propertyCode is the only confirmed EspoCRM
          // attribute suited to a uniqueness check (see
          // property.repository.ts's isPropertyCodeTaken).
          .validate([{
            type: 'async',
            debounce: 400,
            validate: async (value) => {
              if (!value) return true
              const taken = await isPropertyCodeTaken(String(value), currentPropertyId)
              return !taken || 'This reference code is already in use.'
            },
          }])
          .build(),
        field.select('category', 'Category')
          .required().half()
          .placeholder('Select category…')
          .options(CATEGORY_OPTIONS)
          .build(),
        {
          // Business rule: Type's available options depend entirely on the
          // selected Category (see property-type.registry.ts's
          // getTypeOptionsForCategory) — no static options here. Reloads on
          // every category change; the engine (useDynamicForm.ts) clears the
          // current `type` value only if it isn't a member of the freshly
          // loaded list — Residential/Commercial/Land/Other's allowed value
          // lists are mutually exclusive (verified against
          // TYPE_VALUES_BY_CATEGORY), so any *user-driven* category change
          // still clears the prior type exactly as before. The conditional
          // check (rather than an unconditional `clear` dependency) matters
          // for the one case where it isn't a no-op: a whole-form reset
          // (draft restore, edit prefill) that sets category and a
          // still-valid matching type together — that value must survive,
          // not get wiped by a reload that merely observes category go from
          // unset to set. Empty category still correctly empties the
          // dropdown (PDF Condition 5), since `[]` never contains any value.
          ...field.select('type', 'Property Type')
            .required().half()
            .placeholder('Select type…')
            // Reuses the exact same getTypeOptionsForCategory registry the
            // dropdown's options come from — the submitted value must be a
            // member of the current category's allowed list, not just
            // whatever happens to be sitting in form state.
            .validate([{
              type: 'custom',
              validate: (value, allValues) => {
                if (!value) return true // emptiness is the `required` rule's job
                const allowed = getTypeOptionsForCategory(allValues.category as string | undefined)
                  .map(o => o.value)
                return allowed.includes(String(value)) || 'Selected type is not valid for the chosen category'
              },
            }])
            .build(),
          dependencies: [
            {
              on: 'category',
              action: 'reload-options',
              loadOptions: async categoryValue => getTypeOptionsForCategory(categoryValue),
            },
          ],
        } as FieldSchema,
        field.select('requestType', 'Request Type')
          .required().half()
          .placeholder('Select request type…')
          .options(REQUEST_TYPE_OPTIONS)
          .build(),
      ]),

      section({
        id: 'governance',
        title: 'Governance',
        description: 'Lifecycle, ownership, and scheduling.',
        icon: ShieldCheck,
      }).fields([
        {
          // Auto-populated from Category (see domain/assignment-rules.ts's
          // getAssignmentForCategory) — the user is never required to pick
          // this manually when the rule can determine it. The dependency
          // engine (useDynamicForm.ts's auto-derive action) only overwrites
          // the field while it's empty or still holds the value THIS engine
          // last auto-set — a manual choice, or a pre-existing record value
          // restored in edit mode, is never clobbered by a later Category
          // change. Still a plain required select (not read-only): the rule
          // is a convenience default, not a hard lock — the user can always
          // override it.
          ...field.select('cAssignment', 'Assignment')
            .required().half()
            .placeholder('Select assignment…')
            .options(ASSIGNMENT_OPTIONS)
            .build(),
          dependencies: [
            {
              on: 'category',
              action: 'auto-derive',
              derive: categoryValue => getAssignmentForCategory(categoryValue as string | undefined),
            },
          ],
        } as FieldSchema,
        // Enterprise Phase 3.2, Finding B (resolved: keep, document). Live
        // entityDefs carries no `required` flag, only `default: 'Under
        // Approval'` — the server never rejects an omitted status, it just
        // fills in the default. Required here anyway: the Wizard's status
        // options drive validateStatusChange's lifecycle-transition guard
        // below, which needs a real, user-confirmed value to check against,
        // not a silently-applied default the user never saw. Intentional UX
        // decision, not a metadata mirror.
        field.select('status', 'Listing Status')
          .required().half()
          .options(statusOptions)
          // Wave 2 (2026-07-14): real live entityDefs default is 'Under
          // Approval', not the fabricated 'Draft' this used to declare —
          // see the approved Product Decision Record.
          .default('Under Approval')
          // previousStatus is undefined on create (no prior state to
          // violate) and the record's real current status on edit — see
          // property-lifecycle.rules.ts's validateStatusChange, the same
          // function the legacy Edit dialog's Zod schema called.
          .validate([{
            type: 'custom',
            validate: (value, allValues) => {
              const result = validateStatusChange(previousStatus, String(value), allValues)
              return result.allowed || result.reason || 'This status change is not allowed.'
            },
          }])
          .build(),
        field.select('assignedUserId', 'Assigned Agent')
          .half()
          .placeholder('Select agent…')
          .options(userOptions)
          .clearable()
          // Ownership rule: any status other than Draft must have an
          // assignee (property-lifecycle.rules.ts's requiresOwner — same
          // function the legacy Edit dialog's Zod schema calls).
          .validate([{
            type: 'custom',
            validate: (value, allValues) => {
              const status = String(allValues.status ?? '')
              if (requiresOwner(status) && !value) {
                return 'An active listing must have an assigned agent.'
              }
              return true
            },
          }])
          .build(),
        field.date('cAvailableFrom', 'Available from')
          .half()
          .placeholder('Pick a date…')
          .build(),
        field.date('nextUpdate', 'Next Update')
          .half()
          .placeholder('Pick a date…')
          .build(),
      ]),

      section({
        id: 'office-use',
        title: 'Office Use',
        description: 'Back-office bookkeeping, rarely touched at listing time.',
        icon: Archive,
        collapsible: true,
        defaultCollapsed: true,
      }).fields([
        field.switch('keys', 'Keys')
          .half()
          .build(),
        field.switch('cSold', 'Sold')
          .half()
          .build(),
        field.switch('cConsideration', 'Consideration')
          .half()
          .build(),
      ]),
    ],
  }
}
