// RealEstateProperty — field names verified against the live EspoCRM entity.
// Do not rename fields here without confirming against the API response first.

export type SortOption  = 'newest' | 'oldest' | 'price-high' | 'price-low'
export type ViewMode    = 'grid' | 'list'
export type PriceRange  = 'all' | 'under500k' | '500k-1m' | '1m-2m' | 'over2m'
export type AreaRange   = 'all' | 'under100'  | '100-500' | 'over500'
export type SavedView   = 'all' | 'mine' | 'favorites' | 'recent' | 'pending' | 'sold'

/** Known EspoCRM status values. `string &amp; {}` keeps the union open so unexpected
 *  API responses don't crash the type system while still enabling autocomplete.
 *  Corrected to the real live entityDefs enum in Wave 2 (2026-07-14) — see
 *  domain/constants.ts's PROPERTY_STATUSES, the single source of truth this
 *  mirrors. Old fabricated values (Available/Reserved/Pending/Draft) removed;
 *  see the approved Product Decision Record for the old→new mapping. */
export type PropertyStatus =
  | 'Under Approval'
  | 'Active'
  | 'Inactive'
  | 'Not Approved'
  | 'Under negotiation'
  | 'Received payment'
  | 'Rented'
  | 'Sold'
  | (string & {})

// Legacy Title-Case values (still submitted by the legacy edit dialog / may
// exist on older records) alongside the PDF master `type` catalogue (lowercase
// — see property-type.registry.ts's getTypeOptionsForCategory), which is
// dependent on `category` in the property creation wizard. Both vocabularies
// are valid; do not remove either.
export type PropertyType =
  | 'House'
  | 'Villa'
  | 'Apartment'
  | 'Townhouse'
  | 'Office'
  | 'Land'
  // PDF master enum — Residential
  | 'apartment' | 'studio' | 'flatlet' | 'maisonette' | 'detached' | 'villa'
  | 'loft' | 'bungalow' | 'building' | 'apartment complex' | 'farm' | 'other categories'
  // PDF master enum — Commercial
  | 'office' | 'store' | 'warehouse' | 'industrial space' | 'craft space'
  | 'hotel' | 'business building' | 'hall' | 'showroom' | 'other commercial'
  // PDF master enum — Land
  | 'plot' | 'parcel' | 'island' | 'other land'
  // PDF master enum — Other
  | 'business' | 'air' | 'parking spot' | 'wind farm' | 'photovoltaics'
  | 'dissolvable' | 'prefabricated' | 'other'
  | (string & {})

/** Business-spec master classification field — distinct from `type`, which
 *  is not yet conditioned on it (see identity.schema.ts Phase A notes). */
export type PropertyCategory =
  | 'Residential'
  | 'Commercial'
  | 'Land'
  | 'Other'
  | (string & {})

/** Listing mandate type — 'Simple' (non-exclusive) or 'Exclusive'. */
export type PropertyAssignment =
  | 'Simple'
  | 'Exclusive'
  | (string & {})

/** PDF-confirmed EspoCRM attribute `requestType` — is this listing for Rent or
 *  Sale? Reconciled from the prior, unconfirmed `purpose` field (see git
 *  history) which never had a verified live-metadata source. */
export type PropertyRequestType =
  | 'Rent'
  | 'Sale'
  | (string & {})

/** Accuracy of the geocoded property location. */
export type PropertyGeocodeType =
  | 'Exact'
  | 'Approximate'
  | (string & {})

/** Land-use/zoning belt classification. No dynamic logic. */
export type PropertyBelt =
  | 'agricultural'
  | 'commercial'
  | 'industrial'
  | 'recreational'
  | 'residential'
  | 'unincorporated'
  | (string & {})

/** Floor classification enum — distinct from the plain-integer `floor`
 *  attribute. Values are exact strings per the PDF (including decimals like
 *  '0.1', '1.1') — never coerce these to numbers. */
export type PropertyFloorKey =
  | '0' | '0.1' | '0.2' | '0.3' | '0.4'
  | '1' | '1.1'
  | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10'
  | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '20'
  | (string & {})

// Wave 7 (2026-07-15, Attachments). The Document entity's shape, as read
// back via GET /RealEstateProperty/{id}/documents — see document.repository.ts.
export interface PropertyDocumentRef {
  id: string
  name: string
  fileId: string
  fileName?: string
  publishDate?: string | null
}

// Property Details Completion (2026-07-17). Contact's role on this specific
// property — EspoCRM returns this as a per-relation "column" alongside the
// contactsIds linkMultiple, not as a property of the Contact record itself.
export interface PropertyContactRole {
  role: string | null
}

// EC-8 (2026-07-15, Detail Page Relationship Panels). Read-only shapes for
// the 3 hasChildren activity relations (calls/meetings/tasks), as read back
// via GET /RealEstateProperty/{id}/<relation> — see activity.repository.ts.
export interface PropertyCallRef {
  id: string
  name: string
  status: string
  dateStart: string | null
  direction?: string
}

export interface PropertyMeetingRef {
  id: string
  name: string
  status: string
  dateStart: string | null
  dateEnd: string | null
}

export interface PropertyTaskRef {
  id: string
  name: string
  status: string
  dateEnd: string | null
}

export interface RealEstateProperty {
  id: string
  name: string                        // EspoCRM internal name (often auto-generated)
  title?: string                      // Marketing / display title — primary display field
  propertyCode?: string               // Short reference code e.g. "REF-001"

  status: PropertyStatus
  type?: PropertyType
  category?: PropertyCategory
  cAssignment?: PropertyAssignment
  requestType?: PropertyRequestType   // Rent or Sale (PDF: "Request Type")

  price?: number                      // Asking Price — Currency, required live. Migrated from a plain Number field to Currency in Wave 4 (2026-07-14, Pricing Reconciliation) — see property-form.transform.ts's priceCurrency comment.
  lowerPriceLimit?: number            // Negotiation floor — minimum acceptable price
  // Financial business group (added 2026-07-12) — all PDF-documented, none
  // previously built, none carry a Dynamic Logic rule (always visible).
  initialPrice?: number               // "Initial Price" — Currency, no min/max.
  objectiveValue?: number             // "Objective Value" — Currency, no min/max. Referenced by the VAT tooltip as the transfer-tax basis.
  vat?: boolean                       // "VAT" — Boolean. PDF documents this field in full but gives no Name=; live entityDefs confirms the real attribute is `vat`.
  cRemuneration?: number              // "Αμοιβή (σε € ή %)" — Integer (PDF notes one Integer field can't cleanly hold both € and %, unresolved).
  // Wave 4 (2026-07-14, Pricing Reconciliation): exchangeScheme is the real
  // boolean gate for exchangeSchemePercentage (which predates this wave);
  // cCompensationFactor is the real target of cConsideration (Identity &
  // Governance step), previously a dead-end toggle with no field to reveal.
  // pricePerSqm deliberately NOT modeled here — live entityDefs confirms
  // readOnly:true (server-computed); portfolio-analytics.ts's client-side
  // calculation remains the only source for display.
  exchangeScheme?: boolean
  cCompensationFactor?: number
  // Currency-companion attributes — EspoCRM's REST API pairs every true
  // Currency-typed field with an `XCurrency` attribute; required explicitly
  // on Edit (PATCH), auto-defaulted on Create (POST). 'EUR' is the only
  // value confirmed accepted live 2026-07-12 — see property-form.transform.ts.
  priceCurrency?: string
  lowerPriceLimitCurrency?: string
  initialPriceCurrency?: string
  objectiveValueCurrency?: string

  square?: number                     // Area in m²
  // Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances) — live
  // entityDefs: both float, no min/max declared.
  plotArea?: number                   // "Plot Area" — m²
  balconyArea?: number                // "Balcony Area" — m²
  // Enterprise Certification Program (2026-07-16). Live entityDefs: float,
  // isCustom:false, no min/max/required, no Dynamic Logic. Not Land-only —
  // live production data (5/200 sampled records) shows it populated on
  // Residential and Commercial properties, not just Land, so it is placed
  // alongside the other always-visible measurement fields here rather than
  // in the Land Details cluster. Distinct field from cFrontLength (a
  // separate, custom, int field, Land-only visibility) — confirmed
  // independent live: in every sampled record where one is set, the other
  // is null.
  facadeLength?: number               // "Facade Length"
  bedroomCount?: number
  bathroomCount?: number
  livingRooms?: number
  // EC-4 (2026-07-15, Enterprise Certification Program). Live entityDefs:
  // int, min 0, no dynamic logic. Distinct real field from livingRooms
  // above. Real-write proof obtained live this session (not just shape-only).
  additionalLivingRooms?: number
  kitchens?: number
  // Wave 5. Live Dynamic Logic: visible only when category == 'Residential'
  // — distinct real fields from livingRooms/kitchens above, not a rename.
  cMasterrooms?: number               // "Master Rooms" — int, Residential-only.
  cLivingkitchens?: number            // "Living Kitchens" — int, Residential-only.
  cHalfBathrooms?: number             // WC / half-bathroom count — hidden when category = Land
  parkingSpaces?: number              // Parking spaces — PDF-confirmed backend name, reconciled from the prior `parkingCount` name
  // garageNumber (live entityDefs: int, isCustom:true) is NOT modeled here —
  // live-tested this session: PATCH returns 200 and modifiedAt updates, but
  // the value never persists (fresh GET still shows null). The exact same
  // silent field-level-ACL failure pattern EC-1 already found on status/
  // assignedUser/teams/propertyCode/cFeatured/website/name. Reclassified
  // from "genuine missing capability" to "ACL blocked" — see the Enterprise
  // Coverage Matrix v4 correction and EC-1's frozen investigation.
  floor?:         number              // Floor number
  // Wave 5. Live entityDefs: int, min 0, default 1, no dynamic logic.
  // Distinct from `floor` (which floor this unit is on) — this is the
  // building's total floor count.
  floorCount?:    number
  floorKey?:      PropertyFloorKey    // Floor classification enum — distinct from `floor`; required unless category = Land
  lastFloor?:     boolean             // Is this the top/last floor of the building? No dynamic logic.
  yearBuilt?:     number              // Year of construction
  // Wave 5. Real type is `rate` (a 5-star widget) — no native equivalent in
  // the form-engine (Wave 5 Pre-Implementation Verification), represented
  // as a plain 1-5 integer over the same scale. See domain/options.ts's
  // CONDITION_OPTIONS.
  cCondition?:    number               // "Condition" — 1-5 rating.
  // Enum, not Boolean — corrected 2026-07-12 (CR-08). Live entityDefs:
  // 'furnished' | 'no' | 'halffurnished' | 'fullyfurnished' | 'half' | 'full'.
  // Sending a raw boolean previously caused a hard 400 from EspoCRM,
  // failing the entire Create/Edit submission whenever this field was set.
  furnished?:     string
  // "Furniture & Electrical Appliances" — Multi-Enum, visible when
  // furnished has a value other than 'no'. Not in the PDF. Live entityDefs
  // confirmed 2026-07-12.
  cFurnitureElectricalAppliances?: string[]

  // Address Business Group, Phase 2 (2026-07-12) — `address` confirmed as
  // the canonical composite (see location-zoning.schema.ts's file header for
  // the live evidence). addressStreet/addressState are new this phase;
  // addressLatitude/addressLongitude are plain numbers, manually entered.
  addressStreet?: string               // Street
  addressCity?: string                // City
  addressState?: string                // State / County — closest live field to "County"; no field named County exists.
  addressPostalCode?: string           // Postal code
  addressCountry?: string              // Country
  addressLatitude?: number             // Manually entered — no geocoding lookup yet (deferred to a later phase).
  addressLongitude?: number
  addressGeocodeType?: PropertyGeocodeType   // Accuracy of the geocoded property location
  // Phase 0 Production Hotfix (2026-07-12) originated this field; Phase 2
  // (2026-07-12) resolved the canonicalization decision it was waiting on —
  // `address` is canonical, `cLocationReal*` is a legacy composite nothing
  // in EspoCRM's own UI surfaces. cLocationRealCity itself stays required
  // server-side regardless, outside this app's control, so the mirror in
  // property-form.transform.ts's submitPropertyForm remains, permanently,
  // by design — see that file's comment for the full reasoning. Not open
  // technical debt anymore; a documented, intentional shadow-write.
  cLocationRealCity?: string
  // Contacts Business Group, Phase 1 (2026-07-12) — linkMultiple -> Contact,
  // required: true on the live entity. Real, user-selected data as of this
  // phase (location-zoning.schema.ts's Contacts section); the Phase 0
  // Production Hotfix's placeholder-Contact fallback has been removed.
  contactsIds?: string[]
  // Property Details Completion (2026-07-17). EspoCRM returns these
  // companion maps alongside contactsIds on every full-entity GET response
  // (confirmed live — no separate relation fetch needed, unlike documents/
  // calls/meetings/tasks below, which are hasMany relations with no id on
  // this record at all). contactsColumns carries the per-relation role.
  contactsNames?: Record<string, string>
  contactsColumns?: Record<string, PropertyContactRole>
  belt?: PropertyBelt                 // Land-use/zoning belt classification. No dynamic logic.
  closeTo?: string                    // Free text, max 255 chars. No dynamic logic.
  // Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances) — live
  // entityDefs, all 5 confirmed this session. No unit (km/m) declared for
  // the 4 distance fields anywhere in the live metadata.
  view?: string                       // "View" — enum, 10 real options (see VIEW_OPTIONS). No dynamic logic.
  distanceFromSea?: number
  distanceFromCity?: number
  distanceFromVillage?: number
  distanceFromAirport?: number
  // Land Details business group (all visible only when category = Land) —
  // none appear in the PDF; every type/option/min/max/default below was
  // confirmed live via EspoCRM entityDefs 2026-07-12, not guessed.
  cBuildingBlocks?: number            // "Building Blocks" — int, no min/max.
  cFrontLength?: number               // "Front Length" — int, no min/max.
  cHeightFactor?: number              // "Height Factor" — int, no min/max.
  cRemainingBuild?: number            // "Remaining Build" — int, no min/max. Standard EspoCRM field (isCustom: false), unlike its Land Details siblings.
  cBuildingFactor?: number            // "Building Factor" — int, no min/max.
  cCoverageFactor?: number            // "Coverage Factor" — float, min 0.1, max 10, default 0.1.
  cStructureFactor?: number           // "Structure Factor" — float, min 0.1, max 5, no default.
  cCityplan?: boolean                 // "City Plan" — bool, notNull (storage default, not a UI-required rule).
  cResidentialArea?: boolean          // "Residential Area" — bool, notNull.
  cFacade?: boolean                   // "Facade" — bool, notNull.
  cBuildingPermit?: boolean           // "Building Permit" — bool, notNull.
  cAgriculturalUse?: boolean          // "Agricultural Use" — bool, notNull.
  cContainsBuilding?: boolean         // "Contains Building" — bool, notNull.
  cSlope?: string                     // "Slope" — enum: 'plane' | 'inclining' | 'amphitheatric' (blank placeholder option excluded — see SLOPE_OPTIONS).
  locationName?: string               // Legacy free-text field — does not correspond to a real backend attribute (confirmed via live EspoCRM metadata). Superseded by locationId below; kept only because other display/narrative code still reads it. Do not write to it from the wizard.
  subRegionLocationName?: string      // Legacy free-text field — same caveat as locationName. Superseded by subRegionLocationId below.
  regionLocationName?: string         // Legacy free-text field — same caveat as locationName. Superseded by regionLocationId below.

  // Region -> Sub Region -> Location cascade — real belongsTo relationships
  // to the self-referencing RealEstateLocation entity (regionLocation
  // optional, subRegionLocation and location required server-side). IDs
  // only, per EspoCRM's REST <link>Id convention — same pattern as
  // assignedUserId above. `location` is the field that previously blocked
  // every Create submission (see the Final Release Report).
  locationId?: string
  subRegionLocationId?: string
  regionLocationId?: string

  mainImageId?: string | null         // Primary image ID — served via /api/espo-image?id={id}
  imagesIds?: string[]                // Gallery image IDs — same endpoint

  // Wave 7 (2026-07-15, Attachments). Read-only — populated via a separate
  // GET /RealEstateProperty/{id}/documents call (document.repository.ts),
  // never part of the standard entity payload. `documents` is a real
  // hasMany/hasMany relation to the Document entity, not a settable
  // RealEstateProperty attribute — no id lives directly on this record for
  // it. See the Wave 7 Design Package.
  documents?: PropertyDocumentRef[]

  // EC-8 (2026-07-15, Detail Page Relationship Panels). Read-only, populated
  // via separate GET /RealEstateProperty/{id}/<relation> calls — hasChildren
  // relations (parentId/parentType on the child), no id on this record.
  // devtest's ACL for Call/Meeting/Task is read:own, not read:all — a real
  // agent viewing this panel sees activity they have access to, not
  // necessarily every activity on the property system-wide.
  calls?: PropertyCallRef[]
  meetings?: PropertyMeetingRef[]
  tasks?: PropertyTaskRef[]

  assignedUserId?: string
  assignedUserName?: string
  // Property Details Sprint 1 — Runtime Completion. Both real, standard
  // EspoCRM companion fields present on every GET response (confirmed live
  // this session — accountId/accountName and teamsIds/teamsNames appear on
  // every fetched record, populated or not). Previously typed nowhere and
  // rendered nowhere on the read-only Details page — the earlier "ACL-blocked"
  // classification (Enterprise Coverage Matrix v4) was about whether the
  // Wizard can WRITE to `account`/`teams`, which is unrelated to whether this
  // read-only page should display values EspoCRM already returns.
  accountId?: string | null
  accountName?: string | null
  teamsIds?: string[]
  teamsNames?: Record<string, string>
  createdById?:   string              // EspoCRM standard — creator user ID
  createdByName?: string              // EspoCRM standard — creator user display name
  leadSource?:    string              // Lead / listing source
  description?: string | null
  cOfficeNotes?: string        // "Office Notes" — free multi-line text, no dynamic logic, no max/min length
  cPropertyEvaluatorAI?: string // "Αυτόματος Εκτιμητής Ακινήτου" — free multi-line text, no dynamic logic, no max/min length
  cDescriptionGr?: string      // "Περιγραφή (Ελληνικά) 🇬🇷" — free multi-line text, no dynamic logic. Defaults on create (not stored server-side as a schema default) to the PDF's exact Greek AI-assist prompt text.
  createdAt?: string
  modifiedAt?: string
  nextUpdate?: string                 // Next scheduled update/review date (ISO 'YYYY-MM-DD')
  keys?: boolean                      // Does the office hold keys for showings?
  cSold?: boolean                     // Sold flag — distinct EspoCRM custom attribute from `status`
  cConsideration?: boolean            // "Under consideration" flag
  cAvailableFrom?: string              // Available-from date (ISO 'YYYY-MM-DD')
  cBanner?: boolean                   // Show banner — defaults to true on create (see PropertyForm.tsx / PropertyFormPage.tsx)
  cBannerphoto?: string | null        // Banner photo attachment id — write-side key (PATCH/POST payload)
  // GET responses return this same belongsTo-Attachment value under the
  // standard Id-suffix key instead of the bare one above — read this key
  // when prefilling Edit mode. Same convention as cDocumentassignment/
  // cDocumentassignmentId below; this one was left unfixed at Wave 7 time
  // (see the Wave 7 Certification Report) and is now fixed in
  // PropertyFormPage.tsx's defaultValues alongside it.
  cBannerphotoId?: string | null
  // Wave 7 (2026-07-15, Attachments). belongsTo Attachment, same mechanism
  // as cBannerphoto — confirmed live via links.cDocumentassignment.
  // `cDocumentassignment` is the write-side key (PATCH/POST payload,
  // live-confirmed accepted this wave); the API's own GET responses return
  // the value under `cDocumentassignmentId` instead (the standard
  // belongsTo Id-suffix convention) — read that key when prefilling.
  cDocumentassignment?: string | null
  cDocumentassignmentId?: string | null
  cDocumentassignmentName?: string
  withinCityPlan?: boolean            // Is the property within the official city/urban plan?
  investment?: boolean                // Marked as an investment opportunity
  cRentalprice?: number               // Expected rental price — visible only when investment is true
  withinMonthlyUtilities?: boolean     // Are utilities included within the monthly price?
  cAverageMonthlyUtilities?: number    // "Μέσα μηνιαία κοινόχρηστα" — visible only when withinMonthlyUtilities is true
  exchangeSchemePercentage?: number    // No dynamic logic — always visible; minimum 0, no maximum defined
  idealForStudents?: boolean           // No dynamic logic — always visible, never required
  idealForEmployees?: boolean          // No dynamic logic — always visible, never required
  penthouse?: boolean                  // No dynamic logic — always visible, never required. Distinct from the legacy `type` enum's 'Penthouse' value.

  // Listing quality indicators — rendered as subtle chips on the card when true
  isFeatured?:   boolean
  isVerified?:   boolean
  isPremium?:    boolean
  isNewListing?: boolean

  // Lifestyle quality fields — presented as aspirational highlights in the detail view
  energyClass?:    string   // 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'E' | 'Z' | 'G' | 'Not required' | 'In progress' | 'H'
  cHeatingMedium?: string   // "Heating Medium" — 'petrol' | 'natural_gas' | 'gas' | 'current' | 'stove' | 'thermal_accumulator' | 'pellet' | 'infrared' | 'fan_coil' | 'wood' | 'teleheating' | 'geothermal_energy' | 'thermopompos' | 'heatpump'. Legacy records may still hold the prior Title-Case values ('Heat Pump'/'Gas'/'Electric'/'Solar'/'Oil') — see HEATING_LABELS/HEATING_HIGHLIGHTS/HEATING maps, intentionally left keyed on those for backward compatibility.
  cHeatingController?: string // "Τύπος θέρμανσης (Heating Type)" — distinct from cHeatingMedium: 'automic' | 'autonomus' | 'central' | 'withoutheating' | 'natural gas' (spellings preserved exactly per PDF)
  cAdditionalheating?: string[] // Multi-Enum — zero or more of: 'air conditioning' | 'underfloor' | 'fireplace'
  cOrientation?:   string   // lowercase short codes: 'e' | 'ew' | 'em' | 'n' | 'ne' | 'w' | 'nw' | 'wm' | 'm' | 's' | 'se' | 'sw'
  door?:           string   // 'Security' | 'Simple' | 'yes' | 'no' (confirmed live entityDefs 2026-07-14 — 'yes'/'no' are lowercase, unlike 'Security'/'Simple')
  frames?:         string   // 'wooden' | 'aluminium' | 'synthetic'
  cStorageSpace?:  string   // "Warehouse" — 'External' | 'Interior' | 'No' | 'Yes'
  hasElectricalDevices?: boolean // Visible only when category ≠ Land. No required/read-only/conditional-options logic.
  swimmingPool?:   string   // 'No' | 'External' | 'Interior' | 'indoors' (value 'indoors' intentionally differs from its label 'Indoors')
  accessFrom?:     string   // "Access From" — 'Road' | 'Pedestrian' | 'Paved' | 'Dirt road' | 'Sea' | 'No access' | 'Other'

  // Structural & amenity fields — mapped into feature groups in PropertyFeatureMapper
  buildingElevator?: boolean  // "Building Elevator" — reconciled from a descriptive 'Yes'/'No' string enum to the PDF-mandated Boolean type. No dynamic logic.
  buildingElevatorRooms?: boolean // "Elevator in Rooms" — distinct from buildingElevator (does the building have an elevator at all). No dynamic logic.
  internalElevator?: boolean      // "Internal Elevator" — distinct from buildingElevator and buildingElevatorRooms. No dynamic logic.
  hasDisabledAccess?: boolean     // "Disabled Access" — distinct from the 'accessbility' option inside the `features` Multi-Enum. No dynamic logic.
  doubleGlass?:      boolean  // "Double Glass" — reconciled from a 'Yes'/'No' string enum to the PDF-mandated Boolean type. No dynamic logic.
  balcony?:          boolean  // Reconciled from a descriptive string enum ('Yes'/'No'/'Large'/'Terrace') to the PDF-mandated Boolean type. Hidden when category = Land.
  garage?:           string   // 'Yes' | 'No' | descriptive (e.g. 'Double')
  cGarage?:          string   // "Parking Type" — distinct from `garage` (existence/size): 'Interior' | 'External'
  floorType?:        string   // Flooring material enum — 14 exact values per PDF (e.g. 'marble', 'wood and marble', 'mousamas')
  bedroomsFloorType?: string  // Bedroom-specific flooring enum, distinct from `floorType` — 13 exact values per PDF (e.g. 'Marble', 'Marble - Wood', 'Petra')
  cUnderConstriction?: boolean // "Under Construction" — backend name preserved exactly per PDF (not "cUnderConstruction")
  itNeedsRenovation?: boolean  // "Needs Renovation"
  renovated?: boolean          // Visible only when itNeedsRenovation is false and category ≠ Land
  yearOfRenovation?: number    // Visible only when renovated is true; max 2100, no minimum defined
  cPlacement?: string[]        // "Χωροθέτηση" (Multi-Enum) — zero or more of: airy/painted/corner/Facade/Interior/forCommercialUse/Side/Clear/bright/Three-sided/Four-sided. Note: 'airy' and 'Clear' are distinct values sharing the same label (Διαμπερές).
  additionalBenefits?: string[] // Multi-Enum — zero or more of: 'BBQ' | 'Independent entrance'
  features?: string[]         // Multi-Enum — zero or more of 39 exact PDF values (e.g. 'Veranda', 'petsAllowed', 'accessbility', 'holidayHome', 'Building elevator'). See features field options in specifications.schema.ts for the full list. 'Building elevator' here is a distinct string value, unrelated to the separate `buildingElevator` Boolean field.

}

export interface PropertyFilters {
  search:    string
  type:      string        // 'all' or a specific type value from API
  savedOnly: boolean       // heart toggle — filters by localStorage favorites
  bedrooms:  number | null // minimum bedroom count; null = no filter
  bathrooms: number | null // minimum bathroom count; null = no filter
  minPrice:  number | null // null = no lower bound
  maxPrice:  number | null // null = no upper bound
  sortBy:    SortOption
}

export type Property = RealEstateProperty
