'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
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
import { DynamicForm, type StepSchema } from '@/framework/form-engine'

import { useUsers } from '@/shared/resources/useUsers'
import { useRegionLocations } from '@/shared/resources/useRegionLocations'
import { useContacts } from '@/shared/resources/useContacts'
import { PROPERTY_STATUS_REGISTRY, PROPERTIES_QUERY_KEY } from '@/features/properties/domain/constants'
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
import { LocationMapPreview } from './LocationMapPreview'
import { saveDraft, loadDraft, clearDraft } from './draft-storage'

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
    }
  }, [isEdit, property])

  const form = useForm<Record<string, unknown>>({ defaultValues })

  // Draft restore - create mode only. draft-storage.ts is explicitly a
  // create-only mechanism (one global, unscoped localStorage key); restoring
  // it into an Edit session could overwrite live record data with an
  // unrelated in-progress draft.
  const restoredRef = useRef(false)
  useEffect(() => {
    if (isEdit || restoredRef.current) return
    restoredRef.current = true
    const draft = loadDraft()
    if (draft && Object.keys(draft).length > 0) {
      form.reset(draft)
      toast.info('Restored your unfinished draft')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    title: isEdit ? 'Edit Property Listing' : 'New Property Listing',
    subtitle: isEdit
      ? 'Update the listing details, location, and media for this asset.'
      : 'Define the core identity, location, and media for this asset.',
    entityLabel: 'Property',
    mode,
    submitLabel: isEdit ? 'Save Changes' : undefined,
    // Steady-state 8 - Phase 6 dissolved the last holding step
    // (identity-legacy). The wizard now matches the approved final
    // 8-step structure; Phase 7 only verifies and removes dead imports.
    totalPhasesCount: 8,
    breadcrumbs: isEdit && property
      ? [
          { label: 'Properties', href: '/properties' },
          { label: property.title ?? property.propertyCode ?? 'Property', href: '/properties/' + (property.propertyCode ?? property.id).toLowerCase() },
          { label: 'Edit' },
        ]
      : [
          { label: 'Properties', href: '/properties' },
          { label: 'New Property' },
        ],
    steps: [
      {
        id: 'identity',
        title: 'Identity & Governance',
        displayTitle: 'Identity & Governance',
        description: 'Classify the listing, then set ownership and lifecycle status.',
        icon: Building2,
        requiredCount: 6,
        estTime: '2 min',
        completion: 12,
      },
      {
        id: 'location',
        title: 'Location & Zoning',
        displayTitle: 'Location & Zoning',
        description: 'Where is this property, broadest area to narrowest district, plus zoning notes.',
        icon: MapPin,
        requiredCount: 1,
        estTime: '2 min',
        completion: 30,
      },
      {
        id: 'financial',
        title: 'Pricing & Terms',
        displayTitle: 'Pricing & Financial Terms',
        description: 'Asking price, and any investment or utilities terms.',
        icon: CircleDollarSign,
        requiredCount: 1,
        estTime: '1 min',
        completion: 42,
      },
      {
        id: 'size-rooms-structure',
        title: 'Size, Rooms & Structure',
        displayTitle: 'Size, Rooms & Structure',
        description: 'How big, how many rooms, and where in the building.',
        icon: Ruler,
        requiredCount: 1,
        estTime: '2 min',
        completion: 48,
      },
      {
        id: 'construction-systems',
        title: 'Construction & Systems',
        displayTitle: 'Construction & Systems',
        description: 'Condition, energy rating, heating, and finishes.',
        icon: Wrench,
        optional: true,
        requiredCount: 0,
        estTime: '2 min',
        completion: 55,
      },
      {
        id: 'features',
        title: 'Outdoor, Building & Amenities',
        displayTitle: 'Outdoor, Building & Amenities',
        description: "What's around it, and what else does it offer?",
        icon: Sparkles,
        optional: true,
        requiredCount: 0,
        estTime: '2 min',
        completion: 65,
      },
      {
        id: 'media',
        title: 'Marketing & Media',
        displayTitle: 'Marketing & Media',
        description: 'Badges, listing copy, banner, and photos - the last step before Review.',
        icon: Camera,
        optional: true,
        requiredCount: 0,
        estTime: '3 min',
        completion: 85,
      },
      {
        id: 'review',
        title: 'Review',
        displayTitle: isEdit ? 'Review & Save' : 'Review & Publish',
        description: 'Check completeness and listing quality before saving.',
        icon: ClipboardCheck,
        optional: true,
        requiredCount: 0,
        estTime: '1 min',
        completion: 100,
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
      toast.success('Property updated')
      const slug = property.propertyCode?.toLowerCase() ?? property.id
      router.push('/properties/' + encodeURIComponent(slug))
      return
    }
    const created = await submitPropertyForm(data, session?.user?.id)
    queryClient.invalidateQueries({ queryKey: [PROPERTIES_QUERY_KEY] })
    clearDraft()
    toast.success('Property created')
    const slug = created.propertyCode?.toLowerCase() ?? created.id
    router.push('/properties/' + encodeURIComponent(slug))
  }

  // Not memoized — deliberately mirrors handleSubmit/handleSaveDraft above,
  // which FormFramework already accepts as fresh closures every render.
  const handleSubmitError = (error: unknown) => {
    presentApiError(error, {
      entityLabel: 'property',
      onRetry: () => { void handleSubmit(lastSubmitDataRef.current ?? {}) },
      onRecover: () => router.push('/properties'),
      recoveryLabel: 'Back to properties',
    })
  }

  const handleSaveDraft = isEdit ? undefined : async (data: Record<string, unknown>) => {
    saveDraft(data)
    toast.success('Draft saved')
  }

  return (
    <div className="-mx-4 -mt-4 sm:mx-0 sm:mt-0">
      <FormFramework
        config={config}
        form={form}
        plugins={plugins}
        onSubmit={handleSubmit}
        onSubmitError={handleSubmitError}
        onSaveDraft={handleSaveDraft}
        onCancel={() => router.back()}
      >
        <FormStep id="identity">
          <DynamicForm schema={identityGovernanceSchema} form={form} />
        </FormStep>

        <FormStep id="location">
          <DynamicForm schema={locationZoningSchema} form={form} />
          <div className="mt-6">
            <LocationMapPreview form={form} />
          </div>
        </FormStep>

        <FormStep id="financial">
          <DynamicForm schema={pricingTermsSchema} form={form} />
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
          <ReviewStep form={form} steps={dataSteps} />
        </FormStep>
      </FormFramework>
    </div>
  )
}
