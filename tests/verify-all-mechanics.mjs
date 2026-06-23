/**
 * Full game mechanics verification via browser.
 * Checks every major UI system step by step with screenshots + console errors.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const SCREENSHOT_DIR = 'tests/screenshots';
mkdirSync(SCREENSHOT_DIR, { recursive: true });

const URL = 'http://localhost:5173/?dev&admin';

let stepNum = 0;
const errors = [];
const warnings = [];

function step(name) {
  stepNum++;
  return `${String(stepNum).padStart(2, '0')}_${name.replace(/[^a-zA-Z0-9_]/g, '_')}`;
}

async function screenshot(page, name) {
  const filename = `${SCREENSHOT_DIR}/${name}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  return filename;
}

async function checkConsole(page, ctx) {
  const entries = page._consoleEntries || [];
  const errs = entries.filter(e => e.type() === 'error');
  const warns = entries.filter(e => e.type() === 'warning');

  if (errs.length > 0) {
    for (const e of errs) {
      errors.push({ ctx, msg: e.text().substring(0, 200) });
    }
  }
  if (warns.length > 0) {
    for (const e of warns) {
      warnings.push({ ctx, msg: e.text().substring(0, 200) });
    }
  }
  return { errs: errs.length, warns: warns.length };
}

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 480, height: 850 } });
  const page = await context.newPage();

  // Collect console messages
  const consoleEntries = [];
  page.on('console', msg => {
    consoleEntries.push(msg);
  });
  page._consoleEntries = consoleEntries;
  page.on('pageerror', err => {
    errors.push({ ctx: 'page', msg: err.message.substring(0, 200) });
  });

  // ===== 1. LOAD GAME =====
  console.log('\n=== 1. LOAD GAME ===');
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    console.log(`⚠️ Page load: ${e.message}`);
  }
  await page.waitForTimeout(3000);
  const s1 = await screenshot(page, step('load_game'));
  const c1 = await checkConsole(page, 'load');
  console.log(`Loaded. Errors: ${c1.errs}, Warnings: ${c1.warns}. Screenshot: ${s1}`);

  // ===== 2. AUTH / DEV MODE =====
  console.log('\n=== 2. AUTH / DEV MODE ===');
  await page.waitForTimeout(1000);
  const s2 = await screenshot(page, step('auth_dev_mode'));
  const c2 = await checkConsole(page, 'auth');
  // Check if we see game UI elements
  const bodyText = await page.textContent('body').catch(() => '');
  const hasGameUI = bodyText.includes('ПокеМир') || bodyText.includes('Карта') || bodyText.includes('Команда');
  console.log(`Auth check. Game UI visible: ${hasGameUI}. Errors: ${c2.errs}. Screenshot: ${s2}`);

  // ===== 3. WELCOME / STARTER CHECK =====
  console.log('\n=== 3. STARTER / WELCOME ===');
  // Look for starter selection UI or welcome modal
  const starterCards = await page.$$('.starter-card, [class*="starter"], .pokemon-card, .btn-starter').catch(() => []);
  console.log(`Starter cards found: ${starterCards.length}`);

  // Try to find the starter section
  let hasStarter = false;
  let starterText = '';
  for (const el of ['#starter-section', '.starter-grid', '#starters', '#starter-panel', '#starterModal', '.starter-modal']) {
    const found = await page.$(el).catch(() => null);
    if (found) {
      starterText = await found.textContent().catch(() => '');
      console.log(`  Found starter element: ${el}, text: "${starterText.substring(0, 100)}"`);
      hasStarter = true;
      break;
    }
  }

  // Check for "giveStarterMon" button or similar
  const starterBtn = await page.$('button[onclick*="Starter"], button[onclick*="starter"], .starter-confirm-btn').catch(() => null);
  if (starterBtn) {
    console.log('  Starter button found, clicking...');
    await starterBtn.click().catch(() => {});
    await page.waitForTimeout(2000);
  }
  // Check welcome modal
  const welcomeModal = await page.$('#welcome-modal, .modal-content, [class*="welcome"]').catch(() => null);
  if (welcomeModal) {
    console.log('  Welcome modal visible');
  }

  const s3 = await screenshot(page, step('starter_welcome'));
  const c3 = await checkConsole(page, 'starter');
  console.log(`Starter check done. Errors: ${c3.errs}. Screenshot: ${s3}`);

  // ===== 4. POKEMON TEAM =====
  console.log('\n=== 4. POKEMON TEAM ===');
  // Look for and click team tab
  const teamTab = await page.$('button[onclick*="team"], button[onclick*="Team"], .tab-team, #tab-team, a[href="#team"]').catch(() => null);
  if (teamTab) {
    await teamTab.click().catch(() => {});
    await page.waitForTimeout(1500);
  } else {
    // Try clicking on tab with text "Команда"
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Команда') || text.includes('Team') || text.includes('team')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  const s4 = await screenshot(page, step('pokemon_team'));
  const c4 = await checkConsole(page, 'team');
  console.log(`Team check done. Errors: ${c4.errs}. Screenshot: ${s4}`);

  // Check if any pokemon cards are visible
  const monCards = await page.$$('.mon-card, .pokemon-card, .team-member, [class*="pokemon"]').catch(() => []);
  console.log(`  Pokemon cards visible: ${monCards.length}`);

  // Click on a pokemon to see details
  if (monCards.length > 0) {
    await monCards[0].click().catch(() => {});
    await page.waitForTimeout(1500);
    const sDetail = await screenshot(page, step('pokemon_detail'));
    console.log(`  Pokemon detail screenshot: ${sDetail}`);
    // Close detail modal
    const closeBtn = await page.$('.modal-close, .close-btn, button:has-text("Закрыть")').catch(() => null);
    if (closeBtn) await closeBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // ===== 5. SHOP =====
  console.log('\n=== 5. SHOP ===');
  // Click shop tab
  const shopTab = await page.$('button[onclick*="shop"], button[onclick*="Shop"], .tab-shop, #tab-shop').catch(() => null);
  if (shopTab) {
    await shopTab.click().catch(() => {});
  } else {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Магазин') || text.includes('Shop') || text.includes('shop')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  await page.waitForTimeout(1000);
  const s5 = await screenshot(page, step('shop'));
  const c5 = await checkConsole(page, 'shop');
  console.log(`Shop check done. Errors: ${c5.errs}. Screenshot: ${s5}`);

  // ===== 6. INVENTORY =====
  console.log('\n=== 6. INVENTORY ===');
  const invTab = await page.$('button[onclick*="inventory"], button[onclick*="Inventory"], .tab-inv, #tab-inv').catch(() => null);
  if (invTab) {
    await invTab.click().catch(() => {});
  } else {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Инвентарь') || text.includes('Inventory') || text.includes('inventory') || text.includes('Рюкзак')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  await page.waitForTimeout(1000);
  const s6 = await screenshot(page, step('inventory'));
  const c6 = await checkConsole(page, 'inventory');
  console.log(`Inventory check done. Errors: ${c6.errs}. Screenshot: ${s6}`);

  // ===== 7. MAP / LOCATIONS =====
  console.log('\n=== 7. MAP / LOCATIONS ===');
  // Click map tab
  const mapTab = await page.$('button[onclick*="map"], button[onclick*="Map"], .tab-map, #tab-map').catch(() => null);
  if (mapTab) {
    await mapTab.click().catch(() => {});
  } else {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Карта') || text.includes('Map') || text.includes('map')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  await page.waitForTimeout(1500);
  const s7 = await screenshot(page, step('map_location'));
  const c7 = await checkConsole(page, 'map');
  console.log(`Map check done. Errors: ${c7.errs}. Screenshot: ${s7}`);

  // Try to navigate to a different location
  const navButtons = await page.$$('.btn-nav, .nav-btn, button[onclick*="renderLocation"], .location-btn').catch(() => []);
  if (navButtons.length > 0) {
    console.log(`  Nav buttons found: ${navButtons.length}`);
    await navButtons[0].click().catch(() => {});
    await page.waitForTimeout(2000);
    const s7b = await screenshot(page, step('map_navigate'));
    console.log(`  Navigate screenshot: ${s7b}`);
  }

  // ===== 8. CHAT =====
  console.log('\n=== 8. CHAT ===');
  const chatTab = await page.$('button[onclick*="chat"], button[onclick*="Chat"], .tab-chat, #tab-chat').catch(() => null);
  if (chatTab) {
    await chatTab.click().catch(() => {});
  } else {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Чат') || text.includes('Chat') || text.includes('chat')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1500);
        break;
      }
    }
  }
  await page.waitForTimeout(1500);
  const s8 = await screenshot(page, step('chat'));
  const c8 = await checkConsole(page, 'chat');
  console.log(`Chat check done. Errors: ${c8.errs}. Screenshot: ${s8}`);

  // Check chat input
  const chatInput = await page.$('#chat-input, .chat-input, input[placeholder*="чат"], textarea').catch(() => null);
  if (chatInput) {
    console.log('  Chat input found');
    await chatInput.fill('test message').catch(() => {});
    const sendBtn = await page.$('button:has-text("Отправить"), button:has-text("Send"), .btn-send').catch(() => null);
    if (sendBtn) {
      await sendBtn.click().catch(() => {});
      console.log('  Sent test message');
    }
    await page.waitForTimeout(500);
  }

  // ===== 9. NPC INTERACTIONS =====
  console.log('\n=== 9. NPC ===');
  const npcBtn = await page.$('#npc-buttons button, .npc-btn, button[class*="npc"]').catch(() => null);
  if (npcBtn) {
    const npcText = await npcBtn.textContent().catch(() => '');
    console.log(`  NPC button found: "${npcText}"`);
    await npcBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    const s9 = await screenshot(page, step('npc_dialog'));
    const c9 = await checkConsole(page, 'npc');
    console.log(`NPC check done. Errors: ${c9.errs}. Screenshot: ${s9}`);
    // Close NPC dialog
    const closeBtn = await page.$('.modal-close, .close-btn, button:has-text("Закрыть")').catch(() => null);
    if (closeBtn) await closeBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  } else {
    console.log('  No NPC buttons found on current screen');
    // Navigate to a pokecenter where NPCs should be
    // First go to map, find pokecenter link
    const mapBtns = await page.$$('button');
    for (const btn of mapBtns) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('Карта') || text.includes('Map')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(1000);
        break;
      }
    }
    const locBtns = await page.$$('button');
    for (const btn of locBtns) {
      const text = await btn.textContent().catch(() => '');
      if (text.toLowerCase().includes('pokecenter') || text.toLowerCase().includes('покецентр') || text.toLowerCase().includes('center')) {
        await btn.click().catch(() => {});
        await page.waitForTimeout(2000);
        break;
      }
    }
    await page.waitForTimeout(1000);
    const s9 = await screenshot(page, step('npc_pokecenter'));
    const c9 = await checkConsole(page, 'npc_center');
    console.log(`NPC center check. Errors: ${c9.errs}. Screenshot: ${s9}`);
  }

  // ===== 10. PROFILE =====
  console.log('\n=== 10. PROFILE ===');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Профиль') || text.includes('Profile') || text.includes('profile')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s10 = await screenshot(page, step('profile'));
  const c10 = await checkConsole(page, 'profile');
  console.log(`Profile check done. Errors: ${c10.errs}. Screenshot: ${s10}`);

  // ===== 11. TRAINERS TAB =====
  console.log('\n=== 11. TRAINERS ===');
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Тренеры') || text.includes('Trainers') || text.includes('trainers') || text.includes('Игроки')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s11 = await screenshot(page, step('trainers'));
  const c11 = await checkConsole(page, 'trainers');
  console.log(`Trainers check done. Errors: ${c11.errs}. Screenshot: ${s11}`);

  // ===== 12. LEADERBOARD =====
  console.log('\n=== 12. LEADERBOARD ===');
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Лидеры') || text.includes('Leaderboard') || text.includes('leaderboard') || text.includes('Рейтинг')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s12 = await screenshot(page, step('leaderboard'));
  const c12 = await checkConsole(page, 'leaderboard');
  console.log(`Leaderboard check done. Errors: ${c12.errs}. Screenshot: ${s12}`);

  // ===== 13. PVP =====
  console.log('\n=== 13. PVP ===');
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('PvP') || text.includes('pvp') || text.includes('PVP') || text.includes('Бой')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s13 = await screenshot(page, step('pvp'));
  const c13 = await checkConsole(page, 'pvp');
  console.log(`PvP check done. Errors: ${c13.errs}. Screenshot: ${s13}`);

  // ===== 14. TRADE =====
  console.log('\n=== 14. TRADE ===');
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Торговля') || text.includes('Trade') || text.includes('trade') || text.includes('Обмен')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s14 = await screenshot(page, step('trade'));
  const c14 = await checkConsole(page, 'trade');
  console.log(`Trade check done. Errors: ${c14.errs}. Screenshot: ${s14}`);

  // ===== 15. EVOLUTION =====
  console.log('\n=== 15. EVOLUTION ===');
  // Evolution is usually triggered from inventory or team
  // Check if there's an evolution button anywhere
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Эволюция') || text.includes('Evolution') || text.includes('evolution')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s15 = await screenshot(page, step('evolution'));
  const c15 = await checkConsole(page, 'evolution');
  console.log(`Evolution check done. Errors: ${c15.errs}. Screenshot: ${s15}`);

  // ===== 16. QUEST / ACHIEVEMENTS / ADMIN =====
  console.log('\n=== 16. QUESTS & ACHIEVEMENTS ===');
  // Check for quests tab
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Квесты') || text.includes('Quests') || text.includes('quests') || text.includes('Задания')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s16 = await screenshot(page, step('quests'));
  const c16 = await checkConsole(page, 'quests');
  console.log(`Quests check done. Errors: ${c16.errs}. Screenshot: ${s16}`);

  // Check achievements
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Достижения') || text.includes('Achievements') || text.includes('achievements')) {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const s16b = await screenshot(page, step('achievements'));
  console.log(`Achievements screenshot: ${s16b}`);

  // Check admin panel
  console.log('\n=== ADMIN PANEL ===');
  for (const btn of await page.$$('button')) {
    const text = await btn.textContent().catch(() => '');
    if (text.includes('Админ') || text.includes('Admin') || text.includes('admin') || text === '⚙️') {
      await btn.click().catch(() => {});
      await page.waitForTimeout(1500);
      break;
    }
  }
  const adminS = await screenshot(page, step('admin_panel'));
  const cAdmin = await checkConsole(page, 'admin');
  console.log(`Admin panel check. Errors: ${cAdmin.errs}. Screenshot: ${adminS}`);

  // ===== REPORT =====
  console.log('\n\n========================================');
  console.log('         VERIFICATION REPORT');
  console.log('========================================');
  console.log(`\nScreenshots saved to: ${SCREENSHOT_DIR}`);

  if (errors.length === 0) {
    console.log('\n✅ ERRORS: 0 — no JS console errors detected');
  } else {
    console.log(`\n❌ ERRORS: ${errors.length}`);
    for (const e of errors) {
      console.log(`  [${e.ctx}] ${e.msg}`);
    }
  }

  if (warnings.length === 0) {
    console.log('\n✅ WARNINGS: 0 — no console warnings');
  } else {
    console.log(`\n⚠️ WARNINGS: ${warnings.length}`);
    for (const w of warnings) {
      console.log(`  [${w.ctx}] ${w.msg}`);
    }
  }

  // Try to get the final game state
  const finalText = await page.textContent('body').catch(() => '');
  console.log(`\nGame state indicators:`);
  console.log(`  Has "ПокеМир": ${finalText.includes('ПокеМир')}`);
  console.log(`  Has "Карта": ${finalText.includes('Карта')}`);
  console.log(`  Has "Команда": ${finalText.includes('Команда')}`);
  console.log(`  Has "Магазин": ${finalText.includes('Магазин')}`);
  console.log(`  Has "Инвентарь": ${finalText.includes('Инвентарь')}`);
  console.log(`  Has "Чат": ${finalText.includes('Чат')}`);

  await browser.close();
  console.log('\n✅ Verification complete.');
}

run().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
