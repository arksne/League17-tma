/**
 * Agent 0: Playwright drop test for assigned species x location pairs.
 * Tests processMonsterDrop + store.addItem for each species with 100% drop rate.
 * Outputs JSON-only result to stdout.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CHUNK_INDEX = 0;

const SPECIES = [
  { locId: "celadonCity", locName: "Селедон-Сити", species: "abra" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "clefable" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "clefairy" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "combee" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "dragonair" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "dratini" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "eevee" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "goldeen" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "grimer" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "heracross" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "horsea" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "koffing" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "larvitar" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "magikarp" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "mr-mime" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "muk" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "nidorina" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "nidorino" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "pikachu" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "pinsir" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "poliwag" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "poliwhirl" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "porygon" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "psyduck" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "sandshrew-alola" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "scyther" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "slowpoke" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "spearow" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "vulpix" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "vulpix-alola" },
  { locId: "celadonCity", locName: "Селедон-Сити", species: "wigglytuff" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "bulbasaur" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "combee" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "goldeen" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "gyarados" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "hoothoot" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "horsea" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "jynx" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "krabby" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "magikarp" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "pineco" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "poliwag" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "psyduck" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "rattata-alola" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "seaking" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "slowpoke" },
  { locId: "ceruleanCity", locName: "Церулин-Сити", species: "tentacool" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "aerodactyl" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "chinchou" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "dewgong" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "electrode" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "goldeen" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "grimer-alola" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "gyarados" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "horsea" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "kabuto" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "krabby" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "lanturn" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "magikarp" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "meowth-alola" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "muk" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "omanyte" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "poliwag" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "psyduck" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "rhydon" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "seadra" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "seel" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "shellder" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "slowbro" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "slowpoke" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "staryu" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "tangela" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "tentacool" },
  { locId: "cinnabarIsland", locName: "Остров Киноварь", species: "tentacruel" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "absol" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "bronzor" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "chansey" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "chingling" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "diglett" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "dugtrio" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "makuhita" },
  { locId: "diglettsCave", locName: "Пещера Диглетта", species: "zubat" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "goldeen" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "gyarados" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "hoothoot" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "krabby" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "ledyba" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "magikarp" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "marowak-alola" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "poliwag" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "psyduck" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "seaking" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "slowpoke" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "spinarak" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "tangela" },
  { locId: "fuchsiaCity", locName: "Фуксия-Сити", species: "wurmple" },
  { locId: "mtMoon", locName: "Гора Мун", species: "sandshrew" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "bulbasaur" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "charmander" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "chinchou" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "eevee" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "goldeen" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "gyarados" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "hoothoot" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "horsea" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "kingler" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "krabby" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "lanturn" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "ledyba" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "magikarp" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "pikachu" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "pineco" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "poliwag" },
  { locId: "palletTown", locName: "Паллет-Таун", species: "psyduck" }
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU'
  });

  const browserErrors = [];
  page.on('pageerror', err => browserErrors.push(err.message));

  // 1. Go to game
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 2. Set localStorage drop100 flag
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // 3. Reload to let the game initialize with drop100
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 4. Import game modules into window for access
  const modulesLoaded = await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      window.__STORE = storeModule.store;

      const locModule = await import('/src/ui/location.ts');
      window.__PROCESS_DROP = locModule.processMonsterDrop;

      return { ok: true };
    } catch (e) {
      // Fallback: try .js extension
      try {
        const storeModule = await import('/src/game/store.js');
        window.__STORE = storeModule.store;

        const locModule = await import('/src/ui/location.js');
        window.__PROCESS_DROP = locModule.processMonsterDrop;

        return { ok: true, fallback: true };
      } catch (e2) {
        return { ok: false, error: e.message, error2: e2.message };
      }
    }
  });

  if (!modulesLoaded.ok) {
    await browser.close();
    const result = {
      chunkIndex: CHUNK_INDEX,
      totalTested: 0,
      totalDropped: 0,
      totalAdded: 0,
      failures: [{ species: 'SYSTEM', item: '', reason: `Module import failed: ${modulesLoaded.error} / ${modulesLoaded.error2}` }],
      itemsFound: {},
      summary: 'Module import failed'
    };
    console.log(JSON.stringify(result));
    process.exit(0);
  }

  // 5. Test each species
  const result = await page.evaluate(async (speciesList) => {
    const store = window.__STORE;
    const processDrop = window.__PROCESS_DROP;

    const failures = [];
    const itemsFound = {};
    let totalDropped = 0;
    let totalAdded = 0;

    for (const entry of speciesList) {
      const species = entry.species;
      let drops;

      try {
        drops = processDrop(species);
      } catch (e) {
        failures.push({ species, item: '', reason: `processMonsterDrop threw: ${e.message}` });
        continue;
      }

      if (!drops || drops.length === 0) {
        // No drops for this species (or all rolled empty somehow, but drop100 should make everything 100%)
        continue;
      }

      for (const d of drops) {
        totalDropped++;
        if (!itemsFound[d.item]) itemsFound[d.item] = 0;
        itemsFound[d.item] += d.qty;

        try {
          const added = store.addItem(d.item, d.qty);
          if (added === true) {
            totalAdded += d.qty;
          } else {
            failures.push({ species, item: d.item, reason: 'addItem returned false' });
          }
        } catch (e) {
          failures.push({ species, item: d.item, reason: `addItem threw: ${e.message}` });
        }
      }
    }

    let totalTested = speciesList.length;
    let summary = `Tested ${totalTested} species: ${totalDropped} drop entries (${Object.keys(itemsFound).length} unique items), ${totalAdded} items added, ${failures.length} failures`;

    return {
      chunkIndex: 0,
      totalTested,
      totalDropped,
      totalAdded,
      failures,
      itemsFound,
      summary
    };
  }, SPECIES);

  await browser.close();
  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(e => {
  const result = {
    chunkIndex: CHUNK_INDEX,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'SYSTEM', item: '', reason: `Fatal error: ${e.message}` }],
    itemsFound: {},
    summary: 'Fatal error'
  };
  console.log(JSON.stringify(result));
  process.exit(0);
});
