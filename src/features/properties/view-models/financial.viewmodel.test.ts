import { describe, it, expect } from 'vitest'
import { buildFinancialViewModel } from './financial.viewmodel'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4: null/edge-
// case behavior and every conditional branch of buildFinancialViewModel,
// proven rather than asserted. Each conditional row (Negotiation Range / Tax
// & Fees / Conditional Terms) is gated on a real field; every gate is
// exercised both true and false here.
//
// Enterprise Localization pass (2026-07-24): cluster/row `label` (literal
// display text) became `key`/`labelKey` (i18next lookup keys) — see Row's
// own note in shared/detail-view/rows.ts. Assertions below match against
// those stable keys instead of the old English strings.

const base = {
  price: undefined, square: undefined, requestType: undefined,
  createdAt: undefined, modifiedAt: undefined,
  initialPrice: undefined, objectiveValue: undefined, lowerPriceLimit: undefined,
  vat: undefined, cRemuneration: undefined,
  investment: undefined, cRentalprice: undefined,
  withinMonthlyUtilities: undefined, cAverageMonthlyUtilities: undefined,
  exchangeScheme: undefined, exchangeSchemePercentage: undefined,
  cConsideration: undefined, cCompensationFactor: undefined,
}

describe('buildFinancialViewModel — null/edge cases (Rule 3)', () => {
  it('every field undefined: no crash, empty clusters, null price-derived fields', () => {
    const vm = buildFinancialViewModel(base)
    expect(vm.price).toBeUndefined()
    expect(vm.pricePerSqm).toBeNull()
    expect(vm.listedLabel).toBeNull()
    expect(vm.updatedLabel).toBeNull()
    expect(vm.hasFinancialDetail).toBe(false)
    expect(vm.detailClusters).toEqual([])
  })

  it('price present but square is zero: pricePerSqm is null, not Infinity/NaN', () => {
    const vm = buildFinancialViewModel({ ...base, price: 1000, square: 0 })
    expect(vm.pricePerSqm).toBeNull()
  })

  it('price present but square is null: pricePerSqm is null', () => {
    const vm = buildFinancialViewModel({ ...base, price: 1000, square: undefined })
    expect(vm.pricePerSqm).toBeNull()
  })

  it('price is zero (falsy but a real value): pricePerSqm still computes, price itself is not silently dropped', () => {
    const vm = buildFinancialViewModel({ ...base, price: 0, square: 50 })
    // price: 0 must survive as 0, not be coerced to undefined by a `price ||` fallback anywhere upstream
    expect(vm.price).toBe(0)
    expect(vm.pricePerSqm).toBe(0)
  })

  it('vat is explicitly false (not absent): still renders as a real row, not silently omitted', () => {
    const vm = buildFinancialViewModel({ ...base, vat: false })
    const taxCluster = vm.detailClusters.find(c => c.key === 'taxFees')
    expect(taxCluster).toBeDefined()
    expect(taxCluster!.rows).toContainEqual({ labelKey: 'financial.rows.vat', value: 'Not applicable' })
  })

  it('vat is true: renders "Applicable"', () => {
    const vm = buildFinancialViewModel({ ...base, vat: true })
    const taxCluster = vm.detailClusters.find(c => c.key === 'taxFees')
    expect(taxCluster!.rows).toContainEqual({ labelKey: 'financial.rows.vat', value: 'Applicable' })
  })

  it('vat is undefined (never set): the VAT row does not render at all', () => {
    const vm = buildFinancialViewModel(base)
    const taxCluster = vm.detailClusters.find(c => c.key === 'taxFees')
    expect(taxCluster).toBeUndefined()
  })
})

describe('buildFinancialViewModel — conditional branch matrix (Rule 4)', () => {
  it('Negotiation Range cluster: absent when all 3 fields are unset', () => {
    const vm = buildFinancialViewModel(base)
    expect(vm.detailClusters.find(c => c.key === 'negotiationRange')).toBeUndefined()
  })

  it('Negotiation Range cluster: present with only 1 of 3 fields set', () => {
    const vm = buildFinancialViewModel({ ...base, initialPrice: 500 })
    const cluster = vm.detailClusters.find(c => c.key === 'negotiationRange')
    expect(cluster!.rows).toHaveLength(1)
    expect(cluster!.rows[0].labelKey).toBe('financial.rows.initialPrice')
  })

  it('Negotiation Range cluster: all 3 fields set renders all 3 rows', () => {
    const vm = buildFinancialViewModel({ ...base, initialPrice: 500, objectiveValue: 600, lowerPriceLimit: 400 })
    const cluster = vm.detailClusters.find(c => c.key === 'negotiationRange')
    expect(cluster!.rows).toHaveLength(3)
  })

  it('Conditional Terms: investment=false does not render "Investment Opportunity"', () => {
    const vm = buildFinancialViewModel({ ...base, investment: false, cRentalprice: 900 })
    const cluster = vm.detailClusters.find(c => c.key === 'conditionalTerms')
    expect(cluster).toBeUndefined()
  })

  it('Conditional Terms: investment=true without cRentalprice renders bare "Yes"', () => {
    const vm = buildFinancialViewModel({ ...base, investment: true, cRentalprice: undefined })
    const cluster = vm.detailClusters.find(c => c.key === 'conditionalTerms')
    expect(cluster!.rows).toContainEqual({ labelKey: 'financial.rows.investmentOpportunity', value: 'Yes' })
  })

  it('Conditional Terms: investment=true WITH cRentalprice renders the expected-rent detail', () => {
    const vm = buildFinancialViewModel({ ...base, investment: true, cRentalprice: 900 })
    const cluster = vm.detailClusters.find(c => c.key === 'conditionalTerms')
    const row = cluster!.rows.find(r => r.labelKey === 'financial.rows.investmentOpportunity')
    expect(row!.value).toContain('900')
    expect(row!.value).toContain('Yes')
  })

  it('Conditional Terms: withinMonthlyUtilities branch (both without/with cAverageMonthlyUtilities)', () => {
    const withoutDetail = buildFinancialViewModel({ ...base, withinMonthlyUtilities: true })
    const withDetail = buildFinancialViewModel({ ...base, withinMonthlyUtilities: true, cAverageMonthlyUtilities: 150 })
    const rowWithout = withoutDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.utilitiesIncluded')
    const rowWith = withDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.utilitiesIncluded')
    expect(rowWithout!.value).toBe('Yes')
    expect(rowWith!.value).toContain('150')
  })

  it('Conditional Terms: exchangeScheme branch (both without/with exchangeSchemePercentage)', () => {
    const withoutDetail = buildFinancialViewModel({ ...base, exchangeScheme: true })
    const withDetail = buildFinancialViewModel({ ...base, exchangeScheme: true, exchangeSchemePercentage: 15 })
    expect(withoutDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.exchangeScheme')!.value).toBe('Yes')
    expect(withDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.exchangeScheme')!.value).toContain('15%')
  })

  it('Conditional Terms: cConsideration branch (both without/with cCompensationFactor)', () => {
    const withoutDetail = buildFinancialViewModel({ ...base, cConsideration: true })
    const withDetail = buildFinancialViewModel({ ...base, cConsideration: true, cCompensationFactor: 33 })
    expect(withoutDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.underConsideration')!.value).toBe('Yes')
    expect(withDetail.detailClusters.find(c => c.key === 'conditionalTerms')!.rows
      .find(r => r.labelKey === 'financial.rows.underConsideration')!.value).toContain('33')
  })

  it('all 4 Conditional Terms flags true simultaneously: all 4 rows render (no gate cross-suppresses another)', () => {
    const vm = buildFinancialViewModel({
      ...base,
      investment: true, cRentalprice: 100,
      withinMonthlyUtilities: true, cAverageMonthlyUtilities: 50,
      exchangeScheme: true, exchangeSchemePercentage: 10,
      cConsideration: true, cCompensationFactor: 5,
    })
    const cluster = vm.detailClusters.find(c => c.key === 'conditionalTerms')
    expect(cluster!.rows).toHaveLength(4)
  })

  it('hasFinancialDetail is true iff at least one cluster has rows; false when every cluster is empty', () => {
    expect(buildFinancialViewModel(base).hasFinancialDetail).toBe(false)
    expect(buildFinancialViewModel({ ...base, vat: false }).hasFinancialDetail).toBe(true)
  })
})
