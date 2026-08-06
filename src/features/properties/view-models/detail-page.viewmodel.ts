import type { TFunction } from 'i18next'
import type { RealEstateProperty } from '../types/property.types'
import { getDisplayName, getDisplayLocation } from '../lib/display'

// Enterprise architecture pass (2026-07-23). Was imported from
// PropertySectionNav.tsx (a presentation component) — a data-layer file
// depending on the presentation layer, the reverse of intended dependency
// flow. Now owned here, where the data it describes is actually produced;
// the component imports it from this file instead.
export interface SectionNavItem {
  id:    string
  label: string
}

export interface PropertyDetailPageViewModel {
  displayName: string
  displayLocation: string
  breadcrumbLabel: string
  heroGalleryIds: string[]
  sectionNavItems: SectionNavItem[]
}

// Hero image source — Information Architecture pass (2026-07-21). The
// dedicated Banner field (cBannerphotoId) is the property's single visual
// identity, used here instead of being shown a second time later as its own
// card in Asset Management. Fallback hierarchy, in order: Banner → main
// property photo → first gallery photo → the Hero's own existing empty-state
// graphic (FALLBACK_IMAGE, inside PropertyIntelligenceHeroSection).
//
// Gallery Ordering (2026-07-21 follow-up): the gallery's own sequence — main
// photo first, then imagesIds exactly as stored — must never be reordered; a
// reader browsing via the Hero's carousel sees photos in the same order Asset
// Management's own Photos tab shows them. So this does NOT hand the Banner to
// the component's `mainImageId` prop (that prop's own contract is "move this
// id to the front, filtering it out of wherever it already was" — exactly the
// reordering this pass forbids). Instead the final, already-correctly-ordered
// array is built once here and handed down as a flat `imageIds` list.
//
// Duplicate Asset Protection: the Banner only gets prepended as a distinct
// lead frame when it isn't already part of the gallery order — a property
// with no Banner (heroImageId falls back to mainImageId, already
// galleryOrder[0]) or whose Banner happens to reuse an existing gallery
// photo's id never shows that asset twice, and the rest of the gallery is
// never reordered or filtered to make room for it.
//
// Data Integrity Audit (2026-07-23): `cBanner` — the Wizard's own "show
// banner" toggle — was never consulted here; `cBannerphotoId` was read
// unconditionally, so a property with a Banner Photo uploaded but cBanner
// explicitly set to false still displayed it as the Hero image, silently
// ignoring a real, business-meaningful flag. Confirmed with the product
// owner: the Details page's Hero should respect it. Only an *explicit*
// `false` suppresses the Banner — `null`/`undefined` (legacy records
// predating this field, or records where it was simply never touched)
// falls through to the existing behavior unchanged, since the Wizard's own
// on-create default is `true` and no record should be reinterpreted as
// opted-out just because this field happens to be unset.
//
// Media Gallery Consistency pass (2026-07-24): found live, not assumed —
// EspoCRM's own `imagesIds` array can (and, checked against a real record,
// does) already include `mainImageId` as one of its own entries, not just
// as the separate `mainImageId` field. `galleryOrder` used to be
// `[mainImageId, ...imagesIds]` with no filter, so on that real data shape
// it silently produced the *same id twice* — invisible as long as nothing
// rendered this array through a keyed list, which changed the moment Hero
// started sharing `MediaLightbox` with Asset Management (its thumbnail
// strip renders `ids.map((id) => ... key={id})`, the first real consumer
// of this array to need every id to be genuinely unique). Filtering
// `imagesIds` against `mainImageId` here — the same guard the now-retired
// `buildDedupedImageList` used to apply — fixes it at the one place this
// array is actually built, rather than papering over it with a `key={id}-${i}`
// band-aid at the render site.
export function buildHeroGalleryIds(
  property: Pick<RealEstateProperty, 'mainImageId' | 'imagesIds' | 'cBannerphotoId' | 'cBanner'>,
): string[] {
  const galleryOrder = property.mainImageId
    ? [property.mainImageId, ...(property.imagesIds ?? []).filter(id => id !== property.mainImageId)]
    : (property.imagesIds ?? [])
  const bannerImageId = property.cBanner === false ? null : property.cBannerphotoId
  const heroImageId = bannerImageId ?? property.mainImageId ?? property.imagesIds?.[0] ?? null
  return heroImageId && !galleryOrder.includes(heroImageId)
    ? [heroImageId, ...galleryOrder]
    : galleryOrder
}

// Interaction Design Sprint 4 (2026-07-18) — in-page navigation targets.
// Every id below already anchors a zone wrapper in PropertyDetailView;
// Contacts is the only zone whose card can fully self-hide, so it's the only
// one conditionally included here.
//
// Enterprise Localization pass (2026-07-24): labels resolved via `t` (passed
// in by the caller, same pattern as buildTimelineViewModel — see that
// file's own note) instead of hardcoded English — PropertySectionNav.tsx
// renders `item.label` verbatim with no i18n awareness of its own.
function buildSectionNavItems(property: Pick<RealEstateProperty, 'contactsIds'>, t: TFunction): SectionNavItem[] {
  const hasContacts = (property.contactsIds?.length ?? 0) > 0
  return [
    { id: 'section-overview',  label: t('properties:nav.overview') },
    { id: 'section-financial', label: t('properties:nav.financial') },
    { id: 'section-location',  label: t('properties:nav.location') },
    { id: 'section-specs',     label: t('properties:nav.specifications') },
    { id: 'section-media',     label: t('properties:nav.media') },
    ...(hasContacts ? [{ id: 'section-contacts', label: t('properties:nav.contacts') }] : []),
    { id: 'section-timeline',  label: t('properties:nav.timeline') },
  ]
}

// Data Integrity Audit (2026-07-23): this ViewModel used to also compute
// `slug` for the current property — dead from the start, since
// PropertyDetailView.tsx never destructured it (confirmed via the
// ViewModel-orphan regression test in property-form-coverage.test.ts). The
// component already imports and calls `buildEntitySlug` directly wherever
// it actually needs one — navigating to a *different* property (line ~68)
// — so removing the unused duplicate here doesn't touch that real usage.

/** Everything PropertyDetailView's page chrome (breadcrumb, nav, hero gallery) needs, shaped once. */
export function buildPropertyDetailPageViewModel(property: RealEstateProperty, t: TFunction): PropertyDetailPageViewModel {
  const displayName = getDisplayName(property)
  return {
    displayName,
    displayLocation: getDisplayLocation(property),
    // Enterprise 100% Data Certification (2026-07-23): was `?? 'Property
    // Details'` — nullish coalescing doesn't catch an empty string, so a
    // record with no propertyCode/title and an empty `name` (getDisplayName
    // falls through to `property.name`, which is `string`, not `string |
    // undefined` — theoretically empty, not nullable) rendered a blank
    // breadcrumb instead of the intended fallback. Caught by this file's own
    // edge-case regression test, not observed in production — `name` is an
    // EspoCRM-auto-populated field that in practice is never truly blank,
    // but the fallback should hold regardless of how unlikely the input is.
    breadcrumbLabel: property.propertyCode || displayName || t('properties:detail.breadcrumbFallback'),
    heroGalleryIds: buildHeroGalleryIds(property),
    sectionNavItems: buildSectionNavItems(property, t),
  }
}
