import { state } from './state.js';
import { POKEDEX_ALL, pokedexData, pokedexTotal } from '../battle/core.js';
import { SHOP_STOCK } from '../data/shops.js';
import { ITEMS } from '../data/items.js';
import { trainingStages } from '../data/training.js';
import { eliteFour, champion } from '../utils/state.js';
import { gymLeaders } from '../data/gyms.js';
import { QUEST_CONFIGS } from '../data/quests.js';

export function getTgUser() { return state.tgUser; }
export function getSocket() { return state.socket; }
export function getIsAdmin() { return state.isAdmin; }

export function getPokedexState() {
  return { pokedexSeen: state.pokedexSeen, pokedexCaught: state.pokedexCaught, POKEDEX_ALL: POKEDEX_ALL, pokedexData: pokedexData, pokedexTotal: pokedexTotal };
}

export function getShopState() {
  return { money: state.inventory['credit'] || 0, inventory: state.inventory, locationShopStock: SHOP_STOCK };
}

export function modifyMoney(delta) {
  state.inventory['credit'] = (state.inventory['credit'] || 0) + delta;
}

export function getTeamState() {
  return { myTeam: state.myTeam, currentPokemonIndex: state.currentPokemonIndex };
}

export function getSocialState() {
  return { onlinePlayersList: state.onlinePlayersList, trainerNickname: state.trainerNickname, tgUser: state.tgUser };
}

export function setTrainerNickname(name) {
  state.trainerNickname = name;
}

export function getMapState() { return { currentLocationId: state.currentLocationId, currentRegion: state.currentRegion, lastLocation: state.lastLocation }; }
export function setCurrentLocationId(id) { state.currentLocationId = id; }
export function setCurrentRegion(reg) { state.currentRegion = reg; }
export function setLastLocation(loc) { state.lastLocation = loc; }

export function getGameState() {
  return {
    get myTeam() { return state.myTeam; },
    get pokedexSeen() { return state.pokedexSeen; },
    get pokedexCaught() { return state.pokedexCaught; },
    get currentLocationId() { return state.currentLocationId; },
    get isDaytime() { return state.isDaytime; },
    get gymLeaders() { return gymLeaders; },
    get eliteFour() { return eliteFour; },
    get champion() { return champion; },
    get gymBadges() { return state.badges; },
    get expShareActive() { return state.expShareActive; },
    get quests() { return state.quests; },
    get questProgress() { return state.questProgress; },
    get completedQuests() { return state.completedQuests; },
    get visitedLocations() { return state.visitedLocations; },
    get inventory() { return state.inventory; },
    get money() { return state.inventory['credit'] || 0; },
    get QUEST_CONFIGS() { return QUEST_CONFIGS; },
    get itemsUsedInBattle() { return state.itemsUsedInBattle; },
    set itemsUsedInBattle(v) { state.itemsUsedInBattle = v; },
    get currentRegion() { return state.currentRegion; }
  };
}

export function setGameState(patch: any) {
  if (patch === null || patch === undefined || typeof patch !== 'object') return;
  for (const [k, v] of Object.entries(patch as Record<string, any>)) {
    switch (k) {
      case 'inventory': state.inventory = { ...v }; break;
      case 'money': state.inventory['credit'] = v; break;
      case 'myTeam': state.myTeam = v.map(m => ({ ...m })); break;
      case 'badges': state.badges = [...v]; break;
      case 'pcBoxes': state.pcBoxes = v.map(b => [...b]); break;
      case 'eggs': state.eggs = [...v]; break;
      case 'pokedexSeen': state.pokedexSeen = new Set(v); break;
      case 'pokedexCaught': state.pokedexCaught = new Set(v); break;
      case 'quests': state.quests = [...v]; break;
      case 'questProgress': state.questProgress = { ...v }; break;
      case 'completedQuests': state.completedQuests = [...v]; break;
      case 'npcQuestProgress': state.npcQuestProgress = { ...v }; break;
      case 'completedNPCQuests': state.completedNPCQuests = [...v]; break;
      case 'currentLocationId': state.currentLocationId = v; break;
      case 'currentRegion': state.currentRegion = v; break;
      case 'tutorialStep': state.tutorialStep = v; break;
      case 'trainerNickname': state.trainerNickname = v; break;
      case 'lastLocation': state.lastLocation = v; break;
    }
  }
}

export function getInvState() { return { money: state.inventory['credit'] || 0, eggs: state.eggs, ITEMS, trainingStages: trainingStages, expShareActive: state.expShareActive }; }
export function toggleExpShare() { state.expShareActive = !state.expShareActive; }
