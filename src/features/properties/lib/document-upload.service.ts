import { uploadDocumentFile } from './attachment-upload.service'
import { createDocument, relateDocument } from '../repositories/document.repository'

// Wave 7 (2026-07-15, Attachments). Implements the per-file state machine
// and 3-step upload→create→relate sequence from the Wave 7 Design Package.
//
// Retry semantics (Design Package §2's Failure→Retry transitions): a failed
// item is NEVER rolled back automatically — whatever attachmentId/documentId
// it already obtained is kept, so re-processing resumes at the step that
// actually failed instead of restarting and creating duplicates. This is a
// deliberate refinement over the Design Package's Error Handling Matrix,
// whose rollback-on-every-failure prose contradicted its own state diagram's
// "resume — id already known" transitions. The state diagram is
// authoritative; this corrects the inconsistency rather than implementing
// contradictory behavior. Disclosed in the Certification Report.

export type DocumentUploadStatus =
  | 'pending'
  | 'uploading-attachment'
  | 'attachment-uploaded'
  | 'creating-document'
  | 'relating-document'
  | 'success'
  | 'failure'

export interface DocumentUploadItem {
  file: File
  status: DocumentUploadStatus
  attachmentId?: string
  documentId?: string
  error?: string
}

export function createDocumentUploadItem(file: File): DocumentUploadItem {
  return { file, status: 'pending' }
}

/**
 * Advances one item through Upload → Create → Relate, resuming from
 * whichever step it hasn't yet completed (checked via attachmentId/
 * documentId presence, not status alone, so a retry after a page reload
 * would still resume correctly if those ids were persisted).
 */
export async function processDocumentItem(item: DocumentUploadItem, propertyId: string, assignedUserId: string): Promise<void> {
  try {
    if (!item.attachmentId) {
      item.status = 'uploading-attachment'
      const { id } = await uploadDocumentFile(item.file)
      item.attachmentId = id
    }
    item.status = 'attachment-uploaded'

    if (!item.documentId) {
      item.status = 'creating-document'
      // assignedUserId is required in practice, not just entityDefs-optional
      // — live-tested this wave, see CreateDocumentPayload's comment.
      const doc = await createDocument({
        name: item.file.name,
        fileId: item.attachmentId,
        publishDate: new Date().toISOString().slice(0, 10),
        assignedUserId,
      })
      item.documentId = doc.id
    }

    item.status = 'relating-document'
    await relateDocument(propertyId, item.documentId)

    item.status = 'success'
  } catch (err) {
    item.status = 'failure'
    item.error = err instanceof Error ? err.message : 'Document upload failed'
    throw err
  }
}

/**
 * Sequential, same convention as uploadPropertyImages — preserves order,
 * avoids firing many large base64 POSTs at once. One item's failure does not
 * block the rest (Design Package §1e) — each item's error is captured on
 * itself, not thrown out of the queue.
 */
export async function processDocumentQueue(items: DocumentUploadItem[], propertyId: string, assignedUserId: string): Promise<void> {
  for (const item of items) {
    if (item.status === 'success') continue
    try {
      await processDocumentItem(item, propertyId, assignedUserId)
    } catch {
      // Captured on the item itself (status/error) — continue to the next file.
    }
  }
}

export { unrelateDocument } from '../repositories/document.repository'
