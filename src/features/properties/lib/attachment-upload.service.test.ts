import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axiosClient from '@/api/axiosClient'
import { uploadPropertyImage, uploadDocumentFile, uploadPropertyImages } from './attachment-upload.service'

vi.mock('@/api/axiosClient')

const mockPost = vi.mocked(axiosClient.post)

// This module reads File contents via the browser FileReader API — absent
// from Vitest's 'node' environment (no jsdom in this repo yet, see the EC-9
// Certification Report for why). Stubbing just the one method these
// functions actually use keeps this a real node-environment unit test
// without pulling in jsdom for a single file.
class FakeFileReader {
  result: string | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  readAsDataURL() {
    this.result = 'data:image/jpeg;base64,ZmFrZQ=='
    this.onload?.()
  }
}

beforeEach(() => {
  vi.stubGlobal('FileReader', FakeFileReader)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('attachment-upload.service', () => {
  it('uploadPropertyImage POSTs the EspoCRM Attachment contract with relatedType RealEstateProperty, defaulting field to "images"', async () => {
    mockPost.mockResolvedValue({ data: { id: 'att-1' } })
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' })

    const result = await uploadPropertyImage(file)

    expect(mockPost).toHaveBeenCalledWith('/Attachment', {
      name: 'photo.jpg',
      type: 'image/jpeg',
      role: 'Attachment',
      relatedType: 'RealEstateProperty',
      field: 'images',
      file: 'data:image/jpeg;base64,ZmFrZQ==',
    })
    expect(result).toEqual({ id: 'att-1' })
  })

  it('uploadPropertyImage targets a different field when given one (e.g. cBannerphoto)', async () => {
    mockPost.mockResolvedValue({ data: { id: 'att-2' } })
    await uploadPropertyImage(new File(['x'], 'banner.jpg'), 'cBannerphoto')

    expect(mockPost).toHaveBeenCalledWith('/Attachment', expect.objectContaining({ field: 'cBannerphoto' }))
  })

  it('uploadDocumentFile POSTs with relatedType Document and field "file" — a distinct contract from property images', async () => {
    mockPost.mockResolvedValue({ data: { id: 'att-3' } })
    await uploadDocumentFile(new File(['x'], 'contract.pdf', { type: 'application/pdf' }))

    expect(mockPost).toHaveBeenCalledWith('/Attachment', expect.objectContaining({
      relatedType: 'Document',
      field: 'file',
      name: 'contract.pdf',
    }))
  })

  describe('uploadPropertyImages', () => {
    it('uploads File objects sequentially, in order', async () => {
      mockPost
        .mockResolvedValueOnce({ data: { id: 'att-1' } })
        .mockResolvedValueOnce({ data: { id: 'att-2' } })

      const result = await uploadPropertyImages([new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')])

      expect(result).toEqual(['att-1', 'att-2'])
      expect(mockPost).toHaveBeenCalledTimes(2)
    })

    it('passes through existing attachment id strings unchanged, without re-uploading them', async () => {
      mockPost.mockResolvedValue({ data: { id: 'new-att' } })
      const result = await uploadPropertyImages(['existing-att-1', new File(['x'], 'new.jpg'), 'existing-att-2'])

      expect(result).toEqual(['existing-att-1', 'new-att', 'existing-att-2'])
      expect(mockPost).toHaveBeenCalledTimes(1)
    })

    it('returns [] for an empty list without calling the API', async () => {
      expect(await uploadPropertyImages([])).toEqual([])
      expect(mockPost).not.toHaveBeenCalled()
    })
  })
})
