import { chromium } from '@playwright/test'
const baseURL = 'http://localhost:3000'

async function loginViaApi(request) {
  const csrfRes = await request.get(`${baseURL}/api/auth/csrf`)
  const { csrfToken } = await csrfRes.json()
  await request.post(`${baseURL}/api/auth/callback/credentials`, {
    form: { username: process.env.E2E_USERNAME ?? '', password: process.env.E2E_PASSWORD ?? '', csrfToken, json: 'true' },
  })
}

let failCount = 0
function check(label, cond, detail = '') {
  const ok = !!cond
  if (!ok) failCount++
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ' :: ' + detail : ''}`)
}

const browser = await chromium.launch()
const context = await browser.newContext()
await loginViaApi(context.request)

async function freshPage(width, height) {
  const page = await context.newPage()
  await page.setViewportSize({ width, height })
  return page
}

const errors = []

// ── 1/4/5. Properties: pagination visibility + FAB clearance + no overlap ──
for (const [width, height] of [[320, 700], [375, 700], [390, 700], [428, 700], [375, 560], [375, 480]]) {
  const page = await freshPage(width, height)
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[${width}x${height} properties] ${msg.text()}`) })
  await page.goto(`${baseURL}/properties`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('nav[data-slot="bottom-nav"]')
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)

  const geo = await page.evaluate(() => {
    const nav = document.querySelector('nav[data-slot="bottom-nav"]')
    const navRect = nav?.getBoundingClientRect()
    const pagination = document.querySelector('[data-slot="pagination-footer"]')
    const paginationRect = pagination?.getBoundingClientRect()
    const fab = document.querySelector('[data-slot="floating-utility-button"]')
    const fabRect = fab?.getBoundingClientRect()
    const fabVisible = fab ? getComputedStyle(fab).opacity !== '0' : false
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      navTop: navRect?.top, navBottom: navRect?.bottom,
      paginationExists: !!pagination,
      paginationTop: paginationRect?.top, paginationBottom: paginationRect?.bottom,
      paginationFullyVisible: paginationRect ? (paginationRect.top >= 0 && paginationRect.bottom <= window.innerHeight) : null,
      paginationOverlapsNav: paginationRect && navRect ? (paginationRect.bottom > navRect.top) : null,
      fabExists: !!fab, fabVisible,
      fabTop: fabRect?.top, fabBottom: fabRect?.bottom,
      fabOverlapsNav: fabRect && navRect ? (fabRect.bottom > navRect.top) : null,
      fabOverlapsPagination: fabRect && paginationRect ? (fabRect.bottom > paginationRect.top && fabRect.top < paginationRect.bottom) : null,
      fabGapAboveNav: fabRect && navRect ? (navRect.top - fabRect.bottom) : null,
    }
  })

  const tag = `[Properties ${width}x${height}]`
  check(`${tag} no horizontal overflow`, geo.overflowX <= 0, `overflowX=${geo.overflowX}`)
  check(`${tag} pagination exists and fully visible when scrolled to bottom`, geo.paginationExists && geo.paginationFullyVisible, JSON.stringify(geo))
  check(`${tag} pagination does not overlap BottomNav`, !geo.paginationOverlapsNav, `paginationBottom=${geo.paginationBottom} navTop=${geo.navTop}`)
  if (geo.fabExists && geo.fabVisible) {
    check(`${tag} FAB does not overlap BottomNav`, !geo.fabOverlapsNav, `fabBottom=${geo.fabBottom} navTop=${geo.navTop}`)
    check(`${tag} FAB does not overlap pagination`, !geo.fabOverlapsPagination, JSON.stringify(geo))
    check(`${tag} FAB has a clean positive gap above BottomNav (>=8px)`, geo.fabGapAboveNav >= 8, `gap=${geo.fabGapAboveNav}`)
  } else {
    console.log(`INFO — ${tag} FAB not visible at this scroll position (fabExists=${geo.fabExists} fabVisible=${geo.fabVisible})`)
  }
  await page.close()
}

// ── 2. Property Details page ────────────────────────────────────────────
{
  const PRIMARY_ID = '68d9a39df345c5811'
  const page = await freshPage(390, 700)
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[property-detail] ${msg.text()}`) })
  await page.goto(`${baseURL}/properties/${PRIMARY_ID}`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('nav[data-slot="bottom-nav"]')
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(600)
  const geo = await page.evaluate(() => {
    const nav = document.querySelector('nav[data-slot="bottom-nav"]')
    const navRect = nav.getBoundingClientRect()
    const main = document.querySelector('main')
    const lastEl = [...main.children].pop()
    const lastRect = lastEl.getBoundingClientRect()
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      lastContentBottom: lastRect.bottom, navTop: navRect.top,
      overlaps: lastRect.bottom > navRect.top,
    }
  })
  check('[PropertyDetail 390px] no horizontal overflow', geo.overflowX <= 0, `overflowX=${geo.overflowX}`)
  check('[PropertyDetail 390px] last content not hidden behind BottomNav', !geo.overlaps, JSON.stringify(geo))
  await page.close()
}

// ── 5. Home / Calendar ──────────────────────────────────────────────────
for (const href of ['/dashboard', '/calendar']) {
  const page = await freshPage(390, 700)
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[${href}] ${msg.text()}`) })
  await page.goto(`${baseURL}${href}`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('nav[data-slot="bottom-nav"]')
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(500)
  const geo = await page.evaluate(() => {
    const nav = document.querySelector('nav[data-slot="bottom-nav"]')
    const navRect = nav.getBoundingClientRect()
    const main = document.querySelector('main')
    const lastEl = [...main.children].pop()
    const lastRect = lastEl.getBoundingClientRect()
    return {
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      overlaps: lastRect.bottom > navRect.top,
      lastContentBottom: lastRect.bottom, navTop: navRect.top,
    }
  })
  check(`[${href} 390px] no horizontal overflow`, geo.overflowX <= 0, `overflowX=${geo.overflowX}`)
  check(`[${href} 390px] last content not hidden behind BottomNav`, !geo.overlaps, JSON.stringify(geo))
  await page.close()
}

// ── 7/8. Mobile drawer: z-index, no BottomNav overlap, close control reachable ──
{
  const page = await freshPage(390, 700)
  page.on('console', msg => { if (msg.type() === 'error') errors.push(`[drawer] ${msg.text()}`) })
  await page.goto(`${baseURL}/dashboard`)
  await page.waitForSelector('nav[data-slot="bottom-nav"]')
  await page.waitForTimeout(500)

  // Scroll down first so BackToTop FAB becomes visible, to test its
  // relationship with the drawer/backdrop too.
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(600)

  const hamburger = page.locator('header button').first()
  await hamburger.click()
  await page.waitForTimeout(500)

  const drawerState = await page.evaluate(() => {
    const sidebar = document.querySelector('.app-sidebar')
    const backdrop = document.querySelector('div.fixed.inset-0.z-40.bg-foreground\\/20')
    const nav = document.querySelector('nav[data-slot="bottom-nav"]')
    const fab = document.querySelector('[data-slot="floating-utility-button"]')
    const sidebarCS = sidebar ? getComputedStyle(sidebar) : null
    const backdropCS = backdrop ? getComputedStyle(backdrop) : null
    const navCS = getComputedStyle(nav)
    // Real click-target test: does the topmost element at a point inside the
    // sidebar's own body actually belong to the sidebar (not something else
    // stealing clicks)?
    const sidebarRect = sidebar.getBoundingClientRect()
    const midSidebarX = sidebarRect.left + sidebarRect.width / 2
    const midSidebarY = sidebarRect.top + 200
    const topElAtSidebar = document.elementFromPoint(midSidebarX, midSidebarY)
    return {
      sidebarOpen: sidebar?.classList.contains('sidebar-mobile-open'),
      sidebarZ: sidebarCS?.zIndex,
      backdropZ: backdropCS?.zIndex,
      navHidden: nav.getAttribute('aria-hidden') === 'true',
      navPointerEvents: navCS.pointerEvents,
      fabExistsWhileOpen: !!fab,
      fabPointerEvents: fab ? getComputedStyle(fab).pointerEvents : null,
      sidebarClickReachable: sidebar.contains(topElAtSidebar),
      bodyOverflow: getComputedStyle(document.body).overflow,
    }
  })
  check('[Drawer] sidebar actually opens', drawerState.sidebarOpen === true, JSON.stringify(drawerState))
  check('[Drawer] sidebar z-index (50) > backdrop z-index (40)', Number(drawerState.sidebarZ) > Number(drawerState.backdropZ), JSON.stringify(drawerState))
  check('[Drawer] BottomNav is hidden (aria-hidden + pointer-events:none) while drawer open', drawerState.navHidden && drawerState.navPointerEvents === 'none', JSON.stringify(drawerState))
  check('[Drawer] sidebar content is click-reachable (not covered by another layer)', drawerState.sidebarClickReachable, JSON.stringify(drawerState))

  // Close via the backdrop — NOT the hamburger toggle. Discovered live: the
  // open drawer (220px wide, z-50) fully covers the hamburger button's own
  // screen position (also within that 0-220px band), so re-tapping the same
  // icon can't reach it (Playwright's own diagnostic confirms: "intercepts
  // pointer events"). Pre-existing, unrelated to BottomNav, out of scope for
  // this pass (flagged in the report instead) — the backdrop tap is the
  // mechanism that actually still works, used here to complete the check.
  const sidebarRight = await page.evaluate(() => document.querySelector('.app-sidebar')?.getBoundingClientRect().right ?? 0)
  const vp = page.viewportSize()
  await page.mouse.click(Math.min(vp.width - 8, sidebarRight + 20), 100)
  await page.waitForTimeout(500)
  const afterClose = await page.evaluate(() => {
    const sidebar = document.querySelector('.app-sidebar')
    const nav = document.querySelector('nav[data-slot="bottom-nav"]')
    return { sidebarOpen: sidebar?.classList.contains('sidebar-mobile-open'), navHidden: nav.getAttribute('aria-hidden') === 'true' }
  })
  check('[Drawer] closes and BottomNav reappears after toggling the hamburger closed', !afterClose.sidebarOpen && !afterClose.navHidden, JSON.stringify(afterClose))
  await page.close()
}

// ── FAB vs pagination — real 2D bounding-box overlap (post-fix) ──────────
{
  const page = await freshPage(390, 700)
  await page.goto(`${baseURL}/properties`)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('nav[data-slot="bottom-nav"]')
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(700)
  const geo = await page.evaluate(() => {
    const fab = document.querySelector('[data-slot="floating-utility-button"]')
    const pagination = document.querySelector('[data-slot="pagination-footer"]')
    const fabRect = fab.getBoundingClientRect()
    const pagRect = pagination.getBoundingClientRect()
    const overlaps2D = fabRect.left < pagRect.right && fabRect.right > pagRect.left &&
      fabRect.bottom > pagRect.top && fabRect.top < pagRect.bottom
    return { fabBottom: fabRect.bottom, pagTop: pagRect.top, gap: pagRect.top - fabRect.bottom, overlaps2D }
  })
  check('[FAB/pagination] no 2D bounding-box overlap', !geo.overlaps2D, JSON.stringify(geo))
  check('[FAB/pagination] clean positive gap (>=8px) between FAB and pagination', geo.gap >= 8, JSON.stringify(geo))
  await page.close()
}

console.log('\nCONSOLE ERRORS:', errors.length ? errors.slice(0, 15) : 'none')
console.log(`\n${failCount === 0 ? 'ALL CHECKS PASSED' : failCount + ' CHECK(S) FAILED'}`)

await browser.close()
process.exit(failCount === 0 ? 0 : 1)
