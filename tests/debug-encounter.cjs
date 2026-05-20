const { chromium } = require('playwright');
const BASE = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await context.newPage();

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (url.includes('/api/auth/tg')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers,
        body: JSON.stringify({ token: 'mock-jwt-debug', user: { id: 9999, username: 'debug', first_name: 'Debug', registered: 1 } })
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', headers, body: '{}' });
    }
  });

  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));

  await page.goto(BASE + '/?dev', { waitUntil: 'domcontentloaded', timeout: 20000 });

  for (let i = 0; i < 20; i++) {
    const hasIt = await page.evaluate(() => typeof window.__devSetGameState === 'function').catch(() => false);
    if (hasIt) break;
    await sleep(1000);
  }

  await page.evaluate(() => {
    const ov = document.getElementById('register-overlay');
    if (ov) ov.style.display = 'none';
  });

  const saveData = {
    myTeam: [{
      uid: 'debug-mon', originalTrainer: '9999', createdAt: Date.now(), caughtLocation: 'goldenrod',
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
        moves: [{ move: { name: 'flamethrower', url: 'https://pokeapi.co/api/v2/move/53/' } }]
      },
      maxHp: 180, currentHp: 180, baseLevel: 36, exp: 46656, expToNext: 50653,
      ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      natureIdx: 0, breedLetter: 'A', gender: 'male', happiness: 70,
      status: null, sleepTurns: 0,
      vitaminsEaten: 0, candiesEaten: 0, trainingStage: 0,
      heldItem: null, berries: {},
      learnedMoves: ['flamethrower'], movesPP: [{ current: 15, max: 15 }]
    }],
    pcBoxes: [[]], eggs: [],
    inventory: { pokeball: 10, potion: 5 },
    money: 5000, badges: [], pokedexSeen: [], pokedexCaught: [],
    quests: [], questProgress: {}, completedQuests: [],
    npcQuestProgress: {}, completedNPCQuests: {},
    tutorialStep: 99, currentLocationId: 'goldenrod',
    currentRegion: 'east_johto', flags: {}
  };

  await page.evaluate((d) => {
    window.__devSetGameState(d);
    const overlays = ['register-overlay', 'starter-modal'];
    for (const id of overlays) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  }, saveData);
  await sleep(1000);

  const state1 = await page.evaluate(() => {
    const modal = document.getElementById('encounter-modal');
    const hasTrigger = typeof window.__triggerEncounter === 'function';
    return {
      hasTrigger,
      modalExists: !!modal,
      modalDisplay: modal ? modal.style.display : 'N/A',
      hasBattleLog: !!document.getElementById('battle-log'),
      wildNameExists: !!document.getElementById('wild-name'),
    };
  });
  console.log('STATE:', JSON.stringify(state1, null, 2));

  const modalChildren = await page.evaluate(() => {
    const modal = document.getElementById('encounter-modal');
    if (!modal) return { error: 'no modal' };
    const ids = [];
    modal.querySelectorAll('[id]').forEach(el => ids.push(el.id));
    return { childCount: modal.children.length, ids };
  });
  console.log('MODAL CHILDREN:', JSON.stringify(modalChildren));

  const unCheck = await page.evaluate(() => {
    try {
      return { typeofUn: typeof Un, isFn: typeof Un === 'function' };
    } catch(e) {
      return { error: e.message };
    }
  });
  console.log('UN CHECK:', JSON.stringify(unCheck));

  const result = await page.evaluate(() => {
    try {
      if (!window.__triggerEncounter) return { error: '__triggerEncounter not defined' };
      const result = window.__triggerEncounter(['rattata']);
      const isPromise = result && typeof result.then === 'function';
      return { called: true, returnedPromise: isPromise };
    } catch(e) {
      return { error: e.message, stack: e.stack };
    }
  });
  console.log('TRIGGER RESULT:', JSON.stringify(result, null, 2));

  await sleep(3000);

  const state2 = await page.evaluate(() => {
    const modal = document.getElementById('encounter-modal');
    return {
      modalDisplay: modal ? modal.style.display : 'N/A',
      wildName: document.getElementById('wild-name')?.textContent || '?',
    };
  });
  console.log('AFTER WAIT:', JSON.stringify(state2));

  await browser.close();
})();
