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
  parkingCount?:  number              // Parking spaces
  floor?:         number              // Floor number
  yearBuilt?:     number              // Year of construction
  furnished?:     boolean | null      // Is furnished
  purpose?:       string              // 'Sale' | 'Rent' | etc.

  addressCity?: string                // City
  locationName?: string               // District / area name
  subRegionLocationName?: string      // Sub-region
  regionLocationName?: string         // Region / wider area (e.g. "Athens Western Suburbs")

  mainImageId?: string | null         // Primary image ID — served via /api/espo-image?id={id}
  imagesIds?: string[]                // Gallery image IDs — same endpoint

  assignedUserId?: string
  assignedUserName?: string
  createdById?:   string              // EspoCRM standard — creator user ID
  createdByName?: string              // EspoCRM standard — creator user display name
  leadSource?:    string              // Lead / listing source
  description?: string | null
  createdAt?: string
  modifiedAt?: string

  // Listing quality indicators — rendered as subtle chips on the card when true
  isFeatured?:   boolean
  isVerified?:   boolean
  isPremium?:    boolean
  isNewListing?: boolean

  // Lifestyle quality fields — presented as aspirational highlights in the detail view
  energyClass?:    string   // 'A+' | 'A' | 'B' | 'C' etc.
  cHeatingMedium?: string   // 'Heat Pump' | 'Gas' | 'Electric' etc.
  cOrientation?:   string   // 'SW' | 'SE' | 'S' | 'N' etc.
  door?:           string   // 'Security' | 'Oak' | 'Steel' etc.
  frames?:         string   // 'PVC' | 'Aluminium' | 'Wood' etc.
  cStorageSpace?:  string   // 'Yes' | 'No' | descriptive
  swimmingPool?:   string   // 'Yes' | 'No' | 'Heated' etc.
  accessFrom?:     string   // 'Road' | 'Private Road' | etc.

  // Structural & amenity fields — mapped into feature groups in PropertyFeatureMapper
  buildingElevator?: string   // 'Yes' | 'No' | descriptive
  doubleGlass?:      string   // 'Yes' | 'No'
  balcony?:          string   // 'Yes' | 'No' | descriptive (e.g. 'Large', 'Terrace')
  garage?:           string   // 'Yes' | 'No' | descriptive (e.g. 'Double')

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
