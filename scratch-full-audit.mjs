import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'C:/Users/Win10/AppData/Local/Temp/claude/c--Users-Win10-Documents-myespocrm-ebla-crm-dashboard/43dbdc15-737f-4f0b-8efe-5ae4e70997e6/scratchpad/shots2';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const loginPage = await browser.newPage();
await loginPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
await loginPage.waitForTimeout(1500);
await loginPage.getByLabel('Username', { exact: true }).fill(process.env.E2E_USERNAME);
await loginPage.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD);
await loginPage.getByRole('button', { name: /sign in/i }).click();
await loginPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
const storageState = await loginPage.context().storageState();
await loginPage.close();

async function measure(page) {
  return page.evaluate(() => {
    const bar = document.querySelector('[data-slot="form-action-bar"]');
    const fab = document.querySelector('[data-slot="floating-utility-button"]');
    const barRect = bar ? bar.getBoundingClientRect() : null;
    const fabRect = fab ? fab.getBoundingClientRect() : null;
    const hScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    // detect any element inside the bar whose content overflows its own box (hard clip signal)
    const clipped = [];
    if (bar) {
      bar.querySelectorAll('span, button, div').forEach(el => {
        if (el.className && typeof el.className === 'string' && el.className.includes('sr-only')) return;
        if (el.children.length === 0 && el.textContent.trim().length > 0) {
          if (el.scrollWidth > el.clientWidth + 2) {
            const cs = getComputedStyle(el);
            if (cs.textOverflow !== 'ellipsis') {
              clipped.push(el.textContent.trim().slice(0, 40));
            }
          }
        }
      });
    }
    return {
      gap: (barRect && fabRect) ? (barRect.top - fabRect.bottom) : null,
      hScroll,
      clipped,
      barVisible: !!bar,
    };
  });
}

const results = [];

// ---- Part A: all widths, EN, sidebar expanded ----
const widths = [320,360,390,414,480,600,640,768,820,912,1024,1280,1366,1440,1600,1920];
const context = await browser.newContext({ storageState });
for (const w of widths) {
  const page = await context.newPage();
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto('http://localhost:3000/properties/new', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const m = await measure(page);
  results.push({ tag: `EN-expanded-w${w}`, width: w, ...m });
  await page.screenshot({ path: `${outDir}/w${w}.png` });
  await page.close();
}

// ---- Part B: zoom levels at key widths ----
const zoomWidths = [768, 1024, 1280];
const zooms = [0.9, 1.1, 1.25];
for (const w of zoomWidths) {
  for (const z of zooms) {
    const page = await context.newPage();
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('http://localhost:3000/properties/new', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(700);
    await page.evaluate((zoom) => { document.documentElement.style.zoom = String(zoom); }, z);
    await page.waitForTimeout(400);
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(300);
    const m = await measure(page);
    results.push({ tag: `EN-zoom${z}-w${w}`, width: w, zoom: z, ...m });
    await page.screenshot({ path: `${outDir}/zoom-${z}-w${w}.png` });
    await page.close();
  }
}

// ---- Part C: EL locale at key widths (fresh context — localStorage must not leak into Part D) ----
const elContext = await browser.newContext({ storageState });
const elWidths = [640, 768, 820, 1024, 1280];
for (const w of elWidths) {
  const page = await elContext.newPage();
  await page.addInitScript(() => {
    localStorage.setItem('ebla-language', JSON.stringify({ state: { language: 'el' }, version: 0 }));
  });
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto('http://localhost:3000/properties/new', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const m = await measure(page);
  results.push({ tag: `EL-expanded-w${w}`, width: w, ...m });
  await page.screenshot({ path: `${outDir}/el-w${w}.png` });
  await page.close();
}

// ---- Part D: sidebar collapsed at key widths (fresh context, EN) ----
const collContext = await browser.newContext({ storageState });
const collWidths = [768, 820, 1024, 1280];
for (const w of collWidths) {
  const page = await collContext.newPage();
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto('http://localhost:3000/properties/new', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(900);
  // collapse sidebar via cookie + reload (matches app's own persistence mechanism)
  await page.context().addCookies([{ name: 'sidebar_state', value: 'false', url: 'http://localhost:3000' }]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(400);
  const m = await measure(page);
  results.push({ tag: `EN-collapsed-w${w}`, width: w, ...m });
  await page.screenshot({ path: `${outDir}/collapsed-w${w}.png` });
  await page.close();
}

fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 2));
for (const r of results) {
  console.log(r.tag, 'gap=', r.gap, 'hScroll=', r.hScroll, 'clipped=', JSON.stringify(r.clipped));
}

await browser.close();
