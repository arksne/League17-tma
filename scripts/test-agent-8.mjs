/**
 * Agent 8: Encounter drop test — Playwright script
 *
 * Tests processMonsterDrop + store.addItem for 114 assigned species.
 * Uses pokematrix_drop_100 localStorage flag to guarantee 100% drop rates.
 *
 * Run: node scripts/test-agent-8.mjs 2>&1
 * Only the final line of stdout is the JSON result.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const speciesList = [
  { locId: "lakeOfRage", locName: "Озеро Гнева", species: "venonat" },
  { locId: "lakeOfRage", locName: "Озеро Гнева", species: "weedle" },
  { locId: "mtMortar", locName: "Гора Мортэр", species: "machoke" },
  { locId: "mtMortar", locName: "Гора Мортэр", species: "machop" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "arbok" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "dodrio" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "doduo" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "larvitar" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "machoke" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "magikarp" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "pupitar" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "quagsire" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "seaking" },
  { locId: "mtSilver", locName: "Серебряная Гора", species: "ursaring" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "caterpie" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "kakuna" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "metapod" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "nidoran-f" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "nidoran-m" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "pidgey" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "sunkern" },
  { locId: "nationalPark", locName: "Национальный Парк", species: "weedle" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "chikorita" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "chinchou" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "cyndaquil" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "exeggcute" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "hoothoot" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "lanturn" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "ledyba" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "magikarp" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "pineco" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "shellder" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "spinarak" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "tentacool" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "tentacruel" },
  { locId: "newBarkTown", locName: "Нью-Барк-Таун", species: "totodile" },
  { locId: "olivineCity", locName: "Оливин-Сити", species: "corsola" },
  { locId: "route29", locName: "Маршрут 29", species: "hoppip" },
  { locId: "route29", locName: "Маршрут 29", species: "pidgey" },
  { locId: "route29", locName: "Маршрут 29", species: "sentret" },
  { locId: "route30", locName: "Маршрут 30", species: "caterpie" },
  { locId: "route30", locName: "Маршрут 30", species: "hoppip" },
  { locId: "route30", locName: "Маршрут 30", species: "kakuna" },
  { locId: "route30", locName: "Маршрут 30", species: "metapod" },
  { locId: "route30", locName: "Маршрут 30", species: "pidgey" },
  { locId: "route30", locName: "Маршрут 30", species: "weedle" },
  { locId: "route31", locName: "Маршрут 31", species: "caterpie" },
  { locId: "route31", locName: "Маршрут 31", species: "hoppip" },
  { locId: "route31", locName: "Маршрут 31", species: "kakuna" },
  { locId: "route31", locName: "Маршрут 31", species: "metapod" },
  { locId: "route31", locName: "Маршрут 31", species: "pidgey" },
  { locId: "route31", locName: "Маршрут 31", species: "weedle" },
  { locId: "route32", locName: "Маршрут 32", species: "hoppip" },
  { locId: "route32", locName: "Маршрут 32", species: "pidgey" },
  { locId: "route33", locName: "Маршрут 33", species: "hoppip" },
  { locId: "route33", locName: "Маршрут 33", species: "spearow" },
  { locId: "route34", locName: "Маршрут 34", species: "corsola" },
  { locId: "route34", locName: "Маршрут 34", species: "pidgey" },
  { locId: "route34", locName: "Маршрут 34", species: "snubbull" },
  { locId: "route35", locName: "Маршрут 35", species: "growlithe" },
  { locId: "route35", locName: "Маршрут 35", species: "pidgey" },
  { locId: "route35", locName: "Маршрут 35", species: "snubbull" },
  { locId: "route36", locName: "Маршрут 36", species: "pidgey" },
  { locId: "route37", locName: "Маршрут 37", species: "pidgeotto" },
  { locId: "route37", locName: "Маршрут 37", species: "pidgey" },
  { locId: "route38", locName: "Маршрут 38", species: "farfetchd" },
  { locId: "route38", locName: "Маршрут 38", species: "pidgeotto" },
  { locId: "route39", locName: "Маршрут 39", species: "farfetchd" },
  { locId: "route39", locName: "Маршрут 39", species: "pidgeotto" },
  { locId: "seaRoute40", locName: "Морской Маршрут 40", species: "corsola" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "chinchou" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "lanturn" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "magikarp" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "mantine" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "shellder" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "tentacool" },
  { locId: "seaRoute41", locName: "Морской Маршрут 41", species: "tentacruel" },
  { locId: "route42", locName: "Маршрут 42", species: "arbok" },
  { locId: "route42", locName: "Маршрут 42", species: "ekans" },
  { locId: "route42", locName: "Маршрут 42", species: "fearow" },
  { locId: "route42", locName: "Маршрут 42", species: "spearow" },
  { locId: "route43", locName: "Маршрут 43", species: "farfetchd" },
  { locId: "route43", locName: "Маршрут 43", species: "furret" },
  { locId: "route43", locName: "Маршрут 43", species: "pidgeotto" },
  { locId: "route43", locName: "Маршрут 43", species: "sentret" },
  { locId: "route44", locName: "Маршрут 44", species: "lickitung" },
  { locId: "route45", locName: "Маршрут 45", species: "donphan" },
  { locId: "route45", locName: "Маршрут 45", species: "skarmory" },
  { locId: "route46", locName: "Маршрут 46", species: "spearow" },
  { locId: "route47", locName: "Маршрут 47", species: "farfetchd" },
  { locId: "route47", locName: "Маршрут 47", species: "graveler" },
  { locId: "route47", locName: "Маршрут 47", species: "poliwag" },
  { locId: "route47", locName: "Маршрут 47", species: "quagsire" },
  { locId: "route47", locName: "Маршрут 47", species: "wooper" },
  { locId: "route48", locName: "Маршрут 48", species: "farfetchd" },
  { locId: "ruinsOfAlph", locName: "Руины Алфа", species: "smeargle" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "absol" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "bronzor" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "chingling" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "golbat" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "goldeen" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "magikarp" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "makuhita" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "seaking" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "slowbro" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "slowpoke" },
  { locId: "slowpokeWell", locName: "Колодец Слоупока", species: "zubat" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "chatot" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "gastly" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "meditite" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "rattata" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "spinda" },
  { locId: "sproutTower", locName: "Башня Ростка", species: "zigzagoon" },
  { locId: "bellTower", locName: "Колокольная Башня", species: "rattata" }
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const page = await context.newPage();

  page.on('pageerror', err => {
    process.stderr.write(`[browser:error] ${err.message.slice(0, 200)}\n`);
  });

  // Step 1-2: Go to page, wait 3s
  process.stderr.write('Loading page...\n');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Step 3: Set localStorage
  process.stderr.write('Setting pokematrix_drop_100...\n');
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // Step 4: Reload and wait
  process.stderr.write('Reloading...\n');
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Step 5: Import game modules
  process.stderr.write('Importing game modules...\n');
  const importsOk = await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      window.__STORE = storeModule.store;
      const locModule = await import('/src/ui/location.ts');
      window.__PROCESS_DROP = locModule.processMonsterDrop;
      return true;
    } catch (e) {
      window.__IMPORT_ERR = e.message;
      return false;
    }
  });

  if (!importsOk) {
    const errMsg = await page.evaluate(() => window.__IMPORT_ERR);
    await browser.close();
    throw new Error(`Module import failed: ${errMsg}`);
  }

  process.stderr.write('Modules loaded. Starting drop processing...\n');

  // Step 6: Process each species
  let totalTested = 0;
  let totalDropped = 0;
  let totalAdded = 0;
  const failures = [];
  const itemsFound = {};

  for (const entry of speciesList) {
    const { species, locName } = entry;
    totalTested++;

    try {
      const drops = await page.evaluate((s) => {
        try {
          return window.__PROCESS_DROP(s);
        } catch (e) {
          return { _error: e.message };
        }
      }, species);

      if (!Array.isArray(drops)) {
        const errMsg = drops?._error || 'processMonsterDrop did not return an array';
        process.stderr.write(`[${totalTested}/${speciesList.length}] ${species} (${locName}): FAIL — ${errMsg}\n`);
        failures.push({ species, item: 'N/A', reason: errMsg });
        continue;
      }

      if (drops.length > 0) {
        process.stderr.write(`[${totalTested}/${speciesList.length}] ${species} (${locName}): ${drops.length} drops — ${drops.map(d => `${d.item}x${d.qty}`).join(', ')}\n`);
      } else {
        process.stderr.write(`[${totalTested}/${speciesList.length}] ${species} (${locName}): 0 drops\n`);
      }

      for (const drop of drops) {
        totalDropped++;
        try {
          const added = await page.evaluate(([item, qty]) => {
            try {
              return window.__STORE.addItem(item, qty);
            } catch (e) {
              return { _error: e.message };
            }
          }, [drop.item, drop.qty]);

          if (added === true) {
            totalAdded++;
            itemsFound[drop.item] = (itemsFound[drop.item] || 0) + 1;
          } else {
            const reason = added?._error || 'addItem returned false';
            process.stderr.write(`  FAIL: addItem('${drop.item}', ${drop.qty}) — ${JSON.stringify(added)}\n`);
            failures.push({ species, item: drop.item, reason });
          }
        } catch (e) {
          process.stderr.write(`  EXCEPTION in addItem evaluate: ${e.message}\n`);
          failures.push({ species, item: drop.item, reason: e.message });
        }
      }
    } catch (e) {
      process.stderr.write(`[${totalTested}/${speciesList.length}] ${species}: EXCEPTION — ${e.message}\n`);
      failures.push({ species, item: 'N/A', reason: e.message });
    }
  }

  await browser.close();

  const uniqueLocations = [...new Set(speciesList.map(s => s.locId))];
  const summary = `Agent 8: tested ${totalTested} species across ${uniqueLocations.length} locations, ${totalDropped} drops processed, ${totalAdded} added, ${failures.length} failures`;

  const result = {
    chunkIndex: 8,
    totalTested,
    totalDropped,
    totalAdded,
    failures,
    itemsFound,
    summary
  };

  // stdout: ONLY the JSON result
  process.stdout.write(JSON.stringify(result) + '\n');
}

main().catch(e => {
  process.stdout.write(JSON.stringify({
    chunkIndex: 8,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'N/A', item: 'N/A', reason: e.message }],
    itemsFound: {},
    summary: `FATAL: ${e.message}`
  }) + '\n');
  process.exit(1);
});
