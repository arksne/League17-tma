// Game state helpers — data constants and pure utility functions
// Mutable game variables remain in main.js (imported bindings can't be reassigned)

import { gymLeaders } from '../data/gyms.js';
import { ITEMS } from '../data/items.js';
import { trainingStages } from '../data/training.js';
import { QUEST_CONFIGS } from '../data/quests.js';

// === DATA CONSTANTS ===
export const LEGENDARY_SET = new Set([
  'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
  'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi',
  'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys',
  'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'darkrai', 'shaymin', 'arceus',
  'victini', 'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram', 'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect',
  'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion',
  'type-null', 'silvally', 'tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'necrozma', 'magearna', 'marshadow', 'zeraora',
  'zacian', 'zamazenta', 'eternatus', 'kubfu', 'urshifu', 'regieleki', 'regidrago', 'glastrier', 'spectrier', 'calyrex',
  'koraidon', 'miraidon', 'ting-lu', 'chien-pao', 'wo-chien', 'chi-yu'
]);
export const LEGENDARY_NAMES = new Set([
  'articuno','zapdos','moltres','mewtwo','mew','raikou','entei','suicune','lugia','ho-oh','celebi',
  'regirock','regice','registeel','latias','latios','kyogre','groudon','rayquaza','jirachi','deoxys',
  'uxie','mesprit','azelf','dialga','palkia','heatran','regigigas','giratina','cresselia','phione','manaphy','darkrai','shaymin','arceus',
  'victini','reshiram','zekrom','kyurem','keldeo','meloetta','genesect',
  'xerneas','yveltal','zygarde','diancie','hoopa','volcanion',
  'tapu-koko','tapu-lele','tapu-bulu','tapu-fini','cosmog','cosmoem','solgaleo','lunala','necrozma','magearna','marshadow','zeraora',
  'zacian','zamazenta','eternatus','kubfu','urshifu','regieleki','regidrago','glastrier','spectrier','calyrex',
  'koraidon','miraidon'
]);

export const eliteFour = [
  {
    name: 'Лорели', title: 'Элитная Четверка — Лед', type: 'ice',
    team: [
      { name: 'dewgong', level: 58, move1: 'aurora-beam', move2: 'rest' },
      { name: 'cloyster', level: 57, move1: 'ice-beam', move2: 'supersonic' },
      { name: 'slowbro', level: 58, move1: 'surf', move2: 'psychic' },
      { name: 'jynx', level: 60, move1: 'blizzard', move2: 'psychic' },
      { name: 'lapras', level: 62, move1: 'ice-beam', move2: 'hydro-pump' }
    ],
    moneyReward: 8000
  },
  {
    name: 'Бруно', title: 'Элитная Четверка — Бой', type: 'fighting',
    team: [
      { name: 'hitmonlee', level: 60, move1: 'jump-kick', move2: 'rolling-kick' },
      { name: 'hitmonchan', level: 60, move1: 'ice-punch', move2: 'fire-punch' },
      { name: 'onix', level: 61, move1: 'rock-slide', move2: 'earthquake' },
      { name: 'machamp', level: 63, move1: 'submission', move2: 'cross-chop' },
      { name: 'machamp', level: 65, move1: 'dynamic-punch', move2: 'earthquake' }
    ],
    moneyReward: 9000
  },
  {
    name: 'Агата', title: 'Элитная Четверка — Призрак', type: 'ghost',
    team: [
      { name: 'gengar', level: 63, move1: 'shadow-ball', move2: 'hypnosis' },
      { name: 'crobat', level: 62, move1: 'wing-attack', move2: 'confuse-ray' },
      { name: 'gengar', level: 64, move1: 'shadow-ball', move2: 'night-shade' },
      { name: 'arbok', level: 63, move1: 'sludge-bomb', move2: 'glare' },
      { name: 'gengar', level: 66, move1: 'shadow-ball', move2: 'dream-eater' }
    ],
    moneyReward: 10000
  },
  {
    name: 'Лэнс', title: 'Элитная Четверка — Дракон', type: 'dragon',
    team: [
      { name: 'gyarados', level: 65, move1: 'hydro-pump', move2: 'hyper-beam' },
      { name: 'dragonair', level: 64, move1: 'dragon-rage', move2: 'thunderbolt' },
      { name: 'dragonair', level: 64, move1: 'dragon-rage', move2: 'ice-beam' },
      { name: 'aerodactyl', level: 66, move1: 'hyper-beam', move2: 'ancient-power' },
      { name: 'dragonite', level: 70, move1: 'hyper-beam', move2: 'dragon-rage' }
    ],
    moneyReward: 12000
  }
];
export const champion = {
  name: 'Голд (Чемпион)', title: 'Чемпион Лиги', type: 'water',
  team: [
    { name: 'pidgeot', level: 68, move1: 'fly', move2: 'sky-attack' },
    { name: 'alakazam', level: 70, move1: 'psychic', move2: 'recover' },
    { name: 'rhydon', level: 70, move1: 'earthquake', move2: 'stone-edge' },
    { name: 'exeggutor', level: 68, move1: 'psychic', move2: 'solar-beam' },
    { name: 'gyarados', level: 72, move1: 'hydro-pump', move2: 'hyper-beam' },
    { name: 'blastoise', level: 74, move1: 'hydro-pump', move2: 'ice-beam' }
  ],
  moneyReward: 15000
};

// Johto elite four and champion
export const johtoEliteFour = [
  {
    name: 'Уилл', title: 'Элитная Четверка Джото — Экстрасенс', type: 'psychic',
    team: [
      { name: 'xatu', level: 50, move1: 'psychic', move2: 'confuse-ray' },
      { name: 'exeggutor', level: 52, move1: 'psychic', move2: 'solar-beam' },
      { name: 'slowbro', level: 52, move1: 'surf', move2: 'psychic' },
      { name: 'jynx', level: 53, move1: 'ice-punch', move2: 'psychic' },
      { name: 'espeon', level: 55, move1: 'psychic', move2: 'morning-sun' }
    ],
    moneyReward: 7000
  },
  {
    name: 'Кога', title: 'Элитная Четверка Джото — Яд', type: 'poison',
    team: [
      { name: 'ariados', level: 51, move1: 'sludge-bomb', move2: 'spider-web' },
      { name: 'venomoth', level: 52, move1: 'psychic', move2: 'sludge-bomb' },
      { name: 'muk', level: 54, move1: 'sludge', move2: 'minimize' },
      { name: 'weezing', level: 55, move1: 'sludge-bomb', move2: 'explosion' },
      { name: 'crobat', level: 56, move1: 'wing-attack', move2: 'poison-fang' }
    ],
    moneyReward: 8000
  },
  {
    name: 'Бруно', title: 'Элитная Четверка Джото — Бой', type: 'fighting',
    team: [
      { name: 'hitmontop', level: 54, move1: 'rolling-kick', move2: 'quick-attack' },
      { name: 'hitmonlee', level: 55, move1: 'jump-kick', move2: 'rolling-kick' },
      { name: 'hitmonchan', level: 55, move1: 'ice-punch', move2: 'fire-punch' },
      { name: 'machamp', level: 57, move1: 'cross-chop', move2: 'rock-slide' },
      { name: 'machamp', level: 59, move1: 'dynamic-punch', move2: 'strength' }
    ],
    moneyReward: 9000
  },
  {
    name: 'Карен', title: 'Элитная Четверка Джото — Тьма', type: 'dark',
    team: [
      { name: 'umbreon', level: 56, move1: 'faint-attack', move2: 'confuse-ray' },
      { name: 'vileplume', level: 55, move1: 'petal-dance', move2: 'sludge-bomb' },
      { name: 'murkrow', level: 57, move1: 'shadow-ball', move2: 'drill-peck' },
      { name: 'gengar', level: 58, move1: 'shadow-ball', move2: 'destiny-bond' },
      { name: 'houndoom', level: 60, move1: 'crunch', move2: 'flamethrower' }
    ],
    moneyReward: 10000
  }
];

export const johtoChampion = {
  name: 'Лэнс (Чемпион Джото)', title: 'Чемпион Лиги Джото', type: 'dragon',
  team: [
    { name: 'gyarados', level: 58, move1: 'hydro-pump', move2: 'dragon-rage' },
    { name: 'dragonite', level: 60, move1: 'hyper-beam', move2: 'dragon-rage' },
    { name: 'charizard', level: 59, move1: 'flamethrower', move2: 'fly' },
    { name: 'aerodactyl', level: 60, move1: 'hyper-beam', move2: 'ancient-power' },
    { name: 'dragonite', level: 62, move1: 'hyper-beam', move2: 'outrage' },
    { name: 'dragonite', level: 64, move1: 'hyper-beam', move2: 'thunder' }
  ],
  moneyReward: 15000
};

// === UID ===
let uidCounter = Date.now();
export function generateUID() { return (++uidCounter).toString(36) + Math.random().toString(36).substr(2, 6); }
export function getTrainerId(tgUser?) { return tgUser?.id || localStorage.getItem('league17_trainer_id') || '0'; }
export function lsKey(name, tgUser?) { return `league17_${name}_${getTrainerId(tgUser)}`; }

// === STAR RATINGS — pure functions, no mutable state dependency ===
export function getPowerStars(mon) {
  if (!mon.apiData?.stats) return 1;
  const bst = mon.apiData.stats.reduce((sum, s) => sum + s.base_stat, 0);
  if (bst >= 650) return 10;
  if (bst >= 600) return 9;
  if (bst >= 550) return 8;
  if (bst >= 500) return 7;
  if (bst >= 450) return 6;
  if (bst >= 400) return 5;
  if (bst >= 350) return 4;
  if (bst >= 300) return 3;
  if (bst >= 250) return 2;
  return 1;
}
export function getRarityStars(mon) {
  const name = mon.apiData?.species?.name || mon.apiData?.name;
  if (name && LEGENDARY_NAMES.has(name)) return 5;
  const cr = mon.apiData?.captureRate || mon.apiData?.speciesData?.capture_rate || 255;
  if (cr < 30) return 4;
  if (cr < 80) return 3;
  if (cr < 150) return 2;
  return 1;
}

// === POKEDEX STATE ACCESSORS — read-only wrappers around imported data ===
export function getPokedexState(pokedexSeen?, pokedexCaught?, POKEDEX_ALL?, pokedexData?, pokedexTotal?) {
  return { pokedexSeen, pokedexCaught, POKEDEX_ALL: POKEDEX_ALL || [], pokedexData: pokedexData || {}, pokedexTotal: pokedexTotal || 0 };
}
