/**
 * Симуляция ПОЛНОГО цикла: дроп → addItem → inventory
 * Воспроизводит что происходит при победе над каждым покемоном.
 */
import { readFileSync } from 'fs';

const DROPS_PATH = 'src/data/drops.js';
const ITEMS_PATH = 'src/data/items.ts';
const LOCATION_PATH = 'src/ui/location.ts';

// ── Загружаем дроп-таблицу ───────────────────────────────
const dropsContent = readFileSync(DROPS_PATH, 'utf-8');
const dropsMatch = dropsContent.match(/export const MONSTER_DROP_TABLE\s*=\s*(\{[\s\S]*\})/);
const MONSTER_DROP_TABLE = eval('(' + dropsMatch[1] + ')');

// ── Загружаем предметы ───────────────────────────────────
const itemsContent = readFileSync(ITEMS_PATH, 'utf-8');
const itemRegex = /id:\s*'(\w+)'[\s\S]*?category:\s*'(\w+)'/g;
const itemDefs = {};
let m;
while ((m = itemRegex.exec(itemsContent)) !== null) {
  const id = m[1];
  const category = m[2];
  const lineStart = itemsContent.lastIndexOf('\n', m.index) + 1;
  const lineEnd = itemsContent.indexOf('\n', m.index);
  const chunk = itemsContent.slice(lineStart, lineEnd + 1);
  const maxStackMatch = chunk.match(/maxStack:\s*(\d+)/);
  itemDefs[id] = { category, maxStack: maxStackMatch ? parseInt(maxStackMatch[1]) : null };
}

// ── Категории и лимиты (как в store.ts) ──────────────────
const CATEGORY_LIMITS = {
  balls: 99, healing: 20, statusCure: 20, ppRecovery: 20,
  vitamins: 99, evolutionStones: 5, berries: 20, training: 10,
  battle: 10, crafting: 99, tickets: 10,
};

const MAX_BAG = 1000;

function getMaxStack(itemId) {
  const def = itemDefs[itemId];
  if (!def) return 999;
  if (def.maxStack) return def.maxStack;
  return CATEGORY_LIMITS[def.category] || 999;
}

function simulateAddItem(inventory, itemId, qty) {
  if (!inventory) inventory = {};
  if (!(itemId in inventory)) {
    if (!itemDefs[itemId]) {
      return { added: 0, warn: 'Unknown item: ' + itemId };
    }
    inventory[itemId] = 0;
  }
  const current = inventory[itemId];
  const totalBefore = Object.values(inventory).reduce((a, b) => a + b, 0);
  const bagRoom = MAX_BAG - totalBefore;
  const slotLimit = getMaxStack(itemId);
  const limit = Math.min(slotLimit, current + bagRoom);
  const actualAdd = Math.min(qty, limit - current);
  if (actualAdd <= 0) {
    return { added: 0, warn: `Bag full or slot full (${current}/${slotLimit})` };
  }
  inventory[itemId] = current + actualAdd;
  return { added: actualAdd, newQty: inventory[itemId] };
}

// ── Загружаем универсальные дропы ───────────────────────
const locationContent = readFileSync(LOCATION_PATH, 'utf-8');
const uniMatch = locationContent.match(/UNIVERSAL_DROPS\s*=\s*(\[[\s\S]*?\]);/);
const UNIVERSAL_DROPS = uniMatch ? eval(uniMatch[1]) : [];

// ── Симуляция ────────────────────────────────────────────
console.log('=== СИМУЛЯЦИЯ ДРОПА ===\n');

let totalSpecies = 0;
let totalDropSuccess = 0;
let totalDropFail = 0;
let speciesWithDrops = 0;
let speciesWithoutDrops = 0;

const failReasons = {};
const fullInventory = {};

// Начинаем с пустого инвентаря (как новый игрок)
for (const species of Object.keys(MONSTER_DROP_TABLE)) {
  const entries = MONSTER_DROP_TABLE[species] || [];
  if (entries.length === 0) {
    speciesWithoutDrops++;
    continue;
  }
  speciesWithDrops++;

  for (const entry of entries) {
    const result = simulateAddItem(fullInventory, entry.item, entry.qty);
    if (result.added > 0) {
      totalDropSuccess++;
    } else {
      totalDropFail++;
      const reason = result.warn || 'unknown';
      failReasons[reason] = (failReasons[reason] || 0) + 1;
    }
  }
}

// ── Отчёт ────────────────────────────────────────────────
console.log('СИМУЛЯЦИЯ: новый игрок, пустой инвентарь, победа над всеми видами по 1 разу');
console.log(`Всего видов с дропами: ${speciesWithDrops}, без дропов: ${speciesWithoutDrops}`);
console.log(`Добавлено предметов: ${totalDropSuccess}`);
console.log(`Не добавлено: ${totalDropFail}`);

if (totalDropFail > 0) {
  console.log('\nПричины неудач:');
  for (const [reason, count] of Object.entries(failReasons)) {
    console.log(`  ${count}x: ${reason}`);
  }
}

console.log(`\nИтоговый инвентарь: ${Object.values(fullInventory).reduce((a, b) => a + b, 0)}/${MAX_BAG}`);

// ── Реалистичная симуляция: 10 боёв подряд ────────────────
console.log('\n\n=== РЕАЛИСТИЧНАЯ СИМУЛЯЦИЯ: 10 боёв ===\n');

function simulateBattle(inventory, species) {
  const entries = MONSTER_DROP_TABLE[species] || [];
  const drops = [];
  for (const entry of entries) {
    if (Math.random() < entry.chance) {
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  for (const entry of UNIVERSAL_DROPS) {
    if (Math.random() < entry.chance) {
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  return drops;
}

// Собираем все виды с дропами, которые встречаются в encounters
const regionsContent = readFileSync('src/data/regions.ts', 'utf-8');
const encNames = new Set();
const encRegex = /encounters:\s*\[([^\]]+)\]/g;
while ((m = encRegex.exec(regionsContent)) !== null) {
  const items = m[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encNames.add(i.replace(/"/g, '')));
}

const encounterSpecies = [...encNames].filter(n => MONSTER_DROP_TABLE[n]);
const testSpecies = encounterSpecies.slice(0, 10);

const simInventory = {};
const sessionDrops = [];

for (const species of testSpecies) {
  console.log(`\n--- ${species} (10 боёв) ---`);
  let dropsThisSpecies = 0;
  for (let i = 0; i < 10; i++) {
    const drops = simulateBattle(simInventory, species);
    for (const d of drops) {
      const result = simulateAddItem(simInventory, d.item, d.qty);
      if (result.added > 0) {
        dropsThisSpecies++;
        sessionDrops.push({ species, item: d.item, qty: d.qty, newQty: result.newQty });
        console.log(`  Бой ${i+1}: +1 ${d.item} (теперь ${result.newQty})`);
      } else {
        console.log(`  Бой ${i+1}: ❌ ${d.item} НЕ ДОБАВЛЕН: ${result.warn}`);
      }
    }
    if (drops.length === 0) {
      // Not a failure, just no proc
    }
  }
  if (dropsThisSpecies === 0) {
    console.log(`  (ничего не выпало за 10 боёв)`);
  }
}

console.log(`\n\nИтог: ${sessionDrops.length} предметов добавлено в инвентарь`);
const inventoryTotal = Object.values(simInventory).reduce((a, b) => a + b, 0);
console.log(`В инвентаре: ${inventoryTotal}/${MAX_BAG} предметов`);

// Проверяем категории которые близки к лимиту
console.log('\n--- Слоты, близкие к заполнению ---');
for (const [id, qty] of Object.entries(simInventory)) {
  if (qty <= 0) continue;
  const maxStack = getMaxStack(id);
  if (qty >= maxStack * 0.8) {
    console.log(`  ${id}: ${qty}/${maxStack} (${Math.round(qty/maxStack*100)}%)`);
  }
}
