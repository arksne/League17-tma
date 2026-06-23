/**
 * ТЩАТЕЛЬНЫЙ ТЕСТ: 100 итераций на каждый вид покемона.
 *
 * Цель: проверить, что ВСЕ 121 предмет дропа могут попасть
 * в инвентарь, и найти какие предметы блокируются лимитами.
 *
 * Запуск: node scripts/test-drops-thorough.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'http://localhost:5173';
const ITERATIONS = 100; // вызовов processMonsterDrop на вид

// ── Загружаем имена предметов ──────────────────────────────
const ITEM_NAMES = {};
const ITEM_CATEGORIES = {};
function loadItems() {
  try {
    const content = readFileSync(resolve('src/data/items.ts'), 'utf-8');
    const regex = /id:\s*'(\w+)'[\s\S]*?nameRu:\s*'([^']+)'[\s\S]*?category:\s*'(\w+)'/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      ITEM_NAMES[m[1]] = m[2];
      ITEM_CATEGORIES[m[1]] = m[3];
    }
  } catch (e) {
    console.warn('Cannot load items:', e.message);
  }
}
function n(id) { return ITEM_NAMES[id] || id; }
function cat(id) { return ITEM_CATEGORIES[id] || '?'; }

const CATEGORY_LIMITS = {
  balls: 99, healing: 20, statusCure: 20, ppRecovery: 20,
  vitamins: 99, evolutionStones: 5, berries: 20, training: 10,
  battle: 10, crafting: 99, tickets: 10,
};
const MAX_BAG = 1000;

async function main() {
  loadItems();
  try { mkdirSync(resolve('test-output'), { recursive: true }); } catch(e) {}

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const log = [];

  function logMsg(msg) {
    console.log(msg);
    log.push(msg);
  }

  // ── 1. Загружаем игру ──────────────────────────────────
  logMsg('📡 Загружаем игру...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  logMsg('✅ DOM загружен');

  // ── 2. Подключаемся к store ─────────────────────────────
  logMsg('\n🔌 Подключаемся к game store...');
  await page.evaluate(async () => {
    try {
      const storeModule = await import('/src/game/store.ts');
      // @ts-ignore
      window.__STORE = storeModule.store || storeModule.default || storeModule;
      const locationModule = await import('/src/ui/location.ts');
      // @ts-ignore
      window.__PROCESS_DROP = locationModule.processMonsterDrop;
    } catch(e) {
      // @ts-ignore
      window.__ERROR = e.message;
    }
  });

  const hasError = await page.evaluate(() => {
    // @ts-ignore
    return window.__ERROR || null;
  });
  if (hasError) {
    logMsg('❌ Ошибка подключения: ' + hasError);
    await browser.close();
    process.exit(1);
  }

  // ── 3. Получаем список всех видов ────────────────────────
  logMsg('\n📋 Загружаем дроп-таблицу...');
  const speciesList = await page.evaluate(async () => {
    const dropModule = await import('/src/data/drops.js');
    // @ts-ignore
    const table = dropModule.MONSTER_DROP_TABLE || dropModule.default;
    return Object.keys(table).sort();
  });
  logMsg(`📊 Всего видов: ${speciesList.length}`);

  // ── 4. МНОГОКРАТНЫЙ ТЕСТ ────────────────────────────────
  logMsg(`\n🧪 ТЕСТ: ${ITERATIONS} итераций на каждый вид`);
  logMsg(`   Всего вызовов processMonsterDrop: ${speciesList.length * ITERATIONS}`);
  logMsg('   Это может занять несколько минут...\n');

  const results = await page.evaluate(async (iterations) => {
    const results = {
      // @ts-ignore
      store: window.__STORE,
      // @ts-ignore
      processDrop: window.__PROCESS_DROP,
      iterations,
      speciesCount: 0,
      totalCalls: 0,
      itemsDropped: {},   // itemId -> сколько раз выпал
      itemsAdded: {},     // itemId -> сколько раз добавили
      addFailures: [],    // { item, reason, count }
      speciesResults: {}, // species -> { calls: N, drops: [...], fails: [...] }
    };

    try {
      const dropModule = await import('/src/data/drops.js');
      // @ts-ignore
      const dropTable = dropModule.MONSTER_DROP_TABLE || dropModule.default;
      const species = Object.keys(dropTable).sort();

      results.speciesCount = species.length;

      // Сброс inventory (начинаем с 0 предметов)
      // @ts-ignore
      if (results.store && results.store._state) {
        // @ts-ignore
        const inv = results.store._state.inventory || {};
        // Оставляем только credit
        const credit = inv.credit || 0;
        // @ts-ignore
        results.store._state.inventory = { credit };
      }

      for (const pkm of species) {
        const speciesResult = { drops: 0, fails: 0, items: {} };
        const entries = dropTable[pkm] || [];

        if (entries.length === 0) {
          // Пустой дроп-лист — пропускаем
          results.speciesResults[pkm] = { type: 'empty', drops: 0 };
          continue;
        }

        for (let i = 0; i < iterations; i++) {
          results.totalCalls++;
          // @ts-ignore
          const drops = results.processDrop(pkm);

          if (drops.length > 0) {
            speciesResult.drops++;

            for (const d of drops) {
              // Считаем сколько раз выпал
              results.itemsDropped[d.item] = (results.itemsDropped[d.item] || 0) + 1;

              // Пробуем добавить
              // @ts-ignore
              const added = results.store.addItem(d.item, d.qty);
              if (added) {
                results.itemsAdded[d.item] = (results.itemsAdded[d.item] || 0) + 1;
                speciesResult.items[d.item] = (speciesResult.items[d.item] || 0) + 1;
              } else {
                // Ошибка добавления!
                speciesResult.fails++;
                const reason = 'addItem вернул false';
                results.addFailures.push({ pokemon: pkm, item: d.item, qty: d.qty, reason });
              }
            }
          }
        }

        results.speciesResults[pkm] = speciesResult;
      }
    } catch(e) {
      results.error = e.message;
    }

    return results;
  }, ITERATIONS);

  if (results.error) {
    logMsg(`❌ Ошибка выполнения: ${results.error}`);
  }

  // ── 5. Анализ результатов ───────────────────────────────
  logMsg('\n' + '='.repeat(70));
  logMsg('📊 ИТОГИ ТЕСТА');
  logMsg('='.repeat(70));

  const totalCalls = results.totalCalls;
  const speciesWithDrops = Object.entries(results.speciesResults)
    .filter(([k, v]) => v.type !== 'empty' && v.drops > 0).length;
  const speciesWithoutDrops = Object.entries(results.speciesResults)
    .filter(([k, v]) => v.type === 'empty' || v.drops === 0).length;

  logMsg(`\n📈 Статистика вызовов:`);
  logMsg(`   Всего видов: ${results.speciesCount}`);
  logMsg(`   Всего вызовов: ${totalCalls}`);
  logMsg(`   Виды с дроп-листом: ${Object.entries(results.speciesResults).filter(([k, v]) => v.type !== 'empty').length}`);
  logMsg(`   Виды с хотя бы 1 дропом (за ${ITERATIONS} попыток): ${speciesWithDrops}`);

  // ── Предметы: выпало vs добавлено ──────────────────────
  const allItemIds = [...new Set([...Object.keys(results.itemsDropped), ...Object.keys(results.itemsAdded)])];
  allItemIds.sort();

  logMsg(`\n📋 Предметы дропа (${allItemIds.length} уникальных):`);

  let allAdded = true;
  const failedToAdd = [];

  for (const itemId of allItemIds) {
    const dropped = results.itemsDropped[itemId] || 0;
    const added = results.itemsAdded[itemId] || 0;
    const ok = added === dropped;

    if (ok) {
      logMsg(`   ✅ ${n(itemId).padEnd(25)} выпало: ${dropped} | добавлено: ${added}`);
    } else {
      allAdded = false;
      failedToAdd.push({ itemId, dropped, added });
      logMsg(`   ❌ ${n(itemId).padEnd(25)} выпало: ${dropped} | добавлено: ${added}`);
    }
  }

  if (allAdded) {
    logMsg(`\n✅ ВСЕ ПРЕДМЕТЫ ДОШЛИ ДО ИНВЕНТАРЯ!`);
  } else {
    logMsg(`\n❌ НЕ ВСЕ ПРЕДМЕТЫ ДОШЛИ:`);
    for (const f of failedToAdd) {
      logMsg(`   ${n(f.itemId)}: выпало ${f.dropped}, добавлено ${f.added}`);
    }
  }

  // ── Ошибки добавления ──────────────────────────────────
  if (results.addFailures.length > 0) {
    logMsg(`\n❌ ОШИБКИ ADDITEM (${results.addFailures.length}):`);
    const byReason = {};
    for (const f of results.addFailures) {
      const key = `${f.item} (${f.reason})`;
      byReason[key] = (byReason[key] || 0) + 1;
    }
    for (const [reason, count] of Object.entries(byReason)) {
      logMsg(`   ${count}x: ${n(reason)}`);
    }
  } else {
    logMsg(`\n✅ addItem не вернул ни одного false — все дропы дошли!`);
  }

  // ── Итоговый инвентарь ─────────────────────────────────
  logMsg(`\n\n📦 ИТОГОВЫЙ ИНВЕНТАРЬ`);
  const finalInv = await page.evaluate(() => {
    try {
      // @ts-ignore
      const store = window.__STORE;
      if (!store) return { error: 'no store' };
      const inv = store._state?.inventory || {};

      // Читаем категории
      return Object.fromEntries(
        Object.entries(inv)
          .filter(([k, v]) => v > 0 && k !== 'credit')
          .sort((a, b) => b[1] - a[1])
      );
    } catch(e) { return { error: e.message }; }
  });

  if (finalInv.error) {
    logMsg(`⚠️ ${finalInv.error}`);
  } else {
    const totalQty = Object.values(finalInv).reduce((s, v) => s + v, 0);
    logMsg(`   Всего предметов: ${totalQty}/${MAX_BAG}`);
    logMsg(`   Уникальных типов: ${Object.keys(finalInv).length}`);
    logMsg(`\n📋 Состав:`);

    // Группируем по категориям
    const byCategory = {};
    for (const [id, qty] of Object.entries(finalInv)) {
      const c = cat(id);
      if (!byCategory[c]) byCategory[c] = [];
      byCategory[c].push({ id, qty });
    }

    for (const [c, items] of Object.entries(byCategory)) {
      const limit = CATEGORY_LIMITS[c] || '∞';
      const total = items.reduce((s, i) => s + i.qty, 0);
      logMsg(`\n   📂 ${c} (${total}/${limit}):`);
      items.sort((a, b) => b.qty - a.qty);
      for (const item of items) {
        const fillPct = limit !== '∞' ? Math.round(item.qty / limit * 100) : 0;
        const warn = fillPct >= 80 ? ' ⚠️' : '';
        logMsg(`      ${n(item.id).padEnd(25)} ${String(item.qty).padEnd(5)}${fillPct > 0 ? ` (${fillPct}% лимита)${warn}` : ''}`);
      }
    }
  }

  // ── Вывод решающего заключения ──────────────────────────
  logMsg(`\n\n${'='.repeat(70)}`);
  logMsg('🔍 ЗАКЛЮЧЕНИЕ');
  logMsg('='.repeat(70));

  if (allAdded && results.addFailures.length === 0) {
    logMsg(`
✅ СИСТЕМА ДРОПА РАБОТАЕТ КОРРЕКТНО:
   - processMonsterDrop возвращает корректные предметы
   - addItem успешно добавляет все предметы в инвентарь
   - Ни одного false от addItem не получено

   Если предметы "не падают в инвентарь", причина в том что:
   - Шанс дропа низкий (обычно 5% = большинство боёв без дропа)
   - Рюкзак может быть полон (MAX_BAG = 1000)
   - Слот категории может быть заполнен`);
  } else {
    logMsg(`
❌ ПРОБЛЕМЫ ОБНАРУЖЕНЫ:
   - ${results.addFailures.length} ошибок addItem
   - ${failedToAdd.length} предметов не дошли до инвентаря`);
  }

  // ── Сохраняем результаты ───────────────────────────────
  const output = {
    summary: {
      totalSpecies: results.speciesCount,
      totalCalls: totalCalls,
      iterationsPerSpecies: ITERATIONS,
      allAdded: allAdded,
      totalFailures: results.addFailures.length,
    },
    itemsDropped: results.itemsDropped,
    itemsAdded: results.itemsAdded,
    addFailures: results.addFailures,
    finalInventory: finalInv,
  };

  writeFileSync(
    resolve('test-output', 'thorough-test-results.json'),
    JSON.stringify(output, null, 2),
    'utf8'
  );
  logMsg('\n📝 Подробные результаты: test-output/thorough-test-results.json');

  await browser.close();
  logMsg('\n🏁 ТЕСТ ЗАВЕРШЁН');
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
