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

export const CATEGORY_OPTIONS = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Land', label: 'Land' },
  { value: 'Other', label: 'Other' },
]

export const REQUEST_TYPE_OPTIONS = [
  { value: 'Rent', label: 'Rent' },
  { value: 'Sale', label: 'Sale' },
]

export const ASSIGNMENT_OPTIONS = [
  { value: 'Simple', label: 'Simple' },
  { value: 'Exclusive', label: 'Exclusive' },
]

// -- Location step / legacy "Location" section -----------------------------

export const GEOCODE_TYPE_OPTIONS = [
  { value: 'Exact', label: 'Exact' },
  { value: 'Approximate', label: 'Approximate' },
]

export const BELT_OPTIONS = [
  { value: 'agricultural', label: 'Agricultural' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'recreational', label: 'Recreational' },
  { value: 'residential', label: 'Residential' },
  { value: 'unincorporated', label: 'Unincorporated' },
]

// -- Specifications step / legacy "Specifications" section -----------------

export const FLOOR_KEY_OPTIONS = [
  { value: '0', label: 'Basement' },
  { value: '0.1', label: 'Basement' },
  { value: '0.2', label: 'Semi-basement' },
  { value: '0.3', label: 'Ground floor' },
  { value: '0.4', label: 'Mezzanine' },
  { value: '1', label: '1st Floor' },
  { value: '1.1', label: '1st superlative' },
  { value: '2', label: '2nd Floor' },
  { value: '3', label: '3rd Floor' },
  { value: '4', label: '4th Floor' },
  { value: '5', label: '5th Floor' },
  { value: '6', label: '6th Floor' },
  { value: '7', label: '7th Floor' },
  { value: '8', label: '8th Floor' },
  { value: '9', label: '9th Floor' },
  { value: '10', label: '10th Floor' },
  { value: '11', label: '11th Floor' },
  { value: '12', label: '12th Floor' },
  { value: '13', label: '13th Floor' },
  { value: '14', label: '14th Floor' },
  { value: '15', label: '15th Floor' },
  { value: '16', label: '16th Floor' },
  { value: '17', label: '17th Floor' },
  { value: '18', label: '18th Floor' },
  { value: '19', label: '19th Floor' },
  { value: '20', label: '20th Floor' },
]

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
  { value: 'Not required', label: 'Not required' },
  { value: 'In progress', label: 'In progress' },
  { value: 'H', label: 'H' },
]

export const HEATING_MEDIUM_OPTIONS = [
  { value: 'petrol', label: 'petrol' },
  { value: 'natural_gas', label: 'natural_gas' },
  { value: 'gas', label: 'gas' },
  { value: 'current', label: 'current' },
  { value: 'stove', label: 'stove' },
  { value: 'thermal_accumulator', label: 'thermal_accumulator' },
  { value: 'pellet', label: 'pellet' },
  { value: 'infrared', label: 'infrared' },
  { value: 'fan_coil', label: 'fan_coil' },
  { value: 'wood', label: 'wood' },
  { value: 'teleheating', label: 'teleheating' },
  { value: 'geothermal_energy', label: 'geothermal_energy' },
  { value: 'thermopompos', label: 'thermopompos' },
  { value: 'heatpump', label: 'heatpump' },
]

// Labels are Greek per the PDF spec (field: cHeatingController, "Type of
// heating"). Spliced verbatim from the original specifications.schema.ts
// declaration - do not retype the Greek text by hand.
export const HEATING_CONTROLLER_OPTIONS = [
          { value: 'automic',        label: 'Ατομική θέρμανση' },
          { value: 'autonomus',      label: 'Αυτόνομη θέρμανση' },
          { value: 'central',        label: 'Κεντρική θέρμανση' },
          { value: 'withoutheating', label: 'Χωρίς θέρμανση' },
          { value: 'natural gas',    label: 'natural gas' },
]

export const FRAMES_OPTIONS = [
  { value: 'wooden', label: 'Wooden' },
  { value: 'aluminium', label: 'Aluminium' },
  { value: 'synthetic', label: 'Synthetic' },
]

// Values 'yes'/'no' are intentionally lowercase, unlike 'Security'/'Simple' —
// confirmed against live EspoCRM entityDefs 2026-07-14 (Wave 1 reconciliation
// fix). Labels stay Title Case for display; only the submitted value must
// match the live enum exactly.
export const DOOR_OPTIONS = [
  { value: 'Security', label: 'Security' },
  { value: 'Simple', label: 'Simple' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

export const FLOOR_TYPE_OPTIONS = [
  { value: 'marble', label: 'Marble' },
  { value: 'wood', label: 'Wood' },
  { value: 'stone', label: 'Stone' },
  { value: 'laminate', label: 'Laminate' },
  { value: 'ceramic tiles', label: 'Ceramic tiles' },
  { value: 'mosaic tiles', label: 'Mosaic tiles' },
  { value: 'wood and marble', label: 'Wood and marble' },
  { value: 'marble and tile', label: 'Marble and tile' },
  { value: 'wood and stone', label: 'Wood and stone' },
  { value: 'stone and marble', label: 'Stone and marble' },
  { value: 'wood and tile', label: 'Wood and tile' },
  { value: 'wood and mosaic', label: 'Wood and mosaic' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'mousamas', label: 'Mousamas' },
]

export const BEDROOMS_FLOOR_TYPE_OPTIONS = [
  { value: 'Marble', label: 'Marble' },
  { value: 'Wood', label: 'Wood' },
  { value: 'Petra', label: 'Petra' },
  { value: 'Tile', label: 'Tile' },
  { value: 'Mosaic', label: 'Mosaic' },
  { value: 'Laminate', label: 'Laminate' },
  { value: 'Marble - Wood', label: 'Marble - Wood' },
  { value: 'Marble - Tile', label: 'Marble - Tile' },
  { value: 'Stone - Wood', label: 'Stone - Wood' },
  { value: 'Stone - Marble', label: 'Stone - Marble' },
  { value: 'Tile - Wood', label: 'Tile - Wood' },
  { value: 'Mosaic - Wood', label: 'Mosaic - Wood' },
  { value: 'Industrial flooring', label: 'Industrial flooring' },
]

// Lowercase short compass-direction codes, per the PDF spec.
export const ORIENTATION_OPTIONS = [
  { value: 'e', label: 'East' },
  { value: 'ew', label: 'East-West' },
  { value: 'em', label: 'East-Meridional' },
  { value: 'n', label: 'North' },
  { value: 'ne', label: 'Northeast' },
  { value: 'w', label: 'West' },
  { value: 'nw', label: 'Northwest' },
  { value: 'wm', label: 'West-Meridional' },
  { value: 'm', label: 'Meridional' },
  { value: 's', label: 'South' },
  { value: 'se', label: 'Southeast' },
  { value: 'sw', label: 'Southwest' },
]

// cGarage ("Parking Type") - distinct from the `garage` field's GARAGE_OPTIONS
// above (existence/size vs. interior/external location).
export const PARKING_TYPE_OPTIONS = [
  { value: 'Interior', label: 'Interior' },
  { value: 'External', label: 'External' },
]

// -- Features step -----------------------------------------------------------

export const STORAGE_SPACE_OPTIONS = [
  { value: 'External', label: 'External' },
  { value: 'Interior', label: 'Interior' },
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
]

export const SWIMMING_POOL_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'External', label: 'External' },
  { value: 'Interior', label: 'Interior' },
  { value: 'indoors', label: 'Indoors' },
]

export const GARAGE_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
  { value: 'Double', label: 'Double' },
]

export const ACCESS_FROM_OPTIONS = [
  { value: 'Road', label: 'Road' },
  { value: 'Pedestrian', label: 'Pedestrian' },
  { value: 'Paved', label: 'Paved' },
  { value: 'Dirt road', label: 'Dirt road' },
  { value: 'Sea', label: 'Sea' },
  { value: 'No access', label: 'No access' },
  { value: 'Other', label: 'Other' },
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
export const SLOPE_OPTIONS = [
  { value: 'plane', label: 'Plane' },
  { value: 'inclining', label: 'Inclining' },
  { value: 'amphitheatric', label: 'Amphitheatric' },
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
export const FURNISHED_OPTIONS = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'no', label: 'No' },
  { value: 'halffurnished', label: 'Half Furnished' },
  { value: 'fullyfurnished', label: 'Fully Furnished' },
  { value: 'half', label: 'Half' },
  { value: 'full', label: 'Full' },
]

// Live entityDefs, confirmed 2026-07-12: type multiEnum, exactly these 11
// options, no PDF citation (field absent from the PDF entirely).
export const FURNITURE_ELECTRICAL_APPLIANCES_OPTIONS = [
  { value: 'wardrobe', label: 'Wardrobe' },
  { value: 'living room table', label: 'Living Room Table' },
  { value: 'kitchen table', label: 'Kitchen Table' },
  { value: 'sofa', label: 'Sofa' },
  { value: 'hall furniture', label: 'Hall Furniture' },
  { value: 'office', label: 'Office' },
  { value: 'washing machine', label: 'Washing Machine' },
  { value: 'dishwasher', label: 'Dishwasher' },
  { value: 'built-in oven', label: 'Built-in Oven' },
  { value: 'normal oven', label: 'Normal Oven' },
  { value: 'refrigerator', label: 'Refrigerator' },
]

// -- Wave 5 (2026-07-15, Rooms, Measurements, Views & Distances) ------------
// Live entityDefs, confirmed this session: `view` is type enum, 10 real
// options (blank placeholder excluded, same convention as SLOPE_OPTIONS/
// FURNISHED_OPTIONS above).
export const VIEW_OPTIONS = [
  { value: 'sea', label: 'Sea' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'town', label: 'Town' },
  { value: 'park', label: 'Park' },
  { value: 'open', label: 'Open' },
  { value: 'field', label: 'Field' },
  { value: 'forest', label: 'Forest' },
  { value: 'square', label: 'Square' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
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
