// Central game state singleton.
// All module-level mutable state from main.js lives as properties of `state`.
// Import `state` from this module whenever you need to read or write game state.
// Pure utility functions (no UI/side-effect deps) also live here.

export const state: Record<string, any> = {
  // Location / Navigation
  currentLocationId: 'goldenrod',
  currentRegion: 'johto',
  lastLocation: null,
  visitedLocations: new Set<string>(),
  isDaytime: true,
  moveTypeCache: new Map<string, string>(),

  // Player
  inventory: { credit: 500 } as Record<string, number>,
  itemHistory: [] as Array<any>,
  badges: [] as Array<string>,
  trainerNickname: '',
  expShareActive: false,
  serverDropConfig: null,

  // Pokemon
  myTeam: [] as Array<any>,
  currentPokemonIndex: null as number | null,
  pcBoxes: [[]] as Array<Array<any>>,
  pokedexSeen: new Set<string>(),
  pokedexCaught: new Set<string>(),

  // Battle
  itemsUsedInBattle: 0,

  // Notifications
  notifications: [] as Array<any>,

  // Daycare & Breeding
  daycareMons: [] as Array<any>,
  daycareEgg: null,
  breedingPairs: [] as Array<any>,
  eggs: [] as Array<any>,
  hatching: false,

  // Quests & Tutorial
  quests: [] as Array<any>,
  questProgress: {} as Record<string, any>,
  completedQuests: [] as Array<string>,
  npcQuestProgress: {} as Record<string, number>,
  completedNPCQuests: [] as Array<string>,
  tutorialStep: 0,

  // Auth & Sync
  tgUser: null,
  tgToken: null as string | null,
  isAdmin: false,
  saveVersion: 0,
  lastCloudSync: 0,
  saveRetryCount: 0,
  saveInProgress: false,
  saveTriggerPending: false,
  cloudSaveTimer: null as any,

  // Socket / PvP / Trade
  socket: null as any,
  onlinePlayersList: [] as Array<any>,
  activeTradeId: null as string | null,
  myTradeOffers: [] as Array<any>,
  partnerTradeOffers: [] as Array<any>,
  iAmP1: false,
  pvpBattleId: null as string | null,
  pvpOpponentName: '',
  pvpMyMon: null as any,
  pvpOppMon: null as any,
  pvpMyTurn: false,
  pvpMovesDetailed: [] as Array<any>,
  lastProfileOpen: 0,
  lastSocketAction: 0,
  activeCraftCategory: null as string | null,

  // Lazy-loaded module refs
  _mapModule: null as any,
  _pvpModule: null as any,
};

// Re-export pure utility functions from single source of truth
export { generateUID } from '../utils/state.js';
export { itemDef, itemCategory } from '../utils/items.js';

// Wrappers that use state.tgUser rather than requiring a parameter
import { getTrainerId as _getTrainerId, lsKey as _lsKey } from '../utils/state.js';
export function getTrainerId(): string { return _getTrainerId(state.tgUser); }
export function lsKey(name: string): string { return _lsKey(name, state.tgUser); }

import { ITEMS } from '../data/items.js';

export function getItemQty(itemId: string): number {
  return state.inventory[itemId] ?? 0;
}

export function hasItem(itemId: string): boolean {
  return getItemQty(itemId) > 0;
}

export function toggleBagItem(itemId: string, delta: number): void {
  if (itemId === 'credit') return;
  const qty = getItemQty(itemId) + delta;
  if (qty <= 0) { delete state.inventory[itemId]; return; }
  if (qty > 9999) { state.inventory[itemId] = 9999; return; }
  state.inventory[itemId] = qty;
}
