/**
 * ПРЯМОЙ ТЕСТ СИСТЕМЫ ДРОПА через ES module import.
 *
 * После загрузки игры динамически импортируем store.ts через
 * Vite dev server — получаем доступ к тем же инстансам.
 *
 * Запуск: node scripts/test-drops-direct.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'http://localhost:5173';

// ── Названия предметов для красивого вывода ────────────────
const ITEM_NAMES = {};

// ── Загружаем items.ts для имён ─────────────────────────────
function loadItemNames() {
  try {
    const content = readFileSync(resolve('src/data/items.ts'), 'utf-8');
    const regex = /id:\s*'(\w+)'[\s\S]*?nameRu:\s*'([^']+)'/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      ITEM_NAMES[m[1]] = m[2];
    }
  } catch (e) {
    console.warn('Cannot load item names:', e.message);
  }
}

function itemName(id) {
  return ITEM_NAMES[id] || id;
}

// ── Все виды покемонов в дроп-таблице ──────────────────────
let ALL_DROP_SPECIES = [];
function loadDropSpecies() {
  try {
    const content = readFileSync(resolve('src/data/drops.js'), 'utf-8');
    const match = content.match(/export const MONSTER_DROP_TABLE\s*=\s*(\{[\s\S]*\})/);
    if (match) {
      const table = eval('(' + match[1] + ')');
      ALL_DROP_SPECIES = Object.keys(table).sort();
    }
  } catch (e) {
    console.warn('Cannot load drops.js:', e.message);
  }
}

async function main() {
  loadItemNames();
  loadDropSpecies();
  try { mkdirSync(resolve('test-output'), { recursive: true }); } catch(e) {}

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    locale: 'ru-RU',
  });

  // Ловим консоль и ошибки
  const browserErrors = [];
  page.on('pageerror', err => browserErrors.push(err.message));

  // ── 1. Загружаем игру ──────────────────────────────────
  console.log('📡 Загружаем игру на ' + BASE_URL + '...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);
  console.log('✅ DOM загружен');

  // ── 2. Подключаемся к store через ESM import ─────────────
  console.log('\n🔌 Подключаемся к game store...');

  const storeInfo = await page.evaluate(async () => {
    const info = {
      storeAvailable: false,
      hasProcessMonsterDrop: false,
      errors: [],
      inventorySnapshot: {},
      dropTestResults: [],
      addItemResults: [],
    };

    try {
      // Импортируем модули игры (Vite кэширует — получаем тот же инстанс)
      const storeModule = await import('/src/game/store.ts');
      // @ts-ignore
      window.__STORE = storeModule.store || storeModule.default || storeModule;

      const locationModule = await import('/src/ui/location.ts');
      // @ts-ignore
      window.__PROCESS_DROP = locationModule.processMonsterDrop;
      // @ts-ignore
      window.__DROP_TABLE = locationModule.MONSTER_DROP_TABLE;
    } catch(e) {
      info.errors.push('ESM import failed: ' + e.message);
      // Fallback: попробуем через absolute path
      try {
        const storeModule = await import('/src/game/store.js');
        // @ts-ignore
        window.__STORE = storeModule.store || storeModule.default || storeModule;
      } catch(e2) {
        info.errors.push('Fallback import also failed: ' + e2.message);
      }
      return info;
    }

    // @ts-ignore
    const store = window.__STORE;
    if (!store) {
      info.errors.push('Store still undefined after import');
      return info;
    }

    info.storeAvailable = true;

    // Пробуем получить/создать состояние
    if (store.setState && !store.getState) {
      // Нестандартный интерфейс
    }

    // Проверяем processMonsterDrop
    // @ts-ignore
    if (typeof window.__PROCESS_DROP === 'function') {
      info.hasProcessMonsterDrop = true;
    }

    // Тест addItem
    const testItems = ['potion', 'pokeBall', 'oranBerry', 'sitrusBerry', 'spellTag', 'charcoal'];
    for (const itemId of testItems) {
      try {
        const added = store.addItem(itemId, 5);
        const qty = store.getItemQty ? store.getItemQty(itemId) : '?';
        info.addItemResults.push({ item: itemId, added, qty });
      } catch(e) {
        info.addItemResults.push({ item: itemId, added: false, error: e.message });
      }
    }

    // Снимок инвентаря
    try {
      const inv = store._state?.inventory || {};
      info.inventorySnapshot = Object.fromEntries(
        Object.entries(inv).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1])
      );
    } catch(e) {
      info.errors.push('Inventory snapshot: ' + e.message);
    }

    return info;
  });

  // ── Результаты первого теста ──────────────────────────────
  console.log(`\n📊 Store: ${storeInfo.storeAvailable ? '✅ доступен' : '❌ недоступен'}`);

  if (storeInfo.errors.length > 0) {
    console.log('⚠️ Ошибки:');
    storeInfo.errors.forEach(e => console.log(`   ${e}`));
  }

  if (storeInfo.storeAvailable) {
    console.log(`processMonsterDrop: ${storeInfo.hasProcessMonsterDrop ? '✅' : '❌'}`);

    console.log('\n📦 addItem тест:');
    storeInfo.addItemResults.forEach(r => {
      console.log(`   ${itemName(r.item).padEnd(18)} → ${r.added ? '✅' : '❌'} (qty: ${r.qty || 'error'})`);
    });

    if (Object.keys(storeInfo.inventorySnapshot).length > 0) {
      console.log('\n📊 Инвентарь:');
      Object.entries(storeInfo.inventorySnapshot).slice(0, 20).forEach(([id, qty]) => {
        console.log(`   ${itemName(id).padEnd(25)} ${qty}`);
      });
    }
  }

  // ── 3. Тест processMonsterDrop ──────────────────────────
  if (storeInfo.hasProcessMonsterDrop) {
    console.log('\n\n' + '='.repeat(70));
    console.log('🧪 ТЕСТ processMonsterDrop');
    console.log('='.repeat(70));

    const dropResults = await page.evaluate(async () => {
      const results = [];

      try {
        // @ts-ignore
        const processDrop = window.__PROCESS_DROP;
        // @ts-ignore
        const store = window.__STORE;

        // Тестируем все виды из drops.js
        const dropModule = await import('/src/data/drops.js');
        // @ts-ignore
        const dropTable = dropModule.MONSTER_DROP_TABLE || dropModule.default;
        const species = Object.keys(dropTable).sort();

        let totalWithDrops = 0;
        let totalWithoutDrops = 0;
        let totalItems = 0;

        for (const pkm of species) {
          const drops = processDrop(pkm);
          const itemCount = drops.reduce((s, d) => s + d.qty, 0);
          totalItems += itemCount;

          if (drops.length > 0) {
            totalWithDrops++;
            // Пробуем добавить в инвентарь
            for (const d of drops) {
              if (store && store.addItem) {
                store.addItem(d.item, d.qty);
              }
            }
          } else {
            totalWithoutDrops++;
          }

          results.push({
            pokemon: pkm,
            drops: drops.map(d => ({ item: d.item, qty: d.qty })),
            totalItems: itemCount,
          });

          // Вывод каждых 20 видов
          if (results.length % 20 === 0) {
            console.log(`   Обработано ${results.length}/${species.length} видов...`);
          }
        }

        // @ts-ignore
        window.__DROP_STATS = { totalWithDrops, totalWithoutDrops, totalItems, totalSpecies: species.length };
      } catch(e) {
        results.push({ error: e.message });
      }

      return results;
    });

    // ── Статистика дропа ─────────────────────────────────
    const dropStats = await page.evaluate(() => {
      // @ts-ignore
      return window.__DROP_STATS || { totalWithDrops: 0, totalWithoutDrops: 0, totalItems: 0, totalSpecies: 0 };
    });

    console.log(`\n📊 Статистика дропа по ${dropStats.totalSpecies} видам:`);
    console.log(`   С дропом: ${dropStats.totalWithDrops}`);
    console.log(`   Без дропа: ${dropStats.totalWithoutDrops}`);
    console.log(`   Всего предметов: ${dropStats.totalItems}`);

    // Показываем первые 30
    console.log(`\n📋 Первые 30 результатов:`);
    for (const r of dropResults.slice(0, 30)) {
      if (r.error) {
        console.log(`   ❌ ${r.error}`);
        continue;
      }
      if (r.drops.length > 0) {
        const items = r.drops.map(d => `${d.qty}x${itemName(d.item)}`).join(', ');
        console.log(`   ${r.pokemon.padEnd(20)} → ${items}`);
      } else {
        console.log(`   ${r.pokemon.padEnd(20)} → ❌ ПУСТОЙ ДРОП`);
      }
    }

    if (dropResults.length > 30) {
      console.log(`   ... и ещё ${dropResults.length - 30}`);
    }

    // ── Финальный инвентарь ─────────────────────────────
    console.log('\n\n' + '='.repeat(70));
    console.log('📦 ФИНАЛЬНЫЙ ИНВЕНТАРЬ (после добавления всех дропов)');
    console.log('='.repeat(70));

    const finalInv = await page.evaluate(() => {
      try {
        // @ts-ignore
        const store = window.__STORE;
        if (!store) return { error: 'no store' };
        const inv = store._state?.inventory || {};
        const filtered = Object.fromEntries(
          Object.entries(inv).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1])
        );
        return filtered;
      } catch(e) { return { error: e.message }; }
    });

    if (finalInv.error) {
      console.log(`⚠️ ${finalInv.error}`);
    } else {
      const itemCount = Object.keys(finalInv).length;
      const totalQty = Object.values(finalInv).reduce((s, v) => s + v, 0);
      console.log(`\n📊 Всего типов предметов: ${itemCount}`);
      console.log(`📊 Всего предметов: ${totalQty}`);
      console.log(`\n📋 Инвентарь (${Math.min(itemCount, 30)} из ${itemCount}):`);
      Object.entries(finalInv).slice(0, 30).forEach(([id, qty]) => {
        console.log(`   ${itemName(id).padEnd(25)} ${qty}`);
      });
    }

    // ── Проверка ошибок addItem ──────────────────────────
    console.log('\n\n' + '='.repeat(70));
    console.log('🔍 ПРОВЕРКА: все ли предметы дошли до инвентаря?');
    console.log('='.repeat(70));

    const checkResult = await page.evaluate(async () => {
      const check = { ok: 0, failed: 0, missing: [] };
      try {
        // @ts-ignore
        const store = window.__STORE;
        // @ts-ignore
        const processDrop = window.__PROCESS_DROP;
        const dropModule = await import('/src/data/drops.js');
        // @ts-ignore
        const dropTable = dropModule.MONSTER_DROP_TABLE || dropModule.default;
        const species = Object.keys(dropTable);

        // Собираем ВСЕ предметы которые хоть у кого-то дропаются
        const allDropItems = new Map(); // itemId -> [species]
        for (const pkm of species) {
          const entries = dropTable[pkm] || [];
          for (const entry of entries) {
            if (!allDropItems.has(entry.item)) allDropItems.set(entry.item, []);
            allDropItems.get(entry.item).push(pkm);
          }
        }

        check.totalDropItems = allDropItems.size;

        // Проверяем есть ли они в инвентаре
        for (const [itemId, species] of allDropItems) {
          const qty = store.getItemQty ? store.getItemQty(itemId) : (store._state?.inventory?.[itemId] || 0);
          if (qty > 0) {
            check.ok++;
          } else {
            check.failed++;
            check.missing.push({ item: itemId, qty, fromSpecies: species.slice(0, 3) });
          }
        }
      } catch(e) {
        check.error = e.message;
      }
      return check;
    });

    if (checkResult.error) {
      console.log(`⚠️ ${checkResult.error}`);
    } else {
      console.log(`\n📊 Всего уникальных предметов дропа: ${checkResult.totalDropItems}`);
      console.log(`✅ В инвентаре: ${checkResult.ok}`);
      console.log(`❌ Отсутствуют: ${checkResult.failed}`);

      if (checkResult.failed > 0) {
        console.log(`\n⚠️ Предметы, которых нет в инвентаре:`);
        for (const m of checkResult.missing.slice(0, 20)) {
          const speciesStr = m.fromSpecies.slice(0, 3).join(', ');
          console.log(`   ${itemName(m.item).padEnd(25)} (qty: ${m.qty}) — от ${speciesStr}`);
        }
        if (checkResult.missing.length > 20) {
          console.log(`   ... и ещё ${checkResult.missing.length - 20}`);
        }
        console.log(`\nПричины: категориальный лимит, полный рюкзак или предмет не найден в items.ts`);
      } else {
        console.log('✅ ВСЕ ДРОП-ПРЕДМЕТЫ ДОШЛИ ДО ИНВЕНТАРЯ!');
      }
    }

    // ── Проверка категориальных лимитов ─────────────────
    console.log('\n\n' + '='.repeat(70));
    console.log('⚠️ ПРОВЕРКА КАТЕГОРИАЛЬНЫХ ЛИМИТОВ');
    console.log('='.repeat(70));

    const limitCheck = await page.evaluate(() => {
      const results = [];
      try {
        // @ts-ignore
        const store = window.__STORE;
        const inv = store._state?.inventory || {};
        const CATEGORY_LIMITS = {
          balls: 99, healing: 20, statusCure: 20, ppRecovery: 20,
          vitamins: 99, evolutionStones: 5, berries: 20, training: 10,
          battle: 10, crafting: 99, tickets: 10,
        };
        const MAX_BAG = 1000;

        const total = Object.values(inv).reduce((s, v) => s + v, 0);
        results.push({ label: 'Всего предметов', value: total, limit: MAX_BAG });
        if (total >= MAX_BAG * 0.9) results.push({ label: '⚠️ Рюкзак почти полон!', value: total, limit: MAX_BAG });

        // Проверяем каждый слот
        for (const [id, qty] of Object.entries(inv)) {
          if (id === 'credit') continue;
          if (typeof qty !== 'number') continue;
          // Определяем категорию...
          // TODO: нужно определение категории каждого предмета
          // @ts-ignore
          if (store.getItemQty && store.getMaxStack) {
            const maxStack = store.getMaxStack(id);
            if (qty >= maxStack * 0.9) {
              results.push({ label: `⚠️ ${id} почти полон`, value: qty, limit: maxStack });
            }
          }
        }
      } catch(e) {
        results.push({ label: 'Ошибка: ' + e.message, value: 0, limit: 0 });
      }
      return results;
    });

    limitCheck.forEach(r => console.log(`   ${r.label}: ${r.value}/${r.limit}`));

    // ── Сохраняем результаты ─────────────────────────────
    writeFileSync(
      resolve('test-output', 'drop-results-full.json'),
      JSON.stringify({
        stats: dropStats,
        check: checkResult,
        inventory: finalInv,
        browserErrors,
      }, null, 2),
      'utf8'
    );
    console.log('\n📝 Подробные результаты: test-output/drop-results-full.json');

  } else {
    console.log('\n❌ processMonsterDrop недоступна');
    console.log('⚠️ Ошибки браузера:');
    browserErrors.forEach(e => console.log(`   ${e}`));
  }

  await page.screenshot({ path: resolve('test-output', 'final.png'), fullPage: true });
  await browser.close();

  console.log('\n' + '='.repeat(70));
  console.log('🏁 ТЕСТ ЗАВЕРШЁН');
  console.log('='.repeat(70));
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
