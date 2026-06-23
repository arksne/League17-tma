import { readFileSync, writeFileSync } from 'fs';

const SRC = 'D:\\pokematrix\\league17\\src\\data\\items.ts';
let content = readFileSync(SRC, 'utf-8');

// ─── Fix existing bad Russian translations ───────────────────────────────────
// Some Russian translations from Bulbapedia wiki are ugly — fix them
const FIXES = {
  "Воздушный Шарик": "Воздушный Шар",
  "Чёрные очки": "Черные Очки",
  "Чёрная грязь": "Черная Грязь",
  "Влажный камень": "Влажный Камень",
  "Драконий клык": "Клык Дракона",
  "Твёрдый камень": "Твердый Камень",
  "Горячий камень": "Горячий Камень",
  "Объедки": "Остатки",
  "Металлическое покрытие": "Металлическое Покрытие",
  "Острый клюв": "Острый Клюв",
  "Мягкий песок": "Мягкий Песок",
  "Заговорённая метка": "Метка Заклинания",
  "Каменная пластинка": "Каменная Пластина",
  "Гнутая ложка": "Гнутая Ложка",
  "Белая трава +2": "Белая Трава",
  "Белая трава": "Белая Трава",
  "Фокусный пояс": "Фокусный Пояс",
  "Глубоководная чешуя": "Глубинная Чешуя",
  "Глубоководный зуб": "Глубинный Зуб",
  // Fix berry word order: "Xxx Ягода" → "Ягода Xxx"
  "Аспир Ягода": "Ягода Аспир",
  "Често Ягода": "Ягода Често",
  "Лум Ягода": "Ягода Лум",
  "Оран Ягода": "Ягода Оран",
  "Персим Ягода": "Ягода Персим",
  "Рост Ягода": "Ягода Рост",
  // Also "Ягода Aguav" (English name kept) is fine for now — still shows as English
};
let fixedCount = 0;
for (const [old, neu] of Object.entries(FIXES)) {
  if (content.includes(old)) {
    content = content.replaceAll(old, neu);
    fixedCount++;
  }
}

// ─── Translation Map: item id → proper Russian name ─────────────────────────
const T = {

  // ── Balls (28) ──
  pokeBall: 'Поке-Болл',
  greatBall: 'Грейт-Болл',
  ultraBall: 'Ультра-Болл',
  masterBall: 'Мастер-Болл',
  premierBall: 'Премиер-Болл',
  healBall: 'Хил-Болл',
  netBall: 'Нет-Болл',
  nestBall: 'Нест-Болл',
  diveBall: 'Дайв-Болл',
  duskBall: 'Даск-Болл',
  timerBall: 'Таймер-Болл',
  quickBall: 'Квик-Болл',
  repeatBall: 'Рипит-Болл',
  luxuryBall: 'Лакшери-Болл',
  levelBall: 'Уровневый Болл',
  lureBall: 'Люр-Болл',
  moonBall: 'Лунный Болл',
  friendBall: 'Френд-Болл',
  loveBall: 'Лав-Болл',
  heavyBall: 'Хэви-Болл',
  fastBall: 'Фаст-Болл',
  sportBall: 'Спорт-Болл',
  safariBall: 'Сафари-Болл',
  beastBall: 'Бист-Болл',
  dreamBall: 'Дрим-Болл',
  cherishBall: 'Чериш-Болл',
  parkBall: 'Парк-Болл',
  strangeBall: 'Стрендж-Болл',

  // ── Custom balls (user-added) ──
  darkBall: 'Дарк-Болл',
  superDarkBall: 'Супер-Дарк-Болл',

  // ── Healing (14) ──
  potion: 'Зелье',
  superPotion: 'Супер-Зелье',
  hyperPotion: 'Гипер-Зелье',
  maxPotion: 'Макс-Зелье',
  fullRestore: 'Полное Восстановление',
  fullHeal: 'Полное Исцеление',
  freshWater: 'Чистая Вода',
  sodaPop: 'Содовая',
  lemonade: 'Лимонад',
  moomooMilk: 'Молоко Муму',
  energyPowder: 'Энергетический Порошок',
  energyRoot: 'Энергетический Корень',
  healPowder: 'Целебный Порошок',
  revivalHerb: 'Трава Возрождения',

  // ── Status Cure (8) ──
  antidote: 'Антидот',
  burnHeal: 'Средство От Ожога',
  iceHeal: 'Средство От Обморожения',
  awaken: 'Пробуждение',
  paralyzeHeal: 'Средство От Паралича',
  fullHealStatus: 'Полное Исцеление',
  pokecure: 'Поки-Кюр',

  // ── PP Recovery (4) ──
  ether: 'Эфир',
  maxEther: 'Макс-Эфир',
  elixir: 'Эликсир',
  maxElixir: 'Макс-Эликсир',

  // ── Revival (5) ──
  revive: 'Оживление',
  maxRevive: 'Макс-Оживление',
  sacredAsh: 'Священная Зола',

  // ── Vitamins / EV items ──
  protein: 'Протеин',
  iron: 'Железо',
  calcium: 'Кальций',
  zinc: 'Цинк',
  carbos: 'Углеводы',
  hpUp: 'Увеличитель HP',
  ppUp: 'Увеличитель PP',
  ppMax: 'Макс-Увеличитель PP',
  rareCandy: 'Редкая Конфета',
  expCandyS: 'Конфета Опыта S',
  expCandyM: 'Конфета Опыта M',
  expCandyL: 'Конфета Опыта L',
  dynamaxCandy: 'Конфета Динамикса',
  abilityCapsule: 'Капсула Способности',
  abilityPatch: 'Патч Способности',
  bottleCap: 'Колпачок',
  goldBottleCap: 'Золотой Колпачок',
  natureMint: 'Мятная Конфета',
  friendGuard: 'Дружественная Защита',
  hpFeather: 'Перо HP',
  muscleFeather: 'Перо Мышц',
  resistFeather: 'Перо Защиты',
  geniusFeather: 'Перо Интеллекта',
  cleverFeather: 'Перо Мудрости',
  swiftFeather: 'Перо Скорости',
  freshStartMochi: 'Моти Нового Начала',
  admnMochi: 'Моти Администратора',
  chiefMochi: 'Моти Главного',
  chonkyMochi: 'Толстое Моти',
  healthMochi: 'Здоровое Моти',
  muscleMochi: 'Мышечное Моти',
  resistantMochi: 'Устойчивое Моти',
  smartMochi: 'Умное Моти',
  keenMochi: 'Острое Моти',
  nimbleMochi: 'Проворное Моти',

  // ── Evolution Stones (41) ──
  fireStone: 'Огненный Камень',
  waterStone: 'Водный Камень',
  thunderStone: 'Громовой Камень',
  leafStone: 'Лиственный Камень',
  moonStone: 'Лунный Камень',
  sunStone: 'Солнечный Камень',
  duskStone: 'Камень Сумерек',
  dawnStone: 'Камень Рассвета',
  shinyStone: 'Блестящий Камень',
  iceStone: 'Ледяной Камень',
  ovalStone: 'Овальный Камень',
  everStone: 'Вечный Камень',
  kingsRock: 'Скала Короля',
  metalCoat: 'Металлическое Покрытие',
  dragonScale: 'Драконья Чешуя',
  upGrade: 'Апгрейд',
  dubiousDisc: 'Сомнительный Диск',
  protector: 'Протектор',
  electirizer: 'Электризер',
  magmarizer: 'Магмаризер',
  razorFang: 'Острый Клык',
  razorClaw: 'Острый Коготь',
  reaperCloth: 'Ткань Жнеца',
  deepSeaTooth: 'Глубинный Зуб',
  deepSeaScale: 'Глубинная Чешуя',
  sachet: 'Саше',
  whippedDream: 'Взбитая Мечта',
  prismScale: 'Призматическая Чешуя',
  blackAugurite: 'Чёрный Авгурит',
  peatBlock: 'Торфяной Блок',
  auspiciousArmor: 'Благословенная Броня',
  maliciousArmor: 'Злобная Броня',
  linkingCord: 'Связующий Шнур',
  scrollOfDarkness: 'Свиток Тьмы',
  scrollOfWaters: 'Свиток Вод',
  syrupyApple: 'Сиропное Яблоко',
  unityChest: 'Сундук Единства',
  galaricaCuff: 'Галарский Браслет',
  galaricaWreath: 'Галарский Венок',
  metalAlloy: 'Металлический Сплав',
  sweetApple: 'Сладкое Яблоко',
  tartApple: 'Кислое Яблоко',
  crackedPot: 'Треснувший Горшок',
  chippedPot: 'Битый Горшок',
  masterworkTeacup: 'Искусная Чашка',
  masterpieceTeacup: 'Шедевральная Чашка',
  unremarkableTeacup: 'Обычная Чашка',

  // ── Training (8) ──
  expShare: 'Доля Опыта',
  luckyEgg: 'Счастливое Яйцо',
  amuletCoin: 'Монета-Амулет',
  smokeBall: 'Дымовой Шар',
  sootheBell: 'Колокол Успокоения',
  quickClaw: 'Быстрый Коготь',
  destinyKnot: 'Узел Судьбы',

  // ── Battle Items (held items, type boosters) ──
  abilityShield: 'Щит Способности',
  absorbBulb: 'Впитывающая Луковица',
  airBalloon: 'Воздушный Шар',
  assaultVest: 'Штурмовой Жилет',
  awakening: 'Пробуждение',
  bigRoot: 'Большой Корень',
  bindingBand: 'Связывающая Лента',
  blackGlasses: 'Чёрные Очки',
  blackSludge: 'Чёрная Грязь',
  brightPowder: 'Яркий Порошок',
  cellBattery: 'Элемент Питания',
  choiceBand: 'Банда Выбора',
  choiceScarf: 'Шарф Выбора',
  choiceSpecs: 'Очки Выбора',
  clarityHerb: 'Трава Ясности',
  covertCloak: 'Плащ Скрытности',
  dampRock: 'Влажный Камень',
  dragonFang: 'Клык Дракона',
  ejectButton: 'Кнопка Извлечения',
  ejectPack: 'Выбрасывающий Пакет',
  electricSeed: 'Электрическое Семя',
  escapePack: 'Пакет Побега',
  flameOrb: 'Пламенная Сфера',
  focusBand: 'Фокусная Повязка',
  focusSash: 'Фокусный Пояс',
  glitterPowder: 'Блестящий Порошок',
  grassySeed: 'Травяное Семя',
  gripClaw: 'Цепкий Коготь',
  griseousCore: 'Серый Кор',
  hardStone: 'Твёрдый Камень',
  heatRock: 'Горячий Камень',
  heavyDutyBoots: 'Тяжёлые Ботинки',
  iceRock: 'Ледяная Скала',
  ironBall: 'Железный Шар',
  laggingTail: 'Медлительный Хвост',
  leftovers: 'Остатки',
  lifeOrb: 'Сфера Жизни',
  lightBall: 'Световой Шар',
  lightClay: 'Лёгкая Глина',
  loadedDice: 'Нагруженные Кости',
  luminousMoss: 'Светящийся Мох',
  magnet: 'Магнит',
  mentalHerb: 'Ментальная Трава',
  metalPowder: 'Металлический Порошок',
  metronome: 'Метроном',
  miracleSeed: 'Чудо-Семя',
  mirrorHerb: 'Зеркальная Трава',
  mistySeed: 'Туманное Семя',
  muscleBand: 'Мышечная Повязка',
  mysticWater: 'Мистическая Вода',
  neverMeltIce: 'Нетающий Лёд',
  poisonBarb: 'Ядовитый Шип',
  powerHerb: 'Трава Силы',
  powerAnklet: 'Силовой Браслет',
  powerBand: 'Силовая Повязка',
  powerBelt: 'Силовой Пояс',
  powerBracer: 'Силовой Напульсник',
  powerLens: 'Силовая Линза',
  powerWeight: 'Силовой Утяжелитель',
  psychicSeed: 'Психическое Семя',
  quickPowder: 'Быстрый Порошок',
  redCard: 'Красная Карта',
  ringTarget: 'Кольцевая Мишень',
  rockyHelmet: 'Каменный Шлем',
  scopeLens: 'Линза Прицела',
  sharpBeak: 'Острый Клюв',
  shedShell: 'Сброшенная Оболочка',
  shellBell: 'Ракушечный Колокол',
  silverPowder: 'Серебряный Порошок',
  smoothRock: 'Гладкий Камень',
  softSand: 'Мягкий Песок',
  soulDew: 'Роса Души',
  spellTag: 'Метка Заклинания',
  stickyBarb: 'Липкий Шип',
  terrainExtender: 'Расширитель Террейна',
  thickClub: 'Толстая Дубина',
  throatSpray: 'Спрей Для Горла',
  toxicOrb: 'Токсичная Сфера',
  twistedSpoon: 'Гнутая Ложка',
  utilityUmbrella: 'Утилитарный Зонт',
  weaknessPolicy: 'Стратегия Слабости',
  whiteHerb: 'Белая Трава',
  wideLens: 'Широкая Линза',
  wiseGlasses: 'Очки Мудрости',
  zoomLens: 'Зум-Линза',
  snowball: 'Снежок',
  floatStone: 'Плавающий Камень',
  fullIncense: 'Полное Благовоние',
  luckIncense: 'Благовоние Удачи',
  oddIncense: 'Странное Благовоние',
  pureIncense: 'Чистое Благовоние',
  rockIncense: 'Каменное Благовоние',
  roseIncense: 'Розовое Благовоние',
  seaIncense: 'Морское Благовоние',
  waveIncense: 'Волновое Благовоние',
  charcoal: 'Древесный Уголь',
  silkScarf: 'Шёлковый Шарф',
  blackBelt: 'Чёрный Пояс',
  expertBelt: 'Пояс Эксперта',
  punchGlove: 'Боксёрская Перчатка',
  protectivePads: 'Защитные Накладки',
  safetyGoggles: 'Защитные Очки',
  roomService: 'Комнатный Сервис',
  blunderPolicy: 'Политика Ошибок',
  eviolite: 'Эвиолит',
  adrenalineOrb: 'Адреналиновая Сфера',
  berrySweet: 'Ягодная Сладость',
  cloverSweet: 'Клеверная Сладость',
  flowerSweet: 'Цветочная Сладость',
  loveSweet: 'Сердечная Сладость',
  ribbonSweet: 'Ленточная Сладость',
  starSweet: 'Звёздная Сладость',
  strawberrySweet: 'Клубничная Сладость',
  largeLeek: 'Большой Лук',
  luckPunch: 'Счастливый Удар',
  stick: 'Палка',
  adamantOrb: 'Адамантовая Сфера',
  lustrousOrb: 'Блестящая Сфера',
  griseousOrb: 'Серая Сфера',
  renegadeOrb: 'Сфера Отступника',
  // ── Mega Stones (kept English-like with "ite") ──
  // Actually keeping these English per user request — skip in map

  // ── Gems (18) ──
  bugGem: 'Самоцвет Жука',
  darkGem: 'Самоцвет Тьмы',
  dragonGem: 'Самоцвет Дракона',
  electricGem: 'Самоцвет Электричества',
  fairyGem: 'Самоцвет Феи',
  fightingGem: 'Самоцвет Боя',
  fireGem: 'Самоцвет Огня',
  flyingGem: 'Самоцвет Птицы',
  ghostGem: 'Самоцвет Призрака',
  grassGem: 'Самоцвет Травы',
  groundGem: 'Самоцвет Земли',
  iceGem: 'Самоцвет Льда',
  normalGem: 'Самоцвет Нормала',
  poisonGem: 'Самоцвет Яда',
  psychicGem: 'Самоцвет Психики',
  rockGem: 'Самоцвет Камня',
  steelGem: 'Самоцвет Стали',
  waterGem: 'Самоцвет Воды',

  // ── Plates (17) ──
  blankPlate: 'Пустая Пластина',
  dracoPlate: 'Пластина Дракона',
  dreadPlate: 'Пластина Ужаса',
  earthPlate: 'Земная Пластина',
  fistPlate: 'Кулачная Пластина',
  flamePlate: 'Пламенная Пластина',
  iciclePlate: 'Сосулечная Пластина',
  insectPlate: 'Насекомая Пластина',
  ironPlate: 'Железная Пластина',
  meadowPlate: 'Луговая Пластина',
  mindPlate: 'Пластина Разума',
  pixiePlate: 'Пластина Пикси',
  skyPlate: 'Небесная Пластина',
  splashPlate: 'Всплесковая Пластина',
  spookyPlate: 'Жуткая Пластина',
  stonePlate: 'Каменная Пластина',
  toxicPlate: 'Токсичная Пластина',
  zapPlate: 'Ударная Пластина',
  legendPlate: 'Легендарная Пластина',

  // ── Utility Items ──
  oldRod: 'Старая Удочка',
  goodRod: 'Хорошая Удочка',
  superRod: 'Супер-Удочка',
  repel: 'Рипел',
  superRepel: 'Супер-Рипел',
  maxRepel: 'Макс-Рипел',
  lure: 'Приманка',
  superLure: 'Супер-Приманка',
  maxLure: 'Макс-Приманка',
  pokeDoll: 'Поке-Кукла',
  pokeToy: 'Поке-Игрушка',
  fluffyTail: 'Пушистый Хвост',
  whiteFlute: 'Белая Флейта',
  blackFlute: 'Чёрная Флейта',
  escapeRope: 'Верёвка Спасения',
  direHit: 'Точный Удар',
  guardSpec: 'Гвард-Спек',
  xAccuracy: 'X Точность',
  xAttack: 'X Атака',
  xDefense: 'X Защита',
  xSpAtk: 'X Сп. Атака',
  xSpDef: 'X Сп. Защита',
  xSpeed: 'X Скорость',

  // ── Valuable Items ──
  nugget: 'Самородок',
  bigNugget: 'Большой Самородок',
  pearl: 'Жемчужина',
  bigPearl: 'Большая Жемчужина',
  pearlString: 'Жемчужная Нить',
  stardust: 'Звёздная Пыль',
  starPiece: 'Звёздный Осколок',
  cometShard: 'Осколок Кометы',
  balmMushroom: 'Бальзамовый Гриб',
  bigMushroom: 'Большой Гриб',
  tinyMushroom: 'Крошечный Гриб',
  rareBone: 'Редкая Кость',
  heartScale: 'Чешуя Сердца',
  goldLeaf: 'Золотой Лист',
  silverLeaf: 'Серебряный Лист',
  prettyFeather: 'Красивое Перо',
  redShard: 'Красный Осколок',
  blueShard: 'Синий Осколок',
  yellowShard: 'Жёлтый Осколок',
  greenShard: 'Зелёный Осколок',
  oddKeystone: 'Странный Краеугольный Камень',
  prettyWing: 'Красивое Крыло',

  // ── Crafting Items ──
  bachsFoodTin: 'Банка Корма Баха',
  tinOfBeans: 'Банка Бобов',
  bread: 'Хлеб',
  pasta: 'Макароны',
  curryPowder: 'Порошок Карри',
  coconutMilk: 'Кокосовое Молоко',
  instantNoodles: 'Мгновенная Лапша',
  precookedBurger: 'Готовый Бургер',
  fruitBunch: 'Фруктовый Набор',
  moomooCheese: 'Сыр Муму',
  whippedCream: 'Взбитые Сливки',
  jam: 'Варенье',
  apple: 'Яблоко',
  banana: 'Банан',
  orange: 'Апельсин',
  avocado: 'Авокадо',
  lettuce: 'Салат',
  tomato: 'Помидор',
  cherryTomato: 'Помидор Черри',
  cucumber: 'Огурец',
  pickle: 'Солёный Огурец',
  pepper: 'Перец',
  onion: 'Лук',
  greenBellPepper: 'Зелёный Болгарский Перец',
  rice: 'Рис',
  egg: 'Яйцо',
  smokePokeTail: 'Копчёный Хвост',
  herbalMeds: 'Травяное Лекарство',
  fierySalt: 'Огненная Соль',
  pureOil: 'Чистое Масло',
  spicyHerb: 'Пряная Трава',
  sushiRice: 'Рис Для Суши',
  wasabi: 'Васаби',
  honey: 'Мёд',
  brittleBones: 'Хрупкие Кости',
  mixedMushrooms: 'Смешанные Грибы',

  // ── Mulch (8) ──
  amazeMulch: 'Удивительная Мульча',
  boostMulch: 'Усиливающая Мульча',
  dampMulch: 'Влажная Мульча',
  gooeyMulch: 'Липкая Мульча',
  growthMulch: 'Растительная Мульча',
  richMulch: 'Богатая Мульча',
  stableMulch: 'Стабильная Мульча',
  surpriseMulch: 'Сюрпризная Мульча',

  // ── Currency ──
  credit: 'Кредит',

  // ── Custom items ──
  antiSputin: 'Антиспутин',
  train: 'Набор Тренировки',
  healingHerb: 'Лечебная Трава',

  // ── Hisui Balls (11) ──
  lafeatherBall: 'Перьевой Шар',
  lagigatonBall: 'Гигатонный Шар',
  lagreatBall: 'Отличный Шар',
  laheavyBall: 'Тяжёлый Шар',
  lajetBall: 'Реактивный Шар',
  laleadenBall: 'Свинцовый Шар',
  laoriginBall: 'Изначальный Шар',
  lapokeBall: 'Поке-Шар',
  lastrangeBall: 'Странный Шар',
  laultraBall: 'Ультра-Шар',
  lawingBall: 'Крылатый Шар',

  // ── Regional Specialty Items ──
  berryJuice: 'Ягодный Сок',
  sweetHeart: 'Сладкое Сердце',
  bigMalasada: 'Большая Маласада',
  lavaCookie: 'Лава-Печенье',
  lumioseGalette: 'Люмиозская Галета',
  oldGateau: 'Старинное Пирожное',
  pewterCrunchies: 'Пьютерские Хрустики',
  shalourSable: 'Шалорское Печенье',
  maxHoney: 'Макс-Мёд',

  // ── Stat Candies ──
  courageCandy: 'Конфета Храбрости',
  courageCandyL: 'Конфета Храбрости L',
  courageCandyXl: 'Конфета Храбрости XL',
  healthCandy: 'Конфета Здоровья',
  healthCandyL: 'Конфета Здоровья L',
  healthCandyXl: 'Конфета Здоровья XL',
  mightyCandy: 'Конфета Силы',
  mightyCandyL: 'Конфета Силы L',
  mightyCandyXl: 'Конфета Силы XL',
  quickCandy: 'Конфета Скорости',
  quickCandyL: 'Конфета Скорости L',
  quickCandyXl: 'Конфета Скорости XL',
  smartCandy: 'Конфета Ума',
  smartCandyL: 'Конфета Ума L',
  smartCandyXl: 'Конфета Ума XL',
  toughCandy: 'Конфета Выносливости',
  toughCandyL: 'Конфета Выносливости L',
  toughCandyXl: 'Конфета Выносливости XL',
  expCandyXl: 'Конфета Опыта XL',
  expCandyXs: 'Конфета Опыта XS',

  // ── Wings & Mochi ──
  cleverMochi: 'Моти Ловкости',
  cleverWing: 'Перо Ловкости',
  geniusMochi: 'Моти Гениальности',
  geniusWing: 'Перо Гениальности',
  healthWing: 'Перо HP',
  muscleWing: 'Перо Мышц',
  resistMochi: 'Моти Стойкости',
  resistWing: 'Перо Стойкости',
  swiftMochi: 'Моти Скорости',
  swiftWing: 'Перо Скорости',
  machoBrace: 'Браслет Мачо',

  // ── Other ──
  hiddenBone: 'Скрытая Кость',
  sunFlute: 'Солнечная Флейта',
  moonFlute: 'Лунная Флейта',
  revealGlass: 'Проявляющее Стекло',
  dnaSplicers: 'Сшиватель ДНК',
  prisonBottle: 'Бутылка Заточения',
  nLunarizer: 'N-Лунаризатор',
  nSolarizer: 'N-Соляризатор',
  rotorStarter: 'Роторный Стартер',
  fairyFeather: 'Перо Феи',
  laxIncense: 'Лакс-Благовоние',
  maxMushrooms: 'Макс-Грибы',
  passOrb: 'Орб Прохода',
  magoBerry: 'Ягода Маго',
  qualotBerry: 'Ягода Квалот',
  custapBerry: 'Ягода Кустап',
  jabocaBerry: 'Ягода Джабока',
  rowapBerry: 'Ягода Ровап',
  enigmaBerry: 'Ягода Энигма',
  micleBerry: 'Ягода Микл',
  keeBerry: 'Ягода Ки',
  marangaBerry: 'Ягода Маранга',
};

// ─── IDs that must keep their English nameRu ─────────────────────────────────
const KEEP_ENGLISH = new Set([
  // HMs
  'hm01','hm02','hm03','hm04','hm05','hm06','hm07','hm08',
]);
// TMs (tm00 - tm229)
for (let i = 0; i <= 229; i++) KEEP_ENGLISH.add(`tm${String(i).padStart(2, '0')}`);
// TRs (tr00 - tr99)
for (let i = 0; i <= 99; i++) KEEP_ENGLISH.add(`tr${String(i).padStart(2, '0')}`);
// Dynamax Crystals
for (let i = 1; i <= 9; i++) KEEP_ENGLISH.add(`dynamaxCrystalAnd${i}`);
for (let i = 1; i <= 99; i++) {
  KEEP_ENGLISH.add(`dynamaxCrystalCnc${String(i).padStart(3, '0')}`);
}
KEEP_ENGLISH.add('dynamaxCrystalDynamaxCrystal');

// ─── Custom IDs to keep exactly as written ──────────────────────────────────

// ─── Pokemon name → Russian transliteration for candy names ────────────────
const POKEMON_RU = {
  Abra: 'Абра', Aerodactyl: 'Аэродактиль', Aggron: 'Аггрон', Alakazam: 'Алаказам',
  Arbok: 'Арбок', Arcanine: 'Арканайн', Armaldo: 'Армальдо', Aron: 'Арон',
  Articuno: 'Артикуно', Azumarill: 'Азумарилл', Azurill: 'Азурилл', Bagon: 'Бейгон',
  BalToy: 'БалТой', Bayleef: 'Бейлиф', Beedrill: 'Бидрилл', Bellossom: 'Беллоссом',
  Bellsprout: 'Беллспраут', Blastoise: 'Бластойз', Blaziken: 'Блейзикен', Blissey: 'Блисси',
  Breloom: 'Брелум', Bulbasaur: 'Бульбазавр', Butterfree: 'Баттерфри', Cacnea: 'Какнея',
  Cacturne: 'Кактурн', Camerupt: 'Камерупт', Carnivine: 'Карнивайн', Carvanha: 'Карванха',
  Cascoon: 'Каскун', Castform: 'Кастформ', Celebi: 'Селеби', Chansey: 'Ченси',
  Charizard: 'Чаризард', Charmander: 'Чармандер', Charmeleon: 'Чармелеон', Chikorita: 'Чикорита',
  Chimchar: 'Чимчар', Chimecho: 'Чимечо', Chinchou: 'Чинчоу', Clamperl: 'Кламперл',
  Combusken: 'Комбаскен', Corsola: 'Корсола', Cradily: 'Крадили', Crobat: 'Кробат',
  Croconaw: 'Кроконав', Cubone: 'Кубон', Cyndaquil: 'Синдаквил', Delibird: 'Делиберд',
  Deoxys: 'Деоксис', Diglett: 'Диглетт', Ditto: 'Дитто', Dodrio: 'Додрио',
  Doduo: 'Додуо', Donphan: 'Донфан', Dragonair: 'Драгонэйр', Dragonite: 'Драгонайт',
  Drapion: 'Драпион', Dratini: 'Дратини', Dusclops: 'Дасклопс', Dusknoir: 'Даскнойр',
  Duskull: 'Даскулл', Electrode: 'Электрод', Eevee: 'Иви',
  Ekans: 'Эканс', Electabuzz: 'Электабазз', Electivire: 'Элективайр', Entei: 'Энтей',
  Espeon: 'Эспион', Exeggcute: 'Эксиггьют', Exeggutor: 'Эксигьютор', Exploud: 'Эксплауд',
  Farfetchd: 'Фарфетчд', Fearow: 'Фироу', Feebas: 'Фибос', Feraligatr: 'Фералигатр',
  Flareon: 'Флареон', Flygon: 'Флайгон', Forretress: 'Форретрасс', Fossilegg: 'Фоссилегг',
  Gardevoir: 'Гардевуар', Gastly: 'Гастли', Gengar: 'Генгар', Geodude: 'Геодуд',
  Girafarig: 'Гирафариг', Glalie: 'Глали', Gligar: 'Глайгар', Gliscor: 'Глайскор',
  Golbat: 'Голбат', Goldeen: 'Голдин', Golduck: 'Голдак', Golem: 'Голем',
  Gorebyss: 'Горбисс', Granbull: 'Гранбулл', Graveler: 'Гравелер', Grimer: 'Граймер',
  Groudon: 'Граудон', Grovyle: 'Гровайл', Growlithe: 'Гроулит', Grumpig: 'Грампиг',
  Gulpin: 'Галпин', Gyarados: 'Гьярадос', Happiny: 'Хэппини', Hariyama: 'Харияма',
  Haunter: 'Хонтер', Heracross: 'Геракросс', Hitmonchan: 'Хитмончан', Hitmonlee: 'Хитмонли',
  Hitmontop: 'Хитмонтоп', HoOh: 'Хо-Ох', Honchkrow: 'Хончкроу', Hoothoot: 'Хутхут',
  Hoppip: 'Хоппип', Horsea: 'Хорси', Houndoom: 'Хаундум', Houndour: 'Хаундур',
  Huntail: 'Хантейл', Hypno: 'Гипно', Igglybuff: 'Игглибафф', Illumise: 'Иллюмиз',
  Infernape: 'Инфернейп', Ivysaur: 'Айвизавр', Jigglypuff: 'Джигглипафф', Jirachi: 'Джирачи',
  Jolteon: 'Джолтеон', Jumpluff: 'Джамплафф', Jynx: 'Джинкс', Kabuto: 'Кабуто',
  Kabutops: 'Кабутопс', Kadabra: 'Кадабра', Kecleon: 'Кеклеон', Kingdra: 'Кингдра',
  Kingler: 'Кинглер', Koffing: 'Коффинг', Kyogre: 'Кайогр', Lairon: 'Лайрон',
  Lapras: 'Лапрас', Larvitar: 'Ларвитар', Latias: 'Латиас', Latios: 'Латиос',
  Ledian: 'Ледиан', Ledyba: 'Ледиба', Lickilicky: 'Ликилики', Lickitung: 'Ликитунг',
  Lileep: 'Лилип', Linoone: 'Линун', Lopunny: 'Лопанни', Lotad: 'Лотад',
  Loudred: 'Лаудред', Ludicolo: 'Лудиколо', Lugia: 'Лугия', Lunatone: 'Лунатон',
  Luvdisc: 'Лавдиск', Machamp: 'Мачамп', Machoke: 'Мачок', Machop: 'Мачоп',
  Magby: 'Магби', MagoBerry: 'МагоБерри', Magikarp: 'Маджикарп', Magmar: 'Магмар',
  Magmortar: 'Магмортар', Magnemite: 'Магнемайт', Magneton: 'Магнетон', Mamoswine: 'Мамосвайн',
  Manaphy: 'Манафи', Mantine: 'Мантин', Mantyke: 'Мантайк', Marill: 'Марилл',
  Marowak: 'Маровак', Marshtomp: 'Марштомп', Masquerain: 'Маскерейн', Mawile: 'Мавайл',
  Medicham: 'Медичам', Meditite: 'Медитайт', Meganium: 'Меганиум', Meowth: 'Мяут',
  Metagross: 'Метагросс', Metang: 'Метанг', Mew: 'Мью', Mewtwo: 'Мьюту',
  Mightyena: 'Майтиена', Milotic: 'Милотик', Miltank: 'Милтанк', Minun: 'Минун',
  Misdreavus: 'Мисдреавус', Mismagius: 'Мисмагиус', Moltres: 'Молтрес', Monferno: 'Монферно',
  MrMime: 'Мистер Майм', Mudkip: 'Мадкип', Muk: 'Мак', Munchlax: 'Манчлакс',
  Natu: 'Нату', Nidoking: 'Нидокинг', Nidoqueen: 'Нидоквин', NidoranF: 'НидоринF',
  NidoranM: 'НидоринM', Nidorina: 'Нидорина', Nidorino: 'Нидорино', Nincada: 'Нинкада',
  Ninjask: 'Нинджаск', Noctowl: 'Ноктаул', Nosepass: 'Ноуспасс', Numel: 'Нумел',
  Nuzleaf: 'Назлиф', Octillery: 'Октиллери', Oddish: 'Оддиш', Omanyte: 'Оманайт',
  Omastar: 'Омастар', Onix: 'Оникс', Pachirisu: 'Пачирису', Palkia: 'Палкия',
  Paras: 'Парас', Parasect: 'Парасект', Pelipper: 'Пелиппер', Persian: 'Персиан',
  Phanpy: 'Фанпи', Phione: 'Фион', Pichu: 'Пичу', Pidgeot: 'Пиджеот',
  Pidgeotto: 'Пиджеотто', Pidgey: 'Пиджи', Pikachu: 'Пикачу', Piloswine: 'Пайлосвайн',
  Pineco: 'Пайнеко', Pinsir: 'Пинсир', Piplup: 'Пиплуп', Plusle: 'Пласл',
  Politoed: 'Политоэд', Poliwag: 'Поливаг', Poliwhirl: 'Поливирл', Poliwrath: 'Поливрат',
  Ponyta: 'Понита', Poochyena: 'Пучиена', Porygon: 'Поригон', PorygonZ: 'Поригон-Z',
  Porygon2: 'Поригон2', Primeape: 'Праймейп', Prinplup: 'Принплуп', Probopass: 'Пробопасс',
  Psyduck: 'Псайдак', Pupitar: 'Пьюпитар', Quagsire: 'Квагсайр', Quilava: 'Квилава',
  Qwilfish: 'Квилфиш', Raichu: 'Райчу', Raikou: 'Райкоу', Ralts: 'Ралтс',
  Rampardos: 'Рампардос', Rapidash: 'Рапидаш', Raticate: 'Ратикейт', Rattata: 'Раттата',
  Rayquaza: 'Райкваза', Regice: 'Реджайс', Regigigas: 'Реджигигас', Regirock: 'Реджирок',
  Registeel: 'Реджистил', Relicanth: 'Реликант', Rhydon: 'Райдон', Rhyhorn: 'Райхорн',
  Rhyperior: 'Райпериор', Roselia: 'Розелия', Roserade: 'Розерейд', Rotom: 'Ротом',
  Salamence: 'Саламенс', Sandshrew: 'Сэндшрю', Sandslash: 'Сэндслэш', Sceptile: 'Септайл',
  Scizor: 'Сизор', Scyther: 'Сайтер', Seadra: 'Сидра', Seaking: 'Сикинг',
  Sealeo: 'Сиалео', Seedot: 'Сидот', Seel: 'Сил', Shelgon: 'Шелгон',
  Shellder: 'Шеллдер', Shiftry: 'Шифтри', Shinx: 'Шинкс', Shroomish: 'Шрумиш',
  Shuckle: 'Шакл', Shuppet: 'Шаппет', Silcoon: 'Силкун', Skarmory: 'Скармори',
  Skiploom: 'Скиплум', Skitty: 'Скитти', Slaking: 'Слейкинг', Slakoth: 'Слейкот',
  Slowbro: 'Слоубро', Slowking: 'Слоукинг', Slowpoke: 'Слоупок', Slugma: 'Слагма',
  Smeargle: 'Смиргл', Sneasel: 'Снизел', Snorlax: 'Снорлакс', Snorunt: 'Снорант',
  Snover: 'Сновер', Solrock: 'Солрок', Spearow: 'Спироу', Spheal: 'Сфил',
  Spinda: 'Спинда', Spoink: 'Споинк', Squirtle: 'Сквиртл', Stantler: 'Стантлер',
  Staraptor: 'Стараптор', Staravia: 'Старавия', Starly: 'Старли', Steelix: 'Стиликс',
  Stunky: 'Станки', Sudowoodo: 'Судовудо', Suicune: 'Суйкун', Sunflora: 'Санфлора',
  Sunkern: 'Санкерн', Surskit: 'Сурскит', Swablu: 'Сваблу', Swalot: 'Сваллот',
  Swampert: 'Свамперт', Sweedle: 'Свидл', Swellow: 'Свеллоу', Swing: 'Свинг',
  Tangela: 'Танжела', Tangrowth: 'Танграут', Tauros: 'Таурос', Teddiursa: 'Теддиурса',
  Tentacruel: 'Тентакруэл', Tentacool: 'Тентакул', Togekiss: 'Тогекисс', Togepi: 'Тогепи',
  Togetic: 'Тогетик', Torchic: 'Торчик', Torkoal: 'Торкоал', Torterra: 'Тортерра',
  Totodile: 'Тотодайл', Trapinch: 'Трапинч', Treecko: 'Трико', Tropius: 'Тропиус',
  Turtwig: 'Тертвиг', Tyranitar: 'Тиранитар', Typhlosion: 'Тайфложион',
  Umbreon: 'Амбреон', Unown: 'Ауноун', Ursaring: 'Урсаринг', Vaporeon: 'Вапореон',
  Venomoth: 'Веномот', Venonat: 'Венонат', Venusaur: 'Венузавр', Vespiquen: 'Веспиквин',
  Vibrava: 'Вибрава', Victreebel: 'Виктрибел', Vigoroth: 'Вигорота', Vileplume: 'Вайлплум',
  Volbeat: 'Волбит', Volcarona: 'Волкарона', Voltorb: 'Волторб', Vullaby: 'Вуллаби',
  Walrein: 'Уолрейн', Wartortle: 'Вартортл', Weavile: 'Вивайл', Weedle: 'Видл',
  Weepinbell: 'Випинбелл', Weezing: 'Визинг', Whiscash: 'Вискаш', Wigglytuff: 'Вигглитафф',
  Wingull: 'Вингулл', Wobbuffet: 'Воббафет', Wooper: 'Вупер', Wurmple: 'Вумпл',
  Wynaut: 'Вайнот', Xatu: 'Ксату', Yanma: 'Янма', Yanmega: 'Янмега',
  Zapdos: 'Запдос', Zigzagoon: 'Зигзагун', Zubat: 'Зубат',

  // Missing Pokemon for candy names
  Caterpie: 'Катерпи', Clefairy: 'Клефейри', Drowzee: 'Дроузи',
  Kangaskhan: 'Кенгасхан', Krabby: 'Крабби', Mankey: 'Манки',
  Meltan: 'Мелтан', Staryu: 'Стари', Vulpix: 'Валпикс',
};

// ─── Process ─────────────────────────────────────────────────────────────────
const lines = content.split('\n');
const newLines = [];
let changed = 0, skipped = 0, patterns = 0;
let currentId = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i];

  // Extract current item id from anywhere on the line
  const idMatch = line.match(/\bid:\s*'([^']+)'/);
  if (idMatch) currentId = idMatch[1];

  // Skip lines without nameRu field entirely
  if (!line.includes("nameRu:")) {
    newLines.push(line);
    continue;
  }
  if (!currentId) {
    newLines.push(line);
    continue;
  }

  // Extract current nameRu value from anywhere on the line
  const nameMatch = line.match(/nameRu:\s*'([^']*)'/);
  if (!nameMatch) {
    newLines.push(line);
    continue;
  }
  const currentName = nameMatch[1];

  // ── 1. Custom items: keep as-is (superDarkBall, antiSputin, train) ──
  if (currentId === 'superDarkBall' || currentId === 'antiSputin' || currentId === 'train') {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 2. Technical items: keep English ──
  if (KEEP_ENGLISH.has(currentId)) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 3. Mints: keep English ("Xxx Mint") ──
  if (/^[a-z]+Mint$/.test(currentId)) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 5. Check explicit translation map ──
  if (T[currentId]) {
    line = line.replace(/nameRu:\s*'[^']*'/, `nameRu: '${T[currentId]}'`);
    changed++;
    newLines.push(line);
    continue;
  }

  // ── 6. Mega Stones: keep English ──
  if (/^[a-z]+ite$/.test(currentId) && currentName.length > 0 && /^[A-Z]/.test(currentName[0])) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 7. Z-crystals: keep English via id ──
  if (currentId.endsWith('iumZ') && !T[currentId]) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 8. Drives: keep English (Burn Drive, Chill Drive, etc) ──
  if (/^(burn|chill|douse|shock)Drive$/.test(currentId)) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 9. Berry pattern: "Xxx Berry" → "Ягода Xxx" — translate if still English ──
  const berryEn = currentName.match(/^(\w+)\s*Berry$/);
  if (berryEn && !/[а-яё]/i.test(currentName)) {
    const berryNameRu = ({
      Qualot: 'Квалот', Custap: 'Кустап', Jaboca: 'Джабока',
      Rowap: 'Ровап', Micle: 'Микл', Enigma: 'Энигма',
      Kee: 'Ки', Maranga: 'Маранга', Chople: 'Чопл',
      Wiki: 'Вики', Starf: 'Старф', Spelon: 'Спелон',
      Pamtre: 'Памтре', Watmel: 'Ватмел', Durin: 'Дьюрин',
      Belue: 'Белу', Cornn: 'Корн', Magost: 'Магост',
      Rabuta: 'Рабута', Nomel: 'Номел',
    })[berryEn[1]] || berryEn[1];
    line = line.replace(/nameRu:\s*'[^']*'/, `nameRu: 'Ягода ${berryNameRu}'`);
    patterns++;
    newLines.push(line);
    continue;
  }

  // ── 10. Candy pattern: Pokemon-specific ──
  const candyEn = currentName.match(/^(\w+) Candy$/);
  if (candyEn && !/[а-яё]/i.test(currentName)) {
    const pokeName = candyEn[1];
    const ruName = POKEMON_RU[pokeName];
    if (ruName) {
      line = line.replace(/nameRu:\s*'[^']*'/, `nameRu: 'Конфета ${ruName}'`);
      patterns++;
      newLines.push(line);
      continue;
    }
  }

  // ── 11. Already Russian: keep ──
  if (/[а-яА-ЯёЁ]/.test(currentName)) {
    newLines.push(line);
    skipped++;
    continue;
  }

  // ── 12. English but no translation: skip ──
  newLines.push(line);
  skipped++;
}

writeFileSync(SRC, newLines.join('\n'), 'utf-8');
console.log(`\n=== Translation Results ===`);
console.log(`Applied fix-ups:  ${fixedCount}`);
console.log(`Map translations: ${changed}`);
console.log(`Pattern matches:  ${patterns}`);
console.log(`Skipped (keep):   ${skipped}`);
console.log(`Total lines:      ${lines.length}`);
console.log(`\n✅ Done! Written to ${SRC}`);
