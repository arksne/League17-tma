/**
 * Тест системы дропа: проверяет что каждый предмет из дроп-таблицы
 * реально может попасть в инвентарь без ошибок.
 *
 * Запуск: node scripts/test-drops.mjs (из папки проекта)
 */
import { readFileSync } from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── 1. Загружаем MONSTER_DROP_TABLE ───────────────────────
const dropsPath = 'D:\\pokematrix\\league17\\src\\data\\drops.js';
const dropsContent = readFileSync(dropsPath, 'utf-8');

// Извлекаем объект MONSTER_DROP_TABLE через eval (он чистый data-only)
const dropsMatch = dropsContent.match(/export const MONSTER_DROP_TABLE\s*=\s*(\{[\s\S]*\})/);
if (!dropsMatch) {
  console.error('❌ Не удалось распарсить MONSTER_DROP_TABLE');
  process.exit(1);
}

let MONSTER_DROP_TABLE;
try {
  MONSTER_DROP_TABLE = eval(`(${dropsMatch[1]})`);
} catch (e) {
  console.error('❌ Ошибка парсинга drops.js:', e.message);
  process.exit(1);
}

const speciesCount = Object.keys(MONSTER_DROP_TABLE).length;
console.log(`\n📦 MONSTER_DROP_TABLE: ${speciesCount} видов покемонов\n`);

// ── 2. Загружаем items.ts ─────────────────────────────────
const itemsContent = readFileSync('D:\\pokematrix\\league17\\src\\data\\items.ts', 'utf-8');

// Вытаскиваем все id и category
const itemRegex = /id:\s*'(\w+)'[\s\S]*?category:\s*'(\w+)'/g;
const itemDefs = {};
let itemMatch;
while ((itemMatch = itemRegex.exec(itemsContent)) !== null) {
  const id = itemMatch[1];
  const category = itemMatch[2];
  // Ищем maxStack если есть
  const lineStart = itemsContent.lastIndexOf('\n', itemMatch.index) + 1;
  const lineEnd = itemsContent.indexOf('\n', itemMatch.index);
  const chunk = itemsContent.slice(lineStart, lineEnd + 1);
  const maxStackMatch = chunk.match(/maxStack:\s*(\d+)/);
  itemDefs[id] = {
    category,
    maxStack: maxStackMatch ? parseInt(maxStackMatch[1]) : null,
  };
}

console.log(`📦 items.ts: ${Object.keys(itemDefs).length} предметов\n`);

// ── 3. Категории и их лимиты ──────────────────────────────
const CATEGORY_LIMITS = {
  balls: 99, healing: 20, statusCure: 20, ppRecovery: 20,
  vitamins: 99, evolutionStones: 5, berries: 20, training: 10,
  battle: 10, crafting: 99, tickets: 10,
};
const MAX_BAG = 1000;

// ── 4. Проверяем каждый дроп ──────────────────────────────
console.log('============================================================');
console.log('🔍 ПРОВЕРКА ДРОПА ДЛЯ КАЖДОГО ВИДА');
console.log('============================================================\n');

let totalOk = 0;
let totalWarn = 0;
let totalError = 0;

const allDropItems = new Set();
const errors = [];
const warnings = [];

for (const [species, drops] of Object.entries(MONSTER_DROP_TABLE)) {
  let speciesOk = 0, speciesError = 0, speciesWarn = 0;

  for (const drop of drops) {
    const itemId = drop.item;
    allDropItems.add(itemId);

    // Проверка: существует ли предмет в items.ts
    if (!itemDefs[itemId]) {
      speciesError++;
      errors.push(`❌ [${species}] "${itemId}" — НЕТ В items.ts!`);
      continue;
    }

    // Проверка: есть ли шанс дропа
    if (typeof drop.chance !== 'number' || drop.chance <= 0) {
      speciesWarn++;
      warnings.push(`⚠️ [${species}] "${itemId}" — шанс ${drop.chance} (ноль или отрицательный)`);
    }

    // Проверка: quantity
    if (!drop.qty || drop.qty <= 0) {
      speciesWarn++;
      warnings.push(`⚠️ [${species}] "${itemId}" — qty=${drop.qty} (ноль или отрицательное)`);
    }

    // Проверка лимитов категории
    const def = itemDefs[itemId];
    if (def) {
      if (CATEGORY_LIMITS[def.category] && CATEGORY_LIMITS[def.category] < 5) {
        speciesWarn++;
        warnings.push(`⚠️ [${species}] "${itemId}" (${def.category}) — лимит ${CATEGORY_LIMITS[def.category]} шт, легко переполнить`);
      }
    }

    speciesOk++;
  }

  // Особые проверки
  // Пустой дроп?
  if (drops.length === 0) {
    speciesWarn++;
    warnings.push(`⚠️ [${species}] — пустой дроп-лист (ничего не дропает)`);
  }

  totalOk += speciesOk;
  totalWarn += speciesWarn;
  totalError += speciesError;
}

// ── 5. Проверка универсальных дропов ──────────────────────
console.log('--- Universal Drops ---');
const universalDrops = ['prettyWing', 'nugget', 'starPiece'];
for (const itemId of universalDrops) {
  if (!itemDefs[itemId]) {
    errors.push(`❌ [UNIVERSAL] "${itemId}" — НЕТ В items.ts!`);
  } else {
    console.log(`  ✅ ${itemId} (${itemDefs[itemId].category})`);
  }
}

// ── 6. Проверка имён покемонов ────────────────────────────
// Проверяем что в таблице нет странных имён
const pokemonRegex = /^[a-z-]+$/;
for (const species of Object.keys(MONSTER_DROP_TABLE)) {
  if (!pokemonRegex.test(species)) {
    warnings.push(`⚠️ Странное имя вида: "${species}"`);
  }
}

// ── 7. ИТОГИ ──────────────────────────────────────────────
console.log('\n============================================================');
console.log('📊 РЕЗУЛЬТАТЫ');
console.log('============================================================');
console.log(`Всего предметов в дроп-таблице: ${allDropItems.size}`);
console.log(`Из них есть в items.ts: ${[...allDropItems].filter(id => itemDefs[id]).length}`);
console.log(`Нет в items.ts: ${[...allDropItems].filter(id => !itemDefs[id]).length}`);
console.log(`\n✅ Всего записей дропа OK: ${totalOk}`);
console.log(`⚠️ Предупреждений: ${totalWarn}`);
console.log(`❌ Ошибок: ${totalError}`);

// Печатаем все предметы дропа и их категории
console.log('\n--- Полный список дроп-предметов ---');
const sortedItems = [...allDropItems].sort();
for (const id of sortedItems) {
  if (itemDefs[id]) {
    const limit = CATEGORY_LIMITS[itemDefs[id].category] ? `(лимит: ${CATEGORY_LIMITS[itemDefs[id].category]})` : '';
    console.log(`  ${id.padEnd(25)} ${itemDefs[id].category.padEnd(15)} ${limit}`);
  } else {
    console.log(`  ${id.padEnd(25)} ❌ НЕТ В items.ts`);
  }
}

if (errors.length > 0) {
  console.log('\n❌❌❌ ОШИБКИ:');
  errors.forEach(e => console.log(`  ${e}`));
}

if (warnings.length > 0) {
  console.log(`\n⚠️ ПРЕДУПРЕЖДЕНИЯ (${warnings.length}):`);
  warnings.forEach(w => console.log(`  ${w}`));
}

console.log('\n============================================================');
console.log('🍪 КАТЕГОРИИ И ЛИМИТЫ (addItem может тихо сбросить предмет)');
console.log('============================================================');
const catItems = {};
for (const id of allDropItems) {
  if (itemDefs[id]) {
    if (!catItems[itemDefs[id].category]) catItems[itemDefs[id].category] = [];
    catItems[itemDefs[id].category].push(id);
  }
}
for (const [cat, items] of Object.entries(catItems)) {
  const limit = CATEGORY_LIMITS[cat] || '∞';
  console.log(`  ${cat.padEnd(15)} ${items.length} шт. дропа │ лимит: ${limit}`);
}

// ── 8. Тест на переполнение категорий ─────────────────────
console.log('\n============================================================');
console.log('🧪 СИМУЛЯЦИЯ addItem С ПОЛНЫМ РЮКЗАКОМ');
console.log('============================================================\n');

// Симулируем: у игрока полная сумка некоторых категорий
const fullInventory = {};
for (const id of allDropItems) {
  if (itemDefs[id]) {
    const cat = itemDefs[id].category;
    const maxStack = itemDefs[id].maxStack || CATEGORY_LIMITS[cat] || 999;
    // Заполняем категорию под завязку
    fullInventory[id] = maxStack;
  }
}

// Теперь пробуем добавить ещё один каждого предмета
console.log('Тест: полная сумка → пытаемся добавить 1 шт. каждого дроп-предмета:\n');
let overflowSuccess = 0;
let overflowFail = 0;
for (const id of allDropItems) {
  if (!itemDefs[id]) continue;
  const cat = itemDefs[id].category;
  const current = fullInventory[id] || 0;
  const totalBefore = Object.values(fullInventory).reduce((a, b) => a + b, 0);
  const slotLimit = itemDefs[id].maxStack || CATEGORY_LIMITS[cat] || 999;
  const bagRoom = MAX_BAG - totalBefore;
  const limit = Math.min(slotLimit, current + bagRoom);
  const actualAdd = Math.min(1, limit - current);
  if (actualAdd > 0) {
    overflowSuccess++;
    fullInventory[id] = current + actualAdd;
  } else {
    overflowFail++;
  }
}

const bagTotal = Object.values(fullInventory).reduce((a, b) => a + b, 0);
console.log(`Багаж после добавления: ${bagTotal}/${MAX_BAG}`);
console.log(`✅ Добавилось: ${overflowSuccess}`);
console.log(`❌ Не добавилось: ${overflowFail} (рюкзак/слот полон)`);

if (overflowFail > 0) {
  console.log('\n⚠️ Предметы которые не влезли при полной сумке:');
  for (const id of allDropItems) {
    if (!itemDefs[id]) continue;
    const cat = itemDefs[id].category;
    const current = fullInventory[id] || 0;
    const slotLimit = itemDefs[id].maxStack || CATEGORY_LIMITS[cat] || 999;
    if (current >= slotLimit) {
      console.log(`  ${id} (${cat}) — ${current}/${slotLimit}`);
    }
  }
}
