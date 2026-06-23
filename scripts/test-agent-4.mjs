import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const SPECIES = [
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'psyduck' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'rhyhorn' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'scyther' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'seaking' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'slowpoke' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'tangela' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'tauros' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'venomoth' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'venonat' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'aerodactyl' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'anorith' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'cranidos' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'hoothoot' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'kabuto' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'lileep' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'omanyte' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'pineco' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'rapidash' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'shieldon' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'starly' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'wurmple' },
  { locId: 'pewterCity', locName: 'Пьютер-Сити', species: 'xatu' },
  { locId: 'lavenderTown', locName: 'Лавандовый Город', species: 'diglett-alola' },
  { locId: 'indigoPlateau', locName: 'Индиговое Плато', species: 'exeggutor-alola' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'hitmonchan' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'hitmonlee' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'lapras' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'mudkip' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'porygon' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'raichu-alola' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'torchic' },
  { locId: 'saffronCity', locName: 'Саффрон-Сити', species: 'treecko' },
  { locId: 'moneanChamber', locName: 'Камера Мони', species: 'unown' },
  { locId: 'liptooChamber', locName: 'Камера Липту', species: 'unown' },
  { locId: 'weepthChamber', locName: 'Камера Випта', species: 'unown' },
  { locId: 'dilfordChamber', locName: 'Камера Дилфорда', species: 'unown' },
  { locId: 'scufibChamber', locName: 'Камера Скафиба', species: 'unown' },
  { locId: 'rixyChamber', locName: 'Камера Рикси', species: 'unown' },
  { locId: 'viaposChamber', locName: 'Камера Виапоса', species: 'unown' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'gyarados' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'horsea' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'krabby' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'magikarp' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'psyduck' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'shellder' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'slowpoke' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'staryu' },
  { locId: 'ssAnne', locName: 'С.С. Энн', species: 'tentacool' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'fearow' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'geodude' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'graveler' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'machoke' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'machop' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'magcargo' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'magmar' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'moltres' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'ponyta' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'rapidash' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'slugma' },
  { locId: 'mtEmber', locName: 'Гора Эмбер', species: 'spearow' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'bellsprout' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'drowzee' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'exeggcute' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'gloom' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'goldeen' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'golduck' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'gyarados' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'hypno' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'magikarp' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'oddish' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'pidgeotto' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'pidgey' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'poliwag' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'psyduck' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'seaking' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'slowbro' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'slowpoke' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'venomoth' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'venonat' },
  { locId: 'berryForest', locName: 'Ягодный Лес', species: 'weepinbell' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'delibird' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'dewgong' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'golbat' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'goldeen' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'gyarados' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'horsea' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'kingler' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'krabby' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'lapras' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'magikarp' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'marill' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'poliwag' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'poliwhirl' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'psyduck' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'seadra' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'seel' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'shellder' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'slowpoke' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'sneasel' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'staryu' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'swinub' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'tentacool' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'tentacruel' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'wooper' },
  { locId: 'icefallCave', locName: 'Ледопадная Пещера', species: 'zubat' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'caterpie' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'heracross' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'kakuna' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'ledyba' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'metapod' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'spinarak' },
  { locId: 'patternBush', locName: 'Узорный Кустарник', species: 'weedle' },
  { locId: 'lostCave', locName: 'Затерянная Пещера', species: 'gastly' },
  { locId: 'lostCave', locName: 'Затерянная Пещера', species: 'golbat' },
];

async function main() {
  process.stderr.write('Launching browser...\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const page = await context.newPage();

  // Catch browser errors to stderr
  page.on('pageerror', err => process.stderr.write(`[page error] ${err.message}\n`));

  try {
    // Step 1: Go to the game
    process.stderr.write('Loading game...\n');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Step 2: Set localStorage flag for 100% drops
    process.stderr.write('Setting pokematrix_drop_100 flag...\n');
    await page.evaluate(() => {
      localStorage.setItem('pokematrix_drop_100', '1');
    });

    // Step 3: Reload the page
    process.stderr.write('Reloading...\n');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Step 4: Import game modules
    process.stderr.write('Importing game modules...\n');
    const modulesReady = await page.evaluate(async () => {
      try {
        const storeModule = await import('/src/game/store.ts');
        window.__STORE = storeModule.store;
        const locModule = await import('/src/ui/location.ts');
        window.__PROCESS_DROP = locModule.processMonsterDrop;
        return (
          typeof window.__PROCESS_DROP === 'function' &&
          typeof window.__STORE?.addItem === 'function'
        );
      } catch (e) {
        return 'Error: ' + e.message;
      }
    });

    if (modulesReady !== true) {
      throw new Error('Modules not loaded: ' + modulesReady);
    }

    process.stderr.write('Modules loaded successfully!\n');

    // Step 5: Process each species
    const results = {
      chunkIndex: 4,
      totalTested: 0,
      totalDropped: 0,
      totalAdded: 0,
      failures: [],
      itemsFound: {},
      summary: ''
    };

    for (let i = 0; i < SPECIES.length; i++) {
      const entry = SPECIES[i];
      results.totalTested++;

      // Call processMonsterDrop for this species
      const drops = await page.evaluate((species) => {
        return window.__PROCESS_DROP(species);
      }, entry.species);

      if (!drops || drops.length === 0) {
        process.stderr.write(`[${i + 1}/${SPECIES.length}] ${entry.species} @ ${entry.locName}: no drops returned\n`);
        continue;
      }

      results.totalDropped += drops.length;

      // Add each drop to inventory
      for (const drop of drops) {
        const added = await page.evaluate(([itemId, qty]) => {
          try {
            return window.__STORE.addItem(itemId, qty);
          } catch (e) {
            return 'Error: ' + e.message;
          }
        }, [drop.item, drop.qty]);

        if (added === true) {
          results.totalAdded++;
          results.itemsFound[drop.item] = (results.itemsFound[drop.item] || 0) + drop.qty;
        } else {
          results.failures.push({
            species: entry.species,
            item: drop.item,
            reason: typeof added === 'string' ? added : 'addItem returned false/undefined'
          });
        }
      }

      if ((i + 1) % 10 === 0) {
        process.stderr.write(`[${i + 1}/${SPECIES.length}] processed...\n`);
      }
    }

    // Build summary
    const speciesList = [...new Set(SPECIES.map(s => s.species))];
    const uniqueSpecies = speciesList.length;
    const uniqueItems = Object.keys(results.itemsFound).length;
    results.summary = `chunk4: tested ${results.totalTested} species-location pairs (${uniqueSpecies} unique species), ${results.totalDropped} drops (${uniqueItems} unique items), ${results.totalAdded} added, ${results.failures.length} failures`;

    await browser.close();

    // Output ONLY JSON to stdout
    process.stdout.write(JSON.stringify(results));

  } catch (err) {
    await browser.close().catch(() => {});
    process.stderr.write(`FATAL: ${err.message}\n${err.stack}\n`);
    process.stdout.write(JSON.stringify({
      chunkIndex: 4,
      totalTested: 0,
      totalDropped: 0,
      totalAdded: 0,
      failures: [{ species: 'FATAL', item: '', reason: err.message }],
      itemsFound: {},
      summary: 'Script crashed: ' + err.message
    }));
  }
}

main();
