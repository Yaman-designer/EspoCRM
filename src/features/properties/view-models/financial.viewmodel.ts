import type { RealEstateProperty } from '../types/property.types'
import { fmtPrice } from '../lib/display'
import { formatDateGB, buildOptionalRows, type Row } from '@/shared/detail-view'

export type FinancialClusterKey = 'negotiationRange' | 'taxFees' | 'conditionalTerms'

export interface FinancialDetailCluster {
  key: FinancialClusterKey
  rows: Row[]
}

/** Investment Refinement pass (2026-07-26). Was one row inside the
 * conditionalTerms cluster's generic Row[] list ("Investment Opportunity:
 * Yes · Expected rent €X"), styled identically to "Under Consideration" and
 * "Exchange Scheme" — the one fact here that's arguably a buy/sell signal
 * read no differently than administrative metadata. Broken out as its own
 * typed field so the component can give it a small badge/icon treatment
 * instead of a bigger new module — same two source fields (`investment`,
 * `cRentalprice`) as before, just no longer flattened into a Row. */
export interface InvestmentOpportunity {
  expectedRentAmount: string | null
}

export interface FinancialViewModel {
  price?: number
  requestType?: string
  pricePerSqm: number | null
  listedLabel: string | null
  updatedLabel: string | null
  investmentOpportunity: InvestmentOpportunity | null
  hasFinancialDetail: boolean
  detailClusters: FinancialDetailCluster[]
}

type FinancialFields = Pick<RealEstateProperty,
  | 'price' | 'square' | 'requestType' | 'createdAt' | 'modifiedAt'
  | 'initialPrice' | 'objectiveValue' | 'lowerPriceLimit' | 'vat' | 'cRemuneration'
  | 'investment' | 'cRentalprice' | 'withinMonthlyUtilities' | 'cAverageMonthlyUtilities'
  | 'exchangeScheme' | 'exchangeSchemePercentage' | 'cConsideration' | 'cCompensationFactor'
>

/**
 * Shapes the ~18 raw financial fields FinancialIntelligenceOS used to
 * receive as individually-destructured props into one view-model: the
 * price/m² calculation, the "is there anything to show in the detail
 * column" gate, and the three IA-grouped clusters (Negotiation Range / Tax &
 * Fees / Conditional Terms) are all computed here instead of inside the
 * component. Grouping logic, field priority, and every string template
 * (e.g. "Yes · Expected rent €X") are unchanged from the original component.
 */
export function buildFinancialViewModel(property: FinancialFields): FinancialViewModel {
  const {
    price, square, requestType, createdAt, modifiedAt,
    initialPrice, objectiveValue, lowerPriceLimit, vat, cRemuneration,
    investment, cRentalprice, withinMonthlyUtilities, cAverageMonthlyUtilities,
    exchangeScheme, exchangeSchemePercentage, cConsideration, cCompensationFactor,
  } = property

  const pricePerSqm = price != null && square ? Math.round(price / square) : null

  // Enterprise Localization pass (2026-07-24): `label` → `labelKey` (see
  // Row's own note in shared/detail-view/rows.ts). The VALUE side of these
  // 4 rows (vat/investment/withinMonthlyUtilities/exchangeScheme) is NOT
  // translated in this pass — "Applicable"/"Yes · Expected rent {{price}}"
  // etc. are UI-authored templates, not raw API text, so they're legitimate
  // translation candidates, but doing it correctly means DefinitionList
  // resolving a value-side key too (today it only resolves `labelKey`), a
  // second change to that shared component this pass didn't reach — flagged
  // as a follow-up rather than half-fixed here.
  const negotiationRows = buildOptionalRows([
    initialPrice    != null && { labelKey: 'financial.rows.initialPrice',     value: fmtPrice(initialPrice, true) },
    objectiveValue  != null && { labelKey: 'financial.rows.objectiveValue',   value: fmtPrice(objectiveValue, true) },
    lowerPriceLimit != null && { labelKey: 'financial.rows.lowerPriceLimit', value: fmtPrice(lowerPriceLimit, true) },
  ])

  const taxRows = buildOptionalRows([
    vat           != null && { labelKey: 'financial.rows.vat', value: vat ? 'Applicable' : 'Not applicable' },
    cRemuneration != null && { labelKey: 'financial.rows.remuneration', value: String(cRemuneration) },
  ])

  const conditionalRows = buildOptionalRows([
    withinMonthlyUtilities && { labelKey: 'financial.rows.utilitiesIncluded', value: cAverageMonthlyUtilities != null ? `Yes · Avg. ${fmtPrice(cAverageMonthlyUtilities, true)}/mo` : 'Yes' },
    exchangeScheme && { labelKey: 'financial.rows.exchangeScheme', value: exchangeSchemePercentage != null ? `Yes · ${exchangeSchemePercentage}%` : 'Yes' },
    cConsideration && { labelKey: 'financial.rows.underConsideration', value: cCompensationFactor != null ? `Yes · Factor ${cCompensationFactor}` : 'Yes' },
  ])

  const investmentOpportunity: InvestmentOpportunity | null = investment
    ? { expectedRentAmount: cRentalprice != null ? fmtPrice(cRentalprice, true) : null }
    : null

  const detailClusters = [
    { key: 'negotiationRange' as const, rows: negotiationRows },
    { key: 'taxFees' as const,          rows: taxRows },
    { key: 'conditionalTerms' as const, rows: conditionalRows },
  ].filter(c => c.rows.length > 0)

  return {
    price,
    requestType,
    pricePerSqm,
    listedLabel: createdAt ? formatDateGB(createdAt) : null,
    updatedLabel: modifiedAt ? formatDateGB(modifiedAt) : null,
    investmentOpportunity,
    hasFinancialDetail: detailClusters.length > 0 || investmentOpportunity != null,
    detailClusters,
  }
}
