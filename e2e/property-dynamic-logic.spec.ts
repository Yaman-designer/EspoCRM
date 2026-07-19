import { test, expect } from '@playwright/test'
import { fillMinimalIdentity, fillText, selectOption, toggleSwitch, expectStep } from './helpers/wizard'

// Coverage: Dynamic Logic — the VisibilityEngine/DependencyEngine conditions
// that gate fields on Category (NOT_LAND_CATEGORY and friends) and on sibling
// field values (renovation chain, cBanner reveal).
test.describe('Property Wizard — Dynamic Logic', () => {
  test('Category = Land hides and clears non-Land-only fields on Size, Rooms & Structure', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Land Test ${Date.now()}`)
    // Land has its own Type/Assignment dependent options — re-pick Category to Land.
    await selectOption(page, 'Category', 'Land')
    await selectOption(page, 'Property Type', 'Plot')
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()

    // Land Details section should now be visible (section-level `visibility: category eq Land`).
    await expect(page.getByRole('heading', { name: 'Land Details' })).toBeVisible()

    await page.getByRole('button', { name: /Continue to Pricing/ }).click()
    await page.getByLabel('Asking Price', { exact: true }).fill('120000')
    await page.getByRole('button', { name: /Continue to Size/ }).click()

    // WC, Kitchens, Floor Key are gated on NOT_LAND_CATEGORY — must be absent for Land.
    await expect(page.getByLabel('WC', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Kitchens', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Floor Key', { exact: true })).toHaveCount(0)
    // Total Area and Bedrooms are NOT category-gated (CR-06 removed that rule) — still present.
    await expect(page.getByLabel('Total Area', { exact: true })).toBeVisible()
  })

  test('the renovation chain hides Renovated/Year of Renovation while Needs Renovation is on', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Renovation Test ${Date.now()}`)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await fillText(page, 'City', 'Athens')
    await page.getByRole('button', { name: /Continue to Pricing/ }).click()
    await page.getByLabel('Asking Price', { exact: true }).fill('250000')
    await page.getByRole('button', { name: /Continue to Size/ }).click()
    await page.getByLabel('Total Area', { exact: true }).fill('95')
    await selectOption(page, 'Floor Key', '1st Floor')
    await page.getByRole('button', { name: /Continue to Construction/ }).click()

    await expect(page.getByLabel('Renovated', { exact: true })).toBeVisible()
    await toggleSwitch(page, 'Needs Renovation')
    // renovated is gated on NOT_NEEDS_RENOVATION_AND_NOT_LAND — hides once Needs Renovation is on.
    await expect(page.getByLabel('Renovated', { exact: true })).toHaveCount(0)
    await expect(page.getByLabel('Year of Renovation', { exact: true })).toHaveCount(0)
  })

  test('enabling Banner reveals the Banner Photo upload field on Marketing & Media', async ({ page }) => {
    await page.goto('/properties/new')
    await fillMinimalIdentity(page, `E2E Banner Test ${Date.now()}`)
    for (const [cta, action] of [
      ['Continue to Location & Zoning', async () => { await fillText(page, 'City', 'Athens') }],
      [/Continue to Pricing/, async () => { await page.getByLabel('Asking Price', { exact: true }).fill('250000') }],
      [/Continue to Size/, async () => { await page.getByLabel('Total Area', { exact: true }).fill('95'); await selectOption(page, 'Floor Key', '1st Floor') }],
      [/Continue to Construction/, async () => {}],
      [/Continue to Outdoor/, async () => {}],
    ] as const) {
      await action()
      await page.getByRole('button', { name: cta }).click()
    }

    await expectStep(page, 'Marketing & Media')
    // cBanner defaults to true in create mode (PropertyFormPage.tsx defaultValues) — Banner Photo starts visible.
    await expect(page.getByLabel('Banner Photo', { exact: true })).toBeVisible()
    await toggleSwitch(page, 'Banner')
    await expect(page.getByLabel('Banner Photo', { exact: true })).toHaveCount(0)
  })
})
