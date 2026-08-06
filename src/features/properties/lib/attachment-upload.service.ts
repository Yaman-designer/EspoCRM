import axiosClient from '@/api/axiosClient'

// Uploads browser File objects to EspoCRM's Attachment entity, returning
// real attachment ids. MultiImageField (form-engine) only holds raw File
// objects in RHF state — nothing in this app uploads anything on its own
// until this service is called, which is why property-form.transform.ts
// runs this BEFORE building the final RealEstateProperty payload, never
// submitting File objects themselves.
//
// IMPLEMENTATION NOTE (flagged as an open question in the approved rebuild
// plan): this follows EspoCRM's documented attachment-upload contract — POST
// /Attachment with a base64 data-URI `file`, `relatedType`, and `field`
// naming the target multi-attachment field on RealEstateProperty. No
// existing code in this repo demonstrates this shape before now — verify
// against a live EspoCRM call (or the EspoCRM API docs for your version)
// before relying on this in production, and adjust `field`/`role` below if
// the real attribute name or role differs.

export interface UploadedAttachment {
  id: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Keyed by File identity (not content) — every File this app ever uploads to
// a RealEstateProperty attachment field comes from exactly one field's own
// picker (gallery vs. banner vs. document), so the same File instance is
// never legitimately destined for two different fields. Retrying a failed
// property submit (see property-form.transform.ts's submitPropertyForm)
// re-calls this with the SAME File objects RHF/lastSubmitDataRef already
// held — without this cache, that retry would re-POST and create a brand
// new orphaned Attachment for every image already uploaded by the failed
// attempt. WeakMap so a File that's no longer referenced anywhere (form
// reset/discarded) is free to be garbage-collected along with its cache
// entry — no manual cleanup needed.
const uploadCache = new WeakMap<File, Promise<UploadedAttachment>>()

/**
 * Uploads a single image File to EspoCRM's Attachment entity.
 * `field` names the target RealEstateProperty attachment attribute —
 * defaults to the gallery's `images` (unchanged for existing callers);
 * pass e.g. 'cBannerphoto' to target a different single-image field.
 */
export async function uploadPropertyImage(file: File, field: string = 'images'): Promise<UploadedAttachment> {
  const cached = uploadCache.get(file)
  if (cached) return cached

  const upload = (async () => {
    const dataUrl = await readFileAsDataUrl(file)
    const res = await axiosClient.post<{ id: string }>('/Attachment', {
      name: file.name,
      type: file.type,
      role: 'Attachment',
      relatedType: 'RealEstateProperty',
      field,
      file: dataUrl,
    })
    return { id: res.data.id }
  })()

  uploadCache.set(file, upload)
  // A failed upload must be retryable on its own next attempt, not
  // permanently poisoned by a cached rejection.
  upload.catch(() => uploadCache.delete(file))
  return upload
}

/**
 * Wave 7 (2026-07-15, Attachments). Uploads a File destined for a Document
 * entity's own `file` field — NOT a RealEstateProperty attachment field.
 * Same POST /Attachment contract as uploadPropertyImage above (live-verified
 * this wave), just relatedType='Document' instead of 'RealEstateProperty'.
 * See the Wave 7 Design Package: this is step ① of the 3-step
 * upload→create→relate sequence document-upload.service.ts orchestrates —
 * the resulting attachment id becomes a Document's `fileId`, never a
 * RealEstateProperty attribute directly.
 */
export async function uploadDocumentFile(file: File): Promise<UploadedAttachment> {
  const dataUrl = await readFileAsDataUrl(file)
  const res = await axiosClient.post<{ id: string }>('/Attachment', {
    name: file.name,
    type: file.type,
    role: 'Attachment',
    relatedType: 'Document',
    field: 'file',
    file: dataUrl,
  })
  return { id: res.data.id }
}

/**
 * Uploads every File in order (sequential, not parallel — preserves gallery
 * order deterministically and avoids firing many large base64 POSTs at once).
 * Values that are already attachment id strings (e.g. re-editing an existing
 * upload) pass through unchanged instead of being re-uploaded.
 */
export async function uploadPropertyImages(files: (File | string)[]): Promise<string[]> {
  const ids: string[] = []
  for (const file of files) {
    if (typeof file === 'string') {
      ids.push(file)
      continue
    }
    const { id } = await uploadPropertyImage(file)
    ids.push(id)
  }
  return ids
}
