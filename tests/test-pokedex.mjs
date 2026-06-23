import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const allLogs = [];
page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', e => allLogs.push(`[PAGE_ERROR] ${e.message}`));
page.on('response', r => {
  if (r.status() >= 400) allLogs.push(`[HTTP ${r.status()}] ${r.url()}`);
});

await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);

// Remove tutorial
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());
await page.waitForTimeout(500);

// Click pokedex button via JS (skip overlay issues)
const modalBefore = await page.evaluate(() => {
  document.getElementById('btn-open-pokedex')?.click();
  const modal = document.getElementById('pokedex-modal');
  return { modalDisplay: modal?.style?.display, innerHTML: document.getElementById('pokedex-grid')?.innerHTML?.substring(0,200) || 'empty' };
});
console.log('After button click:', JSON.stringify(modalBefore));

// Check if openPokedex works directly
const directCall = await page.evaluate(async () => {
  try {
    const mod = await import('/src/ui/pokedex.ts');
    mod.openPokedex();
    const grid = document.getElementById('pokedex-grid');
    return {
      openPokedexType: typeof mod.openPokedex,
      cellCount: grid?.children?.length || 0,
      firstCell: grid?.children[0]?.outerHTML?.substring(0,150) || 'none',
    };
  } catch(e) {
    return { err: e.message, stack: e.stack?.substring(0,300) };
  }
});
console.log('Direct call:', JSON.stringify(directCall));

// Show last 20 logs from page
console.log('\n=== Console logs (last 20) ===');
allLogs.slice(-20).forEach(l => console.log(l));

await browser.close();

if (count >= 721) {
  // Click volcanion (#721)
  await cells.nth(720).click({ force: true });
  await page.waitForTimeout(5000);
  const detailEl = page.locator('#pokedex-detail');
  const detailText = await detailEl.textContent().catch(() => 'N/A');
  console.log('Detail content (first 200):', detailText.substring(0, 200));
  const loadingEl = page.locator('.pokedex-detail-loading');
  const hasLoading = await loadingEl.count();
  console.log('Loading screen present:', hasLoading > 0);
  console.log('Errors:', errors.length ? errors.join(' | ') : 'none');
  console.log('Warnings:', warnings.length ? warnings.slice(0,3).join(' | ') : 'none');
}

// Try #1 (bulbasaur)
if (count > 0) {
  const backBtn = page.locator('#pokedex-detail-back');
  if (await backBtn.count() > 0) await backBtn.click({ force: true });
  await page.waitForTimeout(500);
  await cells.first().click({ force: true });
  await page.waitForTimeout(3000);
  console.log('After #1 click - Errors:', errors.length ? errors.join(' | ') : 'none');
}

await browser.close();
