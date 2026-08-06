import type { TFunction } from 'i18next'
import type { RealEstateProperty } from '../types/property.types'
import { isImageAttachment } from '@/shared/detail-view'

export type AssetTab = 'photos' | 'legal'

export interface DocumentAssignmentRef {
  id: string
  name?: string
}

// Named alias so LegalTab.tsx (a presentational component) never has to
// import `RealEstateProperty` itself just to describe its `documents` prop.
export type PropertyDocument = NonNullable<RealEstateProperty['documents']>[number]

export interface AssetsViewModel {
  photoIds: string[]
  documents: PropertyDocument[]
  documentAssignment: DocumentAssignmentRef | null
  legalImageIds: string[]
  /** O(1) lookup replacing a `.findIndex()` call that used to run inside LegalTab's render loop. */
  legalImageIndexById: Record<string, number>
  legalTotalCount: number
  tabs: Array<{ id: AssetTab; label: string; count: number }>
  /** Lightbox header chrome only — never used for anything else. */
  refCode?: string
}

/**
 * Shapes everything AssetManagementSystem needs. Main-image-first gallery
 * ordering, the legal-attachment image merge (cDocumentassignment +
 * documents, filtered to image extensions), and the tab counts used to be
 * computed inline in the component — the Legal count was even computed
 * twice. Enterprise architecture pass (2026-07-23): also now carries
 * `documents`/`documentAssignment`/`refCode` so the component never needs
 * `RealEstateProperty` directly (container-builds-ViewModel pattern,
 * consistent with Financial/Timeline/Operations).
 *
 * Media Gallery Consistency pass (2026-07-24). `photoIds` is now a required
 * parameter — the exact same, already-computed `heroGalleryIds` array
 * PropertyDetailView already builds once (via `buildHeroGalleryIds`) and
 * hands to the Hero section — instead of this function separately
 * re-deriving its own main-image-first, Banner-excluding list via
 * `buildDedupedImageList`. Two independently-computed "the gallery" arrays
 * (one with the Banner folded in, one without) is exactly the two-source-
 * of-truth problem the Hero/Gallery/Lightbox unification exists to remove;
 * this ViewModel no longer computes photo ordering at all, only receives it.
 */
export function buildAssetsViewModel(property: RealEstateProperty, photoIds: string[], t: TFunction): AssetsViewModel {
  const { documents = [] } = property

  // Legal Attachments pass (2026-07-21). Real attachments already carried by
  // `documents`/`cDocumentassignment*` (no new fetch) whose stored filename
  // ends in an image extension — the assignment field first (it renders
  // first in the Legal tab), then the hasMany documents in their existing order.
  const legalImages: Array<{ id: string; name: string }> = [
    ...(property.cDocumentassignmentId && isImageAttachment(property.cDocumentassignmentName)
      ? [{ id: property.cDocumentassignmentId, name: property.cDocumentassignmentName ?? 'Document' }]
      : []),
    ...documents
      .filter(doc => isImageAttachment(doc.fileName ?? doc.name))
      .map(doc => ({ id: doc.fileId, name: doc.name })),
  ]
  const legalImageIndexById = Object.fromEntries(legalImages.map((img, i) => [img.id, i]))

  const legalTotalCount = documents.length + (property.cDocumentassignmentId ? 1 : 0)

  return {
    photoIds,
    documents,
    documentAssignment: property.cDocumentassignmentId
      ? { id: property.cDocumentassignmentId, name: property.cDocumentassignmentName }
      : null,
    legalImageIds: legalImages.map(img => img.id),
    legalImageIndexById,
    legalTotalCount,
    tabs: [
      { id: 'photos', label: t('properties:assets.tabs.photos'), count: photoIds.length },
      { id: 'legal',  label: t('properties:assets.tabs.legal'),  count: legalTotalCount },
    ],
    refCode: property.propertyCode,
  }
}
