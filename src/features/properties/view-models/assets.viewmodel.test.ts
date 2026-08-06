import { describe, it, expect } from 'vitest'
import { buildAssetsViewModel } from './assets.viewmodel'
import { buildProperty } from '@/test/builders/property'
import i18n from '@/i18n/config'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3, 4, 6 (Media).
//
// Media Gallery Consistency pass (2026-07-24) update: `photoIds` is now a
// required second parameter, passed through verbatim rather than computed
// internally (see assets.viewmodel.ts's own doc comment — main-image-first
// gallery ordering now lives in one place, `buildHeroGalleryIds`, which has
// its own coverage in detail-page.viewmodel.test.ts). The "media
// combination matrix" cases below were rewritten from "does this function
// compute the right order" to "does this function pass the order through
// unchanged" — that's the real contract now.
//
// Enterprise Localization pass (2026-07-24): buildAssetsViewModel now takes
// a real `t` (tab labels are translated). Tests use the app's actual i18n
// instance, fixed to English.
const fixedT = i18n.getFixedT('en')
const build = (property: Parameters<typeof buildProperty>[0], photoIds: string[]) =>
  buildAssetsViewModel(buildProperty(property), photoIds, fixedT)

describe('buildAssetsViewModel — null/edge cases (Rule 3)', () => {
  it('no media at all: empty photo list, empty legal ids, zero-count tabs, no crash', () => {
    const vm = build({}, [])
    expect(vm.photoIds).toEqual([])
    expect(vm.legalImageIds).toEqual([])
    expect(vm.legalTotalCount).toBe(0)
    expect(vm.documentAssignment).toBeNull()
    expect(vm.tabs).toEqual([
      { id: 'photos', label: 'Photos', count: 0 },
      { id: 'legal', label: 'Legal', count: 0 },
    ])
  })

  it('documents array present but empty: same as absent, no crash on .filter/.map of an empty array', () => {
    const vm = build({ documents: [] }, [])
    expect(vm.legalTotalCount).toBe(0)
    expect(vm.legalImageIds).toEqual([])
    expect(vm.documents).toEqual([])
  })

  it('cDocumentassignmentId set but cDocumentassignmentName missing: documentAssignment still produced, name is undefined not a crash', () => {
    const vm = build({
      cDocumentassignmentId: 'att-1', cDocumentassignmentName: undefined,
    }, [])
    expect(vm.legalTotalCount).toBe(1)
    expect(vm.documentAssignment).toEqual({ id: 'att-1', name: undefined })
    // Name is missing, so isImageAttachment(undefined) must not treat it as an image.
    expect(vm.legalImageIds).toEqual([])
  })

  it('refCode: passes through propertyCode as-is, including when absent', () => {
    expect(build({ propertyCode: 'REF-1' }, []).refCode).toBe('REF-1')
    expect(build({ propertyCode: undefined }, []).refCode).toBeUndefined()
  })
})

describe('buildAssetsViewModel — photoIds passthrough (Rule 6)', () => {
  it('empty array in: empty array out', () => {
    expect(build({}, []).photoIds).toEqual([])
  })

  it('a real gallery order in: the exact same order out, unchanged (ordering is the caller\'s responsibility now, not this function\'s)', () => {
    const vm = build({}, ['main-1', 'g1', 'g2'])
    expect(vm.photoIds).toEqual(['main-1', 'g1', 'g2'])
  })

  it('tab counts reflect the passed-through photoIds.length and legalTotalCount exactly, independently', () => {
    const vm = build({
      documents: [{ id: 'd1', name: 'x.pdf', fileId: 'f1', fileName: 'x.pdf' }],
    }, ['m1', 'g1', 'g2'])
    expect(vm.tabs.find(tab => tab.id === 'photos')!.count).toBe(3)
    expect(vm.tabs.find(tab => tab.id === 'legal')!.count).toBe(1)
  })

  it('Legal: cDocumentassignment (image) + documents (mixed image/non-image) — image assignment listed first, non-images excluded from legalImageIds but counted in legalTotalCount', () => {
    const vm = build({
      cDocumentassignmentId: 'assign-1', cDocumentassignmentName: 'cover.jpg',
      documents: [
        { id: 'd1', name: 'Contract', fileId: 'f1', fileName: 'contract.pdf' },
        { id: 'd2', name: 'Floor Photo', fileId: 'f2', fileName: 'floor.png' },
      ],
    }, [])
    expect(vm.legalImageIds).toEqual(['assign-1', 'f2'])
    expect(vm.legalTotalCount).toBe(3) // 2 documents + 1 assignment
  })

  it('Legal: documents only, no assignment: legalImageIds excludes the assignment slot entirely', () => {
    const vm = build({
      cDocumentassignmentId: null,
      documents: [{ id: 'd1', name: 'photo.jpg', fileId: 'f1', fileName: 'photo.jpg' }],
    }, [])
    expect(vm.legalImageIds).toEqual(['f1'])
    expect(vm.legalTotalCount).toBe(1)
  })

  it('legalImageIndexById is a correct O(1) index matching legalImageIds\' own array order', () => {
    const vm = build({
      documents: [
        { id: 'd1', name: 'a.jpg', fileId: 'f1', fileName: 'a.jpg' },
        { id: 'd2', name: 'b.jpg', fileId: 'f2', fileName: 'b.jpg' },
      ],
    }, [])
    expect(vm.legalImageIndexById).toEqual({ f1: 0, f2: 1 })
  })

  it('documents passes through verbatim for the component\'s own rendering (Legal tab no longer receives a pre-filtered image list)', () => {
    const docs = [{ id: 'd1', name: 'Contract', fileId: 'f1', fileName: 'contract.pdf' }]
    const vm = build({ documents: docs }, [])
    expect(vm.documents).toEqual(docs)
  })
})
