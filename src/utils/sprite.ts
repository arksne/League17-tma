// Sprite and type-color utilities — no dependency on main.js or core.js

import { ITEMS } from '../data/items.js';

const TYPE_COLORS = {
  normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
  grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
  ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
  rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705898',
  steel: '#B7B7CE', fairy: '#D685AD', stellar: '#40b4a8', unknown: '#68a090'
};

export function getTypeColor(type) {
  return TYPE_COLORS[type] || '#777';
}

export function getTypeGradient(types) {
  if (!types || types.length === 0) return 'radial-gradient(circle at 50% 50%, #1a3050 0%, #0d1b2a 100%)';
  const c1 = getTypeColor(types[0].type.name);
  const c2 = types.length > 1 ? getTypeColor(types[1].type.name) : c1;
  return `radial-gradient(circle at 50% 50%, ${c1}dd 0%, ${c1}55 50%, ${c2}55 80%, ${c2}dd 100%)`;
}

export function getSpriteUrl(mon) {
  const api = mon.apiData || mon;
  const isShiny = mon.isShiny || api.isShiny;
  if (isShiny) {
    return api.sprites?.other?.['official-artwork']?.front_shiny
        || api.sprites?.front_shiny
        || api.sprites?.other?.['official-artwork']?.front_default
        || api.sprites?.front_default
        || '';
  }
  return api.sprites?.other?.['official-artwork']?.front_default
      || api.sprites?.front_default
      || '';
}

export function setTypeBg(id, types) {
  const el = document.getElementById(id);
  if (el && types) {
    el.style.background = getTypeGradient(types);
  }
}

const ITEM_SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/';
const LOCAL_ITEM_SPRITE_BASE = '/assets/items/';
const ITEM_SPRITE_MAP = {
  // Balls
  pokeball: 'poke-ball.png',
  greatBall: 'great-ball.png',
  ultraBall: 'ultra-ball.png',
  masterBall: 'master-ball.png',
  quickBall: 'quick-ball.png',
  friendBall: 'friend-ball.png',
  loveBall: 'love-ball.png',
  duskBall: 'dusk-ball.png',
  timerBall: { local: 'P78.png' },
  cloneBall: { local: 'klonbol.png' },
  centerBall: { local: 'ball7.png' },
  darkBall: { local: '72.png' },
  // Healing
  potion: 'potion.png',
  superPotion: 'super-potion.png',
  fullRestore: 'full-restore.png',
  // Status cure
  antidote: 'antidote.png',
  antiparalyze: 'paralyze-heal.png',
  energyDrink: 'awakening.png',
  fireExtinguisher: 'burn-heal.png',
  antiSputin: { local: '13.gif' },
  healingHerb: { local: '173.gif' },
  // PP recovery
  weakElixir: 'ether.png',
  elixir: 'elixir.png',
  strongElixir: 'max-elixir.png',
  // Vitamins
  vitamin: 'hp-up.png',
  protein: 'protein.png',
  iron: 'iron.png',
  calcium: 'calcium.png',
  zinc: 'zinc.png',
  carbos: 'carbos.png',
  // Training
  train: { local: 'train.gif' },
  weaken: { local: 'oslab.png' },
  candy: 'rare-candy.png',
  // Evolution stones
  evolutionStone: { local: '136.gif' },
  fireStone: 'fire-stone.png',
  waterStone: 'water-stone.png',
  leafStone: 'leaf-stone.png',
  thunderStone: 'thunder-stone.png',
  moonStone: 'moon-stone.png',
  sunStone: 'sun-stone.png',
  shinyStone: 'shiny-stone.png',
  duskStone: 'dusk-stone.png',
  iceStone: 'ice-stone.png',
  dawnStone: 'dawn-stone.png',
  everstone: 'everstone.png',
  // Evolvers
  deepSeaTooth: 'deep-sea-tooth.png',
  deepSeaScale: 'deep-sea-scale.png',
  dragonScale: 'dragon-scale.png',
  upGrade: 'up-grade.png',
  // Berries
  sitrusBerry: 'sitrus-berry.png',
  oranBerry: 'oran-berry.png',
  lumBerry: 'lum-berry.png',
  chestoBerry: 'chesto-berry.png',
  rawstBerry: 'rawst-berry.png',
  cheriBerry: 'cheri-berry.png',
  pechaBerry: 'pecha-berry.png',
  aspearBerry: 'aspear-berry.png',
  leppaBerry: 'leppa-berry.png',
  persimBerry: 'persim-berry.png',
  figyBerry: { local: 'figy-berry.png' },
  wikiBerry: { local: 'wiki-berry.png' },
  // Battle items
  leftovers: 'leftovers.png',
  ppUp: 'pp-up.png',
  luckyEgg: 'lucky-egg.png',
  expertBelt: 'expert-belt.png',
  bigRoot: 'big-root.png',
  assaultVest: 'assault-vest.png',
  eviolite: { local: 'Evolit.png' },
  choiceBand: 'choice-band.png',
  choiceScarf: 'choice-scarf.png',
  choiceSpecs: 'choice-specs.png',
  thickClub: 'thick-club.png',
  leek: { local: 'Item132.png' },
  flameOrb: 'flame-orb.png',
  toxicOrb: 'toxic-orb.png',
  band: 'focus-band.png',
  xAttack: 'x-attack.png',
  xDefense: 'x-defense.png',
  xSpAttack: 'x-sp-atk.png',
  xSpDefense: 'x-sp-def.png',
  xSpeed: 'x-speed.png',
  xAccuracy: 'x-accuracy.png',
  // TMs
  tm: 'tm-normal.png',
  // Accessories
  blackGlasses: 'blackglasses.png',
  twistedSpoon: 'twistedspoon.png',
  sharpBeak: 'sharp-beak.png',
  luckyAmulet: { local: '88.png' }, // keep local fallback
  airBalloon: 'air-balloon.png',
  bandage: { local: '85.png' },
  // Held items missing
  metalCoat: 'metal-coat.png',
  kingsRock: 'kings-rock.png',
  razorClaw: 'razor-claw.png',
  razorFang: 'razor-fang.png',
  protector: 'protector.png',
  electirizer: 'electirizer.png',
  magmarizer: 'magmarizer.png',
  reaperCloth: 'reaper-cloth.png',
  dubiousDisc: 'dubious-disc.png',
  prismScale: 'prism-scale.png',
  whippedDream: 'whipped-dream.png',
  sachet: 'sachet.png',
  // Battle items
  expShare: 'exp-share.png',
  luckyEgg: 'lucky-egg.png',
  sootheBell: 'soothe-bell.png',
  amuletCoin: 'amulet-coin.png',
  // Berries (additional)
  occaBerry: 'occa-berry.png',
  passhoBerry: 'passho-berry.png',
  wacanBerry: 'wacan-berry.png',
  rindoBerry: 'rindo-berry.png',
  yacheBerry: 'yache-berry.png',
  chopleBerry: 'chople-berry.png',
  kebiaBerry: 'kebia-berry.png',
  shucaBerry: 'shuca-berry.png',
  cobaBerry: 'coba-berry.png',
  payapaBerry: 'payapa-berry.png',
  tangaBerry: 'tanga-berry.png',
  chartiBerry: 'charti-berry.png',
  kasibBerry: 'kasib-berry.png',
  habanBerry: 'haban-berry.png',
  colburBerry: 'colbur-berry.png',
  babiriBerry: 'babiri-berry.png',
  chilanBerry: 'chilan-berry.png',
  roseliBerry: 'roseli-berry.png',
  // Quest items from PokeAPI
  oldAmber: 'old-amber.png',
  domeFossil: 'dome-fossil.png',
  helixFossil: 'helix-fossil.png',
  clawFossil: 'claw-fossil.png',
  rootFossil: 'root-fossil.png',
  skullFossil: 'skull-fossil.png',
  armorFossil: 'armor-fossil.png',
  coverFossil: 'cover-fossil.png',
  plumeFossil: 'plume-fossil.png',
  jawFossil: 'jaw-fossil.png',
  sailFossil: 'sail-fossil.png',
  // Type plates
  flamePlate: 'flame-plate.png',
  splashPlate: 'splash-plate.png',
  zapPlate: 'zap-plate.png',
  meadowPlate: 'meadow-plate.png',
  iciclePlate: 'icicle-plate.png',
  fistPlate: 'fist-plate.png',
  toxicPlate: 'toxic-plate.png',
  earthPlate: 'earth-plate.png',
  skyPlate: 'sky-plate.png',
  mindPlate: 'mind-plate.png',
  insectPlate: 'insect-plate.png',
  stonePlate: 'stone-plate.png',
  ghostPlate: 'ghost-plate.png',
  dragonPlate: 'dragon-plate.png',
  darkPlate: 'dark-plate.png',
  ironPlate: 'iron-plate.png',
  pixiePlate: 'pixie-plate.png',
  // Key items / misc
  bicycle: 'bicycle.png',
  oldRod: 'old-rod.png',
  goodRod: 'good-rod.png',
  superRod: 'super-rod.png',
  itemFinder: 'itemfinder.png',
  townMap: 'town-map.png',
  coinCase: 'coin-case.png',
  cleanseTag: 'cleanse-tag.png',
  // === Wiki-mapped items (from league17.ru wiki) ===
  // Balls
  трансбол: { local: '16.png' },
  монстроболовичка: { local: '15.png' },
  фастбол: { local: '6.png' },
  нестбол: { local: '12.png' },
  лайтбол: { local: '14.png' },
  багбол: { local: '101.png' },
  блэкбол: { local: '102.png' },
  драгонбол: { local: '103.png' },
  электробол: { local: '104.png' },
  файтбол: { local: '105.png' },
  фаербол: { local: '106.png' },
  флайбол: { local: '107.png' },
  гостбол: { local: '108.png' },
  грасбол: { local: '109.png' },
  граундбол: { local: '110.png' },
  айсбол: { local: '111.png' },
  нормобол: { local: '112.png' },
  токсикбол: { local: '113.png' },
  псибол: { local: '114.png' },
  стоунбол: { local: '115.png' },
  стилбол: { local: '116.png' },
  дайвбол: { local: '117.png' },
  фейбол: { local: '118.png' },
  монстроболраконьера: { local: '30.png' },
  люксбол: { local: '5.png' },
  // Battle items
  пушистыйвост: { local: '19.png' },
  повязкачищения: { local: '66.png' },
  колокольчик: { local: '45.png' },
  xАтака: { local: '54.png' },
  xЗащита: { local: '55.png' },
  xСкорость: { local: '58.png' },
  xТочность: { local: '53.png' },
  xЛовкость: { local: '56.png' },
  батарейка: { local: '226.png' },
  метроном: { local: '64.png' },
  эволит: { local: '223.png' },
  спасательныйилет: { local: '222.png' },
  шипастаяаска: { local: '221.png' },
  зажигалка: { local: '215.png' },
  крепкийрех: { local: '220.png' },
  цепкийрюк: { local: '218.png' },
  лечебныйорень: { local: '217.png' },
  пружинаскоряющая: { local: '214.png' },
  резиновыеапоги: { local: '212.png' },
  монокль: { local: '157.png' },
  защитныеерчатки: { local: '156.png' },
  повязкарабрости: { local: '154.png' },
  пружинапециальная: { local: '213.png' },
  уплотнительочвы: { local: '155.png' },
  инъектор: { local: '86.png' },
  банджи: { local: '95.png' },
  семямеха: { local: '101.png' },
  кристаллудельены: { local: '98.png' },
  повязкаилы: { local: '158.png' },
  'сныть-трава': { local: '96.png' },
  прозрачныймулет: { local: '361.png' },
  липкаяолючка: { local: '365.png' },
  игральныеости: { local: '364.png' },
  зонт: { local: '363.png' },
  чёрныйлащ: { local: '362.png' },
  броня: { local: '32.png' },
  // Evolution items
  каменьумрака: { local: '247.png' },
  каменьассвета: { local: '253.png' },
  протектор: { local: '302.png' },
  магмарайзер: { local: '305.png' },
  электрайзер: { local: '304.png' },
  кусоккани: { local: '307.png' },
  режущийоготь: { local: '303.png' },
  режущийлык: { local: '306.png' },
  перламутроваяешуя: { local: '358.png' },
  флаконухов: { local: '405.png' },
  пироженка: { local: '404.png' },
  гормонестостерон: { local: '61.png' },
  гормонстроген: { local: '62.png' },
  цветокраверисо: { local: '164.png' },
  посохокианы: { local: '828.png' },
  белыйаменьракона: { local: '87.png' },
  черныйаменьракона: { local: '88.png' },
  звериныйатализатор: { local: '99.png' },
  // Quest items
  чучелоплешера: { local: '261.png' },
  паутинарахнуса: { local: '262.png' },
  ядитонстра: { local: '265.png' },
  маска: { local: '267.png' },
  перецили: { local: '271.png' },
  веточка: { local: '272.png' },
  четырехлистныйлевер: { local: '273.png' },
  виноград: { local: '274.png' },
  мед: { local: '275.png' },
  старыеоты: { local: '372.png' },
  стараянига: { local: '283.png' },
  обрывокекста: { local: '284.png' },
  обрывокневника: { local: '292.png' },
  древнийанускрипт: { local: '310.png' },
  cтатуэткаормеессиа: { local: '327.png' },
  глаз: { local: '300.png' },
  кукластерелла: { local: '165.png' },
  куклаезлаз: { local: '169.png' },
  порваннаяукла: { local: '170.png' },
  конверт: { local: '181.png' },
  самодельнаяарта: { local: '182.png' },
  расшифрованнаяарта: { local: '189.png' },
  перо: { local: '188.png' },
  чёрныйостюм: { local: '190.png' },
  наручныеасы: { local: '191.png' },
  краснаяфера: { local: '178.png' },
  блестящаяешуйка: { local: '1537.png' },
  корарупня: { local: '1508.png' },
  экстрактлезсселиды: { local: '863.png' },
  параднаяента: { local: '708.png' },
  инструменты: { local: '195.png' },
  гайка: { local: '196.png' },
  винтик: { local: '230.png' },
  сломанныйубликатлюча: { local: '197.png' },
  дубликатлюча: { local: '198.png' },
  брелокмблемой: { local: '199.png' },
  осколок: { local: '234.png' },
  старыйемлянойначок: { local: '243.png' },
  сломаннаяотокамера: { local: '238.png' },
  фотокамера: { local: '239.png' },
  таинственныймулеттарушки: { local: '244.png' },
  кулон: { local: '245.png' },
  любовноеисьмо: { local: '346.png' },
  цветокхмиадии: { local: '347.png' },
  инкрустированнаяорона: { local: '348.png' },
  полено: { local: '349.png' },
  игрушечныйеч: { local: '350.png' },
  перороздун: { local: '351.png' },
  костюмринца: { local: '352.png' },
  кукларинца: { local: '353.png' },
  изысканныйукет: { local: '354.png' },
  монстроболулканозавром: { local: '338.png' },
  значокигинергии: { local: '371.png' },
  солярис: { local: '391.png' },
  таймер: { local: '228.png' },
  монстроболантиром: { local: '357.png' },
  еловаяетка: { local: '369.png' },
  волшебнаяыль: { local: '433.png' },
  склянкарасками: { local: '4.png' },
  сфераалансалектричества: { local: '716.png' },
  сфераалансаагии: { local: '719.png' },
  сфераалансарироды: { local: '717.png' },
  сфераалансаоды: { local: '718.png' },
  каучуковаяиана: { local: '438.png' },
  обручальноеольцо: { local: '439.png' },
  монстроболрыконом: { local: '440.png' },
  мерцающаяыль: { local: '1555.png' },
  ягоды: { local: '432.png' },
  ключ: { local: '177.png' },
  лазерныйиск: { local: '301.png' },
  окоироздания: { local: '443.png' },
  осколокеркала: { local: '6.png' },
  зеркало: { local: '399.png' },
  пиратскийлаг: { local: '359.png' },
  паутинаотля: { local: '826.png' },
  осколкиилверсита: { local: '825.png' },
  статуэткапамятныйой: { local: '820.png' },
  улучшеннаятатуэткапамятныйой: { local: '821.png' },
  набореченья: { local: '851.png' },
  волшебныймурит: { local: '854.png' },
  голубойоралл: { local: '849.png' },
  деревянныйеч: { local: '853.png' },
  золотойветок: { local: '862.png' },
  хрустальныйар: { local: '880.png' },
  // Crafting
  окаменелостьпрутти: { local: '138.png' },
  // Other items
  craftCottonCandy: { local: '436.png' },
  разовыйропускитомник: { local: '290.png' },
  наборонстроболов: { local: '392.png' },
  наборитаминов: { local: '394.png' },
  улучшенныйаборонстроболов: { local: '393.png' },
  улучшенныйаборитаминов: { local: '395.png' },
  случайнаяарта: { local: '289.png' },
  золотойилет: { local: '715.png' },
  одежда: { local: '501.png' },
  технокейс: { local: '3_0.png' },
  ламповыйранзистор: { local: '381.png' },
  жетонльманаха: { local: '453.png' },
  секретныйщикрены: { local: '373.png' },
  ключщикарены: { local: '403.png' },
  ящикодземелья: { local: '680.png' },
  ключщикаодземелий: { local: '681.png' },
  лицензияатлов: { local: '444.png' },
  // Rewards
  золотойубокигиемпионов: { local: '201.png' },
  серебряныйубокигиемпионов: { local: '202.png' },
  бронзовыйубокигиемпионов: { local: '203.png' },
  золотойубокладшейигиемпионов: { local: '21_31.png' },
  золотойубоктаршейигиемпионов: { local: '21_21.png' },
  серебряныйубокладшейигиемпионов: { local: '21_32.png' },
  серебряныйубоктаршейигиемпионов: { local: '21_22.png' },
  бронзовыйубокладшейигиемпионов: { local: '21_33.png' },
  бронзовыйубоктаршейигиемпионов: { local: '21_23.png' },
  значокерифа: { local: '343.png' },
  кубокопкоординатора: { local: '334.png' },
  лентаастеркоординатора: { local: '1.png' },
  лентапытногооординатора: { local: '2.png' },
  лентародвинутогооординатора: { local: '3.png' },
  орденащитникажото: { local: '660.png' },
  орденстроваадежды: { local: '661.png' },
  орденащитникаархолла: { local: '662.png' },
  орденащитникаливина: { local: '663.png' },
  орденащитникарёхородов: { local: '664.png' },
  драгоценнаятатуэтка: { local: '5.png' },
  драгоценнаятатуэткаеникса: { local: '6.png' },
  драгоценнаятатуэткаысшегоровня: { local: '7.png' },
  драгоценнаятатуэтка2: { local: '8.png' },
  драгоценнаятатуэткаlack: { local: '9.png' },
  драгоценнаятатуэткаed: { local: '10.png' },
  драгоценнаятатуэткаreen: { local: '11.png' },
  тренерода: { local: '640.png' },
  символомощи: { local: '380.png' },
  // Training
  наборслабления: { local: '331.png' },
  наборренировкиичный: { local: '332.png' },
  // === Drop items (from drops.js) ===
  absorbBulb: 'absorb-bulb.png',
  balmMushroom: 'balm-mushroom.png',
  berryJuice: 'berry-juice.png',
  bigMushroom: 'big-mushroom.png',
  bigNugget: 'big-nugget.png',
  bigPearl: 'big-pearl.png',
  blackBelt: 'black-belt.png',
  blackSludge: 'black-sludge.png',
  brightPowder: 'bright-powder.png',
  cellBattery: 'cell-battery.png',
  charcoal: 'charcoal.png',
  cometShard: 'comet-shard.png',
  dampRock: 'damp-rock.png',
  dragonFang: 'dragon-fang.png',
  electricSeed: 'electric-seed.png',
  focusBand: 'focus-band.png',
  grassySeed: 'grassy-seed.png',
  gripClaw: 'grip-claw.png',
  hardStone: 'hard-stone.png',
  ironBall: 'iron-ball.png',
  laggingTail: 'lagging-tail.png',
  lifeOrb: 'life-orb.png',
  lightBall: 'light-ball.png',
  lightClay: 'light-clay.png',
  luckyPunch: 'lucky-punch.png',
  luminousMoss: 'luminous-moss.png',
  magnet: 'magnet.png',
  maxRevive: 'max-revive.png',
  mentalHerb: 'mental-herb.png',
  metalPowder: 'metal-powder.png',
  metronome: 'metronome.png',
  miracleSeed: 'miracle-seed.png',
  mistySeed: 'misty-seed.png',
  moomooMilk: 'moomoo-milk.png',
  mysticWater: 'mystic-water.png',
  neverMeltIce: 'never-melt-ice.png',
  nugget: 'nugget.png',
  ovalStone: 'oval-stone.png',
  pearl: 'pearl.png',
  poisonBarb: 'poison-barb.png',
  powerHerb: 'power-herb.png',
  prettyWing: 'pretty-wing.png',
  psychicSeed: 'psychic-seed.png',
  quickClaw: 'quick-claw.png',
  quickPowder: 'quick-powder.png',
  rareBone: 'rare-bone.png',
  revive: 'revive.png',
  sacredAsh: 'sacred-ash.png',
  shedShell: 'shed-shell.png',
  silkScarf: 'silk-scarf.png',
  silverPowder: 'silver-powder.png',
  smokeBall: 'smoke-ball.png',
  snowball: 'snowball.png',
  softSand: 'soft-sand.png',
  spellTag: 'spell-tag.png',
  starPiece: 'star-piece.png',
  stardust: 'stardust.png',
  stick: 'stick.png',
  stickyBarb: 'sticky-barb.png',
  tinyMushroom: 'tiny-mushroom.png',
  whiteHerb: 'white-herb.png',
  wideLens: 'wide-lens.png',
  // Shards / valuable items (from PokeAPI)
  blueShard: 'blue-shard.png',
  greenShard: 'green-shard.png',
  heartScale: 'heart-scale.png',
  honey: 'honey.png',
  redShard: 'red-shard.png',
  yellowShard: 'yellow-shard.png',
  superDarkBall: { local: 'P79.png' },
  credit: { local: 'credit_coin.png' },
};

export function getItemSpriteImg(itemId, size = 24) {
  const mapped = ITEM_SPRITE_MAP[itemId];
  if (mapped) {
    if (typeof mapped === 'object' && mapped.local) {
      return `<img src="${LOCAL_ITEM_SPRITE_BASE}${mapped.local}" style="width:${size}px;height:${size}px;vertical-align:middle;image-rendering:auto" alt="">`;
    }
    return `<img src="${ITEM_SPRITE_BASE}${mapped}" style="width:${size}px;height:${size}px;vertical-align:middle;image-rendering:auto" alt="">`;
  }
  // Fallback to ITEMS database
  const item = ITEMS.find(i => i.id === itemId);
  if (!item) return '';
  // item.sprite may be a full URL or just a filename — use it directly if it starts with http
  const spriteUrl = item.sprite.startsWith('http')
    ? item.sprite
    : (item.spriteType === 'pokeapi' ? `${ITEM_SPRITE_BASE}${item.sprite}` : `${LOCAL_ITEM_SPRITE_BASE}${item.sprite}`);
  return `<img src="${spriteUrl}" style="width:${size}px;height:${size}px;vertical-align:middle;image-rendering:auto" alt="">`;
}
const HELD_ITEM_ICONS = {
  sitrus: '🍊', oran: '🫐', lum: '🌈',
  chesto: '🌰', rawst: '🍓'
};

export function updateBattleHeldIcons(playerMon, wildMon) {
  const playerIcon = document.getElementById('player-held-icon');
  const wildIcon = document.getElementById('wild-held-icon');
  if (playerIcon) {
    const itemId = playerMon?.heldItem;
    if (itemId && HELD_ITEM_ICONS[itemId]) {
      playerIcon.innerText = HELD_ITEM_ICONS[itemId];
      playerIcon.style.display = '';
    } else {
      playerIcon.innerText = '';
      playerIcon.style.display = 'none';
    }
  }
  if (wildIcon) {
    const itemId = wildMon?.heldItem;
    if (itemId && HELD_ITEM_ICONS[itemId]) {
      wildIcon.innerText = HELD_ITEM_ICONS[itemId];
      wildIcon.style.display = '';
    } else {
      wildIcon.innerText = '';
      wildIcon.style.display = 'none';
    }
  }
}

export function updateBattleSpriteBgs(playerMon, wildMon) {
  const playerBox = document.getElementById('player-sprite')?.closest('.reborn-sprite-box') as HTMLElement | null;
  if (playerBox && playerMon?.apiData?.types) {
    playerBox.style.background = getTypeGradient(playerMon.apiData.types);
  }
  const wildBox = document.getElementById('wild-sprite')?.closest('.reborn-sprite-box') as HTMLElement | null;
  if (wildBox && wildMon?.types) {
    wildBox.style.background = getTypeGradient(wildMon.types);
  }
  updateBattleHeldIcons(playerMon, wildMon);
}
