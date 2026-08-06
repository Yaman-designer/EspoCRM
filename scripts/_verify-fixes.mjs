import { chromium } from 'playwright'

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ storageState: 'e2e/.auth/user.json' })
  const page = await context.newPage()
  const results = {}

  await page.goto('http://localhost:3000/properties/new')
  await page.getByRole('heading', { name: 'Identity & Governance' }).first().waitFor()

  // ── C1 check 1: Status shows its real default pre-selected, not a placeholder ──
  const statusTrigger = page.getByLabel('Listing Status', { exact: true })
  results.statusPreselectedText = (await statusTrigger.textContent())?.trim()

  // ── C1 check 2: Assigned Agent now carries a required asterisk ──
  const agentLabelText = await page.locator('label', { hasText: 'Assigned Agent' }).first().textContent()
  results.assignedAgentLabelText = agentLabelText?.trim()

  // ── C1 check 3: fill ONLY the fields that visibly look required, leave Status untouched ──
  await page.getByLabel('Title', { exact: true }).fill('Verify C1 Fix ' + Date.now())
  await page.getByLabel('Category', { exact: true }).click()
  await page.getByRole('option', { name: 'Residential', exact: true }).click()
  await page.getByLabel('Property Type', { exact: true }).click()
  await page.getByRole('option', { name: 'Apartment', exact: true }).click()
  await page.getByLabel('Request Type', { exact: true }).click()
  await page.getByRole('option', { name: 'Sale', exact: true }).click()
  await page.getByLabel('Assigned Agent', { exact: true }).click()
  await page.getByRole('option').first().click()
  // Deliberately NOT touching Status or Assignment — Assignment auto-derives,
  // Status should already carry its pre-applied default.

  await page.getByRole('button', { name: 'Continue to Location & Zoning' }).click()
  await page.waitForTimeout(600)
  results.advancedPastStep1WithoutTouchingStatus = await page.getByRole('heading', { name: 'Location & Zoning' }).first().isVisible().catch(() => false)
  await page.screenshot({ path: 'scripts/_verify-c1-after-continue.png' })

  // ── C2 check: Region -> Sub-Region -> District/Area, immediate open ──
  if (results.advancedPastStep1WithoutTouchingStatus) {
    await page.getByLabel('Region', { exact: true }).click()
    await page.getByRole('option', { name: 'Κέντρο Αθήνας', exact: true }).click()
    await page.getByLabel('Sub-Region', { exact: true }).and(page.locator(':not([disabled])')).waitFor()
    await page.getByLabel('Sub-Region', { exact: true }).click()
    await page.getByRole('option', { name: 'Άγιος Ελευθέριος - Προμπονά - Ριζούπολη', exact: true }).click()

    // Check IMMEDIATELY (no wait) — the field must now be disabled/loading, not falsely empty
    const districtTrigger = page.getByLabel('District / Area', { exact: true })
    results.districtImmediateText = (await districtTrigger.textContent())?.trim()
    results.districtImmediateDisabled = await districtTrigger.isDisabled().catch(() => null)

    // Try to open it immediately — should NOT show "No options found" while disabled
    await districtTrigger.click({ force: true }).catch(() => {})
    await page.waitForTimeout(150)
    results.noOptionsShownWhileLoading = await page.getByText('No options found').isVisible().catch(() => false)
    await page.screenshot({ path: 'scripts/_verify-c2-immediate.png' })
    await page.keyboard.press('Escape').catch(() => {})

    // Now wait for real data and try again
    await districtTrigger.and(page.locator(':not([disabled])')).waitFor({ timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(300)
    results.districtEnabledAfterLoad = await districtTrigger.isEnabled().catch(() => false)
    await districtTrigger.click()
    await page.waitForTimeout(200)
    results.optionsAfterLoad = await page.getByRole('option').allTextContents()
    await page.screenshot({ path: 'scripts/_verify-c2-after-load.png' })
  }

  console.log(JSON.stringify(results, null, 2))
  await browser.close()
}

main().catch(e => { console.error('SCRIPT ERROR:', e); process.exit(1) })
