/**
 * Slug used for a Details page's own route (e.g. `/properties/{slug}`,
 * `/contacts/{slug}`): the entity's human-readable code when it has one,
 * else its id, lowercased. Was duplicated inline in two places on the
 * Property details page — now defined once, and generic over any entity
 * that has a `code`/`id` pair rather than typed to `RealEstateProperty`.
 */
export function buildEntitySlug(code: string | null | undefined, id: string): string {
  return (code ?? id).toLowerCase()
}
