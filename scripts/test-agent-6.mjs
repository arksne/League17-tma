import { chromium } from 'playwright';

const ASSIGNED_SPECIES = [
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "seadra" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "sentret" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "slowpoke" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "tentacool" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "tentacruel" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "gyarados" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "hoppip" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "horsea" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "kingler" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "krabby" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "magikarp" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "psyduck" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "qwilfish" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "remoraid" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "seadra" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "slowpoke" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "tentacool" },
  { locId: "memorialPillar", locName: "Мемориальный Столб", species: "tentacruel" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "gyarados" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "horsea" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "kingler" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "krabby" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "magikarp" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "psyduck" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "qwilfish" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "remoraid" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "seadra" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "slowpoke" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "tentacool" },
  { locId: "outcastIsland", locName: "Остров Изгнанников", species: "tentacruel" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "gyarados" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "horsea" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "kingler" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "krabby" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "magikarp" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "psyduck" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "qwilfish" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "remoraid" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "seadra" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "slowpoke" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "tentacool" },
  { locId: "greenPath", locName: "Зелёная Тропа", species: "tentacruel" },
  { locId: "waterPath", locName: "Водная Тропа", species: "bellsprout" },
  { locId: "waterPath", locName: "Водная Тропа", species: "fearow" },
  { locId: "waterPath", locName: "Водная Тропа", species: "gloom" },
  { locId: "waterPath", locName: "Водная Тропа", species: "gyarados" },
  { locId: "waterPath", locName: "Водная Тропа", species: "horsea" },
  { locId: "waterPath", locName: "Водная Тропа", species: "kingler" },
  { locId: "waterPath", locName: "Водная Тропа", species: "krabby" },
  { locId: "waterPath", locName: "Водная Тропа", species: "magikarp" },
  { locId: "waterPath", locName: "Водная Тропа", species: "meowth" },
  { locId: "waterPath", locName: "Водная Тропа", species: "oddish" },
  { locId: "waterPath", locName: "Водная Тропа", species: "persian" },
  { locId: "waterPath", locName: "Водная Тропа", species: "psyduck" },
  { locId: "waterPath", locName: "Водная Тропа", species: "qwilfish" },
  { locId: "waterPath", locName: "Водная Тропа", species: "remoraid" },
  { locId: "waterPath", locName: "Водная Тропа", species: "seadra" },
  { locId: "waterPath", locName: "Водная Тропа", species: "sentret" },
  { locId: "waterPath", locName: "Водная Тропа", species: "slowpoke" },
  { locId: "waterPath", locName: "Водная Тропа", species: "spearow" },
  { locId: "waterPath", locName: "Водная Тропа", species: "tentacool" },
  { locId: "waterPath", locName: "Водная Тропа", species: "tentacruel" },
  { locId: "waterPath", locName: "Водная Тропа", species: "weepinbell" },
  { locId: "ruinValley", locName: "Долина Руин", species: "fearow" },
  { locId: "ruinValley", locName: "Долина Руин", species: "goldeen" },
  { locId: "ruinValley", locName: "Долина Руин", species: "gyarados" },
  { locId: "ruinValley", locName: "Долина Руин", species: "magikarp" },
  { locId: "ruinValley", locName: "Долина Руин", species: "marill" },
  { locId: "ruinValley", locName: "Долина Руин", species: "meowth" },
  { locId: "ruinValley", locName: "Долина Руин", species: "natu" },
  { locId: "ruinValley", locName: "Долина Руин", species: "persian" },
  { locId: "ruinValley", locName: "Долина Руин", species: "poliwag" },
  { locId: "ruinValley", locName: "Долина Руин", species: "poliwhirl" },
  { locId: "ruinValley", locName: "Долина Руин", species: "psyduck" },
  { locId: "ruinValley", locName: "Долина Руин", species: "slowpoke" },
  { locId: "ruinValley", locName: "Долина Руин", species: "spearow" },
  { locId: "ruinValley", locName: "Долина Руин", species: "wobbuffet" },
  { locId: "ruinValley", locName: "Долина Руин", species: "wooper" },
  { locId: "ruinValley", locName: "Долина Руин", species: "yanma" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "gyarados" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "horsea" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "kingler" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "krabby" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "magikarp" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "mantine" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "psyduck" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "qwilfish" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "remoraid" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "seadra" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "slowpoke" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "tentacool" },
  { locId: "trainerTower", locName: "Башня Тренировок", species: "tentacruel" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "fearow" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "meowth" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "persian" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "phanpy" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "psyduck" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "sentret" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "slowpoke" },
  { locId: "canyonEntrance", locName: "Вход в Каньон", species: "spearow" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "cubone" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "fearow" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "geodude" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "graveler" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "larvitar" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "marowak" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "meowth" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "onix" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "persian" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "phanpy" },
  { locId: "sevaultCanyon", locName: "Каньон Севальт", species: "skarmory" },
  { locId: "tanobyRuins", locName: "Руины Танойи", species: "gyarados" },
  { locId: "tanobyRuins", locName: "Руины Танойи", species: "horsea" },
  { locId: "tanobyRuins", locName: "Руины Танойи", species: "kingler" },
];

async function main() {
  console.log('[Agent 6/10] Launching browser...');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser console error] ${msg.text()}`);
    }
  });
  page.on('pageerror', (err) => {
    console.log(`[Browser page error] ${err.message}`);
  });

  // Step 1: Go to game
  console.log('[Agent 6/10] Navigating to game...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Step 2: Set localStorage flag for guaranteed drops
  console.log('[Agent 6/10] Setting localStorage drop100 flag...');
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // Step 3: Reload
  console.log('[Agent 6/10] Reloading...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Step 4: Import game modules in browser context via Vite dynamic imports
  console.log('[Agent 6/10] Importing game modules...');
  const modulesLoaded = await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      window.__STORE = storeModule.store;
      const locModule = await import('/src/ui/location.ts');
      window.__PROCESS_DROP = locModule.processMonsterDrop;
      return true;
    } catch (e) {
      window.__MODULE_ERROR = e.message;
      return false;
    }
  });

  if (!modulesLoaded) {
    const modErr = await page.evaluate(() => window.__MODULE_ERROR);
    throw new Error(`Failed to import game modules: ${modErr}`);
  }

  console.log('[Agent 6/10] Game modules loaded successfully.');

  // Step 5: Initialize tracking
  const results = {
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [],
    itemsFound: {}
  };

  let progressInterval = 0;

  // Step 6: Process each species
  for (let i = 0; i < ASSIGNED_SPECIES.length; i++) {
    const { species, locName } = ASSIGNED_SPECIES[i];

    try {
      // Call processMonsterDrop in the browser
      const drops = await page.evaluate((s) => {
        try {
          const result = window.__PROCESS_DROP(s);
          return JSON.parse(JSON.stringify(result));
        } catch (e) {
          return { _error: e.message };
        }
      }, species);

      // Handle error from evaluate
      if (drops && drops._error) {
        results.failures.push({
          species,
          item: 'N/A',
          reason: drops._error
        });
        results.totalTested++;
        process.stdout.write(`\r[Agent 6/10] [${i + 1}/${ASSIGNED_SPECIES.length}] ${species} (${locName}) — ERROR: ${drops._error}`);
        continue;
      }

      if (!Array.isArray(drops)) {
        results.failures.push({
          species,
          item: 'N/A',
          reason: `processMonsterDrop returned non-array: ${JSON.stringify(drops)}`
        });
        results.totalTested++;
        process.stdout.write(`\r[Agent 6/10] [${i + 1}/${ASSIGNED_SPECIES.length}] ${species} (${locName}) — not an array`);
        continue;
      }

      results.totalTested++;
      results.totalDropped += drops.length;

      // Process each dropped item
      for (const d of drops) {
        if (!d || !d.item) continue;

        results.itemsFound[d.item] = (results.itemsFound[d.item] || 0) + 1;

        // Call addItem in the browser
        const added = await page.evaluate(([item, qty]) => {
          try {
            return window.__STORE.addItem(item, qty);
          } catch (e) {
            return { _error: e.message };
          }
        }, [d.item, d.qty]);

        if (added === true) {
          results.totalAdded += (d.qty || 1);
        } else if (added && added._error) {
          results.failures.push({
            species,
            item: d.item,
            reason: added._error
          });
        } else {
          results.failures.push({
            species,
            item: d.item,
            reason: 'addItem returned false'
          });
        }
      }

      process.stdout.write(`\r[Agent 6/10] [${i + 1}/${ASSIGNED_SPECIES.length}] ${species} (${locName}) — ${drops.length} drops`);
    } catch (e) {
      results.failures.push({
        species,
        item: 'N/A',
        reason: e.message
      });
      process.stdout.write(`\r[Agent 6/10] [${i + 1}/${ASSIGNED_SPECIES.length}] ${species} (${locName}) — EXCEPTION: ${e.message}`);
    }
  }

  console.log('\n');  // newline after progress output

  await browser.close();

  const output = {
    chunkIndex: 6,
    totalTested: results.totalTested,
    totalDropped: results.totalDropped,
    totalAdded: results.totalAdded,
    failures: results.failures,
    itemsFound: results.itemsFound,
    summary: `Tested ${results.totalTested} species, ${results.totalDropped} total drops (${Object.keys(results.itemsFound).length} unique items), ${results.totalAdded} items added, ${results.failures.length} failures`
  };

  console.log(JSON.stringify(output));
}

main().catch(e => {
  const errOutput = {
    chunkIndex: 6,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'SCRIPT', item: 'N/A', reason: e.message }],
    itemsFound: {},
    summary: `Script error: ${e.message}`
  };
  console.log(JSON.stringify(errOutput));
  process.exit(1);
});
