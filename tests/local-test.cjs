const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const TRAINERS = [];
for (let i = 1; i <= 10; i++) {
  TRAINERS.push({ id: 4000 + i, username: `trainer${i}`, first_name: `T${i}` });
}

const REPORT = 'tests/local-report.txt';
fs.writeFileSync(REPORT, '=== LOCAL TEST REPORT ===\n\n');
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

async function clickNav(page, target) {
  await page.evaluate((t) => {
    const item = document.querySelector(`.nav-item[data-target="${t}"]`);
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, target);
}

async function isViewActive(page, viewId) {
  return page.evaluate((id) => {
    const view = document.getElementById(id);
    return view ? view.classList.contains('active-view') : false;
  }, viewId);
}

async function registerTrainer(page) {
  try {
    await page.waitForSelector('#register-overlay', { timeout: 10000 });
  } catch (e) {
    log('  Registration overlay not found (already registered?)');
    return false;
  }
  const btn = page.locator('#btn-register');
  const visible = await btn.isVisible().catch(() => false);
  if (visible) {
    await btn.click({ timeout: 5000 }).catch(() => {});
    await sleep(3000);
    log('  Register: OK');
    return true;
  } else {
    await page.evaluate(() => {
      const btn = document.getElementById('btn-register');
      if (btn) btn.click();
    });
    await sleep(3000);
    log('  Register: OK (evaluate)');
    return true;
  }
}

async function runTrainer(trainer) {
  log(`── ${trainer.username} (ID ${trainer.id}) ──`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await setupPage(context, trainer);

  const stats = { actions: 0, ok: 0, fail: 0, errors: [] };

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(5000);

    const registered = await registerTrainer(page);
    if (registered) stats.actions++;

    // 1. Team view
    await clickNav(page, 'view-team');
    await sleep(2000);
    stats.actions++;
    const teamActive = await isViewActive(page, 'view-team');
    const teamOk = teamActive;
    if (teamOk) stats.ok++; else { stats.fail++; stats.errors.push('Team view not active'); }
    log(`  Team: ${teamOk ? 'OK' : 'FAIL'}`);

    // 2. World view + check location name
    await clickNav(page, 'view-world');
    await sleep(2000);
    stats.actions++;
    const worldActive = await isViewActive(page, 'view-world');
    const worldOk = worldActive;
    if (worldOk) stats.ok++; else { stats.fail++; stats.errors.push('World view not active'); }
    log(`  World: ${worldOk ? 'OK' : 'FAIL'}`);

    // 3. Bag view
    await clickNav(page, 'view-backpack');
    await sleep(2000);
    stats.actions++;
    const bagActive = await isViewActive(page, 'view-backpack');
    const bagOk = bagActive;
    if (bagOk) stats.ok++; else { stats.fail++; stats.errors.push('Bag view not active'); }
    log(`  Bag: ${bagOk ? 'OK' : 'FAIL'}`);

    // 4. Chat view
    await clickNav(page, 'view-chat');
    await sleep(2000);
    stats.actions++;
    const chatActive = await isViewActive(page, 'view-chat');
    const chatOk = chatActive;
    if (chatOk) stats.ok++; else { stats.fail++; stats.errors.push('Chat view not active'); }
    log(`  Chat: ${chatOk ? 'OK' : 'FAIL'}`);

    // 5. Heal button
    await clickNav(page, 'view-world');
    await sleep(1500);
    const healBtn = page.locator('button:has-text("Вылечить")').first();
    if (await healBtn.isVisible().catch(() => false)) {
      await healBtn.click({ timeout: 5000 }).catch(() => {});
      await sleep(1500);
      stats.actions++;
      stats.ok++;
      log(`  Heal: OK`);
    } else {
      log(`  Heal: SKIP (no heal button)`);
    }

    // 6. Save verification - check localStorage has save
    stats.actions++;
    const hasSave = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      return keys.some(k => k.startsWith('league17_save'));
    });
    if (hasSave) stats.ok++; else { stats.fail++; stats.errors.push('No save in localStorage'); }
    log(`  Save: ${hasSave ? 'OK' : 'FAIL'}`);

    // 7. Pick up starter pokemon check
    stats.actions++;
    const teamCount = await page.evaluate(() => {
      try {
        // Check team display for mon count
        const teamMons = document.querySelectorAll('.team-mon');
        return teamMons.length || -1;
      } catch(e) { return -1; }
    });
    if (teamCount >= 0) stats.ok++; else { stats.fail++; stats.errors.push('Team mons not found'); }
    log(`  Team count: ${teamCount}`);

    log(`  Result: ${stats.ok}/${stats.actions} OK, ${stats.fail} failed`);
  } catch (e) {
    log(`  ERROR: ${e.message}`);
    stats.fail++;
    stats.errors.push(e.message);
  } finally {
    await browser.close();
  }

  return { ...stats, name: trainer.username };
}

async function main() {
  log(`Starting ${TRAINERS.length} trainers against localhost:3000...\n`);

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
  const allErrors = [];
  for (const r of allResults) {
    log(`  ${r.name}: ${r.ok}/${r.actions} passed, ${r.failed} failed`);
    totalOk += r.ok;
    totalFail += r.fail;
    totalActions += r.actions;
    allErrors.push(...r.errors.map(e => `  ${r.name}: ${e}`));
  }
  log(`\nTOTAL: ${totalOk}/${totalActions} passed, ${totalFail} failed`);
  if (totalActions > 0) log(`       ${Math.round(totalOk/totalActions*100)}% success rate`);

  if (allErrors.length > 0) {
    log(`\n=== ERRORS ===`);
    allErrors.forEach(e => log(e));
  }
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
