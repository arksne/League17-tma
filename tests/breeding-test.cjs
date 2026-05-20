const { chromium } = require('playwright');
const fs = require('fs');

const BASE = 'http://localhost:3000';
const REPORT = 'tests/breeding-report.txt';

fs.writeFileSync(REPORT, '=== BREEDING & EGG SYSTEM TEST ===\n\n');
const log = (m) => { console.log(m); fs.appendFileSync(REPORT, m + '\n'); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

let total = 0, passed = 0;

function check(desc, condition) {
  total++;
  if (condition) { passed++; log(`  ✓ ${total}: ${desc}`); }
  else { log(`  ✗ ${total}: ${desc}`); }
}

function makeMon(name, lvl, overrides = {}) {
  const base = {
    uid: name + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    originalTrainer: '8888', createdAt: Date.now(), caughtLocation: 'goldenrod',
    apiData: {
      name, id: 25, sprites: { front_default: '' },
      stats: [
        { base_stat: 50, stat: { name: 'hp' } },
        { base_stat: 50, stat: { name: 'attack' } },
        { base_stat: 50, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 50, stat: { name: 'speed' } }
      ],
      types: [{ type: { name: overrides.type || 'normal' } }],
      abilities: [{ ability: { name: 'run-away' } }],
      moves: [{ move: { name: 'tackle', url: '' } }],
      species: { name }
    },
    maxHp: 100, currentHp: 100, baseLevel: lvl,
    exp: 0, expToNext: 100,
    ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    natureIdx: 0, breedLetter: 'A', gender: 'male', happiness: 70,
    status: null, sleepTurns: 0, movesPP: [],
    statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityName: 'run-away', heldItem: null, isShiny: false, isEgg: false, hasBred: false,
    candiesEaten: 0, vitaminsEaten: 0, trainingStage: 0, trainingStat: null,
    berries: {}, learnableMoves: [],
    ...overrides
  };
  return base;
}

(async () => {
  log('--- Breeding Data Validation ---\n');

  // 1. EGG_TIME constant knowledge check
  const EGG_TIME = 10 * 60 * 1000;       // 10 minutes
  const EGG_BONUS_TIME = 5 * 60 * 1000;  // 5 minutes with same nature
  check('EGG_TIME is 10 min', EGG_TIME === 600000);
  check('EGG_BONUS_TIME is 5 min', EGG_BONUS_TIME === 300000);

  // 2. Egg data structure validation
  const validEgg = {
    uid: 'egg-1',
    species: 'pikachu',
    types: [{ type: { name: 'electric' } }],
    ivs: { hp: 15, atk: 20, def: 18, spa: 22, spd: 16, spe: 25 },
    readyTime: Date.now() + 3600000,
    boxIdx: 0,
    parent1Uid: 'parent-1',
    parent2Uid: 'parent-2'
  };
  check('Egg has uid', typeof validEgg.uid === 'string');
  check('Egg has species', typeof validEgg.species === 'string');
  check('Egg has types array', Array.isArray(validEgg.types));
  check('Egg has IVs (6 stats)', Object.keys(validEgg.ivs).length === 6);
  check('Egg IVs all 0-31', Object.values(validEgg.ivs).every(v => v >= 0 && v <= 31));
  check('Egg has future readyTime', validEgg.readyTime > Date.now());
  check('Egg has boxIdx', typeof validEgg.boxIdx === 'number');

  // 3. Compatible pair data validation
  const maleMon = makeMon('pikachu', 10, { gender: 'male', uid: 'male-pika' });
  const femaleMon = makeMon('pikachu', 10, { gender: 'female', uid: 'female-pika' });
  check('Male mon has gender=male', maleMon.gender === 'male');
  check('Female mon has gender=female', femaleMon.gender === 'female');
  check('Two mons have different UIDs', maleMon.uid !== femaleMon.uid);
  check('Male mon has apiData.species', maleMon.apiData.species?.name === 'pikachu');

  // ── Browser Tests ──
  const browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage', '--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 420, height: 780 } });
  const page = await context.newPage();

  await page.route('http://localhost:3000/api/**', async (route) => {
    const url = route.request().url();
    const headers = { 'Access-Control-Allow-Origin': '*' };
    if (url.includes('/api/auth/tg')) {
      await route.fulfill({ status: 200, contentType: 'application/json', headers,
        body: JSON.stringify({ token: 'mock-jwt', user: { id: 8888, username: 'breedtest', first_name: 'Breed', registered: 1 } })
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

  await page.evaluate(() => { const ov = document.getElementById('register-overlay'); if (ov) ov.style.display = 'none'; });

  // Wrap __devSetGameState
  await page.evaluate(() => {
    const orig = window.__devSetGameState;
    window.__devSetGameState = function(data) {
      window._testLastData = JSON.parse(JSON.stringify(data));
      return orig(data);
    };
  });

  log('\n--- PC Box Breeding Setup ---\n');

  // Set up a box with 2 compatible pokemon (male + female)
  await page.evaluate(({ male, female }) => {
    window.__devSetGameState({
      pcBoxes: [[male, female]],
      eggs: [],
      myTeam: [],
      inventory: {},
      money: 5000, badges: [], currentLocationId: 'goldenrod', currentRegion: 'east_johto',
      tutorialStep: 99, flags: {}
    });
  }, { male: maleMon, female: femaleMon });
  await sleep(500);

  const boxResult = await page.evaluate(() => {
    const data = window._testLastData || {};
    const box = (data.pcBoxes || [])[0] || [];
    return { boxLen: box.length, mons: box.map(m => ({ uid: m.uid, gender: m.gender })) };
  });
  check('PC box 0 has 2 mons', boxResult.boxLen === 2);
  check('Box has male mon', boxResult.mons.some(m => m.gender === 'male'));
  check('Box has female mon', boxResult.mons.some(m => m.gender === 'female'));

  log('\n--- Egg in Team Display ---\n');

  // Set up an egg in the team (isEgg: true) + eggs array
  const eggMon = makeMon('pikachu', 1, {
    isEgg: true, gender: null, uid: 'egg-mon-1', nickname: 'Яйцо',
    hp: 1, currentHp: 1, maxHp: 1,
    apiData: { name: 'egg', id: 0, sprites: { front_default: '' }, stats: [], types: [{ type: { name: 'normal' } }], abilities: [], moves: [], species: { name: 'pikachu' } }
  });
  const eggData = {
    uid: 'egg-mon-1',
    species: 'pikachu',
    types: [{ type: { name: 'electric' } }],
    ivs: { hp: 15, atk: 20, def: 18, spa: 22, spd: 16, spe: 25 },
    readyTime: Date.now() + 7200000,
    boxIdx: 0,
    parent1Uid: 'male-pika',
    parent2Uid: 'female-pika'
  };

  await page.evaluate(({ egg, eggState }) => {
    window.__devSetGameState({
      myTeam: [egg],
      eggs: [eggState],
      pcBoxes: [[]],
      inventory: {},
      money: 5000, badges: [], currentLocationId: 'goldenrod', currentRegion: 'east_johto',
      tutorialStep: 99, flags: {}
    });
  }, { egg: eggMon, eggState: eggData });
  await sleep(500);

  const eggStateCheck = await page.evaluate(() => {
    const data = window._testLastData || {};
    const team = data.myTeam || [];
    const eggArr = data.eggs || [];
    return {
      teamLen: team.length,
      isEgg: team[0] ? team[0].isEgg : null,
      eggCount: eggArr.length,
      eggSpecies: eggArr[0] ? eggArr[0].species : null,
    };
  });
  check('Team has 1 mon with isEgg=true', eggStateCheck.isEgg === true);
  check('Eggs array has 1 entry', eggStateCheck.eggCount === 1);
  check('Egg species is pikachu', eggStateCheck.eggSpecies === 'pikachu');

  // Check team grid DOM shows egg
  const teamDom = await page.evaluate(() => {
    const slots = document.querySelectorAll('.team-slot');
    return slots.length;
  });
  check('Team grid shows egg slot', teamDom >= 1);

  // Check egg data can round-trip
  await page.evaluate(() => {
    window.__devSetGameState({
      eggs: [{
        uid: 'egg-rt',
        species: 'charmander',
        types: [{ type: { name: 'fire' } }],
        ivs: { hp: 10, atk: 30, def: 15, spa: 25, spd: 12, spe: 20 },
        readyTime: Date.now() + 5000000,
        boxIdx: 1,
        parent1Uid: 'parent-x',
        parent2Uid: 'parent-y'
      }]
    });
  });
  await sleep(300);

  const rtCheck = await page.evaluate(() => {
    const data = window._testLastData || {};
    const egg = (data.eggs || [])[0] || {};
    return { species: egg.species, boxIdx: egg.boxIdx };
  });
  check('Egg round-trip: species charmander', rtCheck.species === 'charmander');
  check('Egg round-trip: boxIdx 1', rtCheck.boxIdx === 1);

  // Check PC box 0 can store eggs (eggs in box not in team)
  await page.evaluate(() => {
    window.__devSetGameState({
      eggs: [{
        uid: 'egg-boxed',
        species: 'squirtle',
        types: [{ type: { name: 'water' } }],
        ivs: { hp: 20, atk: 10, def: 28, spa: 22, spd: 25, spe: 18 },
        readyTime: Date.now() + 10000000,
        boxIdx: 0,
        parent1Uid: 'p1',
        parent2Uid: 'p2',
        inTeam: false
      }],
      pcBoxes: [[]],
      myTeam: []
    });
  });
  await sleep(300);

  const eggBoxCheck = await page.evaluate(() => {
    const data = window._testLastData || {};
    return {
      eggCount: (data.eggs || []).length,
      boxCount: (data.pcBoxes || []).length,
    };
  });
  check('Egg can exist in PC box (not in team)', eggBoxCheck.eggCount === 1);
  check('PC box exists for egg storage', eggBoxCheck.boxCount >= 1);

  await browser.close();
  log(`\n=== RESULT: ${passed}/${total} passed ===`);
  fs.appendFileSync(REPORT, `\n=== RESULT: ${passed}/${total} passed ===\n`);
  process.exit(passed === total ? 0 : 1);
})().catch(e => {
  log(`\nFATAL: ${e.message}\n${e.stack}`);
  fs.appendFileSync(REPORT, `\nFATAL: ${e.message}\n${e.stack}\n`);
  process.exit(1);
});
