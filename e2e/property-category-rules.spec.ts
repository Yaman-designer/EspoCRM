import { test, expect } from '@playwright/test'
import { fillText, selectOption } from './helpers/wizard'

// Coverage: Category Rules — the Category -> Type (reload-options) and
// Category -> Assignment (auto-derive) dependency chain in
// identity-governance.schema.ts / property-type.registry.ts / assignment-rules.ts.
// This chain already has a recorded manual live-verification pass (2026-07-12,
// per project memory) — this spec turns that into a repeatable regression check.
test.describe('Property Wizard — Category Rules', () => {
  test('changing Category reloads Type options and auto-derives Assignment', async ({ page }) => {
    await page.goto('/properties/new')
    await fillText(page, 'Title', `E2E Category Test ${Date.now()}`)

    await selectOption(page, 'Category', 'Residential')
    await page.getByLabel('Property Type', { exact: true }).click()
    await expect(page.getByRole('option', { name: 'Apartment', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Office', exact: true })).toHaveCount(0)
    await page.getByRole('option', { name: 'Apartment', exact: true }).click()
    await expect(page.getByLabel('Assignment', { exact: true })).toHaveText('Simple')

    // Switching Category to Commercial must reload Type's options and clear
    // the now-invalid 'Apartment' selection (PDF Condition 5 / getTypeOptionsForCategory).
    await selectOption(page, 'Category', 'Commercial')
    await expect(page.getByLabel('Property Type', { exact: true })).toHaveText(/Select property type/i)
    await page.getByLabel('Property Type', { exact: true }).click()
    await expect(page.getByRole('option', { name: 'Office', exact: true })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Apartment', exact: true })).toHaveCount(0)
  })

  test('manually overriding Assignment survives a later Category change', async ({ page }) => {
    await page.goto('/properties/new')
    await fillText(page, 'Title', `E2E Assignment Override Test ${Date.now()}`)
    await selectOption(page, 'Category', 'Residential')
    await selectOption(page, 'Assignment', 'Exclusive') // manual override of the auto-derived 'Simple'

    await selectOption(page, 'Category', 'Commercial')
    // useDependencyEngine's autoValueRef contract: a manual choice is never
    // clobbered by a later auto-derive pass for the same field.
    await expect(page.getByLabel('Assignment', { exact: true })).toHaveText('Exclusive')
  })
})
