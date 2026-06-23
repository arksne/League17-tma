/**
 * Agent 6/10 — Playwright test for encounter drops.
 * Tests 114 species across multiple locations.
 */
import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';

const SPECIES = [
  { locId: "lostCave", locName: "Затерянная Пещера", species: "haunter" },
  { locId: "lostCave", locName: "Затерянная Пещера", species: "misdreavus" },
  { locId: "lostCave", locName: "Затерянная Пещера", species: "murkrow" },
  { locId: "lostCave", locName: "Затерянная Пещера", species: "zubat" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "fearow" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "geodude" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "graveler" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "gyarados" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "horsea" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "kingler" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "krabby" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "magikarp" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "meowth" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "persian" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "ponyta" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "psyduck" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "rapidash" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "seadra" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "slowpoke" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "spearow" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "tentacool" },
  { locId: "kindleRoad", locName: "Дорога Киндл", species: "tentacruel" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "fearow" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "gyarados" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "horsea" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "kingler" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "krabby" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "magikarp" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "meowth" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "persian" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "psyduck" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "seadra" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "slowpoke" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "spearow" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "tangela" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "tentacool" },
  { locId: "treasureBeach", locName: "Пляж Сокровищ", species: "tentacruel" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "bellsprout" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "fearow" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "gloom" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "goldeen" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "golduck" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "gyarados" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "magikarp" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "meowth" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "oddish" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "persian" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "poliwag" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "poliwhirl" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "psyduck" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "slowbro" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "slowpoke" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "spearow" },
  { locId: "capeBrink", locName: "Мыс Бринк", species: "weepinbell" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "bellsprout" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "gloom" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "gyarados" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "horsea" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "kingler" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "krabby" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "magikarp" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "meowth" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "oddish" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "persian" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "pidgeotto" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "pidgey" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "psyduck" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "seadra" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "slowpoke" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "tentacool" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "tentacruel" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "venonat" },
  { locId: "bondBridge", locName: "Мост Бонд", species: "weepinbell" },
  { locId: "threeIslePort", locName: "Порт Трёх Островов", species: "dunsparce" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "gyarados" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "hoppip" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "horsea" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "kingler" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "krabby" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "magikarp" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "psyduck" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "qwilfish" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "remoraid" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "seadra" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "slowpoke" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "tentacool" },
  { locId: "resortGorgeous", locName: "Роскошный Курорт", species: "tentacruel" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "gyarados" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "hoppip" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "horsea" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "kingler" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "krabby" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "magikarp" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "psyduck" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "qwilfish" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "remoraid" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "seadra" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "slowpoke" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "tentacool" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "tentacruel" },
  { locId: "waterLabyrinth", locName: "Водный Лабиринт", species: "togepi" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "gyarados" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "hoppip" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "horsea" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "kingler" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "krabby" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "magikarp" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "meowth" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "persian" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "pidgeotto" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "pidgey" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "psyduck" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "qwilfish" },
  { locId: "fiveIsleMeadow", locName: "Луг Пяти Островов", species: "remoraid" },
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

  // ── 1. Load game ──────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // ── 2. Set drop100 flag ───────────────────────────────────
  await page.evaluate(() => {
    localStorage.setItem('pokematrix_drop_100', '1');
  });

  // ── 3. Reload with flag active ────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // ── 4. Import game modules in browser context ─────────────
  const setupOk = await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      window.__STORE = storeModule.store;
      const locModule = await import('/src/ui/location.ts');
      window.__PROCESS_DROP = locModule.processMonsterDrop;
      return true;
    } catch (e) {
      window.__IMPORT_ERR = e.message;
      // Fallback to .js
      try {
        const storeModule = await import('/src/game/store.js');
        window.__STORE = storeModule.store;
        const locModule = await import('/src/ui/location.js');
        window.__PROCESS_DROP = locModule.processMonsterDrop;
        return true;
      } catch (e2) {
        window.__IMPORT_ERR2 = e2.message;
        return false;
      }
    }
  });

  if (!setupOk) {
    const err = await page.evaluate(() => window.__IMPORT_ERR2 || window.__IMPORT_ERR);
    console.error('Failed to import game modules:', err);
    await browser.close();
    process.exit(1);
  }

  // ── 5. Test drops for each species ────────────────────────
  const result = {
    chunkIndex: 5,
    totalTested: 0,
    totalDropped: 0,
    totalAdded: 0,
    failures: [],
    itemsFound: {},
  };

  for (let i = 0; i < SPECIES.length; i++) {
    const { locId, locName, species } = SPECIES[i];
    const progress = `${i + 1}/${SPECIES.length}`;

    const drops = await page.evaluate(async (s) => {
      try {
        return window.__PROCESS_DROP(s);
      } catch (e) {
        return { error: e.message };
      }
    }, species);

    if (drops.error) {
      result.failures.push({ species, item: 'N/A', reason: `processMonsterDrop error: ${drops.error}` });
      process.stderr.write(`[${progress}] ${locId}/${species} -> ERROR: ${drops.error}\n`);
      continue;
    }

    result.totalTested++;

    if (!Array.isArray(drops)) {
      result.failures.push({ species, item: 'N/A', reason: `unexpected return type: ${typeof drops}` });
      process.stderr.write(`[${progress}] ${locId}/${species} -> unexpected return: ${JSON.stringify(drops)}\n`);
      continue;
    }

    for (const d of drops) {
      result.totalDropped++;
      if (!result.itemsFound[d.item]) result.itemsFound[d.item] = 0;
      result.itemsFound[d.item] += d.qty;

      const added = await page.evaluate(async ([itemId, qty]) => {
        try {
          return window.__STORE.addItem(itemId, qty);
        } catch (e) {
          return { error: e.message };
        }
      }, [d.item, d.qty]);

      if (added === true || added === undefined) {
        // addItem returns true on success
        result.totalAdded++;
        process.stdout.write(`[${progress}] ${locId}/${species} -> +${d.qty}x ${d.item} (added)\n`);
      } else if (added && added.error) {
        result.failures.push({ species, item: d.item, reason: `addItem exception: ${added.error}` });
        process.stderr.write(`[${progress}] ${locId}/${species} -> +${d.qty}x ${d.item} FAILED: ${added.error}\n`);
      } else {
        result.failures.push({ species, item: d.item, reason: `addItem returned ${JSON.stringify(added)}` });
        process.stderr.write(`[${progress}] ${locId}/${species} -> +${d.qty}x ${d.item} FAILED (returned: ${added})\n`);
      }
    }

    if (drops.length === 0) {
      process.stdout.write(`[${progress}] ${locId}/${species} -> no drops\n`);
    }
  }

  result.summary = `Agent 5: tested ${result.totalTested} species, ${result.totalDropped} total drops, ${result.totalAdded} added to inventory, ${result.failures.length} failures`;

  await browser.close();

  // ── 6. Output result as JSON ──────────────────────────────
  process.stdout.write('\n' + JSON.stringify(result) + '\n');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
