import { toast } from 'sonner'
import type { RealEstateProperty } from '../types/property.types'
import { createProperty, updateProperty } from '../repositories/property.repository'
import { uploadPropertyImage, uploadPropertyImages } from './attachment-upload.service'
import { createDocumentUploadItem, processDocumentQueue, unrelateDocument } from './document-upload.service'

// Maps the new wizard's form values -> the EspoCRM-verified RealEstateProperty
// shape and submits it. Every wizard field key already equals the real
// EspoCRM attribute name (see the step schemas), so this is coercion, not
// renaming — following the same explicit-transform precedent as
// pipeline/config.ts's formTransformSubmit, just as a standalone function
// since this wizard doesn't go through CRMResourcePage/DynamicForm at all.

function toNumberOrUndefined(v: unknown): number | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

function toStringOrUndefined(v: unknown): string | undefined {
  if (v === '' || v === null || v === undefined) return undefined
  return String(v)
}

// Multi-Enum fields already store their value as a string[] in form state
// (see MultiSelectField.tsx/FormMultiSelect.tsx) — reused as-is, not
// serialized to a comma-separated string.
function toStringArrayOrUndefined(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined
  const arr = v.filter((item): item is string => typeof item === 'string')
  return arr.length > 0 ? arr : undefined
}

/**
 * Pure, synchronous field mapping — excludes images (async I/O, handled
 * separately by submitPropertyForm) so this half is unit-testable in
 * isolation without network mocking.
 */
export function buildPropertyPayload(values: Record<string, unknown>): Partial<RealEstateProperty> {
  return {
    name: toStringOrUndefined(values.title) ?? '',
    title: toStringOrUndefined(values.title),
    propertyCode: toStringOrUndefined(values.propertyCode),

    status: toStringOrUndefined(values.status) ?? 'Under Approval',
    type: toStringOrUndefined(values.type),
    category: toStringOrUndefined(values.category),
    cAssignment: toStringOrUndefined(values.cAssignment),
    requestType: toStringOrUndefined(values.requestType),

    price: toNumberOrUndefined(values.price),
    lowerPriceLimit: toNumberOrUndefined(values.lowerPriceLimit),
    // Financial business group — see property.types.ts for evidence.
    initialPrice: toNumberOrUndefined(values.initialPrice),
    objectiveValue: toNumberOrUndefined(values.objectiveValue),
    vat: typeof values.vat === 'boolean' ? values.vat : undefined,
    cRemuneration: toNumberOrUndefined(values.cRemuneration),
    // Currency-companion fix, discovered live 2026-07-12: EspoCRM's REST API
    // auto-defaults a currency field's paired `XCurrency` attribute on
    // Create, but NOT on Edit — a PATCH setting a real amount on a
    // currency-typed field that has never had one returns a hard 400
    // (validCurrency) unless the companion is sent explicitly. 'EUR' is the
    // only value confirmed accepted this session ('USD' is rejected the
    // same way). Only sent when the field itself has a real value — never
    // guessed for the untouched/omitted case. `price` was excluded from this
    // fix originally (it was a plain Number field, not the Currency widget)
    // — migrated onto the same pattern in Wave 4 (2026-07-14) now that it's
    // a real field.currency() field too.
    priceCurrency: toNumberOrUndefined(values.price) !== undefined ? 'EUR' : undefined,
    lowerPriceLimitCurrency: toNumberOrUndefined(values.lowerPriceLimit) !== undefined ? 'EUR' : undefined,
    initialPriceCurrency: toNumberOrUndefined(values.initialPrice) !== undefined ? 'EUR' : undefined,
    objectiveValueCurrency: toNumberOrUndefined(values.objectiveValue) !== undefined ? 'EUR' : undefined,
    cRentalprice: toNumberOrUndefined(values.cRentalprice),
    cAverageMonthlyUtilities: toNumberOrUndefined(values.cAverageMonthlyUtilities),
    // Wave 4 (2026-07-14, Pricing Reconciliation): exchangeScheme is the real
    // boolean gate for exchangeSchemePercentage (which already existed);
    // cCompensationFactor is the real target of the previously dead-end
    // cConsideration toggle. pricePerSqm deliberately NOT mapped here — live
    // entityDefs confirms it is readOnly:true (server-computed), so there is
    // no writable value to ever send; the client-side calculation in
    // portfolio-analytics.ts remains the only source for display purposes.
    exchangeScheme: typeof values.exchangeScheme === 'boolean' ? values.exchangeScheme : undefined,
    exchangeSchemePercentage: toNumberOrUndefined(values.exchangeSchemePercentage),
    cCompensationFactor: toNumberOrUndefined(values.cCompensationFactor),

    square: toNumberOrUndefined(values.square),
    // Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances).
    plotArea: toNumberOrUndefined(values.plotArea),
    balconyArea: toNumberOrUndefined(values.balconyArea),
    // Enterprise Certification Program (2026-07-16). Live entityDefs: float,
    // no min/max/required, no Dynamic Logic — not Land-only (see
    // size-rooms-structure.schema.ts for the live-data evidence).
    facadeLength: toNumberOrUndefined(values.facadeLength),
    bedroomCount: toNumberOrUndefined(values.bedroomCount),
    bathroomCount: toNumberOrUndefined(values.bathroomCount),
    livingRooms: toNumberOrUndefined(values.livingRooms),
    // EC-4 (2026-07-15, Enterprise Certification Program).
    additionalLivingRooms: toNumberOrUndefined(values.additionalLivingRooms),
    kitchens: toNumberOrUndefined(values.kitchens),
    cMasterrooms: toNumberOrUndefined(values.cMasterrooms),
    cLivingkitchens: toNumberOrUndefined(values.cLivingkitchens),
    cHalfBathrooms: toNumberOrUndefined(values.cHalfBathrooms),
    parkingSpaces: toNumberOrUndefined(values.parkingSpaces),
    // garageNumber intentionally NOT mapped — see size-rooms-structure.
    // schema.ts's comment; live-confirmed field-level-ACL silent-write-failure.
    floor: toNumberOrUndefined(values.floor),
    floorCount: toNumberOrUndefined(values.floorCount),
    // Enum of exact string values (including decimals) — never coerce to number.
    floorKey: toStringOrUndefined(values.floorKey),
    lastFloor: typeof values.lastFloor === 'boolean' ? values.lastFloor : undefined,
    yearBuilt: toNumberOrUndefined(values.yearBuilt),
    // Represented as a select of exact string values ('1'-'5') over the same
    // integer scale EspoCRM's real `rate` widget uses — coerced to number
    // here, same as any other numeric field. See domain/options.ts's
    // CONDITION_OPTIONS comment.
    cCondition: toNumberOrUndefined(values.cCondition),
    // Enum, not Boolean — see property.types.ts (CR-08).
    furnished: toStringOrUndefined(values.furnished),
    cFurnitureElectricalAppliances: toStringArrayOrUndefined(values.cFurnitureElectricalAppliances),

    // Address Business Group, Phase 2 — addressStreet/addressState are new;
    // addressCity/PostalCode/Country/GeocodeType predate this phase.
    // addressLatitude/addressLongitude are plain numbers, manually entered
    // (no geocoding lookup this phase).
    addressStreet: toStringOrUndefined(values.addressStreet),
    addressCity: toStringOrUndefined(values.addressCity),
    addressState: toStringOrUndefined(values.addressState),
    addressPostalCode: toStringOrUndefined(values.addressPostalCode),
    addressCountry: toStringOrUndefined(values.addressCountry),
    addressLatitude: toNumberOrUndefined(values.addressLatitude),
    addressLongitude: toNumberOrUndefined(values.addressLongitude),
    addressGeocodeType: toStringOrUndefined(values.addressGeocodeType),
    belt: toStringOrUndefined(values.belt),
    closeTo: toStringOrUndefined(values.closeTo),
    // Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances). No unit
    // (km/m) declared in the live metadata for the 4 distance fields —
    // plain numbers, no conversion applied.
    view: toStringOrUndefined(values.view),
    distanceFromSea: toNumberOrUndefined(values.distanceFromSea),
    distanceFromCity: toNumberOrUndefined(values.distanceFromCity),
    distanceFromVillage: toNumberOrUndefined(values.distanceFromVillage),
    distanceFromAirport: toNumberOrUndefined(values.distanceFromAirport),
    // Land Details business group — see property.types.ts for the live
    // entityDefs evidence behind each field.
    cBuildingBlocks: toNumberOrUndefined(values.cBuildingBlocks),
    cFrontLength: toNumberOrUndefined(values.cFrontLength),
    cHeightFactor: toNumberOrUndefined(values.cHeightFactor),
    cRemainingBuild: toNumberOrUndefined(values.cRemainingBuild),
    cBuildingFactor: toNumberOrUndefined(values.cBuildingFactor),
    cCoverageFactor: toNumberOrUndefined(values.cCoverageFactor),
    cStructureFactor: toNumberOrUndefined(values.cStructureFactor),
    cCityplan: typeof values.cCityplan === 'boolean' ? values.cCityplan : undefined,
    cResidentialArea: typeof values.cResidentialArea === 'boolean' ? values.cResidentialArea : undefined,
    cFacade: typeof values.cFacade === 'boolean' ? values.cFacade : undefined,
    cBuildingPermit: typeof values.cBuildingPermit === 'boolean' ? values.cBuildingPermit : undefined,
    cAgriculturalUse: typeof values.cAgriculturalUse === 'boolean' ? values.cAgriculturalUse : undefined,
    cContainsBuilding: typeof values.cContainsBuilding === 'boolean' ? values.cContainsBuilding : undefined,
    cSlope: toStringOrUndefined(values.cSlope),
    // Region -> Sub Region -> Location cascade: real belongsTo relationships
    // to RealEstateLocation (regionLocation optional, subRegionLocation and
    // location required — location is the field that previously blocked
    // every Create submission). EspoCRM's <link>Id REST convention, same
    // pattern already used for assignedUserId below. Replaces the old
    // locationName/subRegionLocationName/regionLocationName keys, which
    // never corresponded to a real backend attribute.
    locationId: toStringOrUndefined(values.locationId),
    subRegionLocationId: toStringOrUndefined(values.subRegionLocationId),
    regionLocationId: toStringOrUndefined(values.regionLocationId),
    // Contacts Business Group (Phase 1) — linkMultiple, required live.
    // MultiSelectField already stores its value as string[] of contact ids
    // (see location-zoning.schema.ts), the same shape EspoCRM's own
    // `contactsIds` REST attribute expects — no mapping needed, same
    // precedent as cFurnitureElectricalAppliances/cPlacement below.
    contactsIds: toStringArrayOrUndefined(values.contactsIds),

    assignedUserId: toStringOrUndefined(values.assignedUserId),
    nextUpdate: toStringOrUndefined(values.nextUpdate),
    description: toStringOrUndefined(values.description),
    cOfficeNotes: toStringOrUndefined(values.cOfficeNotes),
    cPropertyEvaluatorAI: toStringOrUndefined(values.cPropertyEvaluatorAI),
    cDescriptionGr: toStringOrUndefined(values.cDescriptionGr),
    keys: typeof values.keys === 'boolean' ? values.keys : undefined,
    cSold: typeof values.cSold === 'boolean' ? values.cSold : undefined,
    cConsideration: typeof values.cConsideration === 'boolean' ? values.cConsideration : undefined,
    cAvailableFrom: toStringOrUndefined(values.cAvailableFrom),
    cBanner: typeof values.cBanner === 'boolean' ? values.cBanner : undefined,
    withinCityPlan: typeof values.withinCityPlan === 'boolean' ? values.withinCityPlan : undefined,
    investment: typeof values.investment === 'boolean' ? values.investment : undefined,
    withinMonthlyUtilities: typeof values.withinMonthlyUtilities === 'boolean' ? values.withinMonthlyUtilities : undefined,
    idealForStudents: typeof values.idealForStudents === 'boolean' ? values.idealForStudents : undefined,
    idealForEmployees: typeof values.idealForEmployees === 'boolean' ? values.idealForEmployees : undefined,
    penthouse: typeof values.penthouse === 'boolean' ? values.penthouse : undefined,

    energyClass: toStringOrUndefined(values.energyClass),
    cHeatingMedium: toStringOrUndefined(values.cHeatingMedium),
    cHeatingController: toStringOrUndefined(values.cHeatingController),
    cAdditionalheating: toStringArrayOrUndefined(values.cAdditionalheating),
    cPlacement: toStringArrayOrUndefined(values.cPlacement),
    additionalBenefits: toStringArrayOrUndefined(values.additionalBenefits),
    features: toStringArrayOrUndefined(values.features),
    cOrientation: toStringOrUndefined(values.cOrientation),
    door: toStringOrUndefined(values.door),
    frames: toStringOrUndefined(values.frames),
    cStorageSpace: toStringOrUndefined(values.cStorageSpace),
    hasElectricalDevices: typeof values.hasElectricalDevices === 'boolean' ? values.hasElectricalDevices : undefined,
    swimmingPool: toStringOrUndefined(values.swimmingPool),
    accessFrom: toStringOrUndefined(values.accessFrom),
    buildingElevator: typeof values.buildingElevator === 'boolean' ? values.buildingElevator : undefined,
    buildingElevatorRooms: typeof values.buildingElevatorRooms === 'boolean' ? values.buildingElevatorRooms : undefined,
    internalElevator: typeof values.internalElevator === 'boolean' ? values.internalElevator : undefined,
    hasDisabledAccess: typeof values.hasDisabledAccess === 'boolean' ? values.hasDisabledAccess : undefined,
    doubleGlass: typeof values.doubleGlass === 'boolean' ? values.doubleGlass : undefined,
    balcony: typeof values.balcony === 'boolean' ? values.balcony : undefined,
    garage: toStringOrUndefined(values.garage),
    cGarage: toStringOrUndefined(values.cGarage),
    floorType: toStringOrUndefined(values.floorType),
    bedroomsFloorType: toStringOrUndefined(values.bedroomsFloorType),
    cUnderConstriction: typeof values.cUnderConstriction === 'boolean' ? values.cUnderConstriction : undefined,
    itNeedsRenovation: typeof values.itNeedsRenovation === 'boolean' ? values.itNeedsRenovation : undefined,
    renovated: typeof values.renovated === 'boolean' ? values.renovated : undefined,
    yearOfRenovation: toNumberOrUndefined(values.yearOfRenovation),

    isFeatured: typeof values.isFeatured === 'boolean' ? values.isFeatured : undefined,
    isVerified: typeof values.isVerified === 'boolean' ? values.isVerified : undefined,
    isPremium: typeof values.isPremium === 'boolean' ? values.isPremium : undefined,
    isNewListing: typeof values.isNewListing === 'boolean' ? values.isNewListing : undefined,

    // imagesIds/mainImageId/cBannerphoto are set by submitPropertyForm after upload.
  }
}

// Edit-mode-only clear semantics — see the Serialization Verification report
// (live-tested against staging.realtorvoice.gr, 2026-07-12) for the evidence
// behind every value below. buildPropertyPayload resolves any cleared field
// to `undefined`, which JSON.stringify drops entirely — EspoCRM's PATCH
// treats an absent key as "leave unchanged," so a field the user explicitly
// cleared in Edit mode silently keeps its old server-side value unless we
// replace `undefined` with the field's actual canonical empty value before
// submitting. Create mode never calls this — there is no prior value to
// fail to clear, so `undefined`-means-omit is already correct there.
//
// BOOLEAN_KEYS/MULTI_VALUE_KEYS are not an independent classification source
// - they restate, by name, exactly the fields buildPropertyPayload's own
// `typeof v === 'boolean'` and `toStringArrayOrUndefined` lines above already
// route through. No live, enforced field-type registry exists yet to derive
// this from automatically: the step schemas (app/(dashboard)/properties/new/
// steps/*.schema.ts) know each field's true type, but importing all 7 into
// this file would couple the transform layer to the schema layer for the
// first time - a materially larger change than this fix calls for. The
// framework/metadata/property field registry also carries a `fieldType` per
// field, but is explicitly dead code (zero external importers; its own
// index.ts: "Nothing in the existing application imports this module yet...
// exists for a future Phase 4 generator") and is already stale on these
// exact fields - it still marks bedroomCount/bathroomCount/floor/furnished
// with the type-based land-visibility rule removed as a bug (CR-06) this
// same session, never updated to match. Depending on either source would be
// riskier than this small, adjacent, easily-diffed duplication.
// TECH DEBT: if a live field-type source is ever wired into this file for
// another reason, derive these two lists from it instead of hand-maintaining
// them.
const BOOLEAN_KEYS = [
  'lastFloor', 'keys', 'cSold', 'cConsideration', 'cBanner',
  'withinCityPlan', 'investment', 'withinMonthlyUtilities', 'idealForStudents',
  'idealForEmployees', 'penthouse', 'hasElectricalDevices', 'buildingElevator',
  'buildingElevatorRooms', 'internalElevator', 'hasDisabledAccess', 'doubleGlass',
  'balcony', 'cUnderConstriction', 'itNeedsRenovation', 'renovated',
  'isFeatured', 'isVerified', 'isPremium', 'isNewListing',
  // Land Details business group (added 2026-07-12):
  'cCityplan', 'cResidentialArea', 'cFacade', 'cBuildingPermit',
  'cAgriculturalUse', 'cContainsBuilding',
  // Financial business group (added 2026-07-12):
  'vat',
  // Pricing Reconciliation, Wave 4 (2026-07-14):
  'exchangeScheme',
  // 'furnished' removed 2026-07-12 (CR-08) — it is an Enum, not a Boolean;
  // it now falls through to the default null-on-clear rule below, which is
  // correct for Enum per the Serialization Verification report.
]

const MULTI_VALUE_KEYS = [
  'cAdditionalheating', 'cPlacement', 'additionalBenefits', 'features',
  'cFurnitureElectricalAppliances',
  // Contacts Business Group (added 2026-07-12): contactsIds is required
  // live, so this branch is defensive (client validation should already
  // block an empty submission) rather than an expected real path — included
  // for Data Integrity Gate completeness, same rule as every other
  // Multi-Enum/linkMultiple field above.
  'contactsIds',
]

// Image/Multi-Image keys are deliberately excluded — no runtime evidence
// exists for their clearing semantics (Attachment-creation was blocked by
// permissions during verification). attachUploadedMedia's own async logic
// already handles them separately and is untouched by this function.
const EDIT_CLEAR_EXCLUDED_KEYS = ['cBannerphoto', 'imagesIds']

/**
 * Edit-mode only. For every field RHF's dirtyFields marks as touched, if
 * buildPropertyPayload resolved it to `undefined` (the user cleared it),
 * replace `undefined` with that field's canonical empty value — `false` for
 * Boolean, `[]` for Multi-Enum, `null` for everything else (Text, Textarea,
 * Integer, Currency, Enum, Link/Id, Date — all live-confirmed to accept and
 * correctly clear on explicit `null`). Fields never touched by the user stay
 * omitted exactly as before — only dirty+cleared fields are affected.
 */
function applyEditClearSemantics(
  payload: Partial<RealEstateProperty>,
  dirtyFields: Record<string, unknown>,
): void {
  const p = payload as Record<string, unknown>
  for (const key of Object.keys(dirtyFields)) {
    if (!dirtyFields[key]) continue
    if (p[key] !== undefined) continue
    if (EDIT_CLEAR_EXCLUDED_KEYS.includes(key)) continue
    if (BOOLEAN_KEYS.includes(key)) { p[key] = false; continue }
    if (MULTI_VALUE_KEYS.includes(key)) { p[key] = []; continue }
    p[key] = null
  }
}

/**
 * Uploads any File objects in `imagesIds`/`cBannerphoto` to EspoCRM's
 * Attachment entity and merges the resulting ids into the payload
 * (imagesIds = full id array, mainImageId = first id — first-upload-wins for
 * this v1, per the approved plan). Existing string ids (edit mode, photos
 * the user didn't touch) pass through unchanged — see
 * attachment-upload.service.ts's uploadPropertyImages.
 */
async function attachUploadedMedia(
  values: Record<string, unknown>,
  payload: Partial<RealEstateProperty>,
): Promise<void> {
  const rawImages = Array.isArray(values.imagesIds) ? (values.imagesIds as (File | string)[]) : []
  if (rawImages.length > 0) {
    const ids = await uploadPropertyImages(rawImages)
    payload.imagesIds = ids
    payload.mainImageId = ids[0]
  }

  // Banner photo — single image, uploaded independently of the gallery above.
  if (values.cBannerphoto instanceof File) {
    const { id } = await uploadPropertyImage(values.cBannerphoto, 'cBannerphoto')
    payload.cBannerphoto = id
  } else if (typeof values.cBannerphoto === 'string' && values.cBannerphoto) {
    payload.cBannerphoto = values.cBannerphoto
  }

  // Wave 7 (2026-07-15, Attachments). cDocumentassignment is a plain
  // belongsTo Attachment field (live-confirmed via links.cDocumentassignment
  // — resolved the Architecture Proposal's open question) — same mechanism
  // as cBannerphoto above, not the Document-entity relate flow `documents`
  // uses.
  if (values.cDocumentassignment instanceof File) {
    const { id } = await uploadPropertyImage(values.cDocumentassignment, 'cDocumentassignment')
    payload.cDocumentassignment = id
  } else if (typeof values.cDocumentassignment === 'string' && values.cDocumentassignment) {
    payload.cDocumentassignment = values.cDocumentassignment
  }
}

/**
 * Wave 7 (2026-07-15, Attachments). Uploads any newly-picked document Files
 * (Upload -> Create -> Relate, see the Wave 7 Design Package) and unrelates
 * any existing documents the user removed. Always runs AFTER the property
 * itself has been created/updated — unlike images, a document can't be
 * related until a real property id exists. Deliberately does not throw on a
 * partial document failure: the property record is already saved by this
 * point, so a document hiccup must not read to the user as "your property
 * failed to save." Each failed file is reported individually instead.
 */
async function attachDocuments(values: Record<string, unknown>, propertyId: string, currentUserId?: string): Promise<void> {
  const rawDocuments = Array.isArray(values.documents) ? values.documents : []
  const pendingFiles = rawDocuments.filter((f): f is File => f instanceof File)

  if (pendingFiles.length > 0) {
    if (!currentUserId) {
      toast.error('Could not upload documents — no signed-in user found. Try saving again.')
    } else {
      const items = pendingFiles.map(createDocumentUploadItem)
      await processDocumentQueue(items, propertyId, currentUserId)
      const failed = items.filter(i => i.status !== 'success')
      if (failed.length > 0) {
        toast.error(
          failed.length === 1
            ? `"${failed[0].file.name}" failed to upload — try saving again.`
            : `${failed.length} documents failed to upload — try saving again.`,
        )
      }
    }
  }

  // Edit mode only. `documentsOriginalIds` is seeded once at load (see
  // PropertyFormPage.tsx's defaultValues) with every document the record
  // started with; whichever of those ids is no longer present among the
  // remaining ExistingFileRef entries in `values.documents` was removed by
  // the user in this session and needs unrelating. Nothing to diff on
  // Create — documentsOriginalIds is never seeded there.
  const originalIds = Array.isArray(values.documentsOriginalIds)
    ? (values.documentsOriginalIds as unknown[]).filter((v): v is string => typeof v === 'string')
    : []
  if (originalIds.length > 0) {
    const remainingIds = rawDocuments
      .filter((f): f is { id: string } => typeof f === 'object' && f !== null && 'existing' in (f as object))
      .map(f => f.id)
    const toUnrelate = originalIds.filter(id => !remainingIds.includes(id))
    for (const documentId of toUnrelate) {
      try {
        await unrelateDocument(propertyId, documentId)
      } catch {
        toast.error('Could not remove a document — try again.')
      }
    }
  }
}

// Phase 0 Production Hotfix (2026-07-12) originated this bridge; Phase 1
// (Contacts) resolved and removed its `contacts` half entirely. Phase 2
// (Address, 2026-07-12) resolves the remaining question this bridge was
// waiting on — which address composite is canonical — WITHOUT being able to
// remove the bridge itself. Full reasoning:
//
// `address` is now the confirmed canonical composite (see the file header
// comment in location-zoning.schema.ts for the live evidence: EspoCRM's own
// native list-map feature reads `address`, not `cLocationReal`; the latter
// has zero references anywhere in clientDefs; and cLocationReal's own
// Latitude/Longitude are independently confirmed broken). But
// `cLocationRealCity` is still `required: true` server-side, and that
// requirement is enforced by EspoCRM itself — nothing in this application
// can remove it. The mirror therefore stays, permanently, by design: not
// technical debt awaiting a decision anymore, just a required legacy
// attribute kept minimally satisfied so Create succeeds.
//
// Deliberately Create-only, not extended to Edit: cLocationRealCity has
// zero references anywhere in clientDefs (confirmed live) — no EspoCRM
// layout, panel, or list view ever displays it, so a value that goes stale
// after a later Edit has no observable effect anywhere this application or
// EspoCRM's own UI can show it. Wiring the mirror into
// applyEditClearSemantics/buildPropertyPayload would mean the shared,
// both-modes payload function reaching into a field this Business Group
// deliberately treats as non-canonical, for a staleness risk with no known
// consumer — a larger, riskier change than the problem it would solve. If a
// real consumer of cLocationRealCity is ever found, revisit then, with that
// consumer's actual requirement in hand, not preemptively.
//
// No other cLocationReal* field is written anywhere — only City, because
// only City is required.
/**
 * Async submit for the Create wizard: builds the payload, uploads any new
 * media, creates the record. `currentUserId` (the signed-in agent's real
 * EspoCRM user id) is required to attach any queued documents — Document
 * entities need `assignedUserId` set to be relatable at all, see
 * document.repository.ts's CreateDocumentPayload. Omit only if the wizard
 * has no signed-in user available (documents are then skipped, not guessed).
 */
export async function submitPropertyForm(values: Record<string, unknown>, currentUserId?: string): Promise<RealEstateProperty> {
  const payload = buildPropertyPayload(values)

  // cLocationRealCity mirrors addressCity (required client-side, see
  // location-zoning.schema.ts), so this is always a real, user-entered
  // value, never invented.
  if (payload.cLocationRealCity === undefined) {
    payload.cLocationRealCity = payload.addressCity
  }

  await attachUploadedMedia(values, payload)
  const property = await createProperty(payload)
  await attachDocuments(values, property.id, currentUserId)
  return property
}

/**
 * Async submit for the Edit wizard: same payload/media handling as
 * submitPropertyForm, but updates the existing record instead of creating a
 * new one. `id` is the record being edited (not part of the form values).
 * `dirtyFields` (RHF's `formState.dirtyFields`, keyed by field name) drives
 * applyEditClearSemantics — pass `{}`/omit only if there is genuinely no
 * form state available; every real call site should pass the real value.
 * `currentUserId` — see submitPropertyForm's comment.
 */
export async function submitPropertyEdit(
  id: string,
  values: Record<string, unknown>,
  dirtyFields: Record<string, unknown> = {},
  currentUserId?: string,
): Promise<RealEstateProperty> {
  const payload = buildPropertyPayload(values)
  applyEditClearSemantics(payload, dirtyFields)
  await attachUploadedMedia(values, payload)
  const property = await updateProperty(id, payload)
  await attachDocuments(values, id, currentUserId)
  return property
}
