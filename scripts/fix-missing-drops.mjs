/**
 * Добавляет недостающие записи дропа для покемонов из encounters,
 * отсутствующих в MONSTER_DROP_TABLE.
 *
 * Пересобирает всю таблицу целиком (парсит → мержит → сортирует → записывает).
 *
 * Запуск: node scripts/fix-missing-drops.mjs (из папки проекта)
 */
import { readFileSync, writeFileSync } from 'fs';

const SRC = 'src/data/drops.js';

// ── Читаем существующую таблицу ──────────────────────────
let content = readFileSync(SRC, 'utf-8');

// Извлекаем существующие записи: { species: [{item, chance, qty}, ...] }
const existing = {};
const lineRegex = /^\s{2}(['\w-]+):\s*\[(.*?)\],?$/gm;
let m;
while ((m = lineRegex.exec(content)) !== null) {
  const species = m[1].replace(/'/g, '');
  const itemsStr = m[2];
  const drops = [];
  const itemRegex = /\{ item:\s*'(\w+)',\s*chance:\s*([\d.]+),\s*qty:\s*(\d+)\s*\}/g;
  let im;
  while ((im = itemRegex.exec(itemsStr)) !== null) {
    drops.push({ item: im[1], chance: parseFloat(im[2]), qty: parseInt(im[3]) });
  }
  existing[species] = drops;
}

console.log(`Существующие записи: ${Object.keys(existing).length}`);

// ── Новые записи ─────────────────────────────────────────
const newEntries = {
  caterpie: [{ item: 'silverPowder', chance: 0.05, qty: 1 }],
  metapod: [{ item: 'shedShell', chance: 0.05, qty: 1 }],
  weedle: [{ item: 'poisonBarb', chance: 0.05, qty: 1 }],
  kakuna: [{ item: 'shedShell', chance: 0.05, qty: 1 }],
  venonat: [{ item: 'silverPowder', chance: 0.05, qty: 1 }, { item: 'oranBerry', chance: 0.5, qty: 1 }],
  ekans: [{ item: 'poisonBarb', chance: 0.05, qty: 1 }],
  gastly: [{ item: 'spellTag', chance: 0.05, qty: 1 }],
  tauros: [{ item: 'oranBerry', chance: 0.5, qty: 1 }, { item: 'sitrusBerry', chance: 0.05, qty: 1 }],
  kangaskhan: [{ item: 'luckyPunch', chance: 0.05, qty: 1 }, { item: 'oranBerry', chance: 0.5, qty: 1 }],
  porygon: [{ item: 'upGrade', chance: 0.05, qty: 1 }],
  delibird: [{ item: 'aspearBerry', chance: 0.5, qty: 1 }, { item: 'neverMeltIce', chance: 0.05, qty: 1 }],
  murkrow: [{ item: 'sharpBeak', chance: 0.05, qty: 1 }],
  houndour: [{ item: 'charcoal', chance: 0.05, qty: 1 }],
  sudowoodo: [{ item: 'hardStone', chance: 0.05, qty: 1 }],
  aerodactyl: [{ item: 'sharpBeak', chance: 0.05, qty: 1 }, { item: 'oranBerry', chance: 0.5, qty: 1 }],
  cranidos: [{ item: 'hardStone', chance: 0.05, qty: 1 }],
  shieldon: [{ item: 'metalCoat', chance: 0.05, qty: 1 }],
  unown: [{ item: 'twistedSpoon', chance: 0.02, qty: 1 }],
};

// ── Мержим ───────────────────────────────────────────────
const merged = { ...existing, ...newEntries };
const sortedSpecies = Object.keys(merged).sort((a, b) => a.localeCompare(b));

// ── Генерируем содержимое ────────────────────────────────
const fmt = (item) => `{ item: '${item.item}', chance: ${item.chance}, qty: ${item.qty} }`;

// Квотируем имена с дефисами для валидного JS
const q = (s) => /[^a-z0-9]/.test(s) ? `'${s}'` : s;

let out = 'export const MONSTER_DROP_TABLE = {\n';
for (const species of sortedSpecies) {
  const items = merged[species];
  const key = q(species);
  if (items.length === 0) {
    out += `  ${key}: [],\n`;
  } else if (items.length === 1) {
    out += `  ${key}: [${fmt(items[0])}],\n`;
  } else {
    out += `  ${key}: [${items.map(fmt).join(', ')}],\n`;
  }
}
out += '};';

writeFileSync(SRC, out, 'utf-8');

// ── Отчёт ────────────────────────────────────────────────
const added = Object.keys(newEntries).length;
console.log(`✅ Добавлено ${added} новых записей дропа`);
console.log(`📊 Всего в таблице: ${sortedSpecies.length} видов`);

// ── Проверка ─────────────────────────────────────────────
const regionsContent = readFileSync('src/data/regions.ts', 'utf-8');
const encRegex = /encounters:\s*\[([^\]]+)\]/g;
const dayRegex = /dayEncounters:\s*\[([^\]]+)\]/g;
const nightRegex = /nightEncounters:\s*\[([^\]]+)\]/g;

const encounterNames = new Set();
let match;
while ((match = encRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}
while ((match = dayRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}
while ((match = nightRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}

const stillMissing = [...encounterNames].filter(n => !merged[n]);
if (stillMissing.length > 0) {
  console.log(`\n❌ Всё ещё нет в drops.js (${stillMissing.length}):`);
  stillMissing.forEach(n => console.log(`  - ${n}`));
} else {
  console.log('✅ Все энкаунтеры имеют записи в drops.js!');
}
