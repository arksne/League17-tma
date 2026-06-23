/**
 * Генератор дропов из PokeAPI / veekun
 *
 * Скачивает данные held_items из veekun/pokedex CSV и PokeAPI,
 * генерирует MONSTER_DROP_TABLE (drops.ts) и TYPE_DROPS (drop_types.ts)
 *
 * Использование: node scripts/generate-drops.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');
const DROPS_FILE = path.join(DATA_DIR, 'drops.ts');
const DROP_TYPES_FILE = path.join(DATA_DIR, 'drop_types.ts');
const POKEMON_TYPES_FILE = path.join(DATA_DIR, 'pokemon_types.ts');

const VEEKUN_RAW = 'https://raw.githubusercontent.com/veekun/pokedex/master/pokedex/data/csv';

// kebab-case → camelCase (PokeAPI item ID → game item ID)
function kebabToCamel(str) {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// Функция для скачивания и парсинга CSV
async function fetchCSV(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',');
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (vals[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

// TYPE_DROPS: какие предметы дропаются от типов покемонов
// Каждый тип → [ { item_id, chance, qty } ]
const TYPE_DROPS_MAP = {
  normal: [
    { item: 'potion', chance: 0.04, qty: 1 },
    { item: 'oranBerry', chance: 0.03, qty: 1 },
  ],
  fire: [
    { item: 'burnHeal', chance: 0.04, qty: 1 },
    { item: 'charcoal', chance: 0.02, qty: 1 },
  ],
  water: [
    { item: 'freshWater', chance: 0.04, qty: 1 },
    { item: 'mysticWater', chance: 0.02, qty: 1 },
  ],
  grass: [
    { item: 'healPowder', chance: 0.04, qty: 1 },
    { item: 'miracleSeed', chance: 0.02, qty: 1 },
  ],
  electric: [
    { item: 'paralyzeHeal', chance: 0.04, qty: 1 },
    { item: 'magnet', chance: 0.02, qty: 1 },
  ],
  ice: [
    { item: 'iceHeal', chance: 0.04, qty: 1 },
    { item: 'neverMeltIce', chance: 0.02, qty: 1 },
  ],
  fighting: [
    { item: 'xAttack', chance: 0.04, qty: 1 },
    { item: 'blackBelt', chance: 0.02, qty: 1 },
  ],
  poison: [
    { item: 'antidote', chance: 0.04, qty: 1 },
    { item: 'poisonBarb', chance: 0.02, qty: 1 },
  ],
  ground: [
    { item: 'softSand', chance: 0.04, qty: 1 },
    { item: 'hardStone', chance: 0.02, qty: 1 },
  ],
  flying: [
    { item: 'awakening', chance: 0.04, qty: 1 },
    { item: 'sharpBeak', chance: 0.02, qty: 1 },
  ],
  psychic: [
    { item: 'twistedSpoon', chance: 0.04, qty: 1 },
    { item: 'lumBerry', chance: 0.02, qty: 1 },
  ],
  bug: [
    { item: 'netBall', chance: 0.04, qty: 1 },
    { item: 'silverPowder', chance: 0.02, qty: 1 },
  ],
  rock: [
    { item: 'hardStone', chance: 0.04, qty: 1 },
    { item: 'everstone', chance: 0.01, qty: 1 },
  ],
  ghost: [
    { item: 'spellTag', chance: 0.04, qty: 1 },
    { item: 'casherBerry', chance: 0.03, qty: 1 },
  ],
  dragon: [
    { item: 'dragonFang', chance: 0.04, qty: 1 },
    { item: 'fullRestore', chance: 0.02, qty: 1 },
  ],
  dark: [
    { item: 'blackGlasses', chance: 0.04, qty: 1 },
    { item: 'sitrusBerry', chance: 0.03, qty: 1 },
  ],
  steel: [
    { item: 'metalCoat', chance: 0.04, qty: 1 },
    { item: 'iron', chance: 0.02, qty: 1 },
  ],
  fairy: [
    { item: 'burnHeal', chance: 0.04, qty: 1 },
    { item: 'fairyFeather', chance: 0.02, qty: 1 },
  ],
};

// Названия типов покемонов для PokeAPI → читаемые
const TYPE_NAMES = {
  normal: 'normal', fire: 'fire', water: 'water', grass: 'grass',
  electric: 'electric', ice: 'ice', fighting: 'fighting', poison: 'poison',
  ground: 'ground', flying: 'flying', psychic: 'psychic', bug: 'bug',
  rock: 'rock', ghost: 'ghost', dragon: 'dragon', dark: 'dark',
  steel: 'steel', fairy: 'fairy',
};

async function main() {
  console.log('=== Генератор дропов из PokeAPI / veekun ===\n');

  // 1. Скачиваем CSV данные
  console.log('Скачивание данных veekun...');
  const [pokemonItems, pokemonData, itemsData] = await Promise.all([
    fetchCSV(`${VEEKUN_RAW}/pokemon_items.csv`),
    fetchCSV(`${VEEKUN_RAW}/pokemon.csv`),
    fetchCSV(`${VEEKUN_RAW}/items.csv`),
  ]);
  console.log(`  pokemon_items: ${pokemonItems.length} записей`);
  console.log(`  pokemon: ${pokemonData.length} записей`);
  console.log(`  items: ${itemsData.length} записей`);

  // 2. Строим маппинг: pokemon_id → identifier (только is_default = 1)
  const pokeIdToName = new Map();
  for (const p of pokemonData) {
    if (p.is_default === '1') {
      pokeIdToName.set(parseInt(p.id), p.identifier);
    }
  }

  // 3. Строим маппинг: item_id → game identifier (camelCase)
  const itemIdToGameId = new Map();
  for (const item of itemsData) {
    const gameId = kebabToCamel(item.identifier);
    itemIdToGameId.set(parseInt(item.id), gameId);
  }

  // 4. Группируем held_items по pokemon_id, сохраняем последний rarity
  //    Берём самую последнюю запись (номер строки как прокси для "latest version")
  const pokeHeldItems = new Map(); // pokemon_id → Map<item_id, rarity>
  for (const pi of pokemonItems) {
    const pid = parseInt(pi.pokemon_id);
    const iid = parseInt(pi.item_id);
    const rarity = parseInt(pi.rarity);
    if (!pokeHeldItems.has(pid)) pokeHeldItems.set(pid, new Map());
    const held = pokeHeldItems.get(pid);
    // Перезаписываем (последняя версия побеждает)
    held.set(iid, rarity);
  }

  // 5. Генерируем MONSTER_DROP_TABLE
  console.log('\nГенерация MONSTER_DROP_TABLE...');

  const dropTable = {}; // pokemon name → [drop entries]
  let withDrops = 0;
  let noDrops = 0;

  for (const [pid, held] of pokeHeldItems) {
    const pokeName = pokeIdToName.get(pid);
    if (!pokeName) continue; // нестандартная форма, скипаем

    if (held.size === 0) {
      noDrops++;
      continue;
    }

    const drops = [];
    for (const [itemId, rarity] of held) {
      const gameItemId = itemIdToGameId.get(itemId);
      if (!gameItemId) continue;

      // Конвертируем rarity (1-100) в шанс дропа
      // В PokeAPI rarity обычно 5 = common, 50 = 50%, 100 = always
      // В игре chance это 0-1 (0.04 = 4%)
      let chance;
      if (rarity >= 100) chance = 1.0;
      else if (rarity >= 50) chance = 0.5;
      else if (rarity >= 25) chance = 0.25;
      else if (rarity >= 10) chance = 0.1;
      else if (rarity >= 5) chance = 0.05;
      else chance = 0.02;

      drops.push({ item: gameItemId, chance, qty: 1 });
    }

    if (drops.length > 0) {
      dropTable[pokeName] = drops;
      withDrops++;
    }
  }

  console.log(`  Покемонов с дропами: ${withDrops}`);
  console.log(`  Покемонов без дропов: ${noDrops}`);

  // 6. Сохраняем drops.ts
  const dropsLines = [];
  dropsLines.push('import { DropEntry } from \'../types/index.js\';');
  dropsLines.push('');
  dropsLines.push('export const MONSTER_DROP_TABLE: Record<string, DropEntry[]> = {');

  for (const [name, drops] of Object.entries(dropTable).sort()) {
    const dropsStr = drops.map(d =>
      `{ item: '${d.item}', chance: ${d.chance}, qty: ${d.qty} }`
    ).join(', ');
    dropsLines.push(`  ${name}: [${dropsStr}],`);
  }

  dropsLines.push('};');
  dropsLines.push('');

  fs.writeFileSync(DROPS_FILE, dropsLines.join('\n'), 'utf-8');
  console.log(`\nСохранено: ${DROPS_FILE} (${Object.keys(dropTable).length} записей)`);

  // 7. Сохраняем drop_types.ts
  const dtLines = [];
  dtLines.push('import { DropEntry } from \'../types/index.js\';');
  dtLines.push('');
  dtLines.push('export const TYPE_DROPS: Record<string, DropEntry[]> = {');

  for (const [type, drops] of Object.entries(TYPE_DROPS_MAP)) {
    const dropsStr = drops.map(d =>
      `{ item: '${d.item}', chance: ${d.chance}, qty: ${d.qty} }`
    ).join(', ');
    dtLines.push(`  '${type}': [${dropsStr}],`);
  }

  dtLines.push('};');
  dtLines.push('');

  fs.writeFileSync(DROP_TYPES_FILE, dtLines.join('\n'), 'utf-8');
  console.log(`Сохранено: ${DROP_TYPES_FILE} (${Object.keys(TYPE_DROPS_MAP).length} типов)`);

  console.log('\n=== Готово! ===');
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
