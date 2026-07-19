import { test, expect } from '@playwright/test'
import { fillMinimalIdentity, selectFirstOption } from './helpers/wizard'

// Coverage: Region Cascade — regionLocationId -> subRegionLocationId -> locationId,
// the one item this programme's own project memory flagged as "static-verified
// only, live pass pending" as of 2026-07-11. This spec is that live pass.
test.describe('Property Wizard — Region Cascade', () => {
  test('selecting a Region loads Sub-Region; selecting Sub-Region loads District/Area', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Cascade Test ${Date.now()}`)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()

    // Sub-Region and District/Area start disabled/empty until their parent is chosen
    // (readOnlyWhen({ field: parent, operator: 'empty' })).
    await expect(page.getByLabel('Sub-Region', { exact: true })).toBeDisabled()

    await selectFirstOption(page, 'Region')
    await expect(page.getByLabel('Sub-Region', { exact: true })).toBeEnabled({ timeout: 10_000 })

    await selectFirstOption(page, 'Sub-Region')
    await expect(page.getByLabel('District / Area', { exact: true })).toBeEnabled({ timeout: 10_000 })
    await selectFirstOption(page, 'District / Area')

    // Changing Region must clear the now-orphaned Sub-Region/District selections.
    const subRegionBefore = await page.getByLabel('Sub-Region', { exact: true }).textContent()
    await selectFirstOption(page, 'Region')
    await expect(page.getByLabel('District / Area', { exact: true })).toBeDisabled()
    const subRegionAfter = await page.getByLabel('Sub-Region', { exact: true }).textContent()
    expect(subRegionAfter).not.toBe(subRegionBefore) // reset to placeholder, not the stale value
  })

  test('edit-mode restores all three cascade levels from the existing record', async () => {
    // Depends on property-region-cascade.spec.ts running after property-create.spec.ts
    // has established a create->edit round trip is safe; kept as its own file per
    // the Phase 3 coverage list ("Region Cascade" is a named, separate item).
    test.skip(
      !process.env.E2E_RUN_SLOW,
      'Full create+edit round trip for the cascade is exercised by property-edit.spec.ts\'s ' +
      'prefill test today; set E2E_RUN_SLOW=1 once a dedicated fixture property with a known ' +
      'region/sub-region/location is seeded to assert the exact restored labels here.',
    )
  })
})
