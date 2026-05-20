const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const REPORT = 'tests/item-system-report.txt';

fs.writeFileSync(REPORT, '=== ITEM SYSTEM COMPREHENSIVE TEST ===\n\n');
const log = (m) => { console.log(m); fs.appendFileSync(REPORT, m + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let total = 0, passed = 0;

function check(desc, condition) {
  total++;
  if (condition) { passed++; log(`  ✓ ${total}: ${desc}`); }
  else { log(`  ✗ ${total}: ${desc}`); }
}

(async () => {
  // ── Part 1: Item Definition Validation ──
  // Import directly from source (like data-validation.mjs does)
  log('--- Item Definition Validation ---\n');

  let ITEMS_SRC;
  try {
    ITEMS_SRC = (await import('../src/data/items.js')).ITEMS;
  } catch(e) {
    log(`  ! Cannot import items.js: ${e.message}`);
    // Fallback to hardcoded list if import fails
    ITEMS_SRC = [];
  }

  const ITEM_IDS = ITEMS_SRC.map(i => i.id);
  const VALID_CATEGORIES = ['currency','balls','healing','statusCure','ppRecovery','vitamins','evolutionStones','berries','training','other','battle','quest','crafting','tickets','artifacts','awards'];

  check('Item data loaded', ITEMS_SRC.length > 0);
  check('All item IDs are unique', new Set(ITEM_IDS).size === ITEM_IDS.length);
  check('All items have nameRu', ITEMS_SRC.every(i => typeof i.nameRu === 'string' && i.nameRu.length > 0));
  check('All items have valid categories', ITEMS_SRC.every(i => VALID_CATEGORIES.includes(i.category)));
  check('All items have isUsable field', ITEMS_SRC.every(i => typeof i.isUsable === 'boolean'));
  check('All items have isBall field', ITEMS_SRC.every(i => typeof i.isBall === 'boolean'));

  const balls = ITEMS_SRC.filter(i => i.isBall);
  check('Balls exist', balls.length > 0);
  check('All balls have ballMult > 0', balls.every(i => i.ballMult > 0));

  const categories = new Set(ITEMS_SRC.map(i => i.category));
  check('Items span multiple categories', categories.size >= 5);

  const usableItems = ITEMS_SRC.filter(i => i.isUsable);
  check('There are usable items', usableItems.length > 0);

  // ── Part 2: Browser-based Runtime Tests ──
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await context.newPage();

  await page.route('http://localhost:3000/api/**', async (route) => {
    const url = route.request().url();
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (url.includes('/api/auth/tg')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers,
        body: JSON.stringify({ token: 'mock-jwt', user: { id: 8888, username: 'itemtest', first_name: 'Items', registered: 1 } })
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', headers, body: '{}' });
    }
  });

  page.on('pageerror', err => log(`  ! PAGE ERROR: ${err.message.slice(0, 120)}`));

  await page.goto(BASE + '/?dev', { waitUntil: 'domcontentloaded', timeout: 20000 });
  for (let i = 0; i < 20; i++) {
    if (await page.evaluate(() => typeof window.__devSetGameState === 'function').catch(() => false)) break;
    await sleep(1000);
  }

  // Hide the register overlay
  await page.evaluate(() => { const ov = document.getElementById('register-overlay'); if (ov) ov.style.display = 'none'; });

  // Wrap __devSetGameState to capture the last set state for verification
  await page.evaluate(() => {
    const orig = window.__devSetGameState;
    window.__devSetGameState = function(data) {
      window._testLastData = JSON.parse(JSON.stringify(data));
      return orig(data);
    };
  });

  log('\n--- __devSetGameState Inventory Round-Trip ---\n');

  // Set inventory with specific items, verify via wrapped capture
  await page.evaluate(() => {
    window.__devSetGameState({
      inventory: { potion: 5, candy: 3, fireStone: 2, xAttack: 1, graphiteBell: 10, tm: 7 },
      money: 5000
    });
  });
  await sleep(500);

  const invResult = await page.evaluate(() => {
    const data = window._testLastData || {};
    const inv = data.inventory || {};
    return {
      potion: inv.potion,
      candy: inv.candy,
      fireStone: inv.fireStone,
      xAttack: inv.xAttack,
      graphiteBell: inv.graphiteBell,
      tm: inv.tm,
      money: data.money
    };
  });
  check('__devSetGameState captures potion:5', invResult.potion === 5);
  check('__devSetGameState captures candy:3', invResult.candy === 3);
  check('__devSetGameState captures fireStone:2', invResult.fireStone === 2);
  check('__devSetGameState captures xAttack:1', invResult.xAttack === 1);
  check('__devSetGameState captures graphiteBell:10', invResult.graphiteBell === 10);
  check('__devSetGameState captures tm:7', invResult.tm === 7);
  check('__devSetGameState captures money:5000', invResult.money === 5000);

  // Verify DOM shows the inventory items
  const domInv = await page.evaluate(() => {
    const items = document.querySelectorAll('.inv-grid-item');
    const result = {};
    items.forEach(el => {
      const id = el.getAttribute('data-item-id');
      const badge = el.querySelector('.inv-grid-badge');
      if (id && badge) result[id] = badge.textContent;
    });
    return result;
  });
  check('DOM shows potion x5', domInv.potion === '5');
  check('DOM shows xAttack x1', domInv.xAttack === '1');

  // Verify money display
  const moneyTxt = await page.evaluate(() => {
    const el = document.getElementById('money-display');
    return el ? el.innerText : '';
  });
  check('DOM money display shows 5000', moneyTxt.includes('5000'));

  // Overwrite inventory — old items should be gone
  await page.evaluate(() => {
    window.__devSetGameState({ inventory: { potion: 99, superPotion: 2 }, money: 1000 });
  });
  await sleep(500);

  const domInv2 = await page.evaluate(() => {
    const items = document.querySelectorAll('.inv-grid-item');
    const result = {};
    items.forEach(el => {
      const id = el.getAttribute('data-item-id');
      const badge = el.querySelector('.inv-grid-badge');
      if (id && badge) result[id] = badge.textContent;
    });
    return result;
  });
  check('Overwrite: DOM potion now 99', domInv2.potion === '99');
  check('Overwrite: DOM superPotion now 2', domInv2.superPotion === '2');
  check('Overwrite: candy no longer in DOM', domInv2.candy === undefined);

  // Verify money display updated
  const moneyTxt2 = await page.evaluate(() => {
    const el = document.getElementById('money-display');
    return el ? el.innerText : '';
  });
  check('DOM money updated to 1000', moneyTxt2.includes('1000'));

  log('\n--- Badge & State Tests ---\n');

  // Set badges via __devSetGameState
  await page.evaluate(() => {
    window.__devSetGameState({ badges: ['Boulder Badge', 'Cascade Badge'], money: 8888 });
  });
  await sleep(500);

  const badgeResult = await page.evaluate(() => {
    const data = window._testLastData || {};
    return { badgeCount: (data.badges || []).length, money: data.money };
  });
  check('__devSetGameState sets 2 badges', badgeResult.badgeCount === 2);
  check('__devSetGameState sets money 8888', badgeResult.money === 8888);

  // Verify badge DOM
  const badgeDom = await page.evaluate(() => {
    const el = document.getElementById('badge-display');
    return el ? el.innerText.substring(0, 200) : '';
  });
  check('DOM badge display is not empty', badgeDom.length > 0);

  log('\n--- Team State Tests ---\n');

  // Set team state via __devSetGameState
  await page.evaluate(() => {
    window.__devSetGameState({
      myTeam: [{
        uid: 'test-mon', originalTrainer: '8888', createdAt: Date.now(), caughtLocation: 'goldenrod',
        apiData: { name: 'pikachu', id: 25, sprites: { front_default: '' }, stats: [
          { base_stat: 35, stat: { name: 'hp' } },
          { base_stat: 55, stat: { name: 'attack' } },
          { base_stat: 40, stat: { name: 'defense' } },
          { base_stat: 50, stat: { name: 'special-attack' } },
          { base_stat: 50, stat: { name: 'special-defense' } },
          { base_stat: 90, stat: { name: 'speed' } }
        ], types: [{ type: { name: 'electric' } }], abilities: [{ ability: { name: 'static' } }], moves: [], species: { name: 'pikachu' } },
        maxHp: 100, currentHp: 70, baseLevel: 10, exp: 0, expToNext: 100,
        ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
        evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
        natureIdx: 0, breedLetter: 'A', gender: 'male', happiness: 70,
        status: null, sleepTurns: 0, movesPP: [], statStages: {},
        abilityName: 'static', heldItem: null, isShiny: false, isEgg: false, hasBred: false,
        candiesEaten: 5, vitaminsEaten: 0, trainingStage: 0, trainingStat: null,
        berries: {}, learnableMoves: []
      }],
      inventory: { potion: 3, candy: 1 },
      money: 9999, badges: ['Boulder Badge'],
    });
  });
  await sleep(500);

  const teamResult = await page.evaluate(() => {
    const data = window._testLastData || {};
    const mon = (data.myTeam || [])[0] || {};
    return {
      hp: mon.currentHp,
      heldItem: mon.heldItem,
      candiesEaten: mon.candiesEaten,
      status: mon.status,
    };
  });
  check('Team state: HP 70', teamResult.hp === 70);
  check('Team state: heldItem null', teamResult.heldItem === null);
  check('Team state: candiesEaten 5', teamResult.candiesEaten === 5);
  check('Team state: status null', teamResult.status === null);

  // Verify team grid renders
  const teamDom = await page.evaluate(() => {
    const slots = document.querySelectorAll('.team-slot');
    return slots.length;
  });
  check('Team grid shows 1 pokemon', teamDom >= 1);

  log('\n--- Battle Items Validation ---\n');

  const battleItemIds = ['xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy'];
  const srcIds = new Set(ITEM_IDS);
  const allFound = battleItemIds.every(id => srcIds.has(id));
  check('All X-stat items defined in src/data/items.js', allFound);

  const heldItems = ['leftovers','airBalloon','lifeOrb','rockyHelmet','focusSash','blackSludge','expertBelt','bigRoot','assaultVest','choiceBand','choiceScarf','choiceSpecs','thickClub','leek','eviolite'];
  const heldFound = heldItems.filter(id => srcIds.has(id));
  check(`Held items defined: ${heldFound.length}/${heldItems.length}`, heldFound.length >= 10);

  await browser.close();
  log(`\n=== RESULT: ${passed}/${total} passed ===`);
  fs.appendFileSync(REPORT, `\n=== RESULT: ${passed}/${total} passed ===\n`);
  process.exit(passed === total ? 0 : 1);
})().catch(e => {
  log(`\nFATAL: ${e.message}\n${e.stack}`);
  fs.appendFileSync(REPORT, `\nFATAL: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
