/**
 * Генератор регионов/локаций/энкаунтеров из PokeAPI
 *
 * Собирает все регионы, их локации, area-зоны и энкаунтеры покемонов.
 * Сохраняет в src/data/regions.ts
 *
 * Использование: node scripts/generate-regions.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');
const REGIONS_FILE = path.join(DATA_DIR, 'regions.ts');
const TYPES_FILE = path.resolve(__dirname, '..', 'src', 'types', 'index.d.ts');

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';

// Задержка между батчами
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Fetch с повторными попытками
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(1000 * (i + 1));
    }
  }
}

// PokeAPI kebab-case → camelCase game ID
// route-1 → route1, celadon-city → celadonCity, victory-road → victoryRoad
function kebabToCamel(str) {
  return str.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

// Регионы, которые включаем (все каноничные, включая Орре)
const MAIN_REGIONS = [
  { id: 1, name: 'kanto' },
  { id: 2, name: 'johto' },
  // { id: 3, name: 'hoenn' },
  // { id: 4, name: 'sinnoh' },
  // { id: 5, name: 'unova' },
  // { id: 6, name: 'kalos' },
  // { id: 7, name: 'alola' },
  // { id: 8, name: 'galar' },
  // { id: 9, name: 'hisui' },
  // { id: 10, name: 'paldea' },
];

// Цвета регионов для карты
const REGION_COLORS = {
  kanto: '#4ade80',
  johto: '#facc15',
  hoenn: '#60a5fa',
  sinnoh: '#a78bfa',
  unova: '#f472b6',
  kalos: '#fb923c',
  alola: '#34d399',
  galar: '#818cf8',
  hisui: '#e879f9',
  paldea: '#22d3ee',
};

// Красивые имена регионов
const REGION_NAMES = {
  kanto: 'Канто',
  johto: 'Джото',
  hoenn: 'Хоэнн',
  sinnoh: 'Синно',
  unova: 'Юнова',
  kalos: 'Калос',
  alola: 'Алола',
  galar: 'Галар',
  hisui: 'Хисуй',
  paldea: 'Палдея',
};

async function main() {
  console.log('=== Генератор регионов из PokeAPI ===\n');

  const result = {};

  for (const region of MAIN_REGIONS) {
    console.log(`\nОбработка региона: ${REGION_NAMES[region.name]} (${region.name})`);

    // 1. Получаем данные региона (список локаций)
    const regionData = await fetchWithRetry(`${POKEAPI_BASE}/region/${region.id}`);
    const locationUrls = regionData.locations.map(l => l.url);
    console.log(`  Локаций: ${locationUrls.length}`);

    // 2. Получаем каждую локацию (с названиями)
    const locations = [];
    for (const url of locationUrls) {
      try {
        const locData = await fetchWithRetry(url);
        locations.push(locData);
      } catch (err) {
        console.log(`  Ошибка загрузки локации ${url}: ${err.message}`);
      }
      await delay(50);
    }
    console.log(`  Загружено локаций: ${locations.length}`);

    // 3. Для каждой локации получаем area-зоны с энкаунтерами
    const locationDefs = {};

    for (const loc of locations) {
      // Имя локации: убираем префикс региона
      const regionPrefixes = ['kanto-', 'johto-', 'hoenn-', 'sinnoh-', 'unova-', 'kalos-', 'alola-', 'galar-', 'hisui-', 'paldea-'];
      let cleanName = loc.name;
      for (const prefix of regionPrefixes) {
        if (cleanName.toLowerCase().startsWith(prefix)) {
          cleanName = cleanName.slice(prefix.length);
          break;
        }
      }
      let locName = cleanName
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      const locId = kebabToCamel(cleanName);

      // Собираем энкаунтеры из всех area-зон этой локации
      const allEncounters = new Set();
      const dayEncounters = new Set();
      const nightEncounters = new Set();

      for (const area of loc.areas) {
        try {
          const areaData = await fetchWithRetry(area.url);

          // PokeAPI location-area details включают pokemon_encounters
          if (areaData.pokemon_encounters) {
            for (const enc of areaData.pokemon_encounters) {
              const pokeName = enc.pokemon.name;
              allEncounters.add(pokeName);

              // Определяем day/night по условиям
              let isNight = false;
              let isDay = false;

              for (const vd of enc.version_details) {
                for (const ed of vd.encounter_details) {
                  if (ed.condition_values) {
                    for (const cv of ed.condition_values) {
                      if (cv.name.includes('night')) isNight = true;
                      if (cv.name.includes('day')) isDay = true;
                    }
                  }
                }
              }

              if (isNight && !isDay) nightEncounters.add(pokeName);
              if (isDay && !isNight) dayEncounters.add(pokeName);
            }
          }
        } catch (err) {
          // Игнорируем ошибки загрузки area
        }
        await delay(30);
      }

      const encounters = [...allEncounters].sort();
      const day = [...dayEncounters].sort();
      const night = [...nightEncounters].sort();

      // Создаём LocationDef
      const locDef = {
        name: locName,
        desc: `${locName} — локация в регионе ${REGION_NAMES[region.name]}.`,
        image: `/assets/map/${region.name}/${locId}.png`,
        links: [],
        encounters,
        hasHeal: false,
        hasWater: false,
        region: region.name,
      };

      if (day.length > 0) locDef.dayEncounters = day;
      if (night.length > 0) locDef.nightEncounters = night;

      if (encounters.length > 0 || day.length > 0 || night.length > 0) {
        locationDefs[locId] = locDef;
      }
    }

    // 4. Создаём RegionDef
    result[region.name] = {
      name: REGION_NAMES[region.name],
      color: REGION_COLORS[region.name],
      locations: locationDefs,
    };

    const totalEncounterLocs = Object.values(locationDefs).filter(l => l.encounters.length > 0).length;
    const totalDayLocs = Object.values(locationDefs).filter(l => l.dayEncounters?.length > 0).length;
    const totalNightLocs = Object.values(locationDefs).filter(l => l.nightEncounters?.length > 0).length;
    console.log(`  Локаций с энкаунтерами: ${totalEncounterLocs}`);
    console.log(`  Локаций с day/night: ${totalDayLocs}/${totalNightLocs}`);
  }

  // 5. Генерируем TypeScript файл
  console.log('\n=== Генерация regions.ts ===');

  const lines = [];
  lines.push('import { RegionDef } from \'../types/index.js\';');
  lines.push('');
  lines.push('export const REGIONS: Record<string, RegionDef> = {');

  for (const [regionId, region] of Object.entries(result)) {
    lines.push('');
    lines.push(`  // ── ${region.name} (${regionId}) ──`);
    lines.push(`  ${regionId}: {`);
    lines.push(`    name: '${region.name}',`);
    lines.push(`    color: '${region.color}',`);
    lines.push('    locations: {');

    for (const [locId, loc] of Object.entries(region.locations)) {
      lines.push(`      ${locId}: {`);
      lines.push(`        name: '${loc.name.replace(/'/g, "\\'")}',`);
      if (loc.desc) lines.push(`        desc: '${loc.desc.replace(/'/g, "\\'")}',`);
      lines.push(`        image: '${loc.image}',`);
      lines.push(`        links: ${JSON.stringify(loc.links)},`);
      lines.push(`        encounters: ${JSON.stringify(loc.encounters)},`);
      if (loc.dayEncounters) lines.push(`        dayEncounters: ${JSON.stringify(loc.dayEncounters)},`);
      if (loc.nightEncounters) lines.push(`        nightEncounters: ${JSON.stringify(loc.nightEncounters)},`);
      lines.push(`        hasHeal: ${loc.hasHeal},`);
      lines.push(`        hasWater: ${loc.hasWater},`);
      lines.push(`        region: '${loc.region}',`);
      lines.push('      },');
    }

    lines.push('    },');
    lines.push('  },');
  }

  lines.push('};');
  lines.push('');

  const output = lines.join('\n');
  fs.writeFileSync(REGIONS_FILE, output, 'utf-8');

  // Статистика
  let totalLocations = 0;
  let totalEncounters = 0;
  for (const region of Object.values(result)) {
    for (const loc of Object.values(region.locations)) {
      totalLocations++;
      totalEncounters += loc.encounters.length;
    }
  }

  console.log(`\n=== Готово! ===`);
  console.log(`Регионов: ${Object.keys(result).length}`);
  console.log(`Локаций: ${totalLocations}`);
  console.log(`Всего энкаунтеров: ${totalEncounters}`);
  console.log(`Файл: ${REGIONS_FILE}`);
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
