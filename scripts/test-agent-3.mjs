/**
 * Agent 4/10: Playwright test for encounter drops via direct processMonsterDrop API.
 *
 * Tests 114 species across 8 locations.
 * Uses pokematrix_drop_100 flag to guarantee 100% drop rates.
 * Calls processMonsterDrop + store.addItem directly.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

// ── Species assigned to agent 4 ──────────────────────────────
const SPECIES = [
  { locId: 'victoryRoad1', locName: 'Дорога Победы 1', species: 'rhyhorn' },
  { locId: 'victoryRoad1', locName: 'Дорога Победы 1', species: 'sandslash' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'goldeen' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'gyarados' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'hoothoot' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'ledyba' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'magikarp' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'pineco' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'poliwag' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'poliwhirl' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'psyduck' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'slowpoke' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'spinarak' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'tentacool' },
  { locId: 'viridianCity', locName: 'Веридиан-Сити', species: 'wurmple' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'caterpie' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'kakuna' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'metapod' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'pidgeotto' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'pidgey' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'pikachu' },
  { locId: 'viridianForest', locName: 'Веридианский Лес', species: 'weedle' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'arbok' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'chansey' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'ditto' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'ekans' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'exeggcute' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'exeggutor' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'fearow' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'goldeen' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'gyarados' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'kingler' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'magikarp' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'mankey' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidoking' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidoqueen' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidoran-f' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidoran-m' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidorina' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'nidorino' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'poliwag' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'poliwhirl' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'primeape' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'psyduck' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'sandshrew' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'sandslash' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'seadra' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'seaking' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'slowbro' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'slowpoke' },
  { locId: 'route23', locName: 'Маршрут 23', species: 'spearow' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'chansey' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'electabuzz' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'electrode' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'grimer' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'koffing' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'magnemite' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'magneton' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'muk' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'pikachu' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'raichu' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'voltorb' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'weezing' },
  { locId: 'powerPlant', locName: 'Электростанция', species: 'zapdos' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'arbok' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'geodude' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'golbat' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'graveler' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'machoke' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'machop' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'marowak' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'moltres' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'onix' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'primeape' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'sandslash' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'venomoth' },
  { locId: 'victoryRoad2', locName: 'Дорога Победы 2', species: 'zubat' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'chansey' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'cubone' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'gastly' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'golbat' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'haunter' },
  { locId: 'pokemonTower', locName: 'Башня Покемонов', species: 'zubat' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'chansey' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'ditto' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'grimer' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'growlithe' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'koffing' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'magmar' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'muk' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'ponyta' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'raticate' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'rattata' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'vulpix' },
  { locId: 'pokemonMansion', locName: 'Особняк Покемонов', species: 'weezing' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'chansey' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'cubone' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'doduo' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'dragonair' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'dratini' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'exeggcute' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'goldeen' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'kangaskhan' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'krabby' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'magikarp' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'marowak' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'nidoran-f' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'nidoran-m' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'nidorina' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'nidorino' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'paras' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'parasect' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'pinsir' },
  { locId: 'safariZone', locName: 'Сафари-Зона', species: 'poliwag' },
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

  const failures = [];
  const itemsFound = {};
  let totalTested = 0;
  let totalDropped = 0;
  let totalAdded = 0;

  try {
    // ── 1. Load page ────────────────────────────────────────
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    console.error('Page loaded, waiting 3s...');
    await page.waitForTimeout(3000);

    // ── 2. Set drop100 flag ─────────────────────────────────
    await page.evaluate(() => {
      localStorage.setItem('pokematrix_drop_100', '1');
    });
    console.error('drop100 flag set, reloading...');

    // ── 3. Reload ───────────────────────────────────────────
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    console.error('Reloaded, waiting 3s...');

    // ── 4. Import game modules ──────────────────────────────
    await page.evaluate(async () => {
      // Mock Telegram if not present
      if (!window.Telegram) {
        window.Telegram = {
          WebApp: {
            initData: 'test',
            ready: () => {},
            sendData: () => {},
            close: () => {},
          }
        };
      }
    });

    const modulesLoaded = await page.evaluate(async () => {
      try {
        const storeModule = await import('/src/game/store.ts');
        window.__STORE = storeModule.store;
        const locModule = await import('/src/ui/location.ts');
        window.__PROCESS_DROP = locModule.processMonsterDrop;
        return true;
      } catch (e) {
        return 'Error: ' + e.message;
      }
    });
    console.error('Modules loaded:', modulesLoaded);

    if (modulesLoaded !== true) {
      throw new Error('Failed to load modules: ' + modulesLoaded);
    }

    // Verify modules work
    const verify = await page.evaluate(() => {
      return {
        hasStore: typeof window.__STORE !== 'undefined',
        hasProcessDrop: typeof window.__PROCESS_DROP === 'function',
        storeMethods: typeof window.__STORE?.addItem === 'function',
      };
    });
    console.error('Module verification:', JSON.stringify(verify));

    if (!verify.hasStore || !verify.hasProcessDrop || !verify.storeMethods) {
      throw new Error('Modules not loaded correctly');
    }

    // ── 5. Test each species ─────────────────────────────────
    for (let i = 0; i < SPECIES.length; i++) {
      const entry = SPECIES[i];
      const { species, locId, locName } = entry;

      const result = await page.evaluate((s) => {
        try {
          const drops = window.__PROCESS_DROP(s);
          return { ok: true, species: s, drops };
        } catch (e) {
          return { ok: false, species: s, error: e.message };
        }
      }, species);

      totalTested++;
      console.error(`[${i + 1}/${SPECIES.length}] ${species} (${locName})`);

      if (!result.ok) {
        failures.push({ species, item: 'N/A', reason: `processMonsterDrop threw: ${result.error}` });
        console.error(`  ERROR: ${result.error}`);
        continue;
      }

      const drops = result.drops;
      console.error(`  Drops: ${drops.length}`);

      for (const d of drops) {
        totalDropped++;
        const addResult = await page.evaluate(([item, qty]) => {
          try {
            const ok = window.__STORE.addItem(item, qty);
            return { ok, item, qty };
          } catch (e) {
            return { ok: false, item, qty, error: e.message };
          }
        }, [d.item, d.qty]);

        if (addResult.ok) {
          totalAdded++;
          itemsFound[d.item] = (itemsFound[d.item] || 0) + d.qty;
          console.error(`    +${d.qty} ${d.item} (added)`);
        } else {
          failures.push({
            species,
            item: d.item,
            reason: addResult.error ? `addItem threw: ${addResult.error}` : 'addItem returned false'
          });
          console.error(`    ${d.item} FAILED: ${addResult.error || 'returned false'}`);
        }
      }
    }

  } catch (e) {
    console.error('FATAL ERROR:', e.message);
    failures.push({ species: 'SCRIPT', item: 'N/A', reason: e.message });
  } finally {
    await browser.close();
  }

  // ── 6. Output JSON ───────────────────────────────────────
  const totalUniqueItems = Object.keys(itemsFound).length;
  const summary = `Tested ${totalTested} species, ${totalDropped} drops processed, ${totalAdded} added successfully, ${failures.length} failures, ${totalUniqueItems} unique items found.`;

  const output = {
    chunkIndex: 3,
    totalTested,
    totalDropped,
    totalAdded,
    failures,
    itemsFound,
    summary,
  };

  console.log(JSON.stringify(output));
}

main().catch(e => {
  console.error('Script error:', e);
  const output = {
    chunkIndex: 3,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'SCRIPT', item: 'N/A', reason: e.message }],
    itemsFound: {},
    summary: `Script crashed: ${e.message}`,
  };
  console.log(JSON.stringify(output));
  process.exit(1);
});
