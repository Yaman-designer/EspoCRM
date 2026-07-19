// Canonical Property Type registry — the single source of truth for `type`
// display metadata across the app. Replaces the 3 previously-conflicting local
// vocabularies (legacy fields.ts TYPE_OPTIONS, espo-metadata route's hardcoded
// list, and the old wizard's own inline enum). Decorates whatever raw values
// EspoCRM's Metadata API actually returns (via /api/espo-metadata) with a
// label/category/icon — never the other way around, so a type added in
// EspoCRM's Entity Manager never crashes the form, only shows unstyled.
//
// The legacy quick-create dialog (features/properties/fields.ts TYPE_OPTIONS)
// is intentionally left untouched — it belongs to the Edit flow, out of scope
// for this rebuild.

import {
  Building2, Home, Warehouse, Store, Trees, LandPlot,
  type LucideIcon,
} from 'lucide-react'

export type PropertyTypeCategory = 'residential' | 'commercial' | 'land'

export interface PropertyTypeDef {
  value: string
  label: string
  category: PropertyTypeCategory
  icon: LucideIcon
}

const GENERIC_FALLBACK_ICON = Building2

/**
 * Best-effort decoration for every raw `type` value observed across the app's
 * three prior local lists (legacy fields.ts, the old espo-metadata hardcoded
 * list, and the old wizard's enum). Any value EspoCRM returns that isn't in
 * this table still renders — just with a generic label/icon and a
 * 'residential' category default (the safest default: it does NOT hide
 * bedroom/bathroom/etc. fields, whereas defaulting unknowns to 'land' would).
 */
const PROPERTY_TYPE_META: Record<string, Omit<PropertyTypeDef, 'value'>> = {
  Apartment:  { label: 'Apartment',  category: 'residential', icon: Building2 },
  House:      { label: 'House',      category: 'residential', icon: Home },
  Detached:   { label: 'Detached',   category: 'residential', icon: Home },
  Villa:      { label: 'Villa',      category: 'residential', icon: Home },
  Maisonette: { label: 'Maisonette', category: 'residential', icon: Home },
  Townhouse:  { label: 'Townhouse',  category: 'residential', icon: Home },
  Studio:     { label: 'Studio',     category: 'residential', icon: Building2 },
  Office:     { label: 'Office',     category: 'commercial',  icon: Building2 },
  Store:      { label: 'Store',      category: 'commercial',  icon: Store },
  Warehouse:  { label: 'Warehouse',  category: 'commercial',  icon: Warehouse },
  Land:       { label: 'Land',       category: 'land',        icon: Trees },
  Plot:       { label: 'Plot',       category: 'land',        icon: LandPlot },

  // Lowercase entries below are the PDF master `type` catalogue's Land-category
  // values (the wizard's Category → Type dependency, see
  // TYPE_VALUES_BY_CATEGORY/getTypeOptionsForCategory below) — distinct keys
  // from the Title-Case ones above, which remain for the legacy edit dialog /
  // pre-existing records. Both vocabularies are recognized so LAND_TYPE_VALUES
  // (used by specifications.schema.ts to hide room fields) stays correct for
  // records created via either form.
  plot:         { label: 'Plot',       category: 'land', icon: LandPlot },
  parcel:       { label: 'Parcel',     category: 'land', icon: LandPlot },
  island:       { label: 'Island',     category: 'land', icon: LandPlot },
  'other land': { label: 'Other Land', category: 'land', icon: LandPlot },
}

/** Decorates a live EspoCRM `type` value with display metadata. */
export function resolvePropertyType(value: string): PropertyTypeDef {
  const meta = PROPERTY_TYPE_META[value]
  if (meta) return { value, ...meta }
  return { value, label: value, category: 'residential', icon: GENERIC_FALLBACK_ICON }
}

/** Decorates a full list of live EspoCRM `type` values (e.g. from /api/espo-metadata). */
export function resolvePropertyTypes(values: string[]): PropertyTypeDef[] {
  return values.map(resolvePropertyType)
}

/**
 * Single source of truth for "is this a land-type property" — used by Step 4's
 * conditional visibility rules (hide bedroom/bathroom/floor/etc. for land).
 * Never hardcode a second land-type value list anywhere else in the app.
 */
export function isLandType(value: string | undefined | null): boolean {
  if (!value) return false
  return resolvePropertyType(value).category === 'land'
}

/**
 * Static list of known land-category raw values, derived from the same
 * PROPERTY_TYPE_META table `isLandType` reads — for use inside a declarative
 * `ConditionNode` (e.g. `{ field: 'type', operator: 'not_in', value: LAND_TYPE_VALUES }`),
 * since visibleWhen conditions can't call an arbitrary function. Never author
 * a second, independent land-type list — extend PROPERTY_TYPE_META instead.
 */
export const LAND_TYPE_VALUES: string[] = Object.entries(PROPERTY_TYPE_META)
  .filter(([, meta]) => meta.category === 'land')
  .map(([value]) => value)

/**
 * Master `type` catalogue, grouped exactly as the source of truth defines —
 * do not add, remove, reorder, rename, or translate any value without a
 * confirmed source. The `Other` bucket previously included a bare `other`
 * value, claimed (2026-07-12) to be confirmed against Dynamic Logic
 * screenshots — that claim was itself wrong. Live EspoCRM
 * `logicDefs.RealEstateProperty.options.type` was re-fetched directly
 * 2026-07-14 (Requirements Certification Stage A, re-verified unchanged at
 * Wave 1) and returns exactly 7 values for `category == 'Other'`, with no
 * bare `other` among them. Removed.
 */
const TYPE_VALUES_BY_CATEGORY: Record<'Residential' | 'Commercial' | 'Land' | 'Other', string[]> = {
  Residential: [
    'apartment', 'studio', 'flatlet', 'maisonette', 'detached', 'villa',
    'loft', 'bungalow', 'building', 'apartment complex', 'farm', 'other categories',
  ],
  Commercial: [
    'office', 'store', 'warehouse', 'industrial space', 'craft space',
    'hotel', 'business building', 'hall', 'showroom', 'other commercial',
  ],
  Land: ['plot', 'parcel', 'island', 'other land'],
  Other: [
    'business', 'air', 'parking spot', 'wind farm', 'photovoltaics',
    'dissolvable', 'prefabricated',
  ],
}

function titleCaseTypeLabel(value: string): string {
  return value.replace(/\w\S*/g, word => word[0].toUpperCase() + word.slice(1))
}

/**
 * Category → Type conditional option loader (PDF business rule): returns the
 * exact, ordered option list for the given category, or `[]` when category is
 * empty/unrecognized — the Type dropdown must show no options until a
 * Category is selected (PDF Condition 5).
 */
export function getTypeOptionsForCategory(
  category: string | undefined | null,
): { value: string; label: string }[] {
  const values = TYPE_VALUES_BY_CATEGORY[category as keyof typeof TYPE_VALUES_BY_CATEGORY]
  if (!values) return []
  return values.map(value => ({ value, label: titleCaseTypeLabel(value) }))
}
