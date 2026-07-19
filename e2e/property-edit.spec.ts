import { test, expect } from '@playwright/test'
import { createMinimalProperty, fillText, continueTo, expectStep, deletePropertyFromDetailPage } from './helpers/wizard'

// Coverage: Edit flow — load an existing record into the shared wizard,
// modify a field, submit via the dirtyFields PATCH path (submitPropertyEdit),
// and verify the change actually persisted server-side (by reloading the
// detail page after navigating away, not just trusting client-side state).
test.describe('Property Wizard — Edit', () => {
  test('edits an existing property and persists the change', async ({ page }) => {
    const { title } = await createMinimalProperty(page, 'E2E Edit Test')
    const detailUrl = page.url()

    // Detail page's Edit button must route to the wizard-based /edit route,
    // not the legacy dialog (per the approved Wizard-for-both ADR).
    await page.getByRole('button', { name: /edit/i }).first().click()
    await expect(page).toHaveURL(/\/properties\/[^/]+\/edit$/)
    await expectStep(page, 'Identity & Governance')

    const updatedTitle = `${title} (edited)`
    await fillText(page, 'Title', updatedTitle)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Property updated')).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(detailUrl)
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()

    // Hard reload — proves the change round-tripped through EspoCRM, not just React state.
    await page.reload()
    await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible()

    await deletePropertyFromDetailPage(page)
  })

  test('edit-mode prefill restores every step field from the existing record', async ({ page }) => {
    const { title, url } = await createMinimalProperty(page, 'E2E Prefill Test')

    await page.getByRole('button', { name: /edit/i }).first().click()
    await expectStep(page, 'Identity & Governance')

    // The exact title typed during create must reappear verbatim on Edit —
    // confirms defaultValues correctly spreads the fetched record (PropertyFormPage.tsx).
    await expect(page.getByLabel('Title', { exact: true })).toHaveValue(title)
    await expect(page.getByLabel('Category', { exact: true })).toHaveText('Residential')

    await continueTo(page, 'Continue to Location & Zoning')
    await expect(page.getByLabel('City', { exact: true })).toHaveValue('Athens')

    await page.goto(url)
    await deletePropertyFromDetailPage(page)
  })
})
