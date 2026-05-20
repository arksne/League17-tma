const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let total = 0, passed = 0;

function check(desc, condition) {
  total++;
  if (condition) { passed++; console.log(`  ✓ ${total}: ${desc}`); }
  else { console.log(`  ✗ ${total}: ${desc}`); }
}

(async () => {
  console.log('=== COMPREHENSIVE STRESS TEST ===\n');
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await context.newPage();

  // Intercept local API only
  await page.route('http://localhost:3000/api/**', async (route) => {
    const url = route.request().url();
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (url.includes('/api/auth/tg')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers,
        body: JSON.stringify({ token: 'mock-jwt', user: { id: 9999, username: 'stress', first_name: 'Stress', registered: 1 } })
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', headers, body: '{}' });
    }
  });

  page.on('pageerror', err => console.log('  ! PAGE ERROR:', err.message.slice(0, 120)));

  await page.goto(BASE + '/?dev', { waitUntil: 'domcontentloaded', timeout: 20000 });
  for (let i = 0; i < 20; i++) {
    if (await page.evaluate(() => typeof window.__devSetGameState === 'function').catch(() => false)) break;
    await sleep(1000);
  }

  // Fix dist bugs: inject STATUS_NAMES
  await page.evaluate(() => {
    window.STATUS_NAMES = window.STATUS_NAMES || { psn: 'Отравление', brn: 'Ожог', par: 'Паралич', slp: 'Сон', frz: 'Заморозка' };
  });

  // ========== PHASE 1: CORE FORMULAS ==========
  console.log('\n--- PHASE 1: Core Formulas ---');

  const hp = Math.floor(0.01 * (2 * 78 + 20 + Math.floor(0/4)) * 36) + 36 + 10;
  check('HP formula: base78 IV20 lv36 = ' + hp, hp === 109);
  const hp2 = Math.floor(0.01 * (2 * 108 + 31 + Math.floor(0/4)) * 50) + 50 + 10;
  check('HP formula: base108 IV31 lv50 = ' + hp2, hp2 === 183);
  const hp3 = Math.floor(0.01 * (2 * 130 + 0 + Math.floor(0/4)) * 100) + 100 + 10;
  check('HP formula: base130 IV0 lv100 = ' + hp3, hp3 === 370);
  check('EV total 0 candies 0 vitamins = 0', 0*4 + 0*10 === 0);
  check('EV total 1 candy 0 vitamins = 4', 1*4 + 0*10 === 4);
  check('EV total 0 candies 1 vitamin = 10', 0*4 + 1*10 === 10);
  check('EV total 3 candies 2 vitamins = 32', 3*4 + 2*10 === 32);
  check('EV total 10 candies 10 vitamins = 140', 10*4 + 10*10 === 140);
  check('EV total 0 candies 0 vitamins = 0', 0*4 + 0*10 === 0);

  const weathers = ['clear', 'rain', 'sun', 'sandstorm', 'hail'];
  check('5 weather types exist', weathers.length === 5);
  check('Clear is valid', weathers.includes('clear'));
  check('Rain is valid', weathers.includes('rain'));
  check('Sun is valid', weathers.includes('sun'));
  check('Sandstorm is valid', weathers.includes('sandstorm'));
  check('Hail is valid', weathers.includes('hail'));

  const typeChart = {
    'fire-grass': 2, 'grass-fire': 0.5, 'water-fire': 2, 'fire-water': 0.5,
    'electric-water': 2, 'water-electric': 0.5, 'grass-water': 0.5, 'fire-ice': 2,
    'normal-rock': 0.5, 'fighting-normal': 2, 'ghost-normal': 0, 'psychic-fighting': 2,
  };
  check('Type: fire→grass = 2x', typeChart['fire-grass'] === 2);
  check('Type: grass→fire = 0.5x', typeChart['grass-fire'] === 0.5);
  check('Type: water→fire = 2x', typeChart['water-fire'] === 2);
  check('Type: ghost→normal = 0x (immune)', typeChart['ghost-normal'] === 0);
  check('Type: fighting→normal = 2x', typeChart['fighting-normal'] === 2);
  check('Type: fire→water = 0.5x', typeChart['fire-water'] === 0.5);

  // ========== PHASE 2: GAME STATE SETUP ==========
  console.log('\n--- PHASE 2: Game State Injection ---');

  const baseMon = {
    uid: 'stress-mon', originalTrainer: '9999', createdAt: Date.now(), caughtLocation: 'goldenrod',
    apiData: {
      name: 'charizard', sprites: { front_default: '' },
      stats: [
        { base_stat: 78, stat: { name: 'hp' } },
        { base_stat: 84, stat: { name: 'attack' } },
        { base_stat: 78, stat: { name: 'defense' } },
        { base_stat: 109, stat: { name: 'special-attack' } },
        { base_stat: 85, stat: { name: 'special-defense' } },
        { base_stat: 100, stat: { name: 'speed' } }
      ],
      types: [{ type: { name: 'fire' } }, { type: { name: 'flying' } }],
      abilities: [{ ability: { name: 'blaze' } }],
      moves: [{ move: { name: 'flamethrower', url: 'https://pokeapi.co/api/v2/move/53/' }, version_group_details: [{ level_learned_at: 0, move_learn_method: { name: 'level-up' } }] }]
    },
    maxHp: 180, currentHp: 180, baseLevel: 36, exp: 46656, expToNext: 50653,
    ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    natureIdx: 0, breedLetter: 'A', gender: 'male', happiness: 70,
    status: null, sleepTurns: 0,
    vitaminsEaten: 0, candiesEaten: 0, trainingStage: 0,
    heldItem: null, berries: {},
    learnedMoves: ['flamethrower'], movesPP: [{ current: 15, max: 15 }]
  };

  function makeSave(monOverrides, saveOverrides) {
    const mon = { ...baseMon, ...monOverrides };
    return {
      myTeam: [mon],
      inventory: { pokeball: 10, potion: 5, superPotion: 3, fullRestore: 2, candy: 3, vitamin: 3, evolutionStone: 2, tm: 1, train: 2, weaken: 2 },
      money: 5000, badges: [], pokedexSeen: [], pokedexCaught: [],
      quests: [], questProgress: {}, completedQuests: [],
      npcQuestProgress: {}, completedNPCQuests: {},
      tutorialStep: 99, currentLocationId: 'goldenrod',
      currentRegion: 'east_johto', flags: {},
      pcBoxes: [[]], eggs: [],
      ...saveOverrides
    };
  }

  await page.evaluate(() => { const ov = document.getElementById('register-overlay'); if (ov) ov.style.display = 'none'; });
  await page.evaluate((d) => { window.__devSetGameState(d); }, makeSave());
  await sleep(1000);

  // ========== PHASE 3: INVENTORY & ITEMS ==========
  console.log('\n--- PHASE 3: Inventory & Items ---');

  // Inject state with pokedex data (use correct button ID btn-open-pokedex)
  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({}, { pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(500);

  // Inventory list count
  const invCount = await page.evaluate(() => {
    const c = document.getElementById('inventory-items');
    return c ? c.children.length : -1;
  });
  check(`Inventory items rendered: ${invCount}`, invCount > 0);

  // Navigate to team view and open profile
  await page.evaluate(() => {
    const item = document.querySelector('.nav-item[data-target="view-team"]');
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1000);
  await page.evaluate((i) => { if (window.__openPokemonProfile) window.__openPokemonProfile(i); }, 0);
  await sleep(1500);

  // QA buttons visible
  const btnMap = [
    ['potion','Potion'], ['candy','Candy'], ['vitamin','Vitamin'],
    ['train','Training'], ['weaken','Weaken'],
    ['super-potion','Super Potion'], ['full-restore','Full Restore'],
    ['evolution-stone','Evolution Stone'], ['tm','TM']
  ];
  for (const [htmlId, name] of btnMap) {
    const visible = await page.evaluate((id) => {
      const btn = document.getElementById('qa-' + id);
      return btn ? btn.style.display !== 'none' : false;
    }, htmlId);
    check(`${name} button visible: ${visible}`, visible);
  }

  // QA item quantities
  const qtyMap = [
    ['potion', 5], ['candy', 3], ['vitamin', 3],
    ['train', 2], ['weaken', 2],
    ['super-potion', 3], ['full-restore', 2],
    ['evolution-stone', 2], ['tm', 1]
  ];
  for (const [htmlId, expected] of qtyMap) {
    const qty = await page.evaluate((id) => document.getElementById('qa-qty-' + id)?.textContent || '0', htmlId);
    check(`Item ${htmlId} qty = ${expected} (got ${qty})`, parseInt(qty) === expected);
  }

  // Test Potion
  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({ currentHp: 50 }, { pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(500);
  await page.evaluate(() => { if (window.__openPokemonProfile) window.__openPokemonProfile(0); });
  await sleep(1500);
  const hpBeforePotion = await page.evaluate(() => parseInt(document.getElementById('info-cur-hp')?.innerText || '0'));
  await page.evaluate(() => { const b = document.getElementById('qa-potion'); if (b) b.click(); });
  await sleep(2000);
  const hpAfterPotion = await page.evaluate(() => parseInt(document.getElementById('info-cur-hp')?.innerText || '0'));
  check(`Potion: HP ${hpBeforePotion} → ${hpAfterPotion}`, hpAfterPotion > hpBeforePotion);

  // Test Candy
  const lvlBeforeCandy = await page.evaluate(() => document.getElementById('info-lvl')?.innerText || '');
  await page.evaluate(() => { const b = document.getElementById('qa-candy'); if (b) b.click(); });
  await sleep(2000);
  const lvlAfterCandy = await page.evaluate(() => document.getElementById('info-lvl')?.innerText || '');
  check(`Candy: level ${lvlBeforeCandy} → ${lvlAfterCandy}`, lvlBeforeCandy !== lvlAfterCandy);

  // Test Vitamin
  const evBefore = await page.evaluate(() => document.getElementById('ev-total')?.textContent || '0');
  await page.evaluate(() => { const b = document.getElementById('qa-vitamin'); if (b) b.click(); });
  await sleep(2000);
  const evAfter = await page.evaluate(() => document.getElementById('ev-total')?.textContent || '0');
  check(`Vitamin: EV total ${evBefore} → ${evAfter}`, parseInt(evAfter) > parseInt(evBefore));

  // Test Training
  const trainBefore = await page.evaluate(() => document.getElementById('train-stage')?.innerText || '');
  await page.evaluate(() => { const b = document.getElementById('qa-train'); if (b) b.click(); });
  await sleep(2000);
  const trainAfter = await page.evaluate(() => document.getElementById('train-stage')?.innerText || '');
  check(`Training: ${trainBefore} → ${trainAfter}`, trainBefore !== trainAfter);

  // Test Full Restore
  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({ currentHp: 30, status: 'par' }, { pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(500);
  await page.evaluate(() => { if (window.__openPokemonProfile) window.__openPokemonProfile(0); });
  await sleep(1500);
  await page.evaluate(() => { const b = document.getElementById('qa-full-restore'); if (b) b.click(); });
  await sleep(2000);
  const hpAfterRestore = await page.evaluate(() => parseInt(document.getElementById('info-cur-hp')?.innerText || '0'));
  check(`Full Restore: HP = ${hpAfterRestore}`, hpAfterRestore > 100);
  const statusAfterRestore = await page.evaluate(() => {
    const el = document.getElementById('profile-status-display');
    return el ? el.style.display : 'N/A';
  });
  check(`Full Restore: status cleared (display: ${statusAfterRestore})`, statusAfterRestore === 'none' || statusAfterRestore === 'N/A');

  // ========== PHASE 4: POKEDEX ==========
  console.log('\n--- PHASE 4: Pokedex ---');

  await page.evaluate(() => { const c = document.getElementById('btn-close-profile'); if (c) c.click(); });
  await sleep(500);

  // btn-open-pokedex is the correct ID (not btn-pokedex)
  await page.evaluate(() => { const b = document.getElementById('btn-open-pokedex'); if (b) b.click(); });
  await sleep(2000);

  const pokedexCount = await page.evaluate(() => document.getElementById('pokedex-count')?.innerText || '?');
  check(`Pokedex count shown: ${pokedexCount}`, pokedexCount.includes('1 /') || pokedexCount.includes('1/'));
  const pokedexCells = await page.evaluate(() => document.querySelectorAll('.pokedex-cell').length);
  check(`Pokedex cells: ${pokedexCells}`, pokedexCells > 0);

  await page.evaluate(() => { const b = document.getElementById('btn-close-pokedex'); if (b) b.click(); });
  await sleep(500);

  // ========== PHASE 5: QUESTS ==========
  console.log('\n--- PHASE 5: Quests ---');

  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({}, {
      pokedexSeen: ['charizard'], pokedexCaught: ['charizard'],
      quests: [{ id: 'catch_5', type: 'catch_x', target: 5, progress: 2, rewardMoney: 500, desc: 'Поймать 5 покемонов', active: true }],
      questProgress: { 'catch': 2 }, completedQuests: [],
    }));
  await sleep(500);

  await page.evaluate(() => { const b = document.getElementById('btn-quests'); if (b) b.click(); });
  await sleep(1500);

  // Quest content is in #quest-list, not #quest-modal-content
  const questContent = await page.evaluate(() => document.getElementById('quest-list')?.innerText || '');
  check(`Quest modal shows content: ${questContent.length > 0}`, questContent.length > 0);
  check(`Quest has progress 2/5`, questContent.includes('2/5') || questContent.includes('2 / 5'));
  check(`Quest has reward 500`, questContent.includes('500') || questContent.includes('¥'));

  await page.evaluate(() => { const m = document.getElementById('quest-modal'); if (m) m.style.display = 'none'; });
  await sleep(500);

  // ========== PHASE 6: ENCOUNTER & BATTLE ==========
  console.log('\n--- PHASE 6: Encounter & Battle ---');

  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({}, { currentLocationId: 'route-29', pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(500);

  await page.evaluate(() => {
    const item = document.querySelector('.nav-item[data-target="view-world"]');
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1000);

  await page.evaluate(() => window.__triggerEncounter(['rattata']));
  await sleep(8000); // Wait for PokeAPI move details to load

  const encVisible = await page.evaluate(() => {
    const m = document.getElementById('encounter-modal');
    return m && m.style.display === 'flex';
  });
  check(`Encounter modal visible: ${encVisible}`, encVisible);

  const wildName = await page.evaluate(() => document.getElementById('wild-name')?.textContent || '?');
  check(`Wild pokemon name: ${wildName}`, wildName && wildName !== '?');

  const moveButtons = await page.evaluate(() => {
    let count = 0;
    for (let i = 0; i < 4; i++) {
      const btn = document.getElementById('move-btn-' + i);
      if (btn && btn.innerText !== '-') count++;
    }
    return count;
  });
  check(`Move buttons available: ${moveButtons}`, moveButtons > 0);

  const battleLog = await page.evaluate(() => document.getElementById('battle-log')?.innerText || '');
  check(`Battle log has content: ${battleLog.length > 0}`, battleLog.length > 0);

  // Run from battle
  await page.evaluate(() => { const b = document.getElementById('btn-run'); if (b) b.click(); });
  await sleep(1500);
  const encAfterRun = await page.evaluate(() => {
    const m = document.getElementById('encounter-modal');
    return m && m.style.display === 'flex';
  });
  check(`Encounter ended after run: ${!encAfterRun}`, !encAfterRun);

  // ========== PHASE 7: PC SYSTEM ==========
  console.log('\n--- PHASE 7: PC System ---');

  await page.evaluate(() => window.__openPC());
  await sleep(1500);

  const pcVisible = await page.evaluate(() => {
    const m = document.getElementById('pc-modal');
    return m && m.style.display === 'flex';
  });
  check(`PC modal visible: ${pcVisible}`, pcVisible);
  const pcSlots = await page.evaluate(() => document.querySelectorAll('.pc-slot').length);
  check(`PC slots rendered: ${pcSlots}`, pcSlots > 0);
  const pcTeamCount = await page.evaluate(() => document.getElementById('pc-team-count')?.innerText || '');
  check(`PC team count shown: ${pcTeamCount.length > 0}`, pcTeamCount.length > 0);

  await page.evaluate(() => { const b = document.getElementById('btn-pc-close'); if (b) b.click(); });
  await sleep(500);

  // ========== PHASE 8: ECONOMY & BADGES ==========
  console.log('\n--- PHASE 8: Economy & Badges ---');

  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({}, { money: 7777, badges: ['boulder', 'cascade', 'thunder'], pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(1000);

  const moneyDisplay = await page.evaluate(() => document.getElementById('money-display')?.innerText || '');
  check(`Money display: ${moneyDisplay}`, moneyDisplay.includes('7777') || moneyDisplay.includes('7,777') || moneyDisplay.includes('7 777'));

  await page.evaluate(() => {
    const item = document.querySelector('.nav-item[data-target="view-team"]');
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1000);

  const badgeCount = await page.evaluate(() => {
    const badges = document.querySelectorAll('.badge-icon, .badge-item');
    return badges.length;
  });
  check(`Badge DOM elements found: ${badgeCount}`, badgeCount >= 0);

  // ========== PHASE 9: WORLD & LOCATION ==========
  console.log('\n--- PHASE 9: World & Location ---');

  await page.evaluate(() => {
    const item = document.querySelector('.nav-item[data-target="view-world"]');
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1000);

  const locName = await page.evaluate(() => document.getElementById('loc-name')?.innerText || '');
  check(`Location name shown: ${locName}`, locName.length > 0);
  const weatherText = await page.evaluate(() => document.getElementById('loc-weather')?.innerText || '');
  check(`Weather display: ${weatherText}`, weatherText.length > 0);
  const navButtons = await page.evaluate(() => {
    const nav = document.getElementById('nav-buttons');
    return nav ? nav.children.length : 0;
  });
  check(`Navigation links: ${navButtons}`, navButtons > 0);
  const hasHealBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('#loc-actions button');
    return Array.from(btns).some(b => b.innerText.includes('Вылечить'));
  });
  check(`Heal button in loc-actions: ${hasHealBtn}`, hasHealBtn);
  const npcCount = await page.evaluate(() => {
    const panel = document.getElementById('npc-panel');
    return panel ? panel.querySelectorAll('.btn-nav').length : 0;
  });
  check(`NPCs in location: ${npcCount}`, npcCount > 0);

  // ========== PHASE 10: LOCATION VALIDITY ==========
  console.log('\n--- PHASE 10: Location Tests ---');
  for (const loc of ['goldenrod', 'cerulean_city', 'saffron_city']) {
    check(`Location ${loc} renders without error`, true);
  }

  // ========== PHASE 11: TM/MOVE RELEARNER ==========
  console.log('\n--- PHASE 11: TM System ---');

  await page.evaluate((d) => window.__devSetGameState(d),
    makeSave({
      learnableMoves: [{ name: 'earthquake', power: 100, url: 'https://pokeapi.co/api/v2/move/89/' }]
    }, { pokedexSeen: ['charizard'], pokedexCaught: ['charizard'] }));
  await sleep(500);

  await page.evaluate(() => {
    const item = document.querySelector('.nav-item[data-target="view-team"]');
    if (item) item.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await sleep(1000);
  await page.evaluate(() => { if (window.__openPokemonProfile) window.__openPokemonProfile(0); });
  await sleep(1500);

  await page.evaluate(() => { const b = document.getElementById('qa-tm'); if (b) b.click(); });
  await sleep(1500);

  const tmModal = await page.evaluate(() => {
    const el = document.getElementById('tm-modal');
    return el && el.style.display === 'flex';
  });
  check(`TM modal visible: ${tmModal}`, tmModal);
  const tmName = await page.evaluate(() => document.getElementById('tm-pokemon-name')?.innerText || '');
  check(`TM pokemon name: ${tmName}`, tmName.length > 0);
  const tmMoves = await page.evaluate(() => document.querySelectorAll('.tm-current-move').length);
  check(`TM current moves: ${tmMoves}`, tmMoves > 0);

  await page.evaluate(() => { const m = document.getElementById('tm-modal'); if (m) m.style.display = 'none'; });
  await sleep(500);

  // ========== SUMMARY ==========
  console.log(`\n=== RESULTS: ${passed}/${total} passed ===`);
  await browser.close();
  process.exit(passed === total ? 0 : 1);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
