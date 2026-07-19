import axiosClient from '@/api/axiosClient'

// Wave 7 (2026-07-15, Attachments). Document is a full CRM entity related to
// RealEstateProperty via a hasMany/hasMany link (`documents` / `properties`)
// — no id lives directly on either side, so relating/unrelating requires
// EspoCRM's dedicated sub-resource endpoints below, not a normal payload
// field. See the Wave 7 Design Package for the full sequence.

export interface DocumentRecord {
  id: string
  name: string
  fileId: string
  fileName?: string
  publishDate: string
}

/**
 * Live entityDefs: name, file (fileId), publishDate are all required:true.
 * `assignedUserId` is NOT required by entityDefs but is required in
 * practice — live-tested this wave: a Document created without it cannot be
 * related to a property (relate returns 403 noAccessToForeignRecord) and
 * cannot even be read back by its own creator (GET returns 403). EspoCRM
 * does not auto-default assignedUser to the creator for this entity, unlike
 * some others. Always pass the current user's id.
 */
export interface CreateDocumentPayload {
  name: string
  fileId: string
  publishDate: string
  assignedUserId: string
}

export async function createDocument(payload: CreateDocumentPayload): Promise<DocumentRecord> {
  const res = await axiosClient.post<DocumentRecord>('/Document', payload)
  return res.data
}

/**
 * Entity-level delete — requires Document delete permission, which this
 * program's own live testing confirmed is NOT universally available (403 for
 * the devtest account). Only ever called as best-effort cleanup when a user
 * explicitly abandons a failed upload (Design Package §2, Failure→Cancelled)
 * — never as automatic rollback on a retryable failure, and never retried
 * itself if it fails. Callers must catch, not propagate.
 */
export async function deleteDocument(id: string): Promise<void> {
  await axiosClient.delete(`/Document/${id}`)
}

/** Relates an existing Document to a property — step ③ of the upload sequence. */
export async function relateDocument(propertyId: string, documentId: string): Promise<void> {
  await axiosClient.post(`/RealEstateProperty/${propertyId}/documents`, { id: documentId })
}

/**
 * Removes the property↔document junction row only — the Document entity
 * itself is untouched. This is "Remove" in the Wizard's own UX; it requires
 * only RealEstateProperty edit permission, never Document delete permission,
 * which is why it's the correct action regardless of the current
 * environment's ACL, not a workaround for it. See Design Package §5.
 *
 * Live-tested this wave: the id goes in the request BODY, not the URL path
 * — `DELETE /RealEstateProperty/{id}/documents/{documentId}` (the Design
 * Package's original assumption, ordinary REST-ful convention) 404s.
 * EspoCRM's real unrelate contract mirrors the relate call exactly: same
 * URL as the POST, `{ id: documentId }` in the body, DELETE verb. Corrected
 * here from the Design Package after live verification — see the Wave 7
 * Certification Report.
 */
export async function unrelateDocument(propertyId: string, documentId: string): Promise<void> {
  await axiosClient.delete(`/RealEstateProperty/${propertyId}/documents`, { data: { id: documentId } })
}
