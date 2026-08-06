'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  Building2, MapPin, CircleDollarSign, Sparkles, Camera, ClipboardCheck, Ruler, Wrench,
} from 'lucide-react'

import {
  FormFramework,
  FormStep,
  createAutosavePlugin,
  createKeyboardPlugin,
  type FormFrameworkConfig,
} from '@/components/form-framework'
import { DynamicForm, isFieldVisible, getFieldId, getFieldError, type StepSchema } from '@/framework/form-engine'

import { useUsers } from '@/shared/resources/useUsers'
import { useRegionLocations } from '@/shared/resources/useRegionLocations'
import { useContacts } from '@/shared/resources/useContacts'
import { PROPERTY_STATUS_REGISTRY, PROPERTIES_QUERY_KEY, DEFAULT_PROPERTY_STATUS } from '@/features/properties/domain/constants'
import { submitPropertyForm, submitPropertyEdit } from '@/features/properties/lib/property-form.transform'
import { presentApiError } from '@/lib/errors/presentApiError'
import type { RealEstateProperty } from '@/features/properties/types/property.types'
import type { ExistingFileRef } from '@/framework/form-engine/fields/FileField'
import { useAuth } from '@/providers/AuthProvider'

import {
  ReviewStep,
  buildIdentityGovernanceStep,
  buildLocationZoningStep,
  sizeRoomsStructureSchema,
  constructionSystemsSchema,
  outdoorBuildingAmenitiesSchema,
  pricingTermsSchema,
  marketingMediaSchema,
} from './steps'
import { IdentityGovernanceStepView } from './steps/IdentityGovernanceStepView'
import { LocationZoningStepView } from './steps/LocationZoningStepView'
import { PricingTermsStepView } from './steps/PricingTermsStepView'
import { saveDraft, clearDraft } from './draft-storage'

// Required-step-validation helper (wizard workflow only — no RHF/Zod rule
// changes). Walks a StepSchema exactly the way SectionRenderer/GridEngine
// render it (sections → fields, both visibility-gated, hidden fields
// excluded) and returns the field keys that are actually on screen for the
// given form values, so `form.trigger()` below only ever validates fields
// the user can currently see — a required field hidden by a conditional
// visibility rule never blocks navigation.
function collectVisibleFieldKeys(schema: StepSchema | undefined, values: Record<string, unknown>): string[] {
  if (!schema) return []
  const sections = schema.sections ?? (schema.fields ? [{ fields: schema.fields, visibility: undefined }] : [])
  const keys: string[] = []
  for (const section of sections) {
    if (section.visibility && !isFieldVisible(section.visibility, values)) continue
    for (const field of section.fields) {
      if (field.type === 'hidden') continue
      if (field.visibility && !isFieldVisible(field.visibility, values)) continue
      keys.push(field.key)
    }
  }
  return keys
}

// Property Wizard reorg (Engineering Execution Plan, Phases 2-6, complete;
// Phase 8 cleanup complete) is done: all 84 fields live in their approved
// final step/section, in the 8-step structure below. The old per-step files
// this replaced (identity/location/financial/specifications/features/media
// schemas + migration-utils.ts's pruning helper) were deleted in Phase 8 -
// see the Release Readiness Review's Traceability Matrix for the full field-
// by-field audit trail.

/* --- Page component ------------------------------------------------ */
// Shared by both the Create route (app/(dashboard)/properties/new/page.tsx)
// and the Edit route (app/(dashboard)/properties/[slug]/edit/page.tsx), per
// the approved ADR: RealEstateProperty has exactly one Wizard, distinguished
// only by mode + property. Step schemas, FormFramework config shape,
// validation, and dynamic logic are identical in both modes - only initial
// values, the submit action, draft/autosave wiring, and copy differ below.

interface PropertyFormPageProps {
  mode?: 'create' | 'edit'
  /** Required when mode='edit' - the record being edited. */
  property?: RealEstateProperty
}

export function PropertyFormPage({ mode = 'create', property }: PropertyFormPageProps) {
  const { t } = useTranslation('properties')
  const router = useRouter()
  const queryClient = useQueryClient()
  const isEdit = mode === 'edit'
  const { session } = useAuth()

  const { data: userOptions = [] } = useUsers()
  const { data: regionOptions = [] } = useRegionLocations()
  const { data: contactOptions = [] } = useContacts()
  const statusOptions = useMemo(
    () => PROPERTY_STATUS_REGISTRY.map(s => ({ value: s.value, label: s.label })),
    [],
  )

  // previousStatus/currentPropertyId are undefined on create (property is
  // undefined), which reproduces the wizard's original create-only behavior
  // for the status-transition guard and the propertyCode uniqueness check.
  const identityGovernanceSchema = useMemo(
    () => buildIdentityGovernanceStep(statusOptions, userOptions, property?.status, property?.id),
    [statusOptions, userOptions, property?.status, property?.id],
  )
  // regionOptions seeds the Region -> Sub Region -> Location cascade's top
  // level; Sub Region/Location load their own options reactively via the
  // dependency engine (see location-zoning.schema.ts), not from here.
  // contactOptions seeds the Contacts Business Group's selector (Phase 1) —
  // same static-list pattern as regionOptions/userOptions.
  const locationZoningSchema = useMemo(
    () => buildLocationZoningStep(regionOptions, contactOptions),
    [regionOptions, contactOptions],
  )
  // identity-legacy (the "More Details" holding step) is fully drained as of
  // Phase 6 - its last 7 fields now live in pricingTermsSchema/
  // marketingMediaSchema below - so it's removed entirely, same full-drain
  // pattern as location.schema.ts (Phase 3) and features.schema.ts
  // (Phase 5). No holding step remains anywhere in the wizard.

  const dataSteps: StepSchema[] = useMemo(
    () => [
      identityGovernanceSchema,
      locationZoningSchema, pricingTermsSchema,
      sizeRoomsStructureSchema, constructionSystemsSchema,
      outdoorBuildingAmenitiesSchema, marketingMediaSchema,
    ],
    [identityGovernanceSchema, locationZoningSchema],
  )

  // Edit mode: seed every field from the real record (imagesIds reordered so
  // the existing mainImageId stays first, preserving the current cover photo
  // unless the user explicitly reorders the gallery). Create mode: cBanner
  // defaults to true and cDescriptionGr to the PDF's exact Greek prompt text
  // - never applied in edit mode, so an edit can never clobber either
  // field's real stored value with these create-only defaults.
  const defaultValues = useMemo<Record<string, unknown>>(() => {
    if (isEdit && property) {
      const images = property.imagesIds ?? []
      const reordered = property.mainImageId && images.includes(property.mainImageId)
        ? [property.mainImageId, ...images.filter(id => id !== property.mainImageId)]
        : images
      // Wave 7 (2026-07-15, Attachments). Existing related documents are
      // shown in the same FileField list as newly-picked files, tagged so
      // FileField/attachDocuments can tell them apart — see
      // property-form.transform.ts's attachDocuments and the Wave 7 Design
      // Package. Nothing is uploaded for these; removing one only queues an
      // unrelate on save (handled by the Documents section component).
      const existingDocuments: ExistingFileRef[] = (property.documents ?? []).map(doc => ({
        id: doc.id,
        name: doc.name,
        existing: true,
      }))
      return {
        ...property,
        imagesIds: reordered,
        documents: existingDocuments,
        documentsOriginalIds: existingDocuments.map(d => d.id),
        // Wave 7 (2026-07-15, Attachments). Live-confirmed this wave: the
        // fetched property object carries this value under
        // `cDocumentassignmentId`, never a bare `cDocumentassignment` key
        // (the belongsTo-Attachment Id-suffix convention) — `{...property}`
        // above does not seed this field on its own.
        cDocumentassignment: property.cDocumentassignmentId ?? null,
        // Same bare-key-vs-Id-suffix gap, also on `cBannerphoto` — flagged
        // at Wave 7 time as pre-existing and out of that wave's scope (see
        // the Wave 7 Certification Report), fixed here.
        cBannerphoto: property.cBannerphotoId ?? null,
      }
    }
    return {
      cBanner: true,
      cDescriptionGr: 'Πατήστε το πλήκτρο κεραυνού στα δεξιά αφού αποθηκεύσετε την αγγελία σας, ώστε να συμπληρωθεί η περιγραφή αυτόματα μέσω του Βοηθού ΑΙ.',
      // C1 fix (Enterprise Production Certification, Critical): status.schema
      // already declared `.default(DEFAULT_PROPERTY_STATUS)`, but nothing
      // ever seeded it into the wizard's real defaultValues — the same
      // manual-mirroring pattern cBanner/cDescriptionGr above already use
      // for their own declared defaults, just missing for this field.
      status: DEFAULT_PROPERTY_STATUS,
    }
  }, [isEdit, property])

  const form = useForm<Record<string, unknown>>({ defaultValues })

  // Draft lifecycle — create mode only. draft-storage.ts is explicitly a
  // create-only mechanism (one global, unscoped localStorage key); it must
  // never leak into an Edit session's live record data.
  //
  // No mount-time restore: a "Create Property" session always starts from a
  // blank wizard, regardless of how the previous session ended (Discard,
  // successful creation, Cancel, closing the tab, or a hard refresh) — see
  // the Draft Lifecycle requirements. The autosave plugin below still writes
  // to localStorage during the session (so the in-progress draft survives an
  // accidental step-navigation reload within THIS session), but nothing ever
  // reads it back into a later session's form.
  //
  // This cleanup also actively clears storage the moment the wizard is left
  // via any in-app navigation (Cancel, Discard, or after a successful
  // create) — belt-and-suspenders for the same "never inherit an abandoned
  // draft" rule; it's a no-op if storage is already empty.
  useEffect(() => {
    if (isEdit) return
    return () => { clearDraft() }
  }, [isEdit])

  const plugins = useMemo(() => {
    const base = [createKeyboardPlugin({ arrowKeys: true })]
    if (isEdit) return base
    return [
      ...base,
      createAutosavePlugin({
        getValues: () => form.getValues(),
        onSave: async values => saveDraft(values),
      }),
    ]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit])

  // navigationGuard (unsaved-changes confirmation on Cancel) defaults to true
  // in FormFrameworkConfig - intentionally not overridden here.
  const config: FormFrameworkConfig = {
    title: isEdit ? t('wizard.page.editTitle') : t('wizard.page.createTitle'),
    subtitle: isEdit ? t('wizard.page.editSubtitle') : t('wizard.page.createSubtitle'),
    entityLabel: t('wizard.page.entityLabel'),
    mode,
    submitLabel: isEdit ? t('wizard.page.saveChanges') : undefined,
    breadcrumbs: isEdit && property
      ? [
          { label: t('wizard.page.breadcrumbProperties'), href: '/properties' },
          { label: property.title ?? property.propertyCode ?? t('common.propertyFallback'), href: '/properties/' + (property.propertyCode ?? property.id).toLowerCase() },
          { label: t('wizard.page.breadcrumbEdit') },
        ]
      : [
          { label: t('wizard.page.breadcrumbProperties'), href: '/properties' },
          { label: t('wizard.page.breadcrumbNewProperty') },
        ],
    steps: [
      {
        id: 'identity',
        title: t('wizard.page.steps.identity.title'),
        displayTitle: t('wizard.page.steps.identity.title'),
        description: t('wizard.page.steps.identity.description'),
        icon: Building2,
        requiredCount: 6,
        estTime: t('wizard.page.estTime', { count: 2 }),
      },
      {
        id: 'location',
        title: t('wizard.page.steps.location.title'),
        displayTitle: t('wizard.page.steps.location.title'),
        description: t('wizard.page.steps.location.description'),
        icon: MapPin,
        requiredCount: 1,
        estTime: t('wizard.page.estTime', { count: 2 }),
      },
      {
        id: 'financial',
        title: t('wizard.page.steps.financial.title'),
        displayTitle: t('wizard.page.steps.financial.displayTitle'),
        description: t('wizard.page.steps.financial.description'),
        icon: CircleDollarSign,
        requiredCount: 1,
        estTime: t('wizard.page.estTime', { count: 1 }),
      },
      {
        id: 'size-rooms-structure',
        title: t('wizard.page.steps.sizeRoomsStructure.title'),
        displayTitle: t('wizard.page.steps.sizeRoomsStructure.title'),
        description: t('wizard.page.steps.sizeRoomsStructure.description'),
        icon: Ruler,
        requiredCount: 1,
        estTime: t('wizard.page.estTime', { count: 2 }),
      },
      {
        id: 'construction-systems',
        title: t('wizard.page.steps.constructionSystems.title'),
        displayTitle: t('wizard.page.steps.constructionSystems.title'),
        description: t('wizard.page.steps.constructionSystems.description'),
        icon: Wrench,
        // Not optional: energyClass/cHeatingController are
        // .requiredWhen(NOT_LAND_CATEGORY/NOT_LAND_OR_OTHER_CATEGORY) in
        // construction-systems.schema.ts — required for every category
        // except Land (Other also exempts the second field). Previously
        // marked optional/0-required here, which contradicted the step's
        // actual validation once Continue started enforcing required
        // fields — see the Enterprise Production Certification Audit, C1.
        requiredCount: 2,
        estTime: t('wizard.page.estTime', { count: 2 }),
      },
      {
        id: 'features',
        title: t('wizard.page.steps.features.title'),
        displayTitle: t('wizard.page.steps.features.title'),
        description: t('wizard.page.steps.features.description'),
        icon: Sparkles,
        optional: true,
        requiredCount: 0,
        estTime: t('wizard.page.estTime', { count: 2 }),
      },
      {
        id: 'media',
        title: t('wizard.page.steps.media.title'),
        displayTitle: t('wizard.page.steps.media.title'),
        description: t('wizard.page.steps.media.description'),
        icon: Camera,
        optional: true,
        requiredCount: 0,
        estTime: t('wizard.page.estTime', { count: 3 }),
      },
      {
        id: 'review',
        title: t('wizard.page.steps.review.title'),
        displayTitle: isEdit ? t('wizard.page.steps.review.displayTitleEdit') : t('wizard.page.steps.review.displayTitleCreate'),
        description: t('wizard.page.steps.review.description'),
        icon: ClipboardCheck,
        optional: true,
        requiredCount: 0,
        estTime: t('wizard.page.estTime', { count: 1 }),
      },
    ],
  }

  // Kept so the failure toast's "Try again" action can resubmit the exact
  // data the user last attempted, from outside react-hook-form's own state.
  const lastSubmitDataRef = useRef<Record<string, unknown> | null>(null)

  // Left to throw on failure — FormFramework's own submit handler wraps this
  // in try/catch, sets saveState to 'failed' (previously unreachable here,
  // since this function used to swallow every error itself), and calls
  // onSubmitError below. Swallowing the error locally used to mean
  // FormFramework saw onSubmit resolve normally and played its SUCCESS
  // animation even when the save had actually failed — see GAP-25.
  const handleSubmit = async (data: Record<string, unknown>) => {
    lastSubmitDataRef.current = data
    if (isEdit && property) {
      await submitPropertyEdit(property.id, data, form.formState.dirtyFields, session?.user?.id)
      queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] })
      toast.success(t('wizard.page.propertyUpdated'))
      const slug = property.propertyCode?.toLowerCase() ?? property.id
      router.push('/properties/' + encodeURIComponent(slug))
      return
    }
    const created = await submitPropertyForm(data, session?.user?.id)
    queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] })
    // Successful creation wipes the entire wizard lifecycle: draft storage,
    // autosave's backing store (same key), and RHF's own state — so if this
    // component were ever kept mounted, or the next mount somehow raced the
    // navigation below, there is nothing left to accidentally inherit.
    clearDraft()
    form.reset()
    lastSubmitDataRef.current = null
    toast.success(t('wizard.page.propertyCreated'))
    const slug = created.propertyCode?.toLowerCase() ?? created.id
    router.push('/properties/' + encodeURIComponent(slug))
  }

  // Screen-reader-only announcement of how many fields on the current step
  // failed validation — sighted users already see this via the red
  // asterisks on every invalid field plus the stepper's error-state bubble;
  // a screen-reader user landing on just the first invalid field (below)
  // had no way to know N-1 others also needed attention. role="alert" is
  // implicitly aria-live="assertive" + aria-atomic="true", matching the
  // same pattern FormFieldShell already uses for a single field's own error.
  const [stepErrorAnnouncement, setStepErrorAnnouncement] = useState('')

  // Required-step navigation guard — Continue only advances past fields the
  // user can currently see (collectVisibleFieldKeys mirrors the same
  // sections/visibility walk SectionRenderer/GridEngine already render
  // through, so a required field hidden by a conditional-visibility rule is
  // never triggered). No RHF/Zod rule changes: this only calls the existing
  // `form.trigger()` on a narrower field list than "everything registered."
  // The `review` step (index 7) has no entry in dataSteps, so it's always
  // schema === undefined → always allowed through, matching its
  // optional/requiredCount: 0 config below.
  const handleBeforeNext = async (stepIndex: number, formInstance: typeof form) => {
    const schema = dataSteps[stepIndex]
    if (!schema) return true
    const values = formInstance.getValues()
    const visibleKeys = collectVisibleFieldKeys(schema, values)
    if (visibleKeys.length === 0) return true

    const valid = await formInstance.trigger(visibleKeys)
    if (valid) {
      setStepErrorAnnouncement('')
      return true
    }

    const errors = formInstance.formState.errors
    const invalidKeys = visibleKeys.filter(key => getFieldError(errors, key))
    const firstInvalidKey = invalidKeys[0]
    if (firstInvalidKey) {
      const el = document.getElementById(getFieldId(firstInvalidKey))
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (el instanceof HTMLElement) el.focus({ preventScroll: true })
    }
    // Cleared first so a screen reader re-announces even when the exact
    // same count of errors is hit twice in a row (e.g. clicking Continue
    // again without changing anything) — role="alert" only fires on a
    // genuine content change.
    setStepErrorAnnouncement('')
    window.setTimeout(() => {
      setStepErrorAnnouncement(t('wizard.page.stepValidationErrors', { count: invalidKeys.length }))
    }, 50)
    return false
  }

  // Discard Draft — create mode only (an Edit session has no draft; its
  // Discard/Cancel button falls back to FormFramework's guarded-cancel/
  // router.back() instead, since onDiscardDraft is undefined there).
  // Clears storage and resets RHF back to the pristine create-mode
  // defaults; FormFramework resets its own step/completion state right
  // after this resolves (see context.tsx's _resetWizardState).
  const handleDiscardDraft = isEdit ? undefined : () => {
    clearDraft()
    form.reset(defaultValues)
    toast.success(t('wizard.page.draftDiscarded'))
  }

  // Not memoized — deliberately mirrors handleSubmit/handleSaveDraft above,
  // which FormFramework already accepts as fresh closures every render.
  const handleSubmitError = (error: unknown) => {
    presentApiError(error, {
      entityLabel: 'property',
      onRetry: () => { void handleSubmit(lastSubmitDataRef.current ?? {}) },
      onRecover: () => router.push('/properties'),
      recoveryLabel: t('wizard.page.backToProperties'),
    })
  }

  const handleSaveDraft = isEdit ? undefined : async (data: Record<string, unknown>) => {
    saveDraft(data)
    toast.success(t('wizard.page.draftSaved'))
  }

  return (
    // -mb-* cancels DashboardShell's own p-4/p-5/p-6 bottom padding at every
    // tier (not just mobile, unlike -mx-4/-mt-4 above) — otherwise it stacks
    // underneath FormActionBar's sticky bottom-0 bar as dead space between
    // the bar and the real viewport edge.
    <div className="-mx-4 -mt-4 -mb-4 sm:mx-0 sm:mt-0 sm:-mb-5 md:-mb-6">
      <div role="alert" className="sr-only">{stepErrorAnnouncement}</div>
      <FormFramework
        config={config}
        form={form}
        plugins={plugins}
        onSubmit={handleSubmit}
        onSubmitError={handleSubmitError}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.back()}
        onBeforeNext={handleBeforeNext}
        onDiscardDraft={handleDiscardDraft}
      >
        <FormStep id="identity">
          <IdentityGovernanceStepView schema={identityGovernanceSchema} form={form} />
        </FormStep>

        <FormStep id="location">
          <LocationZoningStepView schema={locationZoningSchema} form={form} />
        </FormStep>

        <FormStep id="financial">
          <PricingTermsStepView schema={pricingTermsSchema} form={form} />
        </FormStep>

        <FormStep id="size-rooms-structure">
          <DynamicForm schema={sizeRoomsStructureSchema} form={form} />
        </FormStep>

        <FormStep id="construction-systems">
          <DynamicForm schema={constructionSystemsSchema} form={form} />
        </FormStep>

        <FormStep id="features">
          <DynamicForm schema={outdoorBuildingAmenitiesSchema} form={form} />
        </FormStep>

        <FormStep id="media">
          <DynamicForm schema={marketingMediaSchema} form={form} />
        </FormStep>

        <FormStep id="review">
          <ReviewStep form={form} steps={dataSteps} userOptions={userOptions} />
        </FormStep>
      </FormFramework>
    </div>
  )
}
