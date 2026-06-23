/**
 * Генератор джим-лидеров
 *
 * Создаёт gyms.ts с каноничными джим-лидерами и их командами.
 * Данные берутся из PokeAPI (проверка имён покемонов) + хардкод каноничных составов.
 *
 * Использование: node scripts/generate-gyms.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'src', 'data');
const GYMS_FILE = path.join(DATA_DIR, 'gyms.ts');

// Каноничные джим-лидеры: Канто (Gen 1/3/7) + Джото (Gen 2/4)
// Команды — микс из каноничных игр с релевантными для ММО уровнями
const GYM_LEADERS = {
  // ═══ KANTO ═══
  pewterStadium: {
    name: 'Брок', title: 'Лидер Зала Пьютера', type: 'rock',
    badgeName: 'Boulder Badge', badgeIcon: '🪨',
    trainingStage: 1, moneyReward: 4000,
    rewardItem: 'fullRestore', rewardQty: 1,
    team: [
      { name: 'golem', level: 40 },
      { name: 'omastar', level: 40 },
      { name: 'aerodactyl', level: 40 },
      { name: 'tyranitar', level: 40 },
    ],
  },
  ceruleanStadium: {
    name: 'Мисти', title: 'Лидер Зала Церулина', type: 'water',
    badgeName: 'Cascade Badge', badgeIcon: '💧',
    trainingStage: 1, moneyReward: 5000,
    rewardItem: 'superPotion', rewardQty: 1,
    team: [
      { name: 'starmie', level: 45 },
      { name: 'lapras', level: 45 },
      { name: 'gyarados', level: 45 },
      { name: 'poliwrath', level: 45 },
    ],
  },
  vermilionStadium: {
    name: 'Лейтенант Сёрдж', title: 'Лидер Зала Вермилиона', type: 'electric',
    badgeName: 'Thunder Badge', badgeIcon: '⚡',
    trainingStage: 2, moneyReward: 6000,
    rewardItem: 'elixir', rewardQty: 1,
    team: [
      { name: 'raichu', level: 50 },
      { name: 'magneton', level: 50 },
      { name: 'lanturn', level: 50 },
      { name: 'electabuzz', level: 50 },
    ],
  },
  celadonStadium: {
    name: 'Эрика', title: 'Лидер Зала Селадона', type: 'grass',
    badgeName: 'Rainbow Badge', badgeIcon: '🌿',
    trainingStage: 2, moneyReward: 7000,
    rewardItem: 'hyperPotion', rewardQty: 1,
    team: [
      { name: 'venusaur', level: 55 },
      { name: 'exeggutor', level: 55 },
      { name: 'jumpluff', level: 55 },
      { name: 'bellossom', level: 55 },
    ],
  },
  saffronPsychicStadium: {
    name: 'Сабрина', title: 'Лидер Зала Шаффрана', type: 'psychic',
    badgeName: 'Marsh Badge', badgeIcon: '🔮',
    trainingStage: 2, moneyReward: 8000,
    rewardItem: 'maxPotion', rewardQty: 1,
    team: [
      { name: 'alakazam', level: 60 },
      { name: 'espeon', level: 60 },
      { name: 'mr-mime', level: 60 },
      { name: 'hypno', level: 60 },
    ],
  },
  fuchsiaPoisonStadium: {
    name: 'Кога', title: 'Лидер Зала Фуксии', type: 'poison',
    badgeName: 'Soul Badge', badgeIcon: '☠️',
    trainingStage: 3, moneyReward: 9000,
    rewardItem: 'fullRestore', rewardQty: 2,
    team: [
      { name: 'gengar', level: 65 },
      { name: 'crobat', level: 65 },
      { name: 'tentacruel', level: 65 },
      { name: 'muk', level: 65 },
    ],
  },
  cinnabarStadium: {
    name: 'Блейн', title: 'Лидер Зала Острова Киноварь', type: 'fire',
    badgeName: 'Volcano Badge', badgeIcon: '🌋',
    trainingStage: 3, moneyReward: 10000,
    rewardItem: 'maxElixir', rewardQty: 1,
    team: [
      { name: 'arcanine', level: 70 },
      { name: 'ninetales', level: 70 },
      { name: 'rapidash', level: 70 },
      { name: 'magmortar', level: 70 },
    ],
  },
  viridianStadium: {
    name: 'Джованни', title: 'Босс Команды R', type: 'ground',
    badgeName: 'Earth Badge', badgeIcon: '🏜️',
    trainingStage: 3, moneyReward: 11000,
    rewardItem: 'maxRevive', rewardQty: 1,
    team: [
      { name: 'nidoking', level: 75 },
      { name: 'rhydon', level: 75 },
      { name: 'dugtrio', level: 75 },
      { name: 'krookodile', level: 75 },
    ],
  },

  // ═══ JOHTO ═══
  violetStadium: {
    name: 'Фолкнер', title: 'Лидер Зала Вайолет', type: 'flying',
    badgeName: 'Zephyr Badge', badgeIcon: '🕊️',
    trainingStage: 4, moneyReward: 12000,
    rewardItem: 'fullRestore', rewardQty: 1,
    team: [
      { name: 'pidgeot', level: 80 },
      { name: 'skarmory', level: 80 },
      { name: 'gligar', level: 80 },
      { name: 'aerodactyl', level: 80 },
    ],
  },
  azaleaStadium: {
    name: 'Багси', title: 'Лидер Зала Азалии', type: 'bug',
    badgeName: 'Hive Badge', badgeIcon: '🐛',
    trainingStage: 4, moneyReward: 13000,
    rewardItem: 'hyperPotion', rewardQty: 1,
    team: [
      { name: 'scizor', level: 85 },
      { name: 'heracross', level: 85 },
      { name: 'scyther', level: 85 },
      { name: 'yanmega', level: 85 },
    ],
  },
  goldenrodStadium: {
    name: 'Уитни', title: 'Лидер Зала Голденрода', type: 'normal',
    badgeName: 'Plain Badge', badgeIcon: '⭐',
    trainingStage: 4, moneyReward: 14000,
    rewardItem: 'maxPotion', rewardQty: 1,
    team: [
      { name: 'snorlax', level: 90 },
      { name: 'blissey', level: 90 },
      { name: 'kangaskhan', level: 90 },
      { name: 'tauros', level: 90 },
    ],
  },
  ecruteakStadium: {
    name: 'Морти', title: 'Лидер Зала Эйкрутика', type: 'ghost',
    badgeName: 'Fog Badge', badgeIcon: '👻',
    trainingStage: 5, moneyReward: 15000,
    rewardItem: 'fullRestore', rewardQty: 2,
    team: [
      { name: 'gengar', level: 95 },
      { name: 'mismagius', level: 95 },
      { name: 'sableye', level: 95 },
      { name: 'banette', level: 95 },
    ],
  },
  cianwoodStadium: {
    name: 'Чак', title: 'Лидер Зала Сианвуда', type: 'fighting',
    badgeName: 'Storm Badge', badgeIcon: '👊',
    trainingStage: 5, moneyReward: 16000,
    rewardItem: 'maxElixir', rewardQty: 1,
    team: [
      { name: 'machamp', level: 100 },
      { name: 'hitmonlee', level: 100 },
      { name: 'hitmonchan', level: 100 },
      { name: 'conkeldurr', level: 100 },
    ],
  },
  olivineStadium: {
    name: 'Жасмин', title: 'Лидер Зала Оливина', type: 'steel',
    badgeName: 'Mineral Badge', badgeIcon: '⚙️',
    trainingStage: 5, moneyReward: 17000,
    rewardItem: 'fullRestore', rewardQty: 2,
    team: [
      { name: 'steelix', level: 105 },
      { name: 'skarmory', level: 105 },
      { name: 'mawile', level: 105 },
      { name: 'aggron', level: 105 },
    ],
  },
  mahoganyStadium: {
    name: 'Прайс', title: 'Лидер Зала Махогани', type: 'ice',
    badgeName: 'Glacier Badge', badgeIcon: '❄️',
    trainingStage: 6, moneyReward: 18000,
    rewardItem: 'maxRevive', rewardQty: 1,
    team: [
      { name: 'dewgong', level: 110 },
      { name: 'cloyster', level: 110 },
      { name: 'mamoswine', level: 110 },
      { name: 'glaceon', level: 110 },
    ],
  },
  blackthornStadium: {
    name: 'Клер', title: 'Лидер Зала Блэкторна', type: 'dragon',
    badgeName: 'Rising Badge', badgeIcon: '🐉',
    trainingStage: 6, moneyReward: 20000,
    rewardItem: 'maxRevive', rewardQty: 2,
    team: [
      { name: 'dragonite', level: 115 },
      { name: 'salamence', level: 115 },
      { name: 'garchomp', level: 115 },
      { name: 'kingdra', level: 115 },
    ],
  },
};

async function main() {
  console.log('=== Генератор джим-лидеров ===\n');

  // Валидация: проверяем что все имена покемонов существуют в PokeAPI
  const seenPokes = new Set();
  let errors = 0;

  for (const [stadiumId, leader] of Object.entries(GYM_LEADERS)) {
    for (const mon of leader.team) {
      if (!seenPokes.has(mon.name)) {
        seenPokes.add(mon.name);
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mon.name}`);
          if (!res.ok) {
            console.log(`  ⚠ ${mon.name} — HTTP ${res.status}`);
            errors++;
          }
        } catch {
          console.log(`  ⚠ ${mon.name} — ошибка запроса`);
          errors++;
        }
      }
    }
  }

  console.log(`\nПроверено покемонов: ${seenPokes.size}, ошибок: ${errors}`);

  // Генерация gyms.ts
  const lines = [];
  lines.push('export const gymLeaders = {');
  lines.push('');

  for (const [stadiumId, leader] of Object.entries(GYM_LEADERS)) {
    lines.push(`  // ── ${leader.name} — ${leader.title} (${leader.type}) ──`);
    lines.push(`  ${stadiumId}: {`);
    lines.push(`    name: '${leader.name}',`);
    lines.push(`    title: '${leader.title}',`);
    lines.push(`    type: '${leader.type}',`);
    lines.push(`    badgeName: '${leader.badgeName}',`);
    lines.push(`    badgeIcon: '${leader.badgeIcon}',`);
    lines.push(`    trainingStage: ${leader.trainingStage},`);
    lines.push(`    moneyReward: ${leader.moneyReward},`);
    lines.push(`    rewardItem: '${leader.rewardItem}',`);
    lines.push(`    rewardQty: ${leader.rewardQty},`);
    lines.push('    team: [');
    for (const mon of leader.team) {
      lines.push(`      { name: '${mon.name}', level: ${mon.level} },`);
    }
    lines.push('    ],');
    lines.push('  },');
    lines.push('');
  }

  lines.push('};');
  lines.push('');

  fs.writeFileSync(GYMS_FILE, lines.join('\n'), 'utf-8');
  console.log(`\nСохранено: ${GYMS_FILE}`);
  console.log(`Джим-лидеров: ${Object.keys(GYM_LEADERS).length}`);
  console.log('=== Готово! ===');
}

main().catch(err => {
  console.error('Ошибка:', err);
  process.exit(1);
});
