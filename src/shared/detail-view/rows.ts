export interface Row {
  // Enterprise Localization pass (2026-07-24): was `label: string` (literal
  // display text, e.g. "Initial Price"). ViewModels can't call useTranslation
  // (no React/i18n imports allowed — the view-models/** architecture
  // boundary), so a field label that needs translating can't be handed down
  // as already-rendered text; it has to be a lookup key instead, resolved by
  // whichever presentation component actually renders the row (InfoRow /
  // DefinitionList — see their own notes). `labelKey` is a full i18next key
  // ("financial.rows.initialPrice"), always resolved against the
  // 'properties' namespace — the one real consumer of this shared type
  // today. Still entity-agnostic in the sense that mattered originally
  // (`buildOptionalRows`'s falsy-filtering logic doesn't care what the key
  // is or which namespace it belongs to); a future non-Property Details
  // page would just supply its own keys the same way.
  labelKey: string
  value: string
}

/**
 * Filters a list of conditionally-built {labelKey,value} rows, dropping
 * falsy entries. Replaces the `[cond && {...}, ...].filter(Boolean) as
 * Row[]` idiom hand-rolled across every Details-page section that shows
 * optional fact rows (financial terms, land specs, construction/feature
 * flags, distances). Entity-agnostic — the same helper serves any future
 * Details page (Contact, Company, Vehicle, ...).
 */
export function buildOptionalRows(entries: Array<Row | false | null | undefined>): Row[] {
  return entries.filter((r): r is Row => !!r)
}
