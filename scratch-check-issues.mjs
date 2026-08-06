import { chromium } from 'playwright';

const browser = await chromium.launch();
const loginPage = await browser.newPage();
loginPage.on('console', msg => { if (msg.type() === 'error' || msg.type() === 'warning') console.log('CONSOLE:', msg.type(), msg.text().slice(0,300)); });
loginPage.on('pageerror', err => console.log('PAGEERROR:', err.message.slice(0,300)));
await loginPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 });
await loginPage.waitForTimeout(1500);
await loginPage.getByLabel('Username', { exact: true }).fill(process.env.E2E_USERNAME);
await loginPage.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD);
await loginPage.getByRole('button', { name: /sign in/i }).click();
await loginPage.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
await loginPage.goto('http://localhost:3000/properties/new', { waitUntil: 'networkidle', timeout: 30000 });
await loginPage.waitForTimeout(2000);
await browser.close();
