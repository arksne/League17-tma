import { describe, it, expect, beforeEach, vi } from 'vitest';

// --- Minimal mocks for all getters.ts dependencies ---
// vi.hoisted ensures variable exists before vi.mock factories run (hoisted to top)

const mockState = vi.hoisted(() => ({
  tgUser: { id: 'tg1', first_name: 'Test', username: 'tester' },
  socket: { id: 'sock1' },
  isAdmin: true,
  pokedexSeen: new Set(['pikachu', 'charmander']),
  pokedexCaught: new Set(['pikachu']),
  inventory: { credit: 1000, pokeball: 10, potion: 5 },
  myTeam: [
    { uid: 'mon1', name: 'Pikachu', currentHp: 50, maxHp: 50, baseLevel: 5, candiesEaten: 0, apiData: { name: 'pikachu' } },
    { uid: 'mon2', name: 'Charmander', currentHp: 0, maxHp: 40, baseLevel: 5, candiesEaten: 0, apiData: { name: 'charmander' } },
  ],
  currentPokemonIndex: 0,
  onlinePlayersList: [{ id: 'sock2', username: 'Player2', userId: 456 }],
  trainerNickname: 'Champion',
  currentLocationId: 'goldenrod',
  currentRegion: 'east_johto',
  lastLocation: 'violet',
  visitedLocations: new Set(['goldenrod', 'violet']),
  isDaytime: false,
  badges: ['zephyr', 'hive'],
  expShareActive: false,
  quests: [{ id: 'q1', title: 'Test Quest', progress: 0 }],
  questProgress: { q1: 0 },
  completedQuests: [],
  itemsUsedInBattle: 2,
  eggs: ['egg1'],
  pcBoxes: [['boxedMon1']],
  npcQuestProgress: { npc1: 3 },
  completedNPCQuests: ['npc_quest_1'],
  tutorialStep: 2,
  moveTypeCache: new Map(),
  tgToken: 'tok123',
  saveVersion: 5,
  lastCloudSync: 1000,
  saveRetryCount: 0,
  saveInProgress: false,
  saveTriggerPending: false,
  cloudSaveTimer: null,
  activeTradeId: null,
  myTradeOffers: [],
  partnerTradeOffers: [],
  iAmP1: false,
  pvpBattleId: null,
  pvpOpponentName: '',
  pvpMyMon: null,
  pvpOppMon: null,
  pvpMyTurn: false,
  pvpMovesDetailed: [],
  lastProfileOpen: 0,
  lastSocketAction: 0,
  activeCraftCategory: null,
  notifications: [],
  itemHistory: [],
  serverDropConfig: null,
  daycareMons: [],
  daycareEgg: null,
  breedingPairs: [],
  hatching: false,
  _mapModule: null,
  _pvpModule: null,
}) as Record<string, any>);

vi.mock('../state.js', () => ({
  state: mockState,
}));

vi.mock('../../battle/core.js', () => ({
  POKEDEX_ALL: { pikachu: { id: 25 }, charmander: { id: 4 } },
  pokedexData: null,
  pokedexTotal: 1025,
}));

vi.mock('../../data/shops.js', () => ({
  SHOP_STOCK: { goldenrod: [{ item: 'pokeball', price: 200 }] },
}));

vi.mock('../../data/items.js', () => ({
  ITEMS: [
    { id: 'pokeball', nameRu: 'Покебол', category: 'ball' },
    { id: 'potion', nameRu: 'Зелье', category: 'healing' },
  ],
}));

vi.mock('../../data/training.js', () => ({
  trainingStages: [
    { name: 'Stage 1', cost: 100 },
    { name: 'Stage 2', cost: 200 },
  ],
}));

vi.mock('../../utils/state.js', () => ({
  eliteFour: [
    { name: 'Karen', type: 'dark' },
  ],
  champion: { name: 'Lance', type: 'dragon' },
}));

vi.mock('../../data/gyms.js', () => ({
  gymLeaders: {
    pewter: { name: 'Brock', type: 'rock' },
  },
}));

vi.mock('../../data/quests.js', () => ({
  QUEST_CONFIGS: {
    catch_pokemon: { title: 'Catch Pokemon' },
  },
}));

import {
  getTgUser,
  getSocket,
  getIsAdmin,
  getPokedexState,
  getShopState,
  modifyMoney,
  getTeamState,
  getSocialState,
  setTrainerNickname,
  getMapState,
  setCurrentLocationId,
  setCurrentRegion,
  setLastLocation,
  getGameState,
  setGameState,
  getInvState,
  toggleExpShare,
} from '../getters.js';

beforeEach(() => {
  mockState.inventory['credit'] = 1000;
  mockState.isAdmin = true;
  mockState.tgUser = { id: 'tg1', first_name: 'Test', username: 'tester' };
  mockState.socket = { id: 'sock1' };
  mockState.trainerNickname = 'Champion';
  mockState.currentLocationId = 'goldenrod';
  mockState.currentRegion = 'east_johto';
  mockState.lastLocation = 'violet';
  mockState.expShareActive = false;
  mockState.pokedexSeen = new Set(['pikachu', 'charmander']);
  mockState.pokedexCaught = new Set(['pikachu']);
  mockState.badges = ['zephyr', 'hive'];
  mockState.quests = [{ id: 'q1', title: 'Test Quest', progress: 0 }];
  mockState.questProgress = { q1: 0 };
  mockState.completedQuests = [];
  mockState.itemsUsedInBattle = 2;
  mockState.inventory = { credit: 1000, pokeball: 10, potion: 5 };
  mockState.myTeam = [
    { uid: 'mon1', name: 'Pikachu', currentHp: 50, maxHp: 50, baseLevel: 5, candiesEaten: 0, apiData: { name: 'pikachu' } },
    { uid: 'mon2', name: 'Charmander', currentHp: 0, maxHp: 40, baseLevel: 5, candiesEaten: 0, apiData: { name: 'charmander' } },
  ];
  mockState.eggs = ['egg1'];
  mockState.pcBoxes = [['boxedMon1']];
  mockState.tutorialStep = 2;
  mockState.npcQuestProgress = { npc1: 3 };
  mockState.completedNPCQuests = ['npc_quest_1'];
});

// --- Simple Getters ---

describe('getTgUser', () => {
  it('returns tgUser from state', () => {
    expect(getTgUser()).toEqual({ id: 'tg1', first_name: 'Test', username: 'tester' });
  });

  it('returns null when not set', () => {
    mockState.tgUser = null;
    expect(getTgUser()).toBeNull();
  });
});

describe('getSocket', () => {
  it('returns socket from state', () => {
    expect(getSocket()).toEqual({ id: 'sock1' });
  });

  it('returns null when not connected', () => {
    mockState.socket = null;
    expect(getSocket()).toBeNull();
  });
});

describe('getIsAdmin', () => {
  it('returns admin status', () => {
    expect(getIsAdmin()).toBe(true);
  });

  it('returns false for non-admin', () => {
    mockState.isAdmin = false;
    expect(getIsAdmin()).toBe(false);
  });
});

// --- Composed Getters ---

describe('getPokedexState', () => {
  it('returns combined pokedex state', () => {
    const result = getPokedexState();
    expect(result.pokedexSeen).toBe(mockState.pokedexSeen);
    expect(result.pokedexCaught).toBe(mockState.pokedexCaught);
    expect(result.POKEDEX_ALL).toBeDefined();
    expect(result.pokedexData).toBeNull();
    expect(result.pokedexTotal).toBe(1025);
  });
});

describe('getShopState', () => {
  it('returns shop state with money, inventory, stock', () => {
    const result = getShopState();
    expect(result.money).toBe(1000);
    expect(result.inventory).toBe(mockState.inventory);
    expect(result.locationShopStock).toBeDefined();
    expect(result.locationShopStock.goldenrod).toBeDefined();
  });
});

describe('getTeamState', () => {
  it('returns team and current index', () => {
    const result = getTeamState();
    expect(result.myTeam.length).toBe(2);
    expect(result.currentPokemonIndex).toBe(0);
  });

  it('returns empty team when no pokemon', () => {
    mockState.myTeam = [];
    expect(getTeamState().myTeam).toEqual([]);
  });
});

describe('getSocialState', () => {
  it('returns social/online player info', () => {
    const result = getSocialState();
    expect(result.onlinePlayersList).toHaveLength(1);
    expect(result.trainerNickname).toBe('Champion');
    expect(result.tgUser).toBeDefined();
  });

  it('returns empty list when nobody online', () => {
    mockState.onlinePlayersList = [];
    expect(getSocialState().onlinePlayersList).toEqual([]);
  });
});

// --- State Mutators ---

describe('modifyMoney', () => {
  it('adds money', () => {
    modifyMoney(500);
    expect(mockState.inventory['credit']).toBe(1500);
  });

  it('subtracts money', () => {
    modifyMoney(-300);
    expect(mockState.inventory['credit']).toBe(700);
  });

  it('allows negative balance', () => {
    modifyMoney(-2000);
    expect(mockState.inventory['credit']).toBe(-1000);
  });
});

describe('setTrainerNickname', () => {
  it('sets trainer nickname', () => {
    setTrainerNickname('NewName');
    expect(mockState.trainerNickname).toBe('NewName');
  });

  it('sets empty nickname', () => {
    setTrainerNickname('');
    expect(mockState.trainerNickname).toBe('');
  });
});

// --- Map State ---

describe('getMapState', () => {
  it('returns current location, region, last location', () => {
    const result = getMapState();
    expect(result.currentLocationId).toBe('goldenrod');
    expect(result.currentRegion).toBe('east_johto');
    expect(result.lastLocation).toBe('violet');
  });
});

describe('setCurrentLocationId', () => {
  it('sets location id', () => {
    setCurrentLocationId('violet');
    expect(mockState.currentLocationId).toBe('violet');
  });
});

describe('setCurrentRegion', () => {
  it('sets region', () => {
    setCurrentRegion('west_johto');
    expect(mockState.currentRegion).toBe('west_johto');
  });
});

describe('setLastLocation', () => {
  it('sets last location', () => {
    setLastLocation(null);
    expect(mockState.lastLocation).toBeNull();
  });
});

// --- getGameState ---

describe('getGameState', () => {
  it('returns computed game state with live accessors', () => {
    const gs = getGameState();
    expect(gs.myTeam).toBe(mockState.myTeam);
    expect(gs.pokedexSeen).toBe(mockState.pokedexSeen);
    expect(gs.pokedexCaught).toBe(mockState.pokedexCaught);
    expect(gs.currentLocationId).toBe('goldenrod');
    expect(gs.isDaytime).toBe(false);
    expect(gs.gymBadges).toBe(mockState.badges);
    expect(gs.expShareActive).toBe(false);
    expect(gs.quests).toBe(mockState.quests);
    expect(gs.questProgress).toBe(mockState.questProgress);
    expect(gs.completedQuests).toBe(mockState.completedQuests);
    expect(gs.visitedLocations).toBe(mockState.visitedLocations);
    expect(gs.inventory).toBe(mockState.inventory);
    expect(gs.money).toBe(1000);
    expect(gs.gymLeaders).toBeDefined();
    expect(gs.eliteFour).toHaveLength(1);
    expect(gs.champion).toBeDefined();
    expect(gs.QUEST_CONFIGS).toBeDefined();
    expect(gs.itemsUsedInBattle).toBe(2);
    expect(gs.currentRegion).toBe('east_johto');
  });

  it('accessors reflect live state changes', () => {
    const gs = getGameState();
    expect(gs.money).toBe(1000);
    mockState.inventory['credit'] = 999;
    expect(gs.money).toBe(999);
  });

  it('itemsUsedInBattle setter updates state', () => {
    const gs = getGameState();
    gs.itemsUsedInBattle = 5;
    expect(mockState.itemsUsedInBattle).toBe(5);
  });
});

// --- setGameState ---

describe('setGameState', () => {
  it('handles null/undefined patch', () => {
    setGameState(null);
    setGameState(undefined);
    expect(mockState.inventory['credit']).toBe(1000); // unchanged
  });

  it('sets inventory', () => {
    setGameState({ inventory: { pokeball: 99 } });
    expect(mockState.inventory).toEqual({ pokeball: 99 });
    expect(mockState.inventory).not.toBe({ pokeball: 99 }); // should be new object
  });

  it('sets money', () => {
    setGameState({ money: 5000 });
    expect(mockState.inventory['credit']).toBe(5000);
  });

  it('sets badges as new array', () => {
    setGameState({ badges: ['zephyr', 'hive', 'marsh'] });
    expect(mockState.badges).toEqual(['zephyr', 'hive', 'marsh']);
  });

  it('sets myTeam with cloned mons', () => {
    const team = [{ uid: 'new1', name: 'Bulbasaur' }];
    setGameState({ myTeam: team });
    expect(mockState.myTeam).toEqual(team);
    expect(mockState.myTeam).not.toBe(team);
  });

  it('sets pcBoxes as new arrays', () => {
    setGameState({ pcBoxes: [['a', 'b'], ['c']] });
    expect(mockState.pcBoxes).toEqual([['a', 'b'], ['c']]);
  });

  it('sets eggs as new array', () => {
    setGameState({ eggs: ['egg1', 'egg2'] });
    expect(mockState.eggs).toEqual(['egg1', 'egg2']);
  });

  it('sets pokedexSeen from array to Set', () => {
    setGameState({ pokedexSeen: ['pikachu', 'bulbasaur'] });
    expect(mockState.pokedexSeen).toBeInstanceOf(Set);
    expect(mockState.pokedexSeen.has('bulbasaur')).toBe(true);
  });

  it('sets pokedexCaught from array to Set', () => {
    setGameState({ pokedexCaught: ['pikachu'] });
    expect(mockState.pokedexCaught).toBeInstanceOf(Set);
    expect(mockState.pokedexCaught.has('pikachu')).toBe(true);
  });

  it('sets quests as new array', () => {
    setGameState({ quests: [{ id: 'q2' }] });
    expect(mockState.quests).toEqual([{ id: 'q2' }]);
  });

  it('sets questProgress as new object', () => {
    setGameState({ questProgress: { q1: 5, q2: 1 } });
    expect(mockState.questProgress).toEqual({ q1: 5, q2: 1 });
  });

  it('sets completedQuests as new array', () => {
    setGameState({ completedQuests: ['q1'] });
    expect(mockState.completedQuests).toEqual(['q1']);
  });

  it('sets currentLocationId', () => {
    setGameState({ currentLocationId: 'violet' });
    expect(mockState.currentLocationId).toBe('violet');
  });

  it('sets currentRegion', () => {
    setGameState({ currentRegion: 'west_johto' });
    expect(mockState.currentRegion).toBe('west_johto');
  });

  it('sets tutorialStep', () => {
    setGameState({ tutorialStep: 5 });
    expect(mockState.tutorialStep).toBe(5);
  });

  it('sets trainerNickname', () => {
    setGameState({ trainerNickname: 'Master' });
    expect(mockState.trainerNickname).toBe('Master');
  });

  it('sets lastLocation', () => {
    setGameState({ lastLocation: 'cherrygrove' });
    expect(mockState.lastLocation).toBe('cherrygrove');
  });

  it('sets npcQuestProgress as new object', () => {
    setGameState({ npcQuestProgress: { npc2: 1 } });
    expect(mockState.npcQuestProgress).toEqual({ npc2: 1 });
  });

  it('sets completedNPCQuests as new array', () => {
    setGameState({ completedNPCQuests: ['npc1'] });
    expect(mockState.completedNPCQuests).toEqual(['npc1']);
  });

  it('ignores unknown keys', () => {
    setGameState({ unknownKey: 'should not set' } as any);
    expect((mockState as any).unknownKey).toBeUndefined();
  });
});

// --- Inventory State ---

describe('getInvState', () => {
  it('returns inventory state summary', () => {
    const result = getInvState();
    expect(result.money).toBe(1000);
    expect(result.eggs).toEqual(['egg1']);
    expect(result.ITEMS).toHaveLength(2);
    expect(result.trainingStages).toHaveLength(2);
    expect(result.expShareActive).toBe(false);
  });
});

// --- Toggle ---

describe('toggleExpShare', () => {
  it('toggles from false to true', () => {
    mockState.expShareActive = false;
    toggleExpShare();
    expect(mockState.expShareActive).toBe(true);
  });

  it('toggles from true to false', () => {
    mockState.expShareActive = true;
    toggleExpShare();
    expect(mockState.expShareActive).toBe(false);
  });
});
