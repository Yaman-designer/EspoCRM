import { test, expect } from '@playwright/test'
import { fillMinimalIdentity, fillMinimalLocation, deletePropertyFromDetailPage } from './helpers/wizard'

// Coverage: Contacts — the contactsIds relation field (Location & Zoning
// step's "Contacts" section), required on the live entity. Loads up to 200
// contacts with no search-as-you-type (a confirmed scale limitation, not a bug).
test.describe('Property Wizard — Contacts', () => {
  test('a contact can be attached during Create and is restored on Edit', async ({ page }) => {
    await page.goto('/properties/new')
    const title = `E2E Contacts Test ${Date.now()}`
    await fillMinimalIdentity(page, title)
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    await fillMinimalLocation(page, 'Athens')

    await page.getByLabel('Contacts', { exact: true }).click()
    const firstContact = page.getByRole('option').first()
    await firstContact.waitFor({ state: 'visible', timeout: 10_000 })
    const contactName = (await firstContact.textContent())?.trim()
    await firstContact.click()
    await page.keyboard.press('Escape')

    // Selected contact renders as a chip/badge next to the field.
    if (contactName) {
      await expect(page.getByText(contactName, { exact: false })).toBeVisible()
    }

    // Finish and submit so the restore-on-Edit half of this test has a real record.
    for (const cta of [
      /Continue to Pricing/, /Continue to Size/, /Continue to Construction/,
      /Continue to Outdoor/, /Continue to Marketing/, /Continue to Review/,
    ]) {
      await page.getByRole('button', { name: cta }).click()
    }
    await page.getByRole('button', { name: 'Create Property' }).click()
    await expect(page).toHaveURL(/\/properties\/[^/]+$/, { timeout: 15_000 })
    const url = page.url()

    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
    if (contactName) {
      await expect(page.getByText(contactName, { exact: false })).toBeVisible()
    }

    await page.goto(url)
    await deletePropertyFromDetailPage(page)
  })
})
