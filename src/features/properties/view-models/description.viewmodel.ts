import type { RealEstateProperty } from '../types/property.types'

export interface DescriptionViewModel {
  description?: string
  descriptionGr?: string
  isEmpty: boolean
}

/**
 * ListingDescriptionCard has almost no business logic of its own — its
 * real complexity (ResizeObserver-driven clamp/expand measurement) is
 * legitimate UI mechanics, not a data-shaping concern, so it stays in the
 * component. This ViewModel exists so the component's public API is
 * consistent with every other section (takes a ViewModel, not
 * `RealEstateProperty`) even though the shaping work here is minimal.
 */
export function buildDescriptionViewModel(
  property: Pick<RealEstateProperty, 'description' | 'cDescriptionGr'>,
): DescriptionViewModel {
  const { description, cDescriptionGr } = property
  return {
    description: description ?? undefined,
    descriptionGr: cDescriptionGr ?? undefined,
    isEmpty: !description && !cDescriptionGr,
  }
}
