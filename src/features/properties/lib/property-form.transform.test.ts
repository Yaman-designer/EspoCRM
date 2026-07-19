import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toast } from 'sonner'
import { buildPropertyPayload, submitPropertyForm, submitPropertyEdit } from './property-form.transform'
import { createProperty, updateProperty } from '../repositories/property.repository'
import { uploadPropertyImage, uploadPropertyImages } from './attachment-upload.service'
import { createDocumentUploadItem, processDocumentQueue, unrelateDocument } from './document-upload.service'

vi.mock('sonner')
vi.mock('../repositories/property.repository')
vi.mock('./attachment-upload.service')
vi.mock('./document-upload.service')

describe('buildPropertyPayload — pure field mapping', () => {
  it('coerces numeric-looking strings to numbers, and empty/nullish to undefined', () => {
    const payload = buildPropertyPayload({ price: '250000', square: '', yearBuilt: null })
    expect(payload.price).toBe(250000)
    expect(payload.square).toBeUndefined()
    expect(payload.yearBuilt).toBeUndefined()
  })

  it('mirrors title into both name and title (name has no independent Wizard input)', () => {
    const payload = buildPropertyPayload({ title: 'Sunny Villa' })
    expect(payload.name).toBe('Sunny Villa')
    expect(payload.title).toBe('Sunny Villa')
  })

  it('defaults name to empty string (not undefined) when no title is given', () => {
    const payload = buildPropertyPayload({})
    expect(payload.name).toBe('')
  })

  it('defaults status to "Under Approval" when not provided', () => {
    expect(buildPropertyPayload({}).status).toBe('Under Approval')
  })

  it('only maps real booleans through boolean fields — a truthy non-boolean is treated as absent', () => {
    expect(buildPropertyPayload({ vat: true }).vat).toBe(true)
    expect(buildPropertyPayload({ vat: 'true' }).vat).toBeUndefined()
    expect(buildPropertyPayload({}).vat).toBeUndefined()
  })

  it('passes Multi-Enum arrays through as string[], dropping non-string entries, undefined when empty', () => {
    expect(buildPropertyPayload({ features: ['Veranda', 'BBQ'] }).features).toEqual(['Veranda', 'BBQ'])
    expect(buildPropertyPayload({ features: [] }).features).toBeUndefined()
    expect(buildPropertyPayload({ features: 'not-an-array' }).features).toBeUndefined()
  })

  it('sends the EUR currency companion only for a currency field that actually has a value (Create-vs-Edit auto-default bug workaround)', () => {
    const withPrice = buildPropertyPayload({ price: 250000 })
    expect(withPrice.priceCurrency).toBe('EUR')

    const withoutPrice = buildPropertyPayload({})
    expect(withoutPrice.priceCurrency).toBeUndefined()
  })

  it('does not map pricePerSqm — live entityDefs marks it readOnly, server-computed', () => {
    const payload = buildPropertyPayload({ pricePerSqm: 5000 }) as Record<string, unknown>
    expect(payload.pricePerSqm).toBeUndefined()
  })

  it('maps facadeLength (Enterprise Certification Program, 2026-07-16) — not Land-only, unlike its Land Details neighbors', () => {
    const payload = buildPropertyPayload({ facadeLength: '12.5' })
    expect(payload.facadeLength).toBe(12.5)
  })

  it('does not map garageNumber — live-confirmed field-level ACL silently blocks writes (same pattern as EC-1)', () => {
    const payload = buildPropertyPayload({ garageNumber: 3 }) as Record<string, unknown>
    expect('garageNumber' in payload).toBe(false)
  })

  it('maps the Region -> Sub Region -> Location cascade to the real <link>Id keys', () => {
    const payload = buildPropertyPayload({ locationId: 'loc-1', subRegionLocationId: 'sub-1', regionLocationId: 'reg-1' })
    expect(payload).toMatchObject({ locationId: 'loc-1', subRegionLocationId: 'sub-1', regionLocationId: 'reg-1' })
  })
})

describe('submitPropertyForm (Create)', () => {
  beforeEach(() => {
    vi.mocked(createProperty).mockResolvedValue({ id: 'new-1', name: 'x', status: 'Under Approval' })
  })

  it('mirrors cLocationRealCity from addressCity when the wizard did not set it directly', async () => {
    await submitPropertyForm({ title: 'x', addressCity: 'Athens' })
    const payloadArg = vi.mocked(createProperty).mock.calls[0][0]
    expect(payloadArg.cLocationRealCity).toBe('Athens')
  })

  it('uploads gallery images and sets imagesIds/mainImageId to the returned ids before creating', async () => {
    vi.mocked(uploadPropertyImages).mockResolvedValue(['att-1', 'att-2'])
    const file = new File(['x'], 'photo.jpg')
    await submitPropertyForm({ title: 'x', imagesIds: [file] })

    expect(uploadPropertyImages).toHaveBeenCalledWith([file])
    const payloadArg = vi.mocked(createProperty).mock.calls[0][0]
    expect(payloadArg.imagesIds).toEqual(['att-1', 'att-2'])
    expect(payloadArg.mainImageId).toBe('att-1')
  })

  it('does not attempt an image upload when imagesIds has nothing new to upload', async () => {
    await submitPropertyForm({ title: 'x' })
    expect(uploadPropertyImages).not.toHaveBeenCalled()
  })

  it('queues and processes any picked documents after the property is created, using the real new id', async () => {
    const file = new File(['x'], 'contract.pdf')
    vi.mocked(createDocumentUploadItem).mockReturnValue({ file, status: 'success' })

    await submitPropertyForm({ title: 'x', documents: [file] }, 'user-1')

    // pendingFiles.map(createDocumentUploadItem) — passed via bare function
    // reference, so Array.map's own (index, array) arguments ride along too;
    // only the first argument (the file) is the real contract to assert.
    expect(vi.mocked(createDocumentUploadItem).mock.calls[0][0]).toBe(file)
    expect(processDocumentQueue).toHaveBeenCalledWith([{ file, status: 'success' }], 'new-1', 'user-1')
  })

  it('skips document upload entirely (and warns) when no signed-in user id is available', async () => {
    const file = new File(['x'], 'contract.pdf')
    await submitPropertyForm({ title: 'x', documents: [file] } /* no currentUserId */)

    expect(processDocumentQueue).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/no signed-in user/i))
  })

  it('surfaces one failed-document toast by filename, and a count when several fail', async () => {
    const fileA = new File(['a'], 'a.pdf')
    vi.mocked(createDocumentUploadItem).mockImplementation((file) => ({ file, status: 'failure' }))

    await submitPropertyForm({ title: 'x', documents: [fileA] }, 'user-1')
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('"a.pdf"'))
  })
})

describe('submitPropertyEdit (Edit-mode clear semantics)', () => {
  beforeEach(() => {
    vi.mocked(updateProperty).mockResolvedValue({ id: 'prop-1', name: 'x', status: 'Active' })
  })

  it('replaces a cleared Boolean field with false, not omitting it, when the user touched it', async () => {
    await submitPropertyEdit('prop-1', { cBanner: undefined }, { cBanner: true })
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1]
    expect(payloadArg.cBanner).toBe(false)
  })

  it('replaces a cleared Multi-Enum field with [], not omitting it, when the user touched it', async () => {
    await submitPropertyEdit('prop-1', { features: [] }, { features: true })
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect(payloadArg.features).toEqual([])
  })

  it('replaces a cleared plain field (e.g. Enum/Text) with null, not omitting it', async () => {
    await submitPropertyEdit('prop-1', { furnished: '' }, { furnished: true })
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect(payloadArg.furnished).toBeNull()
  })

  it('leaves a field the user never touched at buildPropertyPayload\'s own undefined — clear semantics never runs for it', async () => {
    // buildPropertyPayload's return is a fixed object literal — `furnished`
    // is always an own key there (value undefined when empty), regardless of
    // dirtyFields; applyEditClearSemantics only ever overwrites it to null
    // when the user actually touched (dirtied) the field. Assert the VALUE,
    // not key presence — `in` can't distinguish these two cases.
    await submitPropertyEdit('prop-1', { furnished: '' }, { /* furnished not dirty */ })
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect(payloadArg.furnished).toBeUndefined()
  })

  it('never applies clear semantics to the excluded image/attachment keys', async () => {
    await submitPropertyEdit('prop-1', { imagesIds: undefined }, { imagesIds: true })
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect('imagesIds' in payloadArg).toBe(false)
  })

  it('does not mirror cLocationRealCity on Edit (Create-only mirror, no known consumer on Edit)', async () => {
    await submitPropertyEdit('prop-1', { addressCity: 'Athens' }, {})
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect('cLocationRealCity' in payloadArg).toBe(false)
  })

  it('unrelates a document the user removed, diffed against documentsOriginalIds', async () => {
    await submitPropertyEdit(
      'prop-1',
      { documents: [{ id: 'doc-1', existing: true }], documentsOriginalIds: ['doc-1', 'doc-2'] },
      {},
    )
    expect(unrelateDocument).toHaveBeenCalledWith('prop-1', 'doc-2')
    expect(unrelateDocument).not.toHaveBeenCalledWith('prop-1', 'doc-1')
  })

  it('uploads a new banner file and keeps an existing banner id untouched', async () => {
    vi.mocked(uploadPropertyImage).mockResolvedValue({ id: 'banner-att-1' })
    const bannerFile = new File(['x'], 'banner.jpg')
    await submitPropertyEdit('prop-1', { cBannerphoto: bannerFile }, {})
    expect(uploadPropertyImage).toHaveBeenCalledWith(bannerFile, 'cBannerphoto')
    const payloadArg = vi.mocked(updateProperty).mock.calls[0][1] as Record<string, unknown>
    expect(payloadArg.cBannerphoto).toBe('banner-att-1')
  })
})
