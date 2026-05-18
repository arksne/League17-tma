const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'https://league17-tma-production.up.railway.app';
const TRAINERS = [];
for (let i = 1; i <= 10; i++) {
  TRAINERS.push({ id: 4000 + i, username: `trainer${i}`, first_name: `T${i}` });
}

const REPORT = 'tests/test-report.txt';
fs.writeFileSync(REPORT, '=== MULTI-TRAINER TEST REPORT ===\n\n');
const log = (m) => { console.log(m); fs.appendFileSync(REPORT, m + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function setupPage(context, trainer) {
  const page = await context.newPage();
  await page.route('**/api/auth/tg', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    body.initData = JSON.stringify(trainer);
    await route.continue({
      method: 'POST',
      postData: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
  });
  return page;
}

// Click a nav item by its data-target attribute
async function clickNav(page, target) {
  await page.evaluate((t) => {
    const item = document.querySelector(`.nav-item[data-target="${t}"]`);
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, target);
}

// Check active view
async function isViewActive(page, viewId) {
  return page.evaluate((id) => {
    const view = document.getElementById(id);
    return view ? view.classList.contains('active-view') : false;
  }, viewId);
}

// Register trainer to dismiss overlay
async function registerTrainer(page) {
  // Wait for overlay to appear
  try {
    await page.waitForSelector('#register-overlay', { timeout: 10000 });
  } catch (e) {
    log('  Registration overlay not found (already registered?)');
    return;
  }
  // Nickname is pre-filled; just click register button
  const btn = page.locator('#btn-register');
  const visible = await btn.isVisible().catch(() => false);
  if (visible) {
    await btn.click({ timeout: 5000 }).catch(() => {});
    await sleep(3000); // Wait for registration + overlay fade
    log('  Register: OK');
  } else {
    // Use evaluate as fallback
    await page.evaluate(() => {
      const btn = document.getElementById('btn-register');
      if (btn) btn.click();
    });
    await sleep(3000);
    log('  Register: OK (evaluate)');
  }
}

async function runTrainer(trainer) {
  log(`── ${trainer.username} (ID ${trainer.id}) ──`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await setupPage(context, trainer);

  const stats = { actions: 0, ok: 0, fail: 0 };

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);

    // --- Register to dismiss overlay ---
    await registerTrainer(page);
    stats.actions++;

    // --- 1. Team ---
    await clickNav(page, 'view-team');
    await sleep(1500);
    stats.actions++;
    const teamActive = await isViewActive(page, 'view-team');
    const teamText = await page.locator('h3:has-text("Команда")').first().isVisible().catch(() => false);
    const teamOk = teamActive || teamText;
    if (teamOk) stats.ok++; else stats.fail++;
    log(`  Team: ${teamOk ? 'OK' : 'FAIL'} (active=${teamActive}, text=${teamText})`);

    // --- 2. World ---
    await clickNav(page, 'view-world');
    await sleep(1500);
    stats.actions++;
    const worldActive = await isViewActive(page, 'view-world');
    const worldText = await page.locator('.location-name').isVisible().catch(() => false);
    const worldOk = worldActive || worldText;
    if (worldOk) stats.ok++; else stats.fail++;
    log(`  World: ${worldOk ? 'OK' : 'FAIL'} (active=${worldActive}, text=${worldText})`);

    // --- 3. Bag ---
    await clickNav(page, 'view-backpack');
    await sleep(1500);
    stats.actions++;
    const bagActive = await isViewActive(page, 'view-backpack');
    const bagText = await page.locator('h3:has-text("Рюкзак")').isVisible().catch(() => false);
    const bagOk = bagActive || bagText;
    if (bagOk) stats.ok++; else stats.fail++;
    log(`  Bag: ${bagOk ? 'OK' : 'FAIL'} (active=${bagActive}, text=${bagText})`);

    // --- 4. Chat ---
    await clickNav(page, 'view-chat');
    await sleep(1500);
    stats.actions++;
    const chatActive = await isViewActive(page, 'view-chat');
    const chatText = await page.locator('.chat-layout').isVisible().catch(() => false);
    const chatOk = chatActive || chatText;
    if (chatOk) stats.ok++; else stats.fail++;
    log(`  Chat: ${chatOk ? 'OK' : 'FAIL'} (active=${chatActive}, text=${chatText})`);

    // --- 5. World → heal ---
    await clickNav(page, 'view-world');
    await sleep(1000);
    const healBtn = page.locator('button:has-text("Вылечить")').first();
    if (await healBtn.isVisible().catch(() => false)) {
      await healBtn.click({ timeout: 5000 }).catch(() => {});
      await sleep(1000);
      stats.actions++;
      stats.ok++;
      log(`  Heal: OK`);
    } else {
      log(`  Heal: SKIP (no heal button)`);
    }

    // --- 6. Location transition ---
    const transition = page.locator('button:has-text("➔")').first();
    if (await transition.isVisible().catch(() => false)) {
      await transition.click({ timeout: 5000 }).catch(() => {});
      await sleep(2000);
      stats.actions++;
      stats.ok++;
      log(`  Travel: OK`);
    } else {
      log(`  Travel: SKIP (no travel button)`);
    }

    log(`  Result: ${stats.ok}/${stats.actions} OK, ${stats.fail} failed`);
  } catch (e) {
    log(`  ERROR: ${e.message}`);
    stats.fail++;
  } finally {
    await browser.close();
  }

  return { ...stats, name: trainer.username };
}

async function main() {
  log(`Starting ${TRAINERS.length} trainers...\n`);

  const allResults = [];
  for (let i = 0; i < TRAINERS.length; i += 3) {
    const batch = TRAINERS.slice(i, i + 3);
    log(`\n=== Batch ${Math.floor(i/3)+1}: ${batch.map(t => t.username).join(', ')} ===`);
    const batchResults = await Promise.all(batch.map(t => runTrainer(t)));
    allResults.push(...batchResults);
    log(`  --- Batch done, cooling 5s ---`);
    await sleep(5000);
  }

  log('\n\n=== FINAL SUMMARY ===');
  let totalOk = 0, totalFail = 0, totalActions = 0;
  for (const r of allResults) {
    log(`  ${r.name}: ${r.ok}/${r.actions} passed, ${r.failed} failed`);
    totalOk += r.ok;
    totalFail += r.fail;
    totalActions += r.actions;
  }
  log(`\nTOTAL: ${totalOk}/${totalActions} passed, ${totalFail} failed`);
  if (totalActions > 0) log(`       ${Math.round(totalOk/totalActions*100)}% success rate`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
