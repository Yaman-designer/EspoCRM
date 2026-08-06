import type { RealEstateProperty, PropertyStatus } from '../types/property.types'
import { getHeroStatusFillClass } from '../lib/mappers/status-presentation'

export interface HeroViewModel {
  imageIds: string[]
  title?: string
  location?: string
  status?: PropertyStatus
  statusFillClass: string
  type?: string
  propertyCode?: string
  requestType?: string
  isPremium?: boolean
  isFeatured?: boolean
  isVerified?: boolean
  isNewListing?: boolean
}

/**
 * Shapes PropertyIntelligenceHeroSection's identity strip. `imageIds`,
 * `title`, and `location` are passed in already-computed (from
 * `buildPropertyDetailPageViewModel` / `getDisplayName` / `getDisplayLocation`)
 * rather than recomputed here, so display-name/location logic keeps exactly
 * one source of truth. `statusFillClass` moves the status→color mapping out
 * of the component and into the shared `status-presentation` mapper — the
 * same one Command Hub's status dot uses, though (verified, not assumed)
 * the two intentionally use different bucket boundaries; see that file's
 * own note.
 */
export function buildHeroViewModel(
  property: Pick<RealEstateProperty,
    | 'status' | 'type' | 'propertyCode' | 'requestType'
    | 'isPremium' | 'isFeatured' | 'isVerified' | 'isNewListing'
  >,
  imageIds: string[],
  title: string,
  location: string,
): HeroViewModel {
  return {
    imageIds,
    title,
    location,
    status: property.status,
    statusFillClass: getHeroStatusFillClass(property.status),
    type: property.type,
    propertyCode: property.propertyCode,
    requestType: property.requestType,
    isPremium: property.isPremium,
    isFeatured: property.isFeatured,
    isVerified: property.isVerified,
    isNewListing: property.isNewListing,
  }
}
