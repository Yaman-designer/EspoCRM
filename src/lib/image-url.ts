/**
 * EspoCRM image URL helpers.
 *
 * Images are served through the WebAsset entry point at the CRM root — NOT
 * through the /api/v1/Attachment path. All requests are proxied via
 * /api/espo-image so that the Espo-Authorization header is added server-side
 * and the CRM URL is never exposed to the browser.
 */

export const FALLBACK_IMAGE = '/images/image.webp'

/**
 * Returns the internal proxy URL for a WebAsset image.
 * Falls back to the local placeholder when imageId is absent.
 */
export function getWebAssetUrl(
  imageId: string | null | undefined,
  size: 'small' | 'medium' | 'large' = 'medium',
): string {
  if (!imageId) return FALLBACK_IMAGE
  return `/api/espo-image?id=${encodeURIComponent(imageId)}&size=${encodeURIComponent(size)}`
}

/**
 * Resolves the best available image ID for a property.
 * Priority: mainImageId → first of imagesIds → null
 */
export function resolvePropertyImageId(
  mainImageId?: string | null,
  imagesIds?: string[],
): string | null {
  return mainImageId ?? imagesIds?.[0] ?? null
}
