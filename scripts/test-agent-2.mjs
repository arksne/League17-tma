/**
 * Agent 2/10 — Playwright test for encounter drops.
 * Tests 114 species across multiple locations, capturing drops via
 * processMonsterDrop and adding them to the game store.
 */

import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const CHUNK_INDEX = 2;

// ── Assigned species list (114 entries) ──────────────────────
const ASSIGNED = [
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'seadra' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'shellder' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'slowpoke' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'spinarak' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'squirtle' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'staryu' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'tentacool' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'tentacruel' },
  { locId: 'palletTown', locName: 'Паллет-Таун', species: 'wurmple' },
  { locId: 'rockTunnel', locName: 'Скальный Туннель', species: 'cubone' },
  { locId: 'rockTunnel', locName: 'Скальный Туннель', species: 'kangaskhan' },
  { locId: 'rockTunnel', locName: 'Скальный Туннель', species: 'machoke' },
  { locId: 'rockTunnel', locName: 'Скальный Туннель', species: 'machop' },
  { locId: 'rockTunnel', locName: 'Скальный Туннель', species: 'marowak' },
  { locId: 'route1', locName: 'Маршрут 1', species: 'furret' },
  { locId: 'route1', locName: 'Маршрут 1', species: 'pidgey' },
  { locId: 'route1', locName: 'Маршрут 1', species: 'sentret' },
  { locId: 'route10', locName: 'Маршрут 10', species: 'fearow' },
  { locId: 'route10', locName: 'Маршрут 10', species: 'marowak' },
  { locId: 'route10', locName: 'Маршрут 10', species: 'spearow' },
  { locId: 'route11', locName: 'Маршрут 11', species: 'hoppip' },
  { locId: 'route11', locName: 'Маршрут 11', species: 'pidgeotto' },
  { locId: 'route11', locName: 'Маршрут 11', species: 'rattata' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'bellsprout' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'chansey' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'farfetchd' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'gloom' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'goldeen' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'gyarados' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'hoothoot' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'horsea' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'kingler' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'krabby' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'ledyba' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'magikarp' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'oddish' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'pidgeot' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'pidgeotto' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'pidgey' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'poliwag' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'psyduck' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'quagsire' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'qwilfish' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'relicanth' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'seadra' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'slowbro' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'slowpoke' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'snorlax' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'spinarak' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'tangela' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'tentacool' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'tentacruel' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'venonat' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'weepinbell' },
  { locId: 'route12', locName: 'Маршрут 12', species: 'wurmple' },
  { locId: 'route13', locName: 'Маршрут 13', species: 'hoppip' },
  { locId: 'route13', locName: 'Маршрут 13', species: 'pidgeotto' },
  { locId: 'route14', locName: 'Маршрут 14', species: 'hoppip' },
  { locId: 'route14', locName: 'Маршрут 14', species: 'pidgeotto' },
  { locId: 'route14', locName: 'Маршрут 14', species: 'skiploom' },
  { locId: 'route15', locName: 'Маршрут 15', species: 'hoppip' },
  { locId: 'route15', locName: 'Маршрут 15', species: 'pidgeotto' },
  { locId: 'route16', locName: 'Маршрут 16', species: 'fearow' },
  { locId: 'route17', locName: 'Маршрут 17', species: 'fearow' },
  { locId: 'route18', locName: 'Маршрут 18', species: 'fearow' },
  { locId: 'seaRoute19', locName: 'Морской Маршрут 19', species: 'corsola' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'butterfree' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'caterpie' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'ledyba' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'metapod' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'pidgeotto' },
  { locId: 'route2', locName: 'Маршрут 2', species: 'pidgey' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'chinchou' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'goldeen' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'gyarados' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'horsea' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'kingler' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'krabby' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'lanturn' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'lapras' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'magikarp' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'pidgeot' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'pidgeotto' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'pidgey' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'poliwag' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'psyduck' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'seadra' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'shellder' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'slowpoke' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'staryu' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'tentacool' },
  { locId: 'seaRoute20', locName: 'Морской Маршрут 20', species: 'tentacruel' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'bellsprout' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'bidoof' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'buizel' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'chansey' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'chinchou' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'gloom' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'goldeen' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'gyarados' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'hoothoot' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'horsea' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'kingler' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'krabby' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'lanturn' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'ledyba' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'linoone' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'magikarp' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'mr-mime' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'oddish' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'pidgeot' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'pidgeotto' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'pidgey' },
  { locId: 'seaRoute21', locName: 'Морской Маршрут 21', species: 'poliwag' },
];

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  const browserErrors = [];
  page.on('pageerror', err => browserErrors.push(err.message));
  page.on('console', () => {});

  // ── 1. Load the game ──────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // ── 2. Enable drop100 mode ────────────────────────────────
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // ── 3. Reload ─────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // ── 4. Import game modules ────────────────────────────────
  const modulesReady = await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      window.__STORE = storeModule.store;
      const locModule = await import('/src/ui/location.ts');
      window.__PROCESS_DROP = locModule.processMonsterDrop;
      // Ensure inventory is initialized
      if (!window.__STORE._state.inventory) {
        window.__STORE._state.inventory = {};
      }
      return true;
    } catch (e) {
      window.__IMPORT_ERR = e.message;
      return false;
    }
  });

  if (!modulesReady) {
    const errMsg = await page.evaluate(() => window.__IMPORT_ERR);
    await browser.close();
    const output = {
      chunkIndex: CHUNK_INDEX,
      totalTested: 0,
      totalDropped: 0,
      totalAdded: 0,
      failures: [{ species: 'N/A', item: 'N/A', reason: `ESM import failed: ${errMsg}` }],
      itemsFound: {},
      summary: `FAILED: import error - ${errMsg}`,
    };
    console.log(JSON.stringify(output));
    process.exit(1);
  }

  // ── 5. Test each assigned species ─────────────────────────
  let totalTested = 0;
  let totalDropped = 0;
  let totalAdded = 0;
  const failures = [];
  const itemsFound = {};

  for (const entry of ASSIGNED) {
    const species = entry.species;
    const locName = entry.locName;
    try {
      const drops = await page.evaluate((s) => window.__PROCESS_DROP(s), species);
      totalTested++;
      if (drops && drops.length > 0) {
        for (const d of drops) {
          totalDropped += d.qty || 1;
          const added = await page.evaluate(
            ([item, qty]) => window.__STORE.addItem(item, qty),
            [d.item, d.qty || 1]
          );
          if (added) {
            totalAdded += d.qty || 1;
          } else {
            failures.push({
              species,
              item: d.item,
              reason: 'addItem returned false',
            });
          }
          const itemKey = d.item;
          itemsFound[itemKey] = (itemsFound[itemKey] || 0) + (d.qty || 1);
        }
      }
    } catch (e) {
      totalTested++;
      failures.push({
        species,
        item: 'N/A',
        reason: `processMonsterDrop threw: ${e.message}`,
      });
    }
  }

  await browser.close();

  // ── 6. Output JSON result ─────────────────────────────────
  const output = {
    chunkIndex: CHUNK_INDEX,
    totalTested,
    totalDropped,
    totalAdded,
    failures,
    itemsFound,
    summary: `Agent ${CHUNK_INDEX}: tested ${totalTested} species, ${totalDropped} items dropped, ${totalAdded} items added to inventory, ${failures.length} failures`,
  };

  console.log(JSON.stringify(output));
}

main().catch(e => {
  const output = {
    chunkIndex: CHUNK_INDEX,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [{ species: 'N/A', item: 'N/A', reason: `Fatal error: ${e.message}` }],
    itemsFound: {},
    summary: `FATAL: ${e.message}`,
  };
  console.log(JSON.stringify(output));
  process.exit(1);
});
