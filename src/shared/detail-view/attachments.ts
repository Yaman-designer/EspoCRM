const IMAGE_EXTENSION_RE = /\.(jpe?g|png|webp)$/i

/**
 * Detects whether an attachment/document is an image by filename extension.
 * Originated on the Property details page, where the `Document` entity has
 * no MIME-type field in what the app reads back (id, name, fileId,
 * fileName, publishDate only), so file extension is the only real signal
 * available. Entity-agnostic — any Details page rendering related
 * attachments faces the same problem.
 */
export function isImageAttachment(filename: string | null | undefined): boolean {
  return !!filename && IMAGE_EXTENSION_RE.test(filename)
}

/**
 * Reads the real file extension off the stored filename for display as a
 * type badge (PDF, JPG, DOCX…) — never a guess or a MIME lookup, since (per
 * `isImageAttachment`'s own note) no MIME field exists to read instead.
 * `jpeg` is normalized to the more common `JPG` convention; anything without
 * a recognizable extension falls back to a neutral `FILE` label rather than
 * inventing a type.
 */
export function getAttachmentTypeLabel(filename: string | null | undefined): string {
  const ext = filename ? /\.([a-z0-9]+)$/i.exec(filename)?.[1] : undefined
  if (!ext) return 'FILE'
  return ext.toLowerCase() === 'jpeg' ? 'JPG' : ext.toUpperCase()
}
