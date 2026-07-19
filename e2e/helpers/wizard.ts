import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

// Shared helpers for driving the Property Wizard (src/app/(dashboard)/properties/new).
// Built directly against the form-engine's real accessibility contract, not
// guessed selectors:
//   - Every field's control carries id={getFieldId(key)}; FieldWrapper renders
//     <label htmlFor={that id}> — so getByLabel(...) targets every field type
//     (text, number, currency, switch, select) the same way.
//   - SelectField is a Radix combobox: getByLabel finds the trigger button;
//     the option list is a portal, queried via getByRole('option', ...).
//   - MultiSelect/Tags-style fields use a Command/Popover pattern — options
//     are toggled by clicking their listbox entry, not by typing + Enter.

export async function fillText(page: Page, label: string, value: string) {
  await page.getByLabel(label, { exact: true }).fill(value)
}

export async function selectOption(page: Page, label: string, optionText: string) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: optionText, exact: true }).click()
}

/** For fields whose real option list is live server data (Region/Sub-Region/Location)
 *  and can't be hardcoded — opens the dropdown and picks whatever the first entry is. */
export async function selectFirstOption(page: Page, label: string) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option').first().click()
}

export async function toggleSwitch(page: Page, label: string) {
  await page.getByLabel(label, { exact: true }).click()
}

/** Multi-select fields render a Popover+Command combobox — click the trigger, then each option. */
export async function pickMultiSelect(page: Page, label: string, optionTexts: string[]) {
  await page.getByLabel(label, { exact: true }).click()
  for (const text of optionTexts) {
    await page.getByRole('option', { name: text, exact: true }).click()
  }
  await page.keyboard.press('Escape')
}

/** Advances from the current step via the primary CTA (its label is the next step's title, or the terminal submit label). */
export async function continueTo(page: Page, ctaLabel: string | RegExp) {
  await page.getByRole('button', { name: ctaLabel }).click()
}

export async function goPrevious(page: Page) {
  await page.getByRole('button', { name: 'Go to previous step' }).click()
}

/** Waits for a step's heading to be visible — confirms navigation actually landed, not just that a click fired. */
export async function expectStep(page: Page, stepTitle: string) {
  await page.getByRole('heading', { name: stepTitle }).waitFor({ state: 'visible' })
}

export const CTA = {
  toLocation: 'Continue to Location & Zoning',
  toPricing: /Continue to Pricing/,
  toSize: /Continue to Size/,
  toConstruction: /Continue to Construction/,
  toOutdoor: /Continue to Outdoor/,
  toMedia: /Continue to Marketing/,
  toReview: /Continue to Review/,
  createProperty: 'Create Property',
  saveChanges: 'Save Changes',
} as const

/** Minimum fields required to pass Step 1 (Identity & Governance) validation. */
export async function fillMinimalIdentity(page: Page, title: string) {
  await fillText(page, 'Title', title)
  await selectOption(page, 'Category', 'Residential')
  await selectOption(page, 'Property Type', 'Apartment')
  await selectOption(page, 'Request Type', 'Sale')
  // Assignment auto-derives from Category; Status defaults to Draft (no owner required).
}

/** Minimum fields required to pass Step 2 (Location & Zoning) validation.
 *  Sub-Region and District/Area are real required fields (see
 *  location-zoning.schema.ts) driven by live server data — this walks the
 *  cascade generically (first available option at each level) rather than
 *  assuming specific staging region names. */
export async function fillMinimalLocation(page: Page, city: string) {
  await fillText(page, 'City', city)
  await selectFirstOption(page, 'Region')
  await expectOptionsLoaded(page, 'Sub-Region')
  await selectFirstOption(page, 'Sub-Region')
  await expectOptionsLoaded(page, 'District / Area')
  await selectFirstOption(page, 'District / Area')
}

/** Waits until a cascading select's trigger is no longer disabled/read-only
 *  after its parent selection reloads its options (DependencyEngine's
 *  reload-options action is asynchronous). */
async function expectOptionsLoaded(page: Page, label: string) {
  await page.getByLabel(label, { exact: true }).and(page.locator(':not([disabled])')).waitFor({ state: 'visible' })
}

/** Drives a full Create through every required field only, submits, and
 *  returns the resulting property's detail URL — the minimal shared fixture
 *  every Edit/Clear-Semantics/Attachments/Contacts spec builds on, so each of
 *  those specs is testing its own scenario against a real record rather than
 *  re-deriving the whole Create flow inline. */
export async function createMinimalProperty(page: Page, titlePrefix: string): Promise<{ title: string; url: string }> {
  const title = `${titlePrefix} ${Date.now()}`

  await page.goto('/properties/new')
  await fillMinimalIdentity(page, title)
  await continueTo(page, CTA.toLocation)
  await fillMinimalLocation(page, 'Athens')
  await continueTo(page, CTA.toPricing)
  await page.getByLabel('Asking Price', { exact: true }).fill('250000')
  await continueTo(page, CTA.toSize)
  await page.getByLabel('Total Area', { exact: true }).fill('95')
  await continueTo(page, CTA.toConstruction)
  await continueTo(page, CTA.toOutdoor)
  await continueTo(page, CTA.toMedia)
  await continueTo(page, CTA.toReview)
  await page.getByRole('button', { name: CTA.createProperty }).click()

  await expect(page.getByText('Property created')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/\/properties\/[^/]+$/, { timeout: 15_000 })
  return { title, url: page.url() }
}

/** Deletes a property from its own detail page — used for end-of-test cleanup
 *  so specs don't accumulate permanent junk records on the shared staging
 *  instance. The trigger button's exact accessible name wasn't confirmed
 *  against a live run at the time this suite was written — adjust the regex
 *  below if the first live run shows a mismatch. */
export async function deletePropertyFromDetailPage(page: Page) {
  await page.getByRole('button', { name: /delete/i }).first().click()
  await page.getByRole('button', { name: 'Delete Property' }).click()
  await expect(page.getByText('Property deleted')).toBeVisible({ timeout: 15_000 })
}
