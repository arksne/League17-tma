/** Игровой предмет */
export interface ItemDef {
  id: string;
  nameRu: string;
  category: string;
  desc: string;
  sprite: string;
  spriteType: string;
  price: number;
  sellPrice: number;
  isUsable: boolean;
  isBall: boolean;
  implemented: boolean;
  ballMult?: number;
  maxStack?: number;
}

/** Тип покемона */
export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'grass' | 'electric' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

/** Дроп предмета */
export interface DropEntry {
  item: string;
  chance: number;
  qty: number;
  qtyVar?: number;
}

/** Локация региона */
export interface LocationDef {
  name: string;
  access?: string;
  desc?: string;
  image: string;
  links: string[];
  encounters: string[];
  dayEncounters?: string[];
  nightEncounters?: string[];
  hasHeal?: boolean;
  hasWater?: boolean;
  region: string;
  shopStock?: string[];
  shopType?: string;
}

/** Регион */
export interface RegionDef {
  name: string;
  color?: string;
  locations: Record<string, LocationDef>;
}

/** NPC */
export interface NPCDef {
  id: string;
  name: string;
  sprite: string;
  location: string;
  dialog: NPCDialog;
  quests: NPCQuest[];
}

export interface NPCDialog {
  greet: string;
  default: string;
  quest_offer?: string;
  quest_complete?: string;
  quest_incomplete?: string;
}

export interface NPCQuest {
  id: string;
  type?: string;
  desc: string;
  target?: number;
  targetQty?: number;
  targetItem?: string;
  rewardItem?: string;
  rewardQty?: number;
  rewardMoney?: number;
  prereqQuest?: string;
}

/** IV статы */
export interface IVs {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

/** EV статы */
export interface EVs {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

/** Модификаторы стадий статов */
export interface StatStages {
  atk: number; def: number; spa: number; spd: number; spe: number;
}

/** PP хода */
export interface PPData {
  current: number;
  max: number;
}

/** Магазинный слот предмета */
export interface ShopSlot {
  item: string;
  price: number;
  qty?: number;
}

/** Покемон в команде или PC */
export interface TeamMonster {
  uid: string;
  originalTrainer?: string;
  createdAt: number;
  caughtLocation: string;
  previousOwner?: string;
  name?: string;
  apiData: any;
  maxHp: number;
  currentHp: number;
  ivs: IVs;
  evs: EVs;
  baseLevel: number;
  candiesEaten: number;
  exp: number;
  expToNext: number;
  vitaminsEaten: number;
  training: string | null;
  trainingStage: number;
  trainingStat: string | null;
  happiness: number;
  natureIdx: number;
  breedLetter: string;
  gender: string | null;
  status: string | null;
  sleepTurns: number;
  movesPP: PPData[] | null;
  statStages: StatStages | null;
  abilityName: string | null;
  heldItem: string | null;
  berries: Record<string, number>;
  learnableMoves: any[];
  nickname?: string;
  lastMoveCheckLevel?: number;
  choiceLockedMove?: number;
  currentHpDisplay?: string;
  /** Used for trading */
  hasBred?: boolean;
  /** Wild-only: random IVs */
  wildIVs?: IVs;
  captureRate?: number;
  speciesData?: any;
  wildGender?: string | null;
  isShiny?: boolean;
}

/** Опции для calculateStat */
export interface CalculateStatOpts {
  isWild?: boolean;
  level?: number;
  ivs?: IVs;
  evs?: EVs;
  natures?: Array<{ buff: string; nerf: string }>;
}

/** Запись истории предметов */
export interface ItemHistoryEntry {
  itemId: string;
  qty: number;
  source: string;
  timestamp: number;
  trainerId: string;
}

/** Квест */
export interface QuestData {
  id: string;
  desc: string;
  type: string;
  target: number;
  targetItem?: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardMoney: number;
  rewardItem?: string;
  rewardQty?: number;
}

/** Достижение */
export interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

/** Данные для торговли */
export interface TradeOffer {
  uid: string;
  item?: string;
  qty?: number;
  mon?: TeamMonster;
}

/** Центральное состояние игры (game/state.ts) */
export interface GameState {
  // Location / Navigation
  currentLocationId: string;
  currentRegion: string;
  lastLocation: string | null;
  visitedLocations: Set<string>;
  isDaytime: boolean;
  moveTypeCache: Map<string, string>;

  // Player
  inventory: Record<string, number>;
  itemHistory: ItemHistoryEntry[];
  badges: string[];
  trainerNickname: string;
  expShareActive: boolean;
  serverDropConfig: any;

  // Pokemon
  myTeam: TeamMonster[];
  currentPokemonIndex: number | null;
  pcBoxes: TeamMonster[][];
  pokedexSeen: Set<string>;
  pokedexCaught: Set<string>;

  // Battle
  itemsUsedInBattle: number;

  // Notifications
  notifications: any[];

  // Daycare & Breeding
  daycareMons: any[];
  daycareEgg: any;
  breedingPairs: any[];
  eggs: any[];
  hatching: boolean;

  // Quests & Tutorial
  quests: QuestData[];
  questProgress: Record<string, number>;
  completedQuests: string[];
  npcQuestProgress: Record<string, number>;
  completedNPCQuests: string[];
  tutorialStep: number;

  // Auth & Sync
  tgUser: any;
  tgToken: string | null;
  isAdmin: boolean;
  saveVersion: number;
  lastCloudSync: number;
  saveRetryCount: number;
  saveInProgress: boolean;
  saveTriggerPending: boolean;
  cloudSaveTimer: any;

  // Socket / PvP / Trade
  socket: any;
  onlinePlayersList: any[];
  activeTradeId: string | null;
  myTradeOffers: TradeOffer[];
  partnerTradeOffers: TradeOffer[];
  iAmP1: boolean;
  pvpBattleId: string | null;
  pvpOpponentName: string;
  pvpMyMon: TeamMonster | null;
  pvpOppMon: any;
  pvpMyTurn: boolean;
  pvpMovesDetailed: any[];
  lastProfileOpen: number;
  lastSocketAction: number;
  activeCraftCategory: string | null;

  // Lazy-loaded module refs
  _mapModule: any;
  _pvpModule: any;
}
