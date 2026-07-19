import { test, expect } from '@playwright/test'
import {
  fillMinimalIdentity, fillMinimalLocation, continueTo, expectStep, CTA,
  createMinimalProperty, deletePropertyFromDetailPage,
} from './helpers/wizard'

// Coverage: Create flow, end to end, across all 8 steps of the current Wizard
// (identity -> location -> financial -> size-rooms-structure ->
// construction-systems -> features -> media -> review), verifying the
// record is actually created in EspoCRM and the app navigates to it.
test.describe('Property Wizard — Create', () => {
  test('creates a property through every step and lands on its detail page', async ({ page }) => {
    const { title } = await createMinimalProperty(page, 'E2E Create Test')
    await expect(page.getByRole('heading', { name: title })).toBeVisible()

    await deletePropertyFromDetailPage(page) // cleanup — don't leave test junk on shared staging
  })

  test('blocks submission when a required field is missing (floorKey for non-Land categories)', async ({ page }) => {
    const title = `E2E Validation Test ${Date.now()}`

    await page.goto('/properties/new')
    await fillMinimalIdentity(page, title)
    await continueTo(page, CTA.toLocation)
    await fillMinimalLocation(page, 'Athens')
    await continueTo(page, CTA.toPricing)
    await page.getByLabel('Asking Price', { exact: true }).fill('250000')
    await continueTo(page, CTA.toSize)

    // Floor Key is required whenever Category != Land (requiredWhen(NOT_LAND_CATEGORY)) —
    // deliberately left blank here.
    await page.getByRole('button', { name: CTA.toConstruction }).click()

    await expect(page.getByText('Floor Key is required')).toBeVisible()
    await expectStep(page, 'Size, Rooms & Structure') // did not advance
  })
})
