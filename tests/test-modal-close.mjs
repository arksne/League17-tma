// Test that modals can be opened and closed properly
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
let errors = 0;

page.on('pageerror', e => { console.log(`[PAGE_ERROR] ${e.message}`); errors++; });

await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());

const modals = [
  { open: 'btn-quests', close: 'btn-close-quests', modal: 'quest-modal' },
  { open: 'btn-open-pokedex', close: 'btn-close-pokedex', modal: 'pokedex-modal' },
  { open: 'btn-notifications', close: 'btn-close-notif', modal: 'notif-modal' },
];

for (const m of modals) {
  // Open modal
  await page.evaluate((id) => document.getElementById(id)?.click(), m.open);
  await page.waitForTimeout(500);

  // Check visibility
  const display = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return 'not-found';
    const style = el.style.display;
    const computed = window.getComputedStyle(el).display;
    return style || computed;
  }, m.modal);

  if (display === 'none' || display === 'not-found') {
    console.log(`❌ ${m.open}: modal ${m.modal} not visible (display: ${display})`);
    errors++;
  } else {
    console.log(`✅ ${m.open}: opened (display: ${display})`);
  }

  // Close with close button
  await page.evaluate((id) => document.getElementById(id)?.click(), m.close);
  await page.waitForTimeout(300);

  const closed = await page.evaluate((id) => {
    const el = document.getElementById(id);
    if (!el) return 'not-found';
    const style = el.style.display;
    const computed = window.getComputedStyle(el).display;
    return style || computed;
  }, m.modal);

  if (closed === 'none') {
    console.log(`  -> Close button: ✅`);
  } else {
    console.log(`  -> Close button: ❌ (display: ${closed})`);
    errors++;
  }
}

// Test overlay background click to close ALL supported modals
console.log('\n--- Overlay background click test ---');
const overlaysToTest = [
  'quest-modal', 'pokedex-modal', 'notif-modal'
];

for (const modalId of overlaysToTest) {
  // Open it first (if it has an open button)
  const openBtn = modals.find(m => m.modal === modalId)?.open;
  if (openBtn) {
    await page.evaluate((id) => document.getElementById(id)?.click(), openBtn);
    await page.waitForTimeout(400);
  }

  const closed = await page.evaluate((id) => {
    const overlay = document.getElementById(id);
    if (!overlay) return 'no-overlay';
    // Simulate clicking the overlay background itself
    overlay.click();
    const style = overlay.style.display;
    const computed = window.getComputedStyle(overlay).display;
    return style || computed;
  }, modalId);

  if (closed === 'none') {
    console.log(`  ${modalId} overlay click: ✅`);
  } else {
    console.log(`  ${modalId} overlay click: ❌ (${closed})`);
    errors++;
  }
}

console.log(`\nTotal errors: ${errors}`);
console.log(errors === 0 ? 'All modals close correctly! 🎉' : 'Some modals still have issues.');
await browser.close();
