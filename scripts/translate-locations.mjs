import { readFileSync, writeFileSync } from 'fs';

const SRC = 'D:\\pokematrix\\league17\\src\\data\\regions.ts';
let content = readFileSync(SRC, 'utf-8');

const T = {
  // ── Kanto Cities ──
  celadonCity: 'Селедон-Сити',
  ceruleanCity: 'Церулин-Сити',
  cinnabarIsland: 'Остров Киноварь',
  fuchsiaCity: 'Фуксия-Сити',
  palletTown: 'Паллет-Таун',
  vermilionCity: 'Вермилион-Сити',
  viridianCity: 'Веридиан-Сити',
  pewterCity: 'Пьютер-Сити',
  lavenderTown: 'Лавандовый Город',
  saffronCity: 'Саффрон-Сити',

  // ── Kanto Landmarks ──
  diglettsCave: 'Пещера Диглетта',
  mtMoon: 'Гора Мун',
  rockTunnel: 'Скальный Туннель',
  seafoamIslands: 'Морская Пена',
  ceruleanCave: 'Церулинская Пещера',
  victoryRoad1: 'Дорога Победы 1',
  victoryRoad2: 'Дорога Победы 2',
  viridianForest: 'Веридианский Лес',
  powerPlant: 'Электростанция',
  pokemonTower: 'Башня Покемонов',
  pokemonMansion: 'Особняк Покемонов',
  safariZone: 'Сафари-Зона',
  indigoPlateau: 'Индиговое Плато',
  pokecenter: 'Поке-Центр',
  undergroundPath: 'Подземный Путь',

  // ── Kanto Routes ──
  route1: 'Маршрут 1',
  route2: 'Маршрут 2',
  route3: 'Маршрут 3',
  route4: 'Маршрут 4',
  route5: 'Маршрут 5',
  route6: 'Маршрут 6',
  route7: 'Маршрут 7',
  route8: 'Маршрут 8',
  route9: 'Маршрут 9',
  route10: 'Маршрут 10',
  route11: 'Маршрут 11',
  route12: 'Маршрут 12',
  route13: 'Маршрут 13',
  route14: 'Маршрут 14',
  route15: 'Маршрут 15',
  route16: 'Маршрут 16',
  route17: 'Маршрут 17',
  route18: 'Маршрут 18',
  route22: 'Маршрут 22',
  route23: 'Маршрут 23',
  route24: 'Маршрут 24',
  route25: 'Маршрут 25',
  route26: 'Маршрут 26',
  route27: 'Маршрут 27',
  route28: 'Маршрут 28',

  // ── Kanto Sea Routes ──
  seaRoute19: 'Морской Маршрут 19',
  seaRoute20: 'Морской Маршрут 20',
  seaRoute21: 'Морской Маршрут 21',

  // ── Kanto Sevii Islands ──
  mtEmber: 'Гора Эмбер',
  berryForest: 'Ягодный Лес',
  icefallCave: 'Ледопадная Пещера',
  patternBush: 'Узорный Кустарник',
  lostCave: 'Затерянная Пещера',
  kindleRoad: 'Дорога Киндл',
  treasureBeach: 'Пляж Сокровищ',
  capeBrink: 'Мыс Бринк',
  bondBridge: 'Мост Бонд',
  threeIslePort: 'Порт Трёх Островов',
  resortGorgeous: 'Роскошный Курорт',
  waterLabyrinth: 'Водный Лабиринт',
  fiveIsleMeadow: 'Луг Пяти Островов',
  memorialPillar: 'Мемориальный Столб',
  outcastIsland: 'Остров Изгнанников',
  greenPath: 'Зелёная Тропа',
  waterPath: 'Водная Тропа',
  ruinValley: 'Долина Руин',
  trainerTower: 'Башня Тренировок',
  canyonEntrance: 'Вход в Каньон',
  sevaultCanyon: 'Каньон Севальт',
  tanobyRuins: 'Руины Танойи',
  oneIsland: 'Остров Один',
  fourIsland: 'Остров Четыре',
  fiveIsland: 'Остров Пять',
  alteringCave: 'Изменчивая Пещера',
  roamingKanto: 'Блуждающие Канто',
  birthIsland: 'Остров Рождения',
  navelRock: 'Скала Пуп',

  // ── Kanto Ruins Chambers ──
  moneanChamber: 'Камера Мони',
  liptooChamber: 'Камера Липту',
  weepthChamber: 'Камера Випта',
  dilfordChamber: 'Камера Дилфорда',
  scufibChamber: 'Камера Скафиба',
  rixyChamber: 'Камера Рикси',
  viaposChamber: 'Камера Виапоса',

  // ── Kanto Other ──
  ssAnne: 'С.С. Энн',

  // ── Johto Cities ──
  blackthornCity: 'Блэкторн-Сити',
  cherrygroveCity: 'Черригроув-Сити',
  cianwoodCity: 'Сианвуд-Сити',
  ecruteakCity: 'Экрютик-Сити',
  newBarkTown: 'Нью-Барк-Таун',
  olivineCity: 'Оливин-Сити',
  violetCity: 'Вайолет-Сити',
  azaleaTown: 'Азалия-Таун',
  goldenrodCity: 'Голденрод-Сити',

  // ── Johto Landmarks ──
  burnedTower: 'Обожжённая Башня',
  darkCave: 'Тёмная Пещера',
  dragonsDen: 'Логово Дракона',
  icePath: 'Ледяная Тропа',
  ilexForest: 'Лес Илекс',
  lakeOfRage: 'Озеро Гнева',
  mtMortar: 'Гора Мортэр',
  mtSilver: 'Серебряная Гора',
  nationalPark: 'Национальный Парк',
  ruinsOfAlph: 'Руины Алфа',
  slowpokeWell: 'Колодец Слоупока',
  sproutTower: 'Башня Ростка',
  bellTower: 'Колокольная Башня',
  tohjoFalls: 'Водопад Тоджо',
  unionCave: 'Юнион-Пещера',
  whirlIslands: 'Водоворотные Острова',
  teamRocketHq: 'Штаб Команды R',
  safariZoneGate: 'Вход в Сафари-Зону',
  sinjohRuins: 'Руины Синдзё',
  embeddedTower: 'Вмороженная Башня',
  roamingJohto: 'Блуждающие Джото',
  pokemart: 'Поке-Март',

  // ── Johto Routes ──
  route29: 'Маршрут 29',
  route30: 'Маршрут 30',
  route31: 'Маршрут 31',
  route32: 'Маршрут 32',
  route33: 'Маршрут 33',
  route34: 'Маршрут 34',
  route35: 'Маршрут 35',
  route36: 'Маршрут 36',
  route37: 'Маршрут 37',
  route38: 'Маршрут 38',
  route39: 'Маршрут 39',
  route42: 'Маршрут 42',
  route43: 'Маршрут 43',
  route44: 'Маршрут 44',
  route45: 'Маршрут 45',
  route46: 'Маршрут 46',
  route47: 'Маршрут 47',
  route48: 'Маршрут 48',

  // ── Johto Sea Routes ──
  seaRoute40: 'Морской Маршрут 40',
  seaRoute41: 'Морской Маршрут 41',

  // ── Johto Special ──
  unknownAllPoliwag: 'Неизвестно: Все Поливаг',
  unknownAllRattata: 'Неизвестно: Все Раттата',
  unknownAllBugs: 'Неизвестно: Все Жуки',
};

// Process line-by-line
const lines = content.split('\n');
const newLines = [];
let currentId = null;
let changed = 0, skipped = 0;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Track the current location ID (e.g., "      celadonCity: {")
  const idMatch = line.match(/^(\s{6})(\w+):\s*\{$/);
  if (idMatch) {
    currentId = idMatch[2];
  }

  // Look for name: '...' fields (8 spaces indent inside location)
  const nameMatch = line.match(/^(\s{8}name:\s*)'([^']*)'(.*)$/);
  if (nameMatch && currentId && T[currentId]) {
    line = `${nameMatch[1]}'${T[currentId]}'${nameMatch[3]}`;
    changed++;
  }

  newLines.push(line);
}

writeFileSync(SRC, newLines.join('\n'), 'utf-8');
console.log(`\n=== Location Translation Results ===`);
console.log(`Translated: ${changed}`);
console.log(`Total lines: ${lines.length}`);
console.log(`\n✅ Done! Written to ${SRC}`);
