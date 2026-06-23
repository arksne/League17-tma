/**
 * E2E smoke test for League17 PokeMatrix
 * Usage: node e2e/smoke.mjs [--headed] [--url=http://localhost:5174]
 *
 * Prerequisites: Vite dev server running (npm run dev)
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const HEADED = process.argv.includes('--headed');
const urlArg = process.argv.find(a => a.startsWith('--url='));
const BASE_URL = urlArg ? urlArg.slice(6) : 'http://localhost:5174';

const results = { errors: [], warnings: [], checks: { passed: 0, failed: 0 } };

async function check(page, name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    results.checks.passed++;
  } catch (e) {
    console.log(`  ❌ ${name} — ${e.message}`);
    results.checks.failed++;
  }
}

async function main() {
  mkdirSync('e2e/screenshots', { recursive: true });

  console.log(`🚀 Launching ${HEADED ? 'headed' : 'headless'} browser...`);
  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') results.errors.push({ text: msg.text(), url: msg.location().url, line: msg.location().lineNumber });
    if (msg.type() === 'warning') results.warnings.push(msg.text());
  });
  page.on('pageerror', (err) => results.errors.push({ text: err.message, stack: err.stack }));

  // ====== 1. PAGE LOAD ======
  console.log('\n📄 Loading page...');

  // Mark tutorial as complete so it doesn't block clicks
  await page.addInitScript(() => {
    localStorage.setItem('league17_tutorial', 'complete');
  });

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Dismiss any overlay that might be blocking (tutorial, starter modal)
  await page.evaluate(() => {
    document.querySelectorAll('.modal-overlay, #tutorial-overlay, [class*="overlay"]')
      .forEach(el => { if (el.parentNode) el.style.display = 'none'; });
  }).catch(() => {});
  await page.waitForTimeout(300);

  await check(page, 'Page title is PokeMatrix', () => expect(page).toHaveTitle('PokeMatrix'));
  await check(page, 'No JS error bars', async () => {
    const bars = await page.$$('.error-bar');
    if (bars.length > 0) throw new Error(`Found ${bars.length} error bars`);
  });

  // ====== 2. NAVIGATION TABS ======
  console.log('\n🗂️  Testing navigation tabs...');

  const navTargets = [
    { id: 'view-world', label: 'Мир' },
    { id: 'view-backpack', label: 'Рюкзак' },
    { id: 'view-team', label: 'Команда Покемонов' },
    { id: 'view-chat', label: 'Чат' },
    { id: 'view-trainers', label: 'Тренеры' },
    { id: 'view-info', label: 'Инфо' },
  ];

  for (const target of navTargets) {
    await check(page, `Navigate to "${target.label}"`, async () => {
      // Click the nav item with matching data-target
      const navItem = await page.locator(`.nav-item[data-target="${target.id}"]`);
      await navItem.click();
      await page.waitForTimeout(500);

      // Verify the view is now active
      const view = await page.locator(`#${target.id}`);
      const classAttr = await view.getAttribute('class');
      if (!classAttr?.includes('active-view')) {
        throw new Error(`View #${target.id} did not get active-view class`);
      }
    });
  }

  // ====== 3. TAB CONTENT CHECKS ======
  console.log('\n🔍 Checking tab content...');

  // World tab
  await page.locator('.nav-item[data-target="view-world"]').click();
  await page.waitForTimeout(500);
  await check(page, 'World shows location tabs', async () => {
    const tabs = await page.locator('.loc-tab').count();
    if (tabs < 2) throw new Error(`Expected >= 2 location tabs, got ${tabs}`);
  });
  await check(page, 'World shows NPC buttons', async () => {
    const npcs = await page.locator('.npc-btn, button:has-text("Сестра")').count();
    if (npcs === 0) throw new Error('No NPC buttons found');
  });

  // Backpack tab
  await page.locator('.nav-item[data-target="view-backpack"]').click();
  await page.waitForTimeout(500);
  await check(page, 'Backpack view renders', async () => {
    const heading = await page.locator('#view-backpack h3').textContent();
    if (!heading?.includes('Рюкзак')) throw new Error('Backpack heading not found');
  });

  // Team tab
  await page.locator('.nav-item[data-target="view-team"]').click();
  await page.waitForTimeout(500);
  await check(page, 'Team tab shows roster', async () => {
    await page.waitForSelector('#team-roster', { timeout: 3000 });
  });
  await check(page, 'Team grid has pokemon', async () => {
    const mons = await page.locator('.team-mon, .mon-card, #team-grid > *').count();
    if (mons === 0) throw new Error('No pokemon in team');
  });

  // Info tab
  await page.locator('.nav-item[data-target="view-info"]').click();
  await page.waitForTimeout(500);
  await check(page, 'Info tab has help/quest/pvp buttons', async () => {
    await page.waitForSelector('#btn-help-system', { timeout: 3000 });
    await page.waitForSelector('#btn-quests', { timeout: 3000 });
    await page.waitForSelector('#btn-pvp', { timeout: 3000 });
  });

  // ====== 4. SCREENSHOT ======
  await page.screenshot({ path: 'e2e/screenshots/smoke-final.png', fullPage: true });
  console.log('\n📸 Final screenshot saved: e2e/screenshots/smoke-final.png');

  // ====== 5. SUMMARY ======
  console.log(`\n${'='.repeat(55)}`);
  console.log(`   Errors:     ${results.errors.length}`);
  console.log(`   Warnings:   ${results.warnings.length}`);
  console.log(`   Checks:     ${results.checks.passed} passed, ${results.checks.failed} failed`);
  console.log(`${'='.repeat(55)}`);

  if (results.errors.length > 0) {
    console.error('\n❌ Console errors:');
    results.errors.forEach(e => console.error(`  ${e.text}`));
  }

  const failed = results.errors.length > 0 || results.checks.failed > 0;
  console.log(failed ? '\n❌ E2E SMOKE TEST FAILED' : '\n✅ E2E SMOKE TEST PASSED');

  await browser.close();
  process.exit(failed ? 1 : 0);
}

function expect(page) {
  return {
    toHaveTitle: async (expected) => {
      const actual = await page.title();
      if (actual !== expected) throw new Error(`Expected title "${expected}", got "${actual}"`);
    },
  };
}

main().catch(err => { console.error('💥', err); process.exit(1); });
