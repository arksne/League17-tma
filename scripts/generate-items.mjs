/**
 * Генератор предметов из PokeAPI
 *
 * Запрашивает категории предметов из PokeAPI, собирает все релевантные предметы,
 * маппит их в формат ItemDef[] и сохраняет в src/data/items.ts
 *
 * Использование: node scripts/generate-items.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'items.ts');
const TYPES_FILE = path.resolve(__dirname, '..', 'src', 'types', 'index.d.ts');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const POKEAPI_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items';

// Категории PokeAPI, которые нам нужны
// [id, имя_категории, игровая_категория]
const INCLUDE_CATEGORIES = [
  [1, 'stat-boosts', 'battle'],
  [2, 'effort-drop', 'berries'],
  [3, 'medicine', 'berries'],
  [4, 'other', 'other'],
  [5, 'in-a-pinch', 'berries'],
  [6, 'picky-healing', 'berries'],
  [7, 'type-protection', 'berries'],
  [10, 'evolution', 'evolutionStones'],
  [11, 'spelunking', 'other'],
  [12, 'held-items', 'battle'],
  [13, 'choice', 'battle'],
  [14, 'effort-training', 'vitamins'],
  [15, 'bad-held-items', 'battle'],
  [16, 'training', 'training'],
  [17, 'plates', 'battle'],
  [18, 'species-specific', 'battle'],
  [19, 'type-enhancement', 'battle'],
  [24, 'loot', 'valuable'],
  [26, 'vitamins', 'vitamins'],
  [27, 'healing', 'healing'],
  [28, 'pp-recovery', 'ppRecovery'],
  [29, 'revival', 'revival'],
  [30, 'status-cures', 'statusCure'],
  [32, 'mulch', 'mulch'],
  [33, 'special-balls', 'balls'],
  [34, 'standard-balls', 'balls'],
  [37, 'all-machines', 'tm'],
  [39, 'apricorn-balls', 'balls'],
  [42, 'jewels', 'battle'],
  [44, 'mega-stones', 'battle'],
  [46, 'z-crystals', 'battle'],
  [47, 'species-candies', 'other'],
  [48, 'catching-bonus', 'battle'],
  [49, 'dynamax-crystals', 'other'],
  [50, 'nature-mints', 'other'],
  [51, 'curry-ingredients', 'crafting'],
];

// Категории, которые ИСКЛЮЧАЕМ (сюжетные/ивент-предметы ММО)
const EXCLUDE_CATEGORIES = new Set([
  'event-items',    // 20
  'plot-advancement', // 22
  'unused',         // 23
  'dex-completion', // 35
  'scarves',        // 36
  'all-mail',       // 25
  'baking-only',    // 8
  'apricorn-box',   // 40
  'data-cards',     // 41
  'flutes',         // 38
  'gameplay',       // 21
  'collectibles',   // 9 - специфические Gen4 предметы
]);

// Кастомные предметы, которых нет в PokeAPI, но жизненно необходимы игре
// (кредиты, тренировка, удочки, билеты, бейджи, транспорт)
const CUSTOM_ITEMS = [
  { id: 'credit', nameRu: 'Кредит', category: 'currency', desc: 'Игровая валюта', price: 0, sellPrice: 0, isUsable: false, isBall: false, implemented: true, sprite: 'credit_coin.png', spriteType: 'local' },
  { id: 'train', nameRu: 'Набор Тренировки', category: 'training', desc: 'Улучшает случайный стат', price: 200000, sellPrice: 250000, isUsable: true, isBall: false, implemented: true, sprite: 'train.gif', spriteType: 'local' },
  { id: 'oldRod', nameRu: 'Старая удочка', category: 'other', desc: 'Ловля рыбы (многоразовая)', price: 0, sellPrice: 500, isUsable: true, isBall: false, implemented: true, sprite: '145.gif', spriteType: 'local' },
  { id: 'darkBall', nameRu: 'Темный бол', category: 'balls', desc: 'Кастомный покебол', price: 15000, sellPrice: 50000, isUsable: false, isBall: true, ballMult: 1, implemented: true, sprite: '72.png', spriteType: 'local' },
  { id: 'superDarkBall', nameRu: 'Супердаркбол', category: 'balls', desc: 'Продвинутый темный бол', price: 300000, sellPrice: 500000, isUsable: false, isBall: true, ballMult: 1, implemented: true, sprite: 'P79.png', spriteType: 'local' },
  { id: 'healingHerb', nameRu: 'Лечебная трава', category: 'statusCure', desc: 'Снимает все статусы', price: 0, sellPrice: 200, isUsable: true, isBall: false, implemented: true, sprite: '173.gif', spriteType: 'local' },
  { id: 'antiSputin', nameRu: 'Антиспутин', category: 'statusCure', desc: 'Снимает спутанность', price: 0, sellPrice: 100, isUsable: true, isBall: false, implemented: true, sprite: '13.gif', spriteType: 'local' },
];

// PokeAPI kebab-case → camelCase
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

// Задержка между запросами (rate limiting)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Читает существующий items.ts и извлекает маппинг: PokeAPI ID → Русское название
 * Пробует сматчить: kebab-case PokeAPI ID → camelCase game ID
 */
function extractRussianNames() {
  const nameMap = new Map();
  if (fs.existsSync(ITEMS_FILE)) {
    const content = fs.readFileSync(ITEMS_FILE, 'utf-8');
    // Ищем все объекты item: { id: '...', nameRu: '...', ... }
    const itemRegex = /\{\s*id:\s*'([^']+)'[^}]*nameRu:\s*'([^']+)'/g;
    let match;
    while ((match = itemRegex.exec(content)) !== null) {
      nameMap.set(match[1], match[2]);
    }
    console.log(`Извлечено ${nameMap.size} русских названий из текущего items.ts`);
  }
  return nameMap;
}

// Получить данные категории (список предметов в ней)
async function fetchCategory(categoryId) {
  const url = `${POKEAPI_BASE}/item-category/${categoryId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const data = await res.json();
  return data.items.map(item => {
    // item.name это kebab-case PokeAPI ID
    const id = item.url.split('/').filter(Boolean).pop();
    return { name: item.name, id: parseInt(id), url: item.url };
  });
}

// Получить детали предмета
async function fetchItemDetail(name) {
  const url = `${POKEAPI_BASE}/item/${name}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} для ${url}`);
  return await res.json();
}

// Создать ItemDef из PokeAPI данных
function pokeApiToItemDef(item, gameCategory, russianNames, usedIds) {
  const pokeId = item.name; // kebab-case
  let gameId = kebabToCamel(pokeId);

  // Разрешаем конфликты: если ID уже занят, добавляем суффикс
  let suffix = '';
  while (usedIds.has(gameId + suffix)) {
    suffix = suffix === '' ? '2' : (parseInt(suffix) + 1).toString();
  }
  gameId = gameId + suffix;
  usedIds.add(gameId);

  // Русское название: из маппинга или английское
  let nameRu = russianNames.get(gameId) || russianNames.get(pokeId) || '';
  if (!nameRu) {
    // Генерируем читаемое английское название
    nameRu = pokeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Определяем isBall
  const isBall = gameCategory === 'balls';

  // Цена
  const price = item.cost || 0;
  const sellPrice = Math.floor(price / 2);

  // Множитель для покеболов (по дефолту 1, кроме мастербола)
  let ballMult = undefined;
  if (isBall) {
    if (gameId === 'masterBall') ballMult = 255;
    else if (gameId === 'ultraBall') ballMult = 2;
    else if (gameId === 'greatBall') ballMult = 1.5;
    else ballMult = 1;
  }

  // Спрайт из PokeAPI CDN
  const sprite = `${POKEAPI_SPRITE_BASE}/${pokeId}.png`;
  const spriteType = 'pokeapi';

  // isUsable: предметы, которые можно использовать из инвентаря
  const usableCategories = ['healing', 'statusCure', 'ppRecovery', 'revival', 'berries', 'battle', 'training', 'vitamins'];
  const isUsable = usableCategories.includes(gameCategory);

  // implemented: по умолчанию true для предметов, которые имеют цену > 0 или это боллы/ягоды
  const implemented = price > 0 || isBall || gameCategory === 'berries' || gameCategory === 'evolutionStones';

  // Берём описание из эффекта
  let desc = '';
  if (item.effect_entries && item.effect_entries.length > 0) {
    const enEffect = item.effect_entries.find(e => e.language.name === 'en');
    if (enEffect) {
      // Берём short_effect, иначе effect (обрезаем)
      desc = enEffect.short_effect || enEffect.effect || '';
      // Обрезаем до 120 символов
      if (desc.length > 120) desc = desc.substring(0, 117) + '...';
    }
  }

  return {
    id: gameId,
    nameRu,
    category: gameCategory,
    desc,
    sprite,
    spriteType,
    price,
    sellPrice,
    isUsable,
    isBall,
    implemented,
    ...(ballMult !== undefined ? { ballMult } : {}),
  };
}

// Основная функция
async function main() {
  console.log('=== Генератор предметов из PokeAPI ===\n');

  // 1. Извлекаем русские названия из старого items.ts
  const russianNames = extractRussianNames();

  // 2. Собираем все предметы из нужных категорий
  const allItems = new Map(); // poke-id → { item, category }

  for (const [catId, catName, gameCat] of INCLUDE_CATEGORIES) {
    process.stdout.write(`Загрузка категории ${catName} (${catId})... `);
    try {
      const items = await fetchCategory(catId);
      for (const item of items) {
        if (!allItems.has(item.name)) {
          allItems.set(item.name, { item, categories: [] });
        }
        allItems.get(item.name).categories.push({ catName, gameCat });
      }
      console.log(`${items.length} предметов`);
    } catch (err) {
      console.log(`ОШИБКА: ${err.message}`);
    }
    await delay(100); // rate limit
  }

  console.log(`\nВсего уникальных предметов: ${allItems.size}`);

  // 3. Фильтруем: если предмет в хорошей категории (не EXCLUDE)
  // Берём первую "наилучшую" категорию для каждого предмета

  // Приоритет категорий (меньше = лучше)
  const categoryPriority = {
    'balls': 1,
    'healing': 2,
    'statusCure': 3,
    'ppRecovery': 4,
    'revival': 5,
    'evolutionStones': 6,
    'vitamins': 7,
    'berries': 8,
    'battle': 9,
    'training': 10,
    'tm': 11,
    'other': 20,
    'valuable': 21,
    'crafting': 22,
    'mulch': 23,
  };

  const processed = [];
  const usedIds = new Set();

  for (const [pokeId, data] of allItems) {
    // Выбираем категорию с наивысшим приоритетом
    const sorted = data.categories.sort((a, b) => {
      const pa = categoryPriority[a.gameCat] || 99;
      const pb = categoryPriority[b.gameCat] || 99;
      return pa - pb;
    });
    const bestCategory = sorted[0].gameCat;

    // Пропускаем служебные
    if (bestCategory === 'other' && pokeId.includes('-drive')) continue; // Gen5 drives
    if (pokeId.includes('-memory')) continue; // Gen7 memories (Silvally)
    if (pokeId === 'rse-pokedex' || pokeId === 'sintear') continue;

    processed.push({ pokeId, gameCategory: bestCategory });
  }

  console.log(`После фильтрации: ${processed.length} предметов`);

  // 4. Запрашиваем детали каждого предмета
  const itemDefs = [];
  let fetched = 0;
  const BATCH_SIZE = 40;

  for (let i = 0; i < processed.length; i += BATCH_SIZE) {
    const batch = processed.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ({ pokeId, gameCategory }) => {
      try {
        const detail = await fetchItemDetail(pokeId);
        return pokeApiToItemDef(detail, gameCategory, russianNames, usedIds);
      } catch (err) {
        console.error(`Ошибка загрузки ${pokeId}: ${err.message}`);
        return null;
      }
    });

    const results = await Promise.all(promises);
    for (const r of results) {
      if (r) itemDefs.push(r);
    }

    fetched += batch.length;
    console.log(`Загружено ${fetched}/${processed.length} предметов`);

    if (i + BATCH_SIZE < processed.length) {
      await delay(500); // пауза между батчами
    }
  }

  console.log(`\nУспешно загружено: ${itemDefs.length} предметов`);

  // 5. Добавляем кастомные предметы
  for (const custom of CUSTOM_ITEMS) {
    if (!usedIds.has(custom.id)) {
      itemDefs.push(custom);
      usedIds.add(custom.id);
    }
  }

  // 6. Сортируем: кастомные (currency, tickets, awards, quest, badges) в конец, остальные по категориям+имени
  const customPriority = ['currency', 'tickets', 'awards', 'quest'];
  const canon = itemDefs.filter(i => !customPriority.includes(i.category) && i.category !== 'awards' && i.category !== 'currency' && i.category !== 'tickets');
  const custom = itemDefs.filter(i => customPriority.includes(i.category) || i.category === 'awards' || i.category === 'currency' || i.category === 'tickets');

  canon.sort((a, b) => {
    const order = ['balls', 'healing', 'statusCure', 'ppRecovery', 'revival', 'vitamins', 'berries', 'evolutionStones', 'training', 'battle', 'tm', 'other', 'valuable', 'crafting', 'mulch'];
    const oa = order.indexOf(a.category);
    const ob = order.indexOf(b.category);
    if (oa !== ob) return oa - ob;
    return a.id.localeCompare(b.id);
  });

  const sortedItems = [...canon, ...custom];

  // 7. Генерируем items.ts
  const lines = [];
  lines.push('import { ItemDef } from \'../types/index.js\';');
  lines.push('');
  lines.push('export const ITEMS: ItemDef[] = [');

  let lastCategory = '';
  for (const item of sortedItems) {
    if (item.category !== lastCategory) {
      lines.push('');
      lines.push(`  // ── ${item.category} ──`);
      lastCategory = item.category;
    }

    const fields = {
      id: item.id,
      nameRu: item.nameRu,
      category: item.category,
      desc: item.desc,
      sprite: item.sprite,
      spriteType: item.spriteType,
      price: item.price,
      sellPrice: item.sellPrice,
      isUsable: item.isUsable,
      isBall: item.isBall,
      implemented: item.implemented,
    };
    if (item.ballMult !== undefined) fields.ballMult = item.ballMult;

    const fieldStr = Object.entries(fields)
      .map(([k, v]) => {
        if (typeof v === 'string') return `${k}: '${v.replace(/'/g, "\\'")}'`;
        if (typeof v === 'number') return `${k}: ${v}`;
        if (typeof v === 'boolean') return `${k}: ${v}`;
        return `${k}: ${v}`;
      })
      .join(', ');

    lines.push(`  { ${fieldStr} },`);
  }

  lines.push('];');
  lines.push('');

  // 8. Сохраняем
  const output = lines.join('\n');
  fs.writeFileSync(ITEMS_FILE, output, 'utf-8');

  console.log(`\n=== Готово! ===`);
  console.log(`Сохранено ${sortedItems.length} предметов в ${ITEMS_FILE}`);
  console.log(`  - Каноничных (PokeAPI): ${canon.length}`);
  console.log(`  - Кастомных/специальных: ${custom.length}`);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
