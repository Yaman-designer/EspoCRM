import { describe, it, expect } from 'vitest'
import { buildPropertyDetailPageViewModel } from './detail-page.viewmodel'
import { buildProperty } from '@/test/builders/property'
import i18n from '@/i18n/config'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3, 4, 6 (Media),
// 9/10 (this file directly protects the cBanner fix and the media
// fallback chain against regression — see the mutation-testing proof in
// property-form-coverage.test.ts's sibling report for a live demonstration
// that these exact assertions catch a reintroduced bug).
//
// Enterprise Localization pass (2026-07-24): buildPropertyDetailPageViewModel
// now takes a real `t` (breadcrumb fallback + section nav labels are
// translated — see that file's own note). Tests use the app's actual i18n
// instance, fixed to English, so assertions exercise the real translation
// keys end-to-end.
const t = i18n.getFixedT('en')
const build = (overrides: Parameters<typeof buildProperty>[0]) =>
  buildPropertyDetailPageViewModel(buildProperty(overrides), t)

describe('buildPropertyDetailPageViewModel — Hero media selection (Rule 6, full combination matrix)', () => {
  it('no media at all: empty gallery, no crash', () => {
    const vm = build({})
    expect(vm.heroGalleryIds).toEqual([])
  })

  it('Banner only (no mainImageId, no gallery): Banner is the sole Hero image', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: true, mainImageId: null, imagesIds: [],
    })
    expect(vm.heroGalleryIds).toEqual(['banner-1'])
  })

  it('Gallery only (no Banner): first gallery photo leads, gallery order preserved exactly', () => {
    const vm = build({
      cBannerphotoId: null, mainImageId: null, imagesIds: ['g1', 'g2', 'g3'],
    })
    expect(vm.heroGalleryIds).toEqual(['g1', 'g2', 'g3'])
  })

  it('Media Gallery Consistency pass (2026-07-24): imagesIds already containing mainImageId as one of its own entries (a real, confirmed EspoCRM data shape) never produces a duplicate — the exact bug that surfaced as a React key-collision warning once Hero started sharing MediaLightbox\'s keyed thumbnail strip with Asset Management', () => {
    const vm = build({
      cBannerphotoId: null, mainImageId: 'shared-id', imagesIds: ['shared-id'],
    })
    expect(vm.heroGalleryIds).toEqual(['shared-id'])
    expect(new Set(vm.heroGalleryIds).size).toBe(vm.heroGalleryIds.length)
  })

  it('same overlap, but WITH a distinct Banner: Banner leads, mainImageId appears exactly once even though it also duplicates a gallery entry', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: true, mainImageId: 'shared-id', imagesIds: ['shared-id', 'g2'],
    })
    expect(vm.heroGalleryIds).toEqual(['banner-1', 'shared-id', 'g2'])
    expect(new Set(vm.heroGalleryIds).size).toBe(vm.heroGalleryIds.length)
  })

  it('mainImageId overlaps a LATER gallery entry, not just the first: still deduped, gallery order otherwise preserved', () => {
    const vm = build({
      cBannerphotoId: null, mainImageId: 'g2', imagesIds: ['g1', 'g2', 'g3'],
    })
    // mainImageId ('g2') leads; the gallery's own 'g2' entry is filtered out
    // rather than kept as a second copy, but g1/g3 keep their real order.
    expect(vm.heroGalleryIds).toEqual(['g2', 'g1', 'g3'])
  })

  it('Banner + Gallery, Banner distinct from every gallery photo: Banner prepended, gallery order untouched', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: true, mainImageId: 'main-1', imagesIds: ['g1', 'g2'],
    })
    expect(vm.heroGalleryIds).toEqual(['banner-1', 'main-1', 'g1', 'g2'])
  })

  it('Duplicate media: Banner reuses mainImageId — Duplicate Asset Protection prevents it appearing twice', () => {
    const vm = build({
      cBannerphotoId: 'shared-id', cBanner: true, mainImageId: 'shared-id', imagesIds: ['g1'],
    })
    expect(vm.heroGalleryIds.filter(id => id === 'shared-id')).toHaveLength(1)
    expect(vm.heroGalleryIds).toEqual(['shared-id', 'g1'])
  })

  it('Duplicate media: Banner reuses a gallery photo further down the list — still only appears once, gallery unreordered', () => {
    const vm = build({
      cBannerphotoId: 'g2', cBanner: true, mainImageId: 'main-1', imagesIds: ['g1', 'g2', 'g3'],
    })
    expect(vm.heroGalleryIds.filter(id => id === 'g2')).toHaveLength(1)
    // g2 must NOT be pulled to the front — the gallery's own order is sacred.
    expect(vm.heroGalleryIds).toEqual(['main-1', 'g1', 'g2', 'g3'])
  })

  it('cBanner=false with a Banner Photo present: Banner is suppressed, falls through to mainImageId', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: false, mainImageId: 'main-1', imagesIds: ['g1'],
    })
    expect(vm.heroGalleryIds).not.toContain('banner-1')
    expect(vm.heroGalleryIds).toEqual(['main-1', 'g1'])
  })

  it('cBanner=false with a Banner Photo present and NO mainImageId: falls through to first gallery photo, not the suppressed Banner', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: false, mainImageId: null, imagesIds: ['g1', 'g2'],
    })
    expect(vm.heroGalleryIds).toEqual(['g1', 'g2'])
  })

  it('cBanner=true (explicit) with a Banner Photo: unchanged from the default — Banner leads', () => {
    const vm = build({
      cBannerphotoId: 'banner-1', cBanner: true, mainImageId: 'main-1', imagesIds: [],
    })
    expect(vm.heroGalleryIds[0]).toBe('banner-1')
  })

  it('cBanner unset (null/undefined, legacy record) with a Banner Photo present: Banner still leads — unset must NOT be treated as false', () => {
    const undefinedVm = build({
      cBannerphotoId: 'banner-1', cBanner: undefined, mainImageId: 'main-1', imagesIds: [],
    })
    expect(undefinedVm.heroGalleryIds[0]).toBe('banner-1')
  })

  it('Missing media: no Banner, no mainImageId, no gallery — resolves to an empty list, not a crash or a null-id entry', () => {
    const vm = build({
      cBannerphotoId: null, mainImageId: null, imagesIds: undefined,
    })
    expect(vm.heroGalleryIds).toEqual([])
  })
})

describe('buildPropertyDetailPageViewModel — display name / location / breadcrumb (Rule 3)', () => {
  it('breadcrumbLabel fallback chain: propertyCode -> displayName -> translated "Property Details" fallback', () => {
    expect(build({ propertyCode: 'REF-1', title: 'T' }).breadcrumbLabel).toBe('REF-1')
    expect(build({ propertyCode: undefined, title: 'Real Name' }).breadcrumbLabel).toBe('Real Name')
    expect(build({ propertyCode: undefined, title: undefined, name: '' }).breadcrumbLabel).toBe('Property Details')
  })
})

describe('buildPropertyDetailPageViewModel — section nav conditional (Rule 4)', () => {
  it('contactsIds empty: no Contacts nav item', () => {
    const vm = build({ contactsIds: [] })
    expect(vm.sectionNavItems.find(i => i.id === 'section-contacts')).toBeUndefined()
  })

  it('contactsIds undefined: no Contacts nav item, no crash on .length', () => {
    const vm = build({ contactsIds: undefined })
    expect(vm.sectionNavItems.find(i => i.id === 'section-contacts')).toBeUndefined()
  })

  it('contactsIds has entries: Contacts nav item present, positioned between Media and Timeline', () => {
    const vm = build({ contactsIds: ['c1'] })
    const ids = vm.sectionNavItems.map(i => i.id)
    expect(ids).toContain('section-contacts')
    expect(ids.indexOf('section-contacts')).toBeGreaterThan(ids.indexOf('section-media'))
    expect(ids.indexOf('section-contacts')).toBeLessThan(ids.indexOf('section-timeline'))
  })
})
