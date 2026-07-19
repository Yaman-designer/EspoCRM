import { test, expect } from '@playwright/test'

// Regression coverage for Wave 1 (Foundational Data Integrity Fixes) of the
// Enterprise Reconciliation Program: src/app/api/espo-metadata/route.ts read
// `metadata?.RealEstateProperty` instead of `metadata?.entityDefs?.RealEstateProperty`,
// so it silently returned empty/fallback data since it was written. This spec
// is read-only — it never creates, edits, or deletes a RealEstateProperty record.
test.describe('Metadata API route', () => {
  test('returns real, non-empty status and type options from live EspoCRM', async ({ page }) => {
    const res = await page.request.get('/api/espo-metadata')
    expect(res.status()).toBe(200)

    const body = await res.json() as { statusOptions: string[]; typeOptions: string[] }

    // Before the Wave 1 fix, both of these were always empty/fallback —
    // non-empty, real-shaped data is the regression signal.
    expect(body.statusOptions.length).toBeGreaterThan(0)
    expect(body.statusOptions).toContain('Under Approval')
    expect(body.statusOptions).toContain('Sold')

    expect(body.typeOptions.length).toBeGreaterThan(6) // the old hardcoded fallback had exactly 6
    expect(body.typeOptions).toContain('apartment')
    expect(body.typeOptions).not.toContain('Apartment') // old Title-Case fallback value should not leak through
  })
})
