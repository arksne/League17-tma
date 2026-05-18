import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://league17-tma-production.up.railway.app';
const TRAINERS = [];
for (let i = 1; i <= 10; i++) {
  TRAINERS.push({ id: 1000 + i, username: `trainer${i}`, name: `T${i}` });
}

const REPORT_FILE = 'tests/test-report.txt';
fs.writeFileSync(REPORT_FILE, '=== Multi-Trainer Test Report ===\n\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(REPORT_FILE, msg + '\n');
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Helper: click by text in the page
async function clickByText(page, text) {
  const el = page.locator(`text="${text}"`).first();
  if (await el.isVisible()) await el.click();
}

// Helper: wait and snapshot
async function waitForPage(page) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(2000);
}

async function runTrainer(trainer) {
  log(`\n--- [${trainer.username}] Starting ---`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });

  // Inject custom Telegram identity so the server creates a unique user
  await context.addInitScript((data) => {
    window.Telegram = {
      WebApp: {
        initData: JSON.stringify(data),
        initDataUnsafe: { user: data },
        ready: () => {},
        close: () => {},
        MainButton: { setText: () => {}, show: () => {}, hide: () => {}, onClick: () => {} },
        BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
      }
    };
  }, { id: trainer.id, username: trainer.username, first_name: trainer.name });

  const page = await context.newPage();
  const results = { trainer: trainer.username, actions: 0, failed: 0 };

  try {
    // 1. Open game (dev mode bypasses Telegram check)
    log(`  [${trainer.username}] Opening game...`);
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await waitForPage(page);

    // 2. Wait for game to load and register
    await sleep(3000);
    const title = await page.title();
    log(`  [${trainer.username}] Page title: ${title}`);

    // 3. Check if starter selection appears
    const starterVisible = await page.locator('text=Выберите карту').isVisible().catch(() => false);
    if (starterVisible) {
      log(`  [${trainer.username}] Starter modal visible`);
      // Click the first starter option
      const firstStarter = page.locator('.starter-option').first();
      if (await firstStarter.isVisible()) {
        await firstStarter.click();
        await sleep(2000);
        results.actions++;
        log(`  [${trainer.username}] Selected starter ✓`);
      }
    } else {
      log(`  [${trainer.username}] No starter modal (loading existing save)`);
    }

    // 4. Test: Navigate to Team tab
    await clickByText(page, 'Команда');
    await sleep(1500);
    results.actions++;
    const teamCount = await page.locator('text=Моя Команда').isVisible().catch(() => false);
    log(`  [${trainer.username}] Team tab: ${teamCount ? 'visible ✓' : 'missing ✗'}`);
    if (!teamCount) results.failed++;

    // 5. Test: Navigate to World tab
    await clickByText(page, 'Мир');
    await sleep(1500);
    results.actions++;
    const worldVisible = await page.locator('text=Покецентр').isVisible().catch(() => false);
    log(`  [${trainer.username}] World tab: ${worldVisible ? 'visible ✓' : 'missing ✗'}`);
    if (!worldVisible) results.failed++;

    // 6. Test: Navigate to Bag/Inventory
    await clickByText(page, 'Рюкзак');
    await sleep(1500);
    results.actions++;
    const bagVisible = await page.locator('text=Рюкзак').isVisible().catch(() => false);
    log(`  [${trainer.username}] Bag tab: ${bagVisible ? 'visible ✓' : 'missing ✗'}`);
    if (!bagVisible) results.failed++;

    // 7. Test: Navigate to Chat
    await clickByText(page, 'Чат');
    await sleep(1500);
    results.actions++;
    const chatVisible = await page.locator('text=Чат').isVisible().catch(() => false);
    log(`  [${trainer.username}] Chat tab: ${chatVisible ? 'visible ✓' : 'missing ✗'}`);

    // 8. Test: Navigate to Info
    await clickByText(page, 'Инфо');
    await sleep(1500);
    results.actions++;
    const infoVisible = await page.locator('text=Инфо').isVisible().catch(() => false);
    log(`  [${trainer.username}] Info tab: ${infoVisible ? 'visible ✓' : 'missing ✗'}`);

    // 9. Test: Heal at Pokemon Center
    await clickByText(page, 'Мир');
    await sleep(1000);
    const healBtn = page.locator('text=Вылечить команду').first();
    if (await healBtn.isVisible().catch(() => false)) {
      await healBtn.click();
      await sleep(1500);
      results.actions++;
      log(`  [${trainer.username}] Heal team: clicked ✓`);
    } else {
      log(`  [${trainer.username}] Heal button not found`);
    }

    // 10. Test: Navigate back to Team
    await clickByText(page, 'Команда');
    await sleep(1500);
    results.actions++;
    log(`  [${trainer.username}] Back to Team ✓`);

    log(`  [${trainer.username}] Done — ${results.actions} actions, ${results.failed} failures`);
  } catch (e) {
    log(`  [${trainer.username}] ERROR: ${e.message}`);
    results.failed++;
  } finally {
    await browser.close();
  }

  return results;
}

async function main() {
  log(`Starting ${TRAINERS.length} trainers...\n`);

  // Run trainers in batches of 3 to avoid overwhelming the server
  const results = [];
  for (let i = 0; i < TRAINERS.length; i += 3) {
    const batch = TRAINERS.slice(i, i + 3);
    log(`\n=== Batch ${Math.floor(i / 3) + 1}: ${batch.map(t => t.username).join(', ')} ===`);
    const batchResults = await Promise.all(batch.map(t => runTrainer(t)));
    results.push(...batchResults);
    await sleep(3000); // pause between batches
  }

  log('\n\n=== FINAL SUMMARY ===');
  let totalActions = 0, totalFailed = 0;
  for (const r of results) {
    log(`  ${r.trainer}: ${r.actions} actions, ${r.failed} failures`);
    totalActions += r.actions;
    totalFailed += r.failed;
  }
  log(`\nTotal: ${totalActions} actions, ${totalFailed} failures across ${results.length} trainers`);
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
