/**
 * Agent 7 — Playwright script to test encounter drops for assigned species.
 *
 * For each species, calls processMonsterDrop() with drop_100 flag enabled,
 * then attempts to add each dropped item to the store via store.addItem().
 *
 * Output: single JSON object with all results (stdout only).
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const SPECIES = [
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'krabby' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'magikarp' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'mantine' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'psyduck' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'qwilfish' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'remoraid' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'seadra' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'slowpoke' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'tentacool' },
  { locId: 'tanobyRuins', locName: 'Руины Танойи', species: 'tentacruel' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'gyarados' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'horsea' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'kingler' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'krabby' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'magikarp' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'psyduck' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'seadra' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'shellder' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'slowpoke' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'staryu' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'tentacool' },
  { locId: 'oneIsland', locName: 'Остров Один', species: 'tentacruel' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'goldeen' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'gyarados' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'magikarp' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'marill' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'poliwag' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'poliwhirl' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'psyduck' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'slowpoke' },
  { locId: 'fourIsland', locName: 'Остров Четыре', species: 'wooper' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'gyarados' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'hoppip' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'horsea' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'kingler' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'krabby' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'magikarp' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'psyduck' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'seadra' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'shellder' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'slowpoke' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'staryu' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'tentacool' },
  { locId: 'fiveIsland', locName: 'Остров Пять', species: 'tentacruel' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'aipom' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'houndour' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'mareep' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'pineco' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'shuckle' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'smeargle' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'stantler' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'teddiursa' },
  { locId: 'alteringCave', locName: 'Изменчивая Пещера', species: 'zubat' },
  { locId: 'roamingKanto', locName: 'Блуждающие Канто', species: 'entei' },
  { locId: 'roamingKanto', locName: 'Блуждающие Канто', species: 'raikou' },
  { locId: 'roamingKanto', locName: 'Блуждающие Канто', species: 'suicune' },
  { locId: 'birthIsland', locName: 'Остров Рождения', species: 'deoxys-normal' },
  { locId: 'navelRock', locName: 'Скала Пуп', species: 'ho-oh' },
  { locId: 'navelRock', locName: 'Скала Пуп', species: 'lugia' },
  { locId: 'undergroundPath', locName: 'Подземный Путь', species: 'machoke' },
  { locId: 'undergroundPath', locName: 'Подземный Путь', species: 'nidoran-f' },
  { locId: 'blackthornCity', locName: 'Блэкторн-Сити', species: 'dodrio' },
  { locId: 'blackthornCity', locName: 'Блэкторн-Сити', species: 'magikarp' },
  { locId: 'blackthornCity', locName: 'Блэкторн-Сити', species: 'poliwag' },
  { locId: 'blackthornCity', locName: 'Блэкторн-Сити', species: 'rhydon' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'chatot' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'koffing' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'magmar' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'meditite' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'raticate' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'rattata' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'spinda' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'weezing' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'zigzagoon' },
  { locId: 'burnedTower', locName: 'Обожжённая Башня', species: 'zubat' },
  { locId: 'cherrygroveCity', locName: 'Черригроув-Сити', species: 'corsola' },
  { locId: 'cianwoodCity', locName: 'Сианвуд-Сити', species: 'corsola' },
  { locId: 'darkCave', locName: 'Тёмная Пещера', species: 'ursaring' },
  { locId: 'dragonsDen', locName: 'Логово Дракона', species: 'dragonair' },
  { locId: 'dragonsDen', locName: 'Логово Дракона', species: 'dratini' },
  { locId: 'dragonsDen', locName: 'Логово Дракона', species: 'magikarp' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'exeggcute' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'hoothoot' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'ledyba' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'magikarp' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'pineco' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'poliwag' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'poliwhirl' },
  { locId: 'ecruteakCity', locName: 'Экрютик-Сити', species: 'spinarak' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'absol' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'bronzor' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'chingling' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'delibird' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'golbat' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'jynx' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'makuhita' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'sneasel' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'swinub' },
  { locId: 'icePath', locName: 'Ледяная Тропа', species: 'zubat' },
  { locId: 'ilexForest', locName: 'Лес Илекс', species: 'caterpie' },
  { locId: 'ilexForest', locName: 'Лес Илекс', species: 'kakuna' },
  { locId: 'ilexForest', locName: 'Лес Илекс', species: 'metapod' },
  { locId: 'ilexForest', locName: 'Лес Илекс', species: 'pidgey' },
  { locId: 'ilexForest', locName: 'Лес Илекс', species: 'weedle' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'beedrill' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'butterfree' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'caterpie' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'exeggcute' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'gyarados' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'hoothoot' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'kakuna' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'magikarp' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'metapod' },
  { locId: 'lakeOfRage', locName: 'Озеро Гнева', species: 'pineco' },
];

async function main() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'ru-RU' });
  const page = await context.newPage();

  // Collect browser console errors for diagnostics
  const browserErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('manifest')) {
        browserErrors.push(text.slice(0, 300));
      }
    }
  });
  page.on('pageerror', err => {
    browserErrors.push(err.message.slice(0, 300));
  });

  // 1. Load page initially
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 2. Set drop_100 flag
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // 3. Reload so init picks it up
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Mock Telegram if needed (to avoid errors)
  await page.evaluate(() => {
    if (typeof window.Telegram === 'undefined') {
      window.Telegram = { WebApp: { initData: 'test', ready: () => {}, sendData: () => {}, close: () => {} } };
    }
  });

  // 4. Import game modules via dynamic import in the browser
  const modulesReady = await page.evaluate(async () => {
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

  if (!modulesReady) {
    const modErr = await page.evaluate(() => window.__MODULE_ERROR);
    console.error('Module import failed:', modErr);
    await browser.close();
    const result = { chunkIndex: 7, totalTested: 0, totalDropped: 0, totalAdded: 0, failures: [{ species: 'all', item: 'N/A', reason: `Module import failed: ${modErr}` }], itemsFound: {}, summary: 'Module import failed' };
    console.log(JSON.stringify(result));
    return;
  }

  // Verify the functions are accessible
  const hasFunctions = await page.evaluate(() => {
    return typeof window.__PROCESS_DROP === 'function' && typeof window.__STORE.addItem === 'function';
  });
  if (!hasFunctions) {
    console.error('Functions not available after import');
    await browser.close();
    const result = { chunkIndex: 7, totalTested: 0, totalDropped: 0, totalAdded: 0, failures: [{ species: 'all', item: 'N/A', reason: 'Functions not available after module import' }], itemsFound: {}, summary: 'Functions not available' };
    console.log(JSON.stringify(result));
    return;
  }

  // 5. Process each species
  let totalTested = 0;
  let totalDropped = 0;
  let totalAdded = 0;
  const failures = [];
  const itemsFound = {};

  for (const entry of SPECIES) {
    const { locName, species } = entry;
    totalTested++;

    try {
      // Call processMonsterDrop — returns array of {item, qty}
      const drops = await page.evaluate((s) => {
        try {
          return window.__PROCESS_DROP(s);
        } catch (e) {
          return { error: e.message };
        }
      }, species);

      if (drops.error) {
        failures.push({ species, item: 'N/A', reason: `processMonsterDrop error: ${drops.error}` });
        process.stderr.write(`FAIL [${locName}] ${species}: processMonsterDrop error: ${drops.error}\n`);
        continue;
      }

      if (!Array.isArray(drops)) {
        failures.push({ species, item: 'N/A', reason: `processMonsterDrop returned non-array: ${JSON.stringify(drops)}` });
        process.stderr.write(`FAIL [${locName}] ${species}: returned non-array\n`);
        continue;
      }

      totalDropped += drops.length;

      for (const d of drops) {
        if (!d || !d.item) {
          failures.push({ species, item: 'N/A', reason: `Malformed drop entry: ${JSON.stringify(d)}` });
          continue;
        }

        const qty = d.qty || 1;
        const result = await page.evaluate(([item, qtyVal]) => {
          try {
            return window.__STORE.addItem(item, qtyVal);
          } catch (e) {
            return { error: e.message };
          }
        }, [d.item, qty]);

        if (result === true || result === undefined) {
          totalAdded += qty;
          itemsFound[d.item] = (itemsFound[d.item] || 0) + qty;
        } else if (result && result.error) {
          failures.push({ species, item: d.item, reason: `addItem threw: ${result.error}` });
        } else {
          failures.push({ species, item: d.item, reason: 'addItem returned false' });
        }
      }

      process.stderr.write(`OK [${locName}] ${species}: ${drops.length} drops, added successfully\n`);
    } catch (e) {
      failures.push({ species, item: 'N/A', reason: `Unexpected error: ${e.message}` });
      process.stderr.write(`ERROR [${locName}] ${species}: ${e.message}\n`);
    }
  }

  await browser.close();

  // 6. Build summary
  const summaryParts = [];
  summaryParts.push(`Tested ${totalTested} species`);
  summaryParts.push(`${totalDropped} total drops processed`);
  summaryParts.push(`${totalAdded} items added to inventory`);
  if (failures.length > 0) {
    summaryParts.push(`${failures.length} failures`);
  }
  const uniqueItems = Object.keys(itemsFound).length;
  summaryParts.push(`${uniqueItems} unique item types found`);

  const result = {
    chunkIndex: 7,
    totalTested,
    totalDropped,
    totalAdded,
    failures,
    itemsFound,
    summary: summaryParts.join('; ')
  };

  console.log(JSON.stringify(result));
}

main().catch(err => {
  const result = {
    chunkIndex: 7,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'all', item: 'N/A', reason: `Script error: ${err.message}` }],
    itemsFound: {},
    summary: `Script crashed: ${err.message}`
  };
  console.log(JSON.stringify(result));
  process.exit(1);
});
