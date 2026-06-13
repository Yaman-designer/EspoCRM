// RealEstateProperty — field names verified against the live EspoCRM entity.
// Do not rename fields here without confirming against the API response first.

export type SortOption  = 'newest' | 'oldest' | 'price-high' | 'price-low'
export type ViewMode    = 'grid' | 'list'
export type PriceRange  = 'all' | 'under500k' | '500k-1m' | '1m-2m' | 'over2m'
export type AreaRange   = 'all' | 'under100'  | '100-500' | 'over500'
export type SavedView   = 'all' | 'mine' | 'favorites' | 'recent' | 'pending' | 'sold'

/** Known EspoCRM status values. `string &amp; {}` keeps the union open so unexpected
 *  API responses don't crash the type system while still enabling autocomplete. */
export type PropertyStatus =
  | 'Available'
  | 'Reserved'
  | 'Pending'
  | 'Under Approval'
  | 'Rented'
  | 'Sold'
  | 'Draft'
  | (string & {})

export type PropertyType =
  | 'House'
  | 'Villa'
  | 'Apartment'
  | 'Townhouse'
  | 'Office'
  | 'Land'
  | (string & {})

export interface RealEstateProperty {
  id: string
  name: string                        // EspoCRM internal name (often auto-generated)
  title?: string                      // Marketing / display title — primary display field
  propertyCode?: string               // Short reference code e.g. "REF-001"

  status: PropertyStatus
  type?: PropertyType

  price?: number

  square?: number                     // Area in m²
  bedroomCount?: number
  bathroomCount?: number

  addressCity?: string                // City
  locationName?: string               // District / area name
  subRegionLocationName?: string      // Sub-region

  mainImageId?: string | null         // Primary image ID — served via /api/espo-image?id={id}
  imagesIds?: string[]                // Gallery image IDs — same endpoint

  assignedUserId?: string
  assignedUserName?: string
  description?: string | null
  createdAt?: string
  modifiedAt?: string

  // Listing quality indicators — rendered as subtle chips on the card when true
  isFeatured?:   boolean
  isVerified?:   boolean
  isPremium?:    boolean
  isNewListing?: boolean

  // EspoCRM follow state — true when the current user has favorited this property
  isFollowed?: boolean
}

export interface PropertyFilters {
  search:     string
  status:     string
  type:       string
  sortBy:     SortOption
  priceRange: PriceRange
  areaRange:  AreaRange
}

export type Property = RealEstateProperty
