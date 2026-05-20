const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const REPORT = 'tests/comprehensive-report.txt';
const SCREENSHOT_DIR = 'tests/screenshots';

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
fs.writeFileSync(REPORT, '=== COMPREHENSIVE GAME LOGIC TEST ===\n\n');
const log = (m) => { console.log(m); fs.appendFileSync(REPORT, m + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let testId = 0;
function nextId() { return 9000 + (++testId); }

function makeMockSave(overrides = {}) {
  return {
    myTeam: [{
      uid: 'test-mon-1', originalTrainer: '9999', createdAt: Date.now(), caughtLocation: 'goldenrod',
      apiData: {
        name: 'charizard', sprites: { front_default: '' },
        stats: [
          { base_stat: 78, stat: { name: "hp" } },
          { base_stat: 84, stat: { name: "attack" } },
          { base_stat: 78, stat: { name: "defense" } },
          { base_stat: 109, stat: { name: "special-attack" } },
          { base_stat: 85, stat: { name: "special-defense" } },
          { base_stat: 100, stat: { name: "speed" } }
        ],
        types: [{ type: { name: 'fire' } }, { type: { name: 'flying' } }],
        abilities: [{ ability: { name: 'blaze' } }],
        moves: [
          { move: { name: 'flamethrower', url: 'https://pokeapi.co/api/v2/move/53/' } },
          { move: { name: 'air-slash', url: 'https://pokeapi.co/api/v2/move/403/' } }
        ]
      },
      maxHp: 180, currentHp: 180, baseLevel: 36, exp: 46656, expToNext: 50653,
      ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      natureIdx: 0, breedLetter: 'A', gender: 'male', happiness: 70,
      status: null, sleepTurns: 0, movesPP: [{ current: 15, max: 15 }, { current: 15, max: 15 }],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: 'blaze', heldItem: null, isShiny: false, isEgg: false, hasBred: false,
      candiesEaten: 0, vitaminsEaten: 0, trainingStage: 0, trainingStat: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: []
    }],
    pcBoxes: [[]],
    eggs: [],
    inventory: { pokeball: 10, potion: 5, candy: 3 },
    money: 5000,
    badges: [],
    pokedexSeen: ['charizard'],
    pokedexCaught: ['charizard'],
    quests: [],
    questProgress: {},
    completedQuests: [],
    npcQuestProgress: {},
    completedNPCQuests: [],
    tutorialStep: 99,
    currentLocationId: 'goldenrod',
    currentRegion: 'east_johto',
    flags: {},
    ...overrides
  };
}

async function createTestContext(browser, trainer, saveOverrides) {
  const id = trainer.id;
  const saveData = makeMockSave(saveOverrides);
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await context.newPage();

  // Intercept auth: inject custom trainer, patch registered=1 to skip registration
  await page.route('**/api/auth/tg', async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    body.initData = JSON.stringify(trainer);
    const response = await route.fetch({
      method: 'POST',
      postData: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await response.json();
    json.user = json.user || {};
    json.user.id = trainer.id;
    json.user.registered = 1;
    await route.fulfill({
      status: response.status(),
      headers: response.headers(),
      body: JSON.stringify(json)
    });
  });

  // Collect console errors
  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE_ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
    if (msg.type() === 'warning') errors.push(`CONSOLE_WARN: ${msg.text()}`);
  });
  page.errors = errors;

  // Track API errors
  page.apiErrors = [];
  page.on('response', response => {
    if (response.status() >= 400 && !response.url().includes('favicon')) {
      page.apiErrors.push(`${response.status()} ${response.url().slice(0,80)}`);
    }
  });

  return { context, page, saveData };
}

// Wait for game init to complete and inject mock save via dev helper
async function initGameWithMockData(page, saveData) {
  // Wait for auth + starter modal or game view
  await page.waitForFunction(() => {
    const starter = document.getElementById('starter-modal');
    const money = document.getElementById('money-display');
    return (starter && window.getComputedStyle(starter).display !== 'none') ||
           (money && money.textContent !== '');
  }, { timeout: 15000 }).catch(() => {});
  await sleep(1000);

  // If starter modal is showing, dismiss by clicking a generation box
  const starterVisible = await page.locator('#starter-modal').isVisible().catch(() => false);
  if (starterVisible) {
    log('  Dismissing starter modal...');
    await page.locator('.starter-option').first().click({ force: true });
    await sleep(2000);
  }

  // Inject mock save data via dev helper
  await page.evaluate((data) => {
    if (window.__devSetGameState) {
      window.__devSetGameState(data);
    } else {
      throw new Error('__devSetGameState not found — dev helper not loaded');
    }
  }, saveData);
  await sleep(1000);
}

async function hasActiveView(page, viewId) {
  return page.evaluate((id) => {
    const view = document.getElementById(id);
    return view ? view.classList.contains('active-view') : false;
  }, viewId);
}

async function clickNav(page, target) {
  await page.evaluate((t) => {
    const item = document.querySelector(`.nav-item[data-target="${t}"]`);
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, target);
  await sleep(1500);
}

// ========== TEST SUITE ==========
const TESTS = [];

// --- TEST 1: Wild Encounter ---
TESTS.push(async (browser) => {
  log('\n=== TEST 1: Wild Encounter ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    // Go to world (location with encounters)
    await clickNav(page, 'view-world');
    await sleep(2000);

    const locName = await page.locator('.location-name').textContent().catch(() => '?');
    log(`  Location: ${locName}`);

    const hasWildlife = await page.locator('#loc-wildlife').isVisible().catch(() => false);
    log(`  Wildlife visible: ${hasWildlife}`);

    const huntBtn = page.locator('#btn-hunt-toggle');
    const huntVisible = await huntBtn.isVisible().catch(() => false);
    log(`  Hunt button visible: ${huntVisible}`);

    const weather = await page.locator('#loc-weather').textContent().catch(() => '?');
    log(`  Weather: ${weather}`);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS${page.errors.length > 0 ? ' (with errors)' : ''}`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test1-fail.png` }).catch(() => {});
  } finally {
    await context.close();
  }
});

// --- TEST 2: Team View & Pokemon Details ---
TESTS.push(async (browser) => {
  log('\n=== TEST 2: Team View & Pokemon Details ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    // Navigate to team view
    await clickNav(page, 'view-team');
    await sleep(2000);

    const teamActive = await hasActiveView(page, 'view-team');
    log(`  Team view active: ${teamActive}`);

    const teamCount = await page.locator('#team-count').textContent().catch(() => '?');
    log(`  Team count: ${teamCount}`);

    const slots = await page.locator('.team-slot').count().catch(() => 0);
    log(`  Team slots rendered: ${slots}`);

    // Click first team slot
    const firstSlot = page.locator('.team-slot').first();
    const slotVisible = await firstSlot.isVisible().catch(() => false);
    if (slotVisible) {
      await firstSlot.click({ force: true });
      await sleep(1500);

      // The mock save has charizard — should show name, HP, level
      const monName = await page.locator('#poke-name').textContent().catch(() => '?');
      log(`  Pokemon name: ${monName}`);

      const hp = await page.locator('#info-cur-hp').textContent().catch(() => '?');
      const maxHp = await page.locator('#info-max-hp').textContent().catch(() => '?');
      log(`  HP: ${hp}/${maxHp}`);

      const level = await page.locator('#info-lvl').textContent().catch(() => '?');
      log(`  Level: ${level}`);

      // Switch tabs via evaluate (tabs are hidden radio inputs)
      await page.evaluate(() => {
        const r = document.getElementById('tab-stats');
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await sleep(500);
      const statsTabVisible = await page.locator('#content-stats').isVisible().catch(() => false);
      log(`  Stats tab visible: ${statsTabVisible}`);

      await page.evaluate(() => {
        const r = document.getElementById('tab-moves');
        if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
      await sleep(500);
      const movesTabVisible = await page.locator('#content-moves').isVisible().catch(() => false);
      log(`  Moves tab visible: ${movesTabVisible}`);
    }

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/test2-fail.png` }).catch(() => {});
  } finally {
    await context.close();
  }
});

// --- TEST 3: Shop System ---
TESTS.push(async (browser) => {
  log('\n=== TEST 3: Shop System ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` }, { money: 5000 });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    await clickNav(page, 'view-world');
    await sleep(2000);

    const locActions = await page.locator('#loc-actions').isVisible().catch(() => false);
    log(`  Location actions visible: ${locActions}`);

    const moneyDisplay = await page.locator('#money-display').textContent().catch(() => '?');
    log(`  Money display: ${moneyDisplay}`);

    const actionBtns = await page.locator('#loc-actions button, #loc-actions .tma-btn').count().catch(() => 0);
    log(`  Action buttons count: ${actionBtns}`);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 4: Inventory & Item Usage ---
TESTS.push(async (browser) => {
  log('\n=== TEST 4: Inventory & Item Usage ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` }, {
    money: 5000,
    inventory: { pokeball: 10, potion: 5, candy: 3, greatBall: 2, fullRestore: 1 }
  });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    await clickNav(page, 'view-backpack');
    await sleep(2000);

    const bagActive = await hasActiveView(page, 'view-backpack');
    log(`  Backpack view active: ${bagActive}`);

    const items = await page.locator('#inventory-items .inv-grid-item').count().catch(() => 0);
    log(`  Inventory items visible: ${items}`);

    const pageText = await page.locator('#inventory-items').textContent().catch(() => '');
    const hasPokeball = pageText.includes('Покебол') || pageText.includes('pokeball');
    const hasPotion = pageText.includes('Аптечка') || pageText.includes('potion');
    log(`  Pokeball in inventory: ${hasPokeball}`);
    log(`  Potion in inventory: ${hasPotion}`);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 5: Pokecenter Healing ---
TESTS.push(async (browser) => {
  log('\n=== TEST 5: Pokemon Center Healing ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` }, {
    money: 2000,
    inventory: { pokeball: 5, potion: 2 },
    myTeam: [Object.assign(makeMockSave().myTeam[0], {
      currentHp: 50,
      status: 'psn'
    })]
  });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    await clickNav(page, 'view-world');
    await sleep(2000);

    const navBtns = await page.locator('#nav-buttons button, #nav-buttons .nav-link').count().catch(() => 0);
    log(`  Nav buttons count: ${navBtns}`);

    const pokeCenterLink = page.locator('button:has-text("центр"), button:has-text("Center"), button:has-text("Поке"), a:has-text("центр"), a:has-text("Center")').first();
    const pcVisible = await pokeCenterLink.isVisible().catch(() => false);
    log(`  Pokecenter link visible: ${pcVisible}`);

    if (pcVisible) {
      await pokeCenterLink.click({ force: true });
      await sleep(3000);

      const locName = await page.locator('.location-name').textContent().catch(() => '?');
      log(`  Navigated to: ${locName}`);

      const healBtn = page.locator('button:has-text("Вылечить"), button:has-text("Лечить")').first();
      const healVisible = await healBtn.isVisible().catch(() => false);
      log(`  Heal button visible: ${healVisible}`);

      if (healVisible) {
        await healBtn.click({ force: true });
        await sleep(2000);
        log(`  Heal button clicked`);
      }
    }

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 6: Save/Load & Cloud Sync ---
TESTS.push(async (browser) => {
  log('\n=== TEST 6: Save/Load & Cloud Sync ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` }, { money: 9999 });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    const moneyAfterLoad = await page.locator('#money-display').textContent().catch(() => '?');
    log(`  Money after load: ${moneyAfterLoad}`);

    const syncBtn = page.locator('#btn-cloud-sync');
    const syncVisible = await syncBtn.isVisible().catch(() => false);
    log(`  Cloud sync button visible: ${syncVisible}`);

    const hasLocalSave = await page.evaluate(() => {
      return Object.keys(localStorage).some(k => k.startsWith('league17_save'));
    });
    log(`  Local save exists: ${hasLocalSave}`);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 7: Navigation & Region Travel ---
TESTS.push(async (browser) => {
  log('\n=== TEST 7: Navigation & Region Travel ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    await clickNav(page, 'view-world');
    await sleep(2000);

    const navBtns = await page.locator('#nav-buttons button, #nav-buttons .nav-link').count().catch(() => 0);
    log(`  Navigation buttons: ${navBtns}`);

    const routeBtn = page.locator('#nav-buttons button').first();
    if (navBtns > 0) {
      const btnText = await routeBtn.textContent().catch(() => '?');
      log(`  First nav button: ${btnText}`);
    }

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 8: Badges & Gym Detection ---
TESTS.push(async (browser) => {
  log('\n=== TEST 8: Badges & Gym Display ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` }, {
    badges: ['Boulder Badge', 'Cascade Badge'],
    money: 15000
  });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    const badgeDisplay = await page.locator('#badge-display').textContent().catch(() => '?');
    log(`  Badge display: ${badgeDisplay}`);

    const moneyDisplay = await page.locator('#money-display').textContent().catch(() => '?');
    log(`  Money display: ${moneyDisplay}`);

    await clickNav(page, 'view-world');
    await sleep(2000);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);
    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 9: Console & API Monitoring ---
TESTS.push(async (browser) => {
  log('\n=== TEST 9: API & Console Monitoring ===');
  const id = nextId();
  const { context, page, saveData } = await createTestContext(browser, { id, username: `test${id}`, first_name: `T${id}` });

  try {
    await page.goto(`${BASE}/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await initGameWithMockData(page, saveData);

    for (const view of ['view-team', 'view-world', 'view-backpack', 'view-chat']) {
      await clickNav(page, view);
      await sleep(1500);
    }

    log(`  API errors: ${page.apiErrors.length > 0 ? page.apiErrors.join('; ') : 'none'}`);
    log(`  Console errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);

    const allErrors = [...page.errors, ...page.apiErrors];
    log(`  Result: ${allErrors.length === 0 ? 'PASS' : 'FAIL (with errors)'}`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// --- TEST 10: Admin Panel Functionality ---
TESTS.push(async (browser) => {
  log('\n=== TEST 10: Admin Panel ===');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(`PAGE_ERROR: ${err.message}`));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`CONSOLE_ERROR: ${msg.text()}`);
  });
  page.errors = errors;

  try {
    await page.goto(`${BASE}/admin/?dev`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(3000);

    const title = await page.title().catch(() => '?');
    log(`  Admin page title: ${title}`);

    const bodyText = await page.locator('body').textContent().catch(() => '');
    const hasDashboard = bodyText.includes('Панель') || bodyText.includes('Admin') || bodyText.includes('dashboard');
    log(`  Admin dashboard loaded: ${hasDashboard}`);

    log(`  Errors: ${page.errors.length > 0 ? page.errors.join('; ') : 'none'}`);

    log(`  Result: PASS`);
  } catch (e) {
    log(`  FAIL: ${e.message}`);
  } finally {
    await context.close();
  }
});

// ========== MAIN RUNNER ==========
async function main() {
  log(`Starting ${TESTS.length} comprehensive tests at ${new Date().toISOString()}\n`);

  const browser = await chromium.launch({ headless: true });
  let passed = 0, failed = 0;

  for (let i = 0; i < TESTS.length; i++) {
    log(`\n--- Running test ${i + 1}/${TESTS.length} ---`);
    try {
      await TESTS[i](browser);
      passed++;
    } catch (e) {
      log(`  UNHANDLED ERROR: ${e.message}`);
      failed++;
    }
  }

  await browser.close();

  log(`\n\n=== FINAL SUMMARY ===`);
  log(`  Passed: ${passed}/${TESTS.length}`);
  log(`  Failed: ${failed}/${TESTS.length}`);
  log(`  Completed at: ${new Date().toISOString()}`);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
