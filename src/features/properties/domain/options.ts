// Shared FieldOption lists for RealEstateProperty forms - the single source
// of truth for every enum previously hand-copied into two or more of:
//   - features/properties/fields.ts (legacy Edit dialog)
//   - app/(dashboard)/properties/new/steps/*.schema.ts (Create wizard)
//
// Values and order are preserved byte-for-byte from whichever copy existed
// first - this file only changes *where* each list lives, never *what* it
// contains. Do not reorder, rename, add, or remove entries without a
// corresponding business-rule sign-off, per the original "PDF spec" comments
// each of these carried at their old locations.


// -- Identity step / legacy "Property Details" section --------------------

const CATO = 'wizard.steps.identityGovernance.sections.classification.fields.category.options'
export const CATEGORY_OPTIONS = [
  { value: 'Residential', label: 'Residential', labelKey: `${CATO}.residential` },
  { value: 'Commercial', label: 'Commercial', labelKey: `${CATO}.commercial` },
  { value: 'Land', label: 'Land', labelKey: `${CATO}.land` },
  { value: 'Other', label: 'Other', labelKey: `${CATO}.other` },
]

const RTO = 'wizard.steps.identityGovernance.sections.classification.fields.requestType.options'
export const REQUEST_TYPE_OPTIONS = [
  { value: 'Rent', label: 'Rent', labelKey: `${RTO}.rent` },
  { value: 'Sale', label: 'Sale', labelKey: `${RTO}.sale` },
]

const ASO = 'wizard.steps.identityGovernance.sections.governance.fields.cAssignment.options'
export const ASSIGNMENT_OPTIONS = [
  { value: 'Simple', label: 'Simple', labelKey: `${ASO}.simple` },
  { value: 'Exclusive', label: 'Exclusive', labelKey: `${ASO}.exclusive` },
]

// -- Location step / legacy "Location" section -----------------------------

const GTO = 'wizard.steps.locationZoning.sections.zoningDataQuality.fields.addressGeocodeType.options'
export const GEOCODE_TYPE_OPTIONS = [
  { value: 'Exact', label: 'Exact', labelKey: `${GTO}.exact` },
  { value: 'Approximate', label: 'Approximate', labelKey: `${GTO}.approximate` },
]

const BEO = 'wizard.steps.locationZoning.sections.zoningDataQuality.fields.belt.options'
export const BELT_OPTIONS = [
  { value: 'agricultural', label: 'Agricultural', labelKey: `${BEO}.agricultural` },
  { value: 'commercial', label: 'Commercial', labelKey: `${BEO}.commercial` },
  { value: 'industrial', label: 'Industrial', labelKey: `${BEO}.industrial` },
  { value: 'recreational', label: 'Recreational', labelKey: `${BEO}.recreational` },
  { value: 'residential', label: 'Residential', labelKey: `${BEO}.residential` },
  { value: 'unincorporated', label: 'Unincorporated', labelKey: `${BEO}.unincorporated` },
]

// -- Specifications step / legacy "Specifications" section -----------------

const FKO = 'wizard.steps.sizeRoomsStructure.sections.buildingPosition.fields.floorKey.options'
export const FLOOR_KEY_OPTIONS = [
  { value: '0', label: 'Basement', labelKey: `${FKO}.basement` },
  { value: '0.1', label: 'Basement', labelKey: `${FKO}.basement` },
  { value: '0.2', label: 'Semi-basement', labelKey: `${FKO}.semiBasement` },
  { value: '0.3', label: 'Ground floor', labelKey: `${FKO}.groundFloor` },
  { value: '0.4', label: 'Mezzanine', labelKey: `${FKO}.mezzanine` },
  { value: '1', label: '1st Floor', labelKey: `${FKO}.floor1` },
  { value: '1.1', label: '1st superlative', labelKey: `${FKO}.floor1Superlative` },
  { value: '2', label: '2nd Floor', labelKey: `${FKO}.floor2` },
  { value: '3', label: '3rd Floor', labelKey: `${FKO}.floor3` },
  { value: '4', label: '4th Floor', labelKey: `${FKO}.floor4` },
  { value: '5', label: '5th Floor', labelKey: `${FKO}.floor5` },
  { value: '6', label: '6th Floor', labelKey: `${FKO}.floor6` },
  { value: '7', label: '7th Floor', labelKey: `${FKO}.floor7` },
  { value: '8', label: '8th Floor', labelKey: `${FKO}.floor8` },
  { value: '9', label: '9th Floor', labelKey: `${FKO}.floor9` },
  { value: '10', label: '10th Floor', labelKey: `${FKO}.floor10` },
  { value: '11', label: '11th Floor', labelKey: `${FKO}.floor11` },
  { value: '12', label: '12th Floor', labelKey: `${FKO}.floor12` },
  { value: '13', label: '13th Floor', labelKey: `${FKO}.floor13` },
  { value: '14', label: '14th Floor', labelKey: `${FKO}.floor14` },
  { value: '15', label: '15th Floor', labelKey: `${FKO}.floor15` },
  { value: '16', label: '16th Floor', labelKey: `${FKO}.floor16` },
  { value: '17', label: '17th Floor', labelKey: `${FKO}.floor17` },
  { value: '18', label: '18th Floor', labelKey: `${FKO}.floor18` },
  { value: '19', label: '19th Floor', labelKey: `${FKO}.floor19` },
  { value: '20', label: '20th Floor', labelKey: `${FKO}.floor20` },
]

// Energy class letters (A+, A, B+, B, C, D, E, Z, G, H) are the live
// EspoCRM enum's exact stored codes, mirrored on real Greek energy
// performance certificates too — left untranslated, same treatment as VAT.
// Only the two plain-English non-code values get a labelKey.
const ECO = 'wizard.steps.constructionSystems.sections.energyHeating.fields.energyClass.options'
export const ENERGY_CLASS_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B+', label: 'B+' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'Z', label: 'Z' },
  { value: 'G', label: 'G' },
  { value: 'Not required', label: 'Not required', labelKey: `${ECO}.notRequired` },
  { value: 'In progress', label: 'In progress', labelKey: `${ECO}.inProgress` },
  { value: 'H', label: 'H' },
]

const HMO = 'wizard.steps.constructionSystems.sections.energyHeating.fields.cHeatingMedium.options'
export const HEATING_MEDIUM_OPTIONS = [
  { value: 'petrol', label: 'petrol', labelKey: `${HMO}.petrol` },
  { value: 'natural_gas', label: 'natural_gas', labelKey: `${HMO}.naturalGas` },
  { value: 'gas', label: 'gas', labelKey: `${HMO}.gas` },
  { value: 'current', label: 'current', labelKey: `${HMO}.current` },
  { value: 'stove', label: 'stove', labelKey: `${HMO}.stove` },
  { value: 'thermal_accumulator', label: 'thermal_accumulator', labelKey: `${HMO}.thermalAccumulator` },
  { value: 'pellet', label: 'pellet', labelKey: `${HMO}.pellet` },
  { value: 'infrared', label: 'infrared', labelKey: `${HMO}.infrared` },
  { value: 'fan_coil', label: 'fan_coil', labelKey: `${HMO}.fanCoil` },
  { value: 'wood', label: 'wood', labelKey: `${HMO}.wood` },
  { value: 'teleheating', label: 'teleheating', labelKey: `${HMO}.teleheating` },
  { value: 'geothermal_energy', label: 'geothermal_energy', labelKey: `${HMO}.geothermalEnergy` },
  { value: 'thermopompos', label: 'thermopompos', labelKey: `${HMO}.thermopompos` },
  { value: 'heatpump', label: 'heatpump', labelKey: `${HMO}.heatpump` },
]

// Labels are Greek per the PDF spec (field: cHeatingController, "Type of
// heating"). Values are byte-for-byte from the original
// specifications.schema.ts declaration — do not retype or reorder them.
// `label` here is the English fallback (used if `labelKey` can't resolve,
// e.g. outside a translation context); `labelKey` is what actually renders,
// per the active locale — see properties.json's
// wizard.steps.constructionSystems.sections.energyHeating.fields.
// cHeatingController.options.* (en: English gloss, el: this exact Greek
// text, unchanged).
const HCO = 'wizard.steps.constructionSystems.sections.energyHeating.fields.cHeatingController.options'
export const HEATING_CONTROLLER_OPTIONS = [
          { value: 'automic',        label: 'Individual Heating',  labelKey: `${HCO}.automic` },
          { value: 'autonomus',      label: 'Autonomous Heating',  labelKey: `${HCO}.autonomus` },
          { value: 'central',        label: 'Central Heating',     labelKey: `${HCO}.central` },
          { value: 'withoutheating', label: 'Without Heating',     labelKey: `${HCO}.withoutheating` },
          { value: 'natural gas',    label: 'natural gas' },
]

const FRO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.frames.options'
export const FRAMES_OPTIONS = [
  { value: 'wooden', label: 'Wooden', labelKey: `${FRO}.wooden` },
  { value: 'aluminium', label: 'Aluminium', labelKey: `${FRO}.aluminium` },
  { value: 'synthetic', label: 'Synthetic', labelKey: `${FRO}.synthetic` },
]

// Values 'yes'/'no' are intentionally lowercase, unlike 'Security'/'Simple' —
// confirmed against live EspoCRM entityDefs 2026-07-14 (Wave 1 reconciliation
// fix). Labels stay Title Case for display; only the submitted value must
// match the live enum exactly.
const DRO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.door.options'
export const DOOR_OPTIONS = [
  { value: 'Security', label: 'Security', labelKey: `${DRO}.security` },
  { value: 'Simple', label: 'Simple', labelKey: `${DRO}.simple` },
  { value: 'yes', label: 'Yes', labelKey: `${DRO}.yes` },
  { value: 'no', label: 'No', labelKey: `${DRO}.no` },
]

const FTO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.floorType.options'
export const FLOOR_TYPE_OPTIONS = [
  { value: 'marble', label: 'Marble', labelKey: `${FTO}.marble` },
  { value: 'wood', label: 'Wood', labelKey: `${FTO}.wood` },
  { value: 'stone', label: 'Stone', labelKey: `${FTO}.stone` },
  { value: 'laminate', label: 'Laminate', labelKey: `${FTO}.laminate` },
  { value: 'ceramic tiles', label: 'Ceramic tiles', labelKey: `${FTO}.ceramicTiles` },
  { value: 'mosaic tiles', label: 'Mosaic tiles', labelKey: `${FTO}.mosaicTiles` },
  { value: 'wood and marble', label: 'Wood and marble', labelKey: `${FTO}.woodAndMarble` },
  { value: 'marble and tile', label: 'Marble and tile', labelKey: `${FTO}.marbleAndTile` },
  { value: 'wood and stone', label: 'Wood and stone', labelKey: `${FTO}.woodAndStone` },
  { value: 'stone and marble', label: 'Stone and marble', labelKey: `${FTO}.stoneAndMarble` },
  { value: 'wood and tile', label: 'Wood and tile', labelKey: `${FTO}.woodAndTile` },
  { value: 'wood and mosaic', label: 'Wood and mosaic', labelKey: `${FTO}.woodAndMosaic` },
  { value: 'industrial', label: 'Industrial', labelKey: `${FTO}.industrial` },
  { value: 'mousamas', label: 'Mousamas', labelKey: `${FTO}.mousamas` },
]

const BFTO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.bedroomsFloorType.options'
export const BEDROOMS_FLOOR_TYPE_OPTIONS = [
  { value: 'Marble', label: 'Marble', labelKey: `${BFTO}.marble` },
  { value: 'Wood', label: 'Wood', labelKey: `${BFTO}.wood` },
  { value: 'Petra', label: 'Petra', labelKey: `${BFTO}.petra` },
  { value: 'Tile', label: 'Tile', labelKey: `${BFTO}.tile` },
  { value: 'Mosaic', label: 'Mosaic', labelKey: `${BFTO}.mosaic` },
  { value: 'Laminate', label: 'Laminate', labelKey: `${BFTO}.laminate` },
  { value: 'Marble - Wood', label: 'Marble - Wood', labelKey: `${BFTO}.marbleWood` },
  { value: 'Marble - Tile', label: 'Marble - Tile', labelKey: `${BFTO}.marbleTile` },
  { value: 'Stone - Wood', label: 'Stone - Wood', labelKey: `${BFTO}.stoneWood` },
  { value: 'Stone - Marble', label: 'Stone - Marble', labelKey: `${BFTO}.stoneMarble` },
  { value: 'Tile - Wood', label: 'Tile - Wood', labelKey: `${BFTO}.tileWood` },
  { value: 'Mosaic - Wood', label: 'Mosaic - Wood', labelKey: `${BFTO}.mosaicWood` },
  { value: 'Industrial flooring', label: 'Industrial flooring', labelKey: `${BFTO}.industrialFlooring` },
]

// Lowercase short compass-direction codes, per the PDF spec.
const ORO = 'wizard.steps.outdoorBuildingAmenities.sections.positionExposure.fields.cOrientation.options'
export const ORIENTATION_OPTIONS = [
  { value: 'e', label: 'East', labelKey: `${ORO}.e` },
  { value: 'ew', label: 'East-West', labelKey: `${ORO}.ew` },
  { value: 'em', label: 'East-Meridional', labelKey: `${ORO}.em` },
  { value: 'n', label: 'North', labelKey: `${ORO}.n` },
  { value: 'ne', label: 'Northeast', labelKey: `${ORO}.ne` },
  { value: 'w', label: 'West', labelKey: `${ORO}.w` },
  { value: 'nw', label: 'Northwest', labelKey: `${ORO}.nw` },
  { value: 'wm', label: 'West-Meridional', labelKey: `${ORO}.wm` },
  { value: 'm', label: 'Meridional', labelKey: `${ORO}.m` },
  { value: 's', label: 'South', labelKey: `${ORO}.s` },
  { value: 'se', label: 'Southeast', labelKey: `${ORO}.se` },
  { value: 'sw', label: 'Southwest', labelKey: `${ORO}.sw` },
]

// cGarage ("Parking Type") - distinct from the `garage` field's GARAGE_OPTIONS
// above (existence/size vs. interior/external location).
const PTO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.cGarage.options'
export const PARKING_TYPE_OPTIONS = [
  { value: 'Interior', label: 'Interior', labelKey: `${PTO}.interior` },
  { value: 'External', label: 'External', labelKey: `${PTO}.external` },
]

// -- Features step -----------------------------------------------------------

const SSO = 'wizard.steps.constructionSystems.sections.windowsDoorsFinishes.fields.cStorageSpace.options'
export const STORAGE_SPACE_OPTIONS = [
  { value: 'External', label: 'External', labelKey: `${SSO}.external` },
  { value: 'Interior', label: 'Interior', labelKey: `${SSO}.interior` },
  { value: 'No', label: 'No', labelKey: `${SSO}.no` },
  { value: 'Yes', label: 'Yes', labelKey: `${SSO}.yes` },
]

const SPO = 'wizard.steps.outdoorBuildingAmenities.sections.outdoorSpace.fields.swimmingPool.options'
export const SWIMMING_POOL_OPTIONS = [
  { value: 'No', label: 'No', labelKey: `${SPO}.no` },
  { value: 'External', label: 'External', labelKey: `${SPO}.external` },
  { value: 'Interior', label: 'Interior', labelKey: `${SPO}.interior` },
  { value: 'indoors', label: 'Indoors', labelKey: `${SPO}.indoors` },
]

const GRO = 'wizard.steps.outdoorBuildingAmenities.sections.building.fields.garage.options'
export const GARAGE_OPTIONS = [
  { value: 'Yes', label: 'Yes', labelKey: `${GRO}.yes` },
  { value: 'No', label: 'No', labelKey: `${GRO}.no` },
  { value: 'Double', label: 'Double', labelKey: `${GRO}.double` },
]

const AFO = 'wizard.steps.outdoorBuildingAmenities.sections.outdoorSpace.fields.accessFrom.options'
export const ACCESS_FROM_OPTIONS = [
  { value: 'Road', label: 'Road', labelKey: `${AFO}.road` },
  { value: 'Pedestrian', label: 'Pedestrian', labelKey: `${AFO}.pedestrian` },
  { value: 'Paved', label: 'Paved', labelKey: `${AFO}.paved` },
  { value: 'Dirt road', label: 'Dirt road', labelKey: `${AFO}.dirtRoad` },
  { value: 'Sea', label: 'Sea', labelKey: `${AFO}.sea` },
  { value: 'No access', label: 'No access', labelKey: `${AFO}.noAccess` },
  { value: 'Other', label: 'Other', labelKey: `${AFO}.other` },
]

// -- Land Details section (Business Group, 2026-07-12) ----------------------
// Not PDF-sourced (the field doesn't appear in the PDF at all). Values and
// order confirmed live via EspoCRM entityDefs this session:
// cSlope.options = ["", "plane", "inclining", "amphitheatric"] — the leading
// "" is EspoCRM's own blank/unselected placeholder, not a real choice, and
// is intentionally not included here (no other option list in this file
// includes its own blank placeholder either; the field's existing
// optionality/clearability already covers "no selection"). Labels are plain
// capitalizations of the raw values — the PDF gives no label to override,
// same precedent as hasElectricalDevices' humanization (CR-10).
const SLO = 'wizard.steps.locationZoning.sections.landDetails.fields.cSlope.options'
export const SLOPE_OPTIONS = [
  { value: 'plane', label: 'Plane', labelKey: `${SLO}.plane` },
  { value: 'inclining', label: 'Inclining', labelKey: `${SLO}.inclining` },
  { value: 'amphitheatric', label: 'Amphitheatric', labelKey: `${SLO}.amphitheatric` },
]

// -- Furnished dependency group (Business Group, 2026-07-12) ----------------
// `furnished` was previously modeled as a Boolean switch — confirmed this
// session (live PATCH test) to be wrong: EspoCRM rejects a raw boolean with
// a hard 400, failing the entire save. Live entityDefs confirms the real
// type is Enum with these 6 real options (blank placeholder excluded, same
// convention as SLOPE_OPTIONS above). The apparent near-duplicates
// ('half'/'halffurnished', 'full'/'fullyfurnished') are not a wizard-side
// mistake — both pairs are genuinely distinct live option values; neither
// is merged or dropped without a product decision.
const FUO = 'wizard.steps.constructionSystems.sections.condition.fields.furnished.options'
export const FURNISHED_OPTIONS = [
  { value: 'furnished', label: 'Furnished', labelKey: `${FUO}.furnished` },
  { value: 'no', label: 'No', labelKey: `${FUO}.no` },
  { value: 'halffurnished', label: 'Half Furnished', labelKey: `${FUO}.halfFurnished` },
  { value: 'fullyfurnished', label: 'Fully Furnished', labelKey: `${FUO}.fullyFurnished` },
  { value: 'half', label: 'Half', labelKey: `${FUO}.half` },
  { value: 'full', label: 'Full', labelKey: `${FUO}.full` },
]

// Live entityDefs, confirmed 2026-07-12: type multiEnum, exactly these 11
// options, no PDF citation (field absent from the PDF entirely).
const FEAO = 'wizard.steps.constructionSystems.sections.condition.fields.cFurnitureElectricalAppliances.options'
export const FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS = [
  { value: 'wardrobe', label: 'Wardrobe', labelKey: `${FEAO}.wardrobe` },
  { value: 'living room table', label: 'Living Room Table', labelKey: `${FEAO}.livingRoomTable` },
  { value: 'kitchen table', label: 'Kitchen Table', labelKey: `${FEAO}.kitchenTable` },
  { value: 'sofa', label: 'Sofa', labelKey: `${FEAO}.sofa` },
  { value: 'hall furniture', label: 'Hall Furniture', labelKey: `${FEAO}.hallFurniture` },
  { value: 'office', label: 'Office', labelKey: `${FEAO}.office` },
  { value: 'washing machine', label: 'Washing Machine', labelKey: `${FEAO}.washingMachine` },
  { value: 'dishwasher', label: 'Dishwasher', labelKey: `${FEAO}.dishwasher` },
  { value: 'built-in oven', label: 'Built-in Oven', labelKey: `${FEAO}.builtInOven` },
  { value: 'normal oven', label: 'Normal Oven', labelKey: `${FEAO}.normalOven` },
  { value: 'refrigerator', label: 'Refrigerator', labelKey: `${FEAO}.refrigerator` },
]

// -- Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances) ------------
// Live entityDefs, confirmed this session: `view` is type enum, 10 real
// options (blank placeholder excluded, same convention as SLOPE_OPTIONS/
// FURNISHED_OPTIONS above).
const VWO = 'wizard.steps.locationZoning.sections.proximityViews.fields.view.options'
export const VIEW_OPTIONS = [
  { value: 'sea', label: 'Sea', labelKey: `${VWO}.sea` },
  { value: 'mountain', label: 'Mountain', labelKey: `${VWO}.mountain` },
  { value: 'town', label: 'Town', labelKey: `${VWO}.town` },
  { value: 'park', label: 'Park', labelKey: `${VWO}.park` },
  { value: 'open', label: 'Open', labelKey: `${VWO}.open` },
  { value: 'field', label: 'Field', labelKey: `${VWO}.field` },
  { value: 'forest', label: 'Forest', labelKey: `${VWO}.forest` },
  { value: 'square', label: 'Square', labelKey: `${VWO}.square` },
  { value: 'yes', label: 'Yes', labelKey: `${VWO}.yes` },
  { value: 'no', label: 'No', labelKey: `${VWO}.no` },
]

// `cCondition`'s real type is `rate` (a 5-star widget, `numStars: 5`) — the
// form-engine has no native star-rating field type (Wave 5 Pre-Implementation
// Verification). Represented here as a plain 1-5 select, the same integer
// scale the real widget uses; 0/unset is the field's empty state, not a
// selectable option, matching a star widget with nothing clicked.
export const CONDITION_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
]
