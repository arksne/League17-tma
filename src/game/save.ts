import { state, generateUID, getTrainerId, lsKey } from './state.js';
import { ITEMS } from '../data/items.js';
import { REGIONS } from '../data/regions.js';
// Lazy import for cycle-breaking (save.ts ↔ location.ts)
let _getLocation: ((id: string) => any) | null = null;
async function getLocationLazy(locId: string) {
  if (!_getLocation) _getLocation = (await import('../ui/location.js')).getLocation;
  return _getLocation(locId);
}
import { initInventory } from './actions.js';
import { showConfirmModal, showToast } from '../utils/dom.js';
import { LEGENDARY_SET } from '../utils/state.js';
import { API_BASE } from './config.js';
const MAX_RETRIES = 3;
const RETRY_DELAYS = [5000, 15000, 30000];

export function getCloudAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(state.tgToken ? { 'Authorization': `Bearer ${state.tgToken}` } : {})
  };
}

export function getLeaderboardData() {
  const badgesCount = state.badges ? state.badges.length : 0;
  const teamLevelSum = state.myTeam.reduce((sum, mon) => sum + (mon.baseLevel || 1), 0);
  const pokemonCount = state.pokedexCaught.size;
  const legendaryCount = state.myTeam.reduce((c, m) => c + (m.apiData?.name && LEGENDARY_SET.has(m.apiData.name) ? 1 : 0), 0);
  return { badgesCount, teamLevelSum, money: state.inventory['credit'] || 0, pokemonCount, legendaryCount };
}

export function getFullSaveData() {
  return {
    _v: state.saveVersion,
    _ts: Date.now(),
    currentLocationId: state.currentLocationId, currentRegion: state.currentRegion,
    inventory: { ...state.inventory },
    money: state.inventory['credit'] || 0, badges: state.badges, trainerNickname: state.trainerNickname,
    myTeam: state.myTeam.map(m => ({
      uid: m.uid, originalTrainer: m.originalTrainer, createdAt: m.createdAt,
      caughtLocation: m.caughtLocation, previousOwner: m.previousOwner,
      apiData: m.apiData, maxHp: m.maxHp, currentHp: m.currentHp,
      ivs: m.ivs, evs: m.evs, baseLevel: m.baseLevel,
      exp: m.exp, expToNext: m.expToNext, candiesEaten: m.candiesEaten,
      vitaminsEaten: m.vitaminsEaten, training: m.training, trainingStage: m.trainingStage,
      trainingStat: m.trainingStat, happiness: m.happiness, natureIdx: m.natureIdx,
      breedLetter: m.breedLetter, gender: m.gender, status: m.status, sleepTurns: m.sleepTurns,
      movesPP: m.movesPP, statStages: m.statStages, abilityName: m.abilityName,
      heldItem: m.heldItem, berries: m.berries, learnableMoves: m.learnableMoves,
      lastMoveCheckLevel: m.lastMoveCheckLevel,
    })),
    currentPokemonIndex: state.currentPokemonIndex,
    pokedexSeen: Array.from(state.pokedexSeen),
    pokedexCaught: Array.from(state.pokedexCaught),
    quests: state.quests, questProgress: state.questProgress, completedQuests: state.completedQuests, npcQuestProgress: state.npcQuestProgress, completedNPCQuests: state.completedNPCQuests, tutorialStep: state.tutorialStep,
    visitedLocations: Array.from(state.visitedLocations), itemsUsedInBattle: state.itemsUsedInBattle, itemHistory: state.itemHistory,
    pcBoxes: state.pcBoxes.map(box => box.map(m => ({
      uid: m.uid, originalTrainer: m.originalTrainer, createdAt: m.createdAt,
      caughtLocation: m.caughtLocation, apiData: m.apiData, maxHp: m.maxHp,
      currentHp: m.currentHp, ivs: m.ivs, evs: m.evs, baseLevel: m.baseLevel,
      exp: m.exp, expToNext: m.expToNext, candiesEaten: m.candiesEaten,
      vitaminsEaten: m.vitaminsEaten, trainingStage: m.trainingStage, trainingStat: m.trainingStat,
      happiness: m.happiness, natureIdx: m.natureIdx, breedLetter: m.breedLetter, gender: m.gender,
      status: m.status, sleepTurns: m.sleepTurns, movesPP: m.movesPP,
      statStages: m.statStages, abilityName: m.abilityName, heldItem: m.heldItem,
      berries: m.berries, learnableMoves: m.learnableMoves,
      lastMoveCheckLevel: m.lastMoveCheckLevel,
    }))),
    daycareMons: state.daycareMons, daycareEgg: state.daycareEgg, lastLocation: state.lastLocation, expShareActive: state.expShareActive,
    breedingPairs: state.breedingPairs.map(p => ({ boxIdx: p.boxIdx, mon1Uid: p.mon1Uid, mon2Uid: p.mon2Uid, startTime: p.startTime, readyTime: p.readyTime })),
    eggs: state.eggs.map(e => ({ uid: e.uid, species: e.species, types: e.types, ivs: e.ivs, readyTime: e.readyTime, boxIdx: e.boxIdx, parent1Uid: e.parent1Uid, parent2Uid: e.parent2Uid })),
    notifications: state.notifications.slice(0, 30),
  };
}

export function validateGameState() {
  // Ensure critical structures exist
  if (!state.myTeam) state.myTeam = [];
  if (!state.pcBoxes) state.pcBoxes = [[]];
  if (!state.badges) state.badges = [];
  if (!state.inventory) state.inventory = {};
  // Ensure all ITEMS exist in state.inventory (credit is just another item now)
  ITEMS.forEach(item => { if (item.id !== 'credit' && !(item.id in state.inventory)) state.inventory[item.id] = 0; });
  // Ensure credit exists (it IS money)
  if (!('credit' in state.inventory)) state.inventory['credit'] = 500;
  // Validate team pokemon have required fields
  for (let i = state.myTeam.length - 1; i >= 0; i--) {
    const m = state.myTeam[i];
    if (!m.apiData) { console.warn('Pokemon without apiData at index', i, '— removing'); state.myTeam.splice(i, 1); continue; }
    if (!m.uid) m.uid = generateUID();
    if (!m.originalTrainer) m.originalTrainer = getTrainerId();
    if (!m.createdAt) m.createdAt = Date.now();
    if (!m.maxHp || m.maxHp <= 0) m.maxHp = 50;
    if (m.currentHp === undefined || m.currentHp < 0) m.currentHp = m.maxHp;
    if (!m.ivs) m.ivs = { hp: 15, atk: 15, def: 15, spa: 15, spd: 15, spe: 15 };
    if (!m.evs) m.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (!m.learnableMoves) m.learnableMoves = [];
    if (!m.berries) m.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
    // Clamp impossible levels (defense against data corruption)
    if (m.baseLevel > 100) m.baseLevel = 100;
    if (m.baseLevel < 1) m.baseLevel = 1;
    if (m.candiesEaten > 0 && m.baseLevel + m.candiesEaten > 100) m.candiesEaten = 100 - m.baseLevel;
  }
}

export function saveGame() {
  validateGameState();
  state.saveVersion++;
  const saveData = getFullSaveData();

  const saveJson = JSON.stringify(saveData);
  try {
    // Rotate backups: keep last 2 previous saves
    const prev1 = localStorage.getItem(lsKey('save'));
    if (prev1) {
      try { localStorage.setItem(lsKey('save_bak2'), localStorage.getItem(lsKey('save_bak1')) || ''); } catch(_) {}
      try { localStorage.setItem(lsKey('save_bak1'), prev1); } catch(_) {}
    }
    localStorage.setItem(lsKey('save'), saveJson);
    localStorage.setItem(lsKey('save_ts'), String(Date.now()));
    localStorage.setItem(lsKey('save_v'), String(state.saveVersion));
  } catch (e) {
    console.warn('localStorage save failed — freeing space', e);
    try {
      ['save_backup', 'save_bak1', 'save_bak2', 'save_ts', 'save_v', 'quest_date', 'pokedex_seen', 'pokedex_caught', 'battle_state'].forEach(k => {
        try { localStorage.removeItem(lsKey(k)); } catch(_) {}
      });
      localStorage.setItem(lsKey('save'), saveJson);
    } catch (e2) {
      console.error('CRITICAL: Cannot save to localStorage', e2);
    }
  }
}

export async function loadGame() {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(lsKey('save'));
    if (!raw) return false;
    const data = JSON.parse(raw);

    // Version tracking
    state.saveVersion = parseInt(localStorage.getItem(lsKey('save_v')) || '0');
    state.lastCloudSync = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');

    state.currentLocationId = data.currentLocationId || 'goldenrod';
    state.currentRegion = data.currentRegion || 'johto';
    // Migrate old region keys
    if (state.currentRegion === 'tevas_islands') state.currentRegion = 'johto' // was southern_archipelago;
    if (!REGIONS[state.currentRegion]) state.currentRegion = 'johto';
    // Validate location exists
    if (!(await getLocationLazy(state.currentLocationId))) {
      state.currentLocationId = 'goldenrod';
      state.currentRegion = 'johto';
    }

    if (data.inventory) {
      state.inventory = { ...data.inventory };
    } else {
      const OLD_MAP = {
        invPokeballs: 'pokeBall', invGreatBall: 'greatBall', invUltraBall: 'ultraBall',
        invPotion: 'potion', invCandy: 'rareCandy', invVitamin: 'hpUp',
        invTrain: 'train', invWeaken: 'weaken',
        invSuperPotion: 'superPotion', invFullRestore: 'fullRestore',
        invEvolutionStone: 'evolutionStone', invTM: 'tm',
        invSitrusBerry: 'sitrusBerry', invOranBerry: 'oranBerry',
        invLumBerry: 'lumBerry', invChestoBerry: 'chestoBerry', invRawstBerry: 'rawstBerry',
      };
      initInventory();
      for (const [oldKey, newKey] of Object.entries(OLD_MAP)) {
        if (data[oldKey] !== undefined) state.inventory[newKey] = data[oldKey];
      }
    }
    // Money: credit IS money now, read from save (backward compat: try data.money too)
    state.inventory['credit'] = data.inventory?.credit ?? data.money ?? 500;
    state.badges = data.badges || [];
    state.trainerNickname = data.trainerNickname || '';
    state.myTeam = data.myTeam || [];
    // Rehydrate team
    state.myTeam.forEach(m => {
      if (!m.uid) m.uid = generateUID();
      if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      if (!m.learnableMoves) m.learnableMoves = [];
      if (!m.berries) m.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
      if (m.currentHp === undefined || m.currentHp < 0) m.currentHp = m.maxHp || 50;
      if (!m.lastMoveCheckLevel) m.lastMoveCheckLevel = m.baseLevel || 1;
      // Clamp impossible levels (defense against data corruption)
      if (m.baseLevel > 100) m.baseLevel = 100;
      if (m.baseLevel < 1) m.baseLevel = 1;
      if (m.candiesEaten > 0 && m.baseLevel + m.candiesEaten > 100) m.candiesEaten = 100 - m.baseLevel;
    });
    state.currentPokemonIndex = data.currentPokemonIndex ?? null;
    state.pokedexSeen = new Set(data.pokedexSeen || []);
    state.pokedexCaught = new Set(data.pokedexCaught || []);
    state.quests = data.quests || [];
    state.questProgress = data.questProgress || {};
    state.completedQuests = data.completedQuests || [];
    state.npcQuestProgress = data.npcQuestProgress || {};
    state.completedNPCQuests = data.completedNPCQuests || [];
    state.tutorialStep = data.tutorialStep || 0;
    state.visitedLocations = new Set(data.visitedLocations || []);
    state.itemsUsedInBattle = data.itemsUsedInBattle || 0;
    state.itemHistory = data.itemHistory || [];
    state.pcBoxes = data.pcBoxes || [[]];
    // Rehydrate PC pokemon
    state.pcBoxes.forEach(box => box.forEach(m => {
      if (!m.uid) m.uid = generateUID();
      if (m.currentHp === undefined || m.currentHp < 0) m.currentHp = m.maxHp || 50;
      if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      // Migrate old _bredWith to hasBred
      if (m._bredWith !== undefined) { m.hasBred = m._bredWith.length > 0; delete m._bredWith; }
      if (m.hasBred === undefined) m.hasBred = false;
    }));
    // Migrate team pokemon too
    state.myTeam.forEach(m => {
      if (m._bredWith !== undefined) { m.hasBred = m._bredWith.length > 0; delete m._bredWith; }
      if (m.hasBred === undefined) m.hasBred = false;
    });
    state.daycareMons = data.daycareMons || [];
    state.daycareMons.forEach(e => { if (!e.mon.currentHp || e.mon.currentHp < 0) e.mon.currentHp = e.mon.maxHp || 50; });
    state.daycareEgg = data.daycareEgg || null;
    state.lastLocation = data.lastLocation || null;
    state.expShareActive = data.expShareActive || false;
    state.breedingPairs = data.breedingPairs || [];
    state.eggs = data.eggs || [];
    state.notifications = data.notifications || [];

    validateGameState();
    return true;
  } catch (e) {
    console.warn('Load failed — data corrupted', e);
    try { localStorage.setItem(lsKey('save_corrupted'), raw || ''); } catch (_) {}
    // Try backup recovery
    for (const bak of ['save_bak1', 'save_bak2']) {
      try {
        const bakRaw = localStorage.getItem(lsKey(bak));
        if (!bakRaw) continue;
        const bakData = JSON.parse(bakRaw);
        if (bakData.myTeam) {
          console.warn(`Recovered from ${bak}!`);
          showToast('Данные восстановлены из резервной копии!', false);
          // Re-run load with backup data
          localStorage.setItem(lsKey('save'), bakRaw);
          localStorage.setItem(lsKey('save_v'), String(bakData._v || 0));
          return loadGame(); // Retry with recovered data
        }
      } catch(_) {}
    }
    return false;
  }
}

export function autoSave() {
  validateGameState();
  saveGame();
  cloudSave();
}

export function resetGame() {
  showConfirmModal('Сброс прогресса', 'Это действие необратимо! Вы уверены?', async () => {
    localStorage.removeItem(lsKey('save'));
    // Also clear cloud save so reload gives starter
    if (state.tgToken) {
      try {
        await fetch(`${API_BASE}/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.tgToken },
          body: JSON.stringify({ saveData: { _v: Date.now(), myTeam: [], inventory: { credit: 500 }, money: 500, badges: [] } })
        });
      } catch(e) { console.warn('Cloud reset failed', e); }
    }
    location.reload();
  });
}

export function cloudSave() {
  if (!state.tgToken) return;
  // If a save is in flight, mark pending — it'll fire right after the current one
  if (state.saveInProgress) {
    state.saveTriggerPending = true;
    return;
  }
  if (state.cloudSaveTimer) clearTimeout(state.cloudSaveTimer);
  state.cloudSaveTimer = setTimeout(() => doCloudSave(), 2000);
}

export async function doCloudSave(attempt = 0) {
  if (state.saveInProgress) return; // already saving, coalesced call will pick it up
  state.saveInProgress = true;
  state.saveTriggerPending = false;

  validateGameState();
  const saveData = getFullSaveData();
  const lb = getLeaderboardData();

  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: getCloudAuthHeaders(),
      body: JSON.stringify({ saveData, ...lb, saveVersion: state.saveVersion })
    });
    // 429 = rate limited — don't retry, just stop hammering the server
    if (res.status === 429) {
      console.warn('Cloud save rate-limited (429), backing off');
      state.saveInProgress = false;
      const btnSync = document.getElementById('btn-cloud-sync');
      if (btnSync) { btnSync.textContent = '☁️✗'; setTimeout(() => { btnSync.textContent = '☁️ Авто'; }, 5000); }
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    state.lastCloudSync = Date.now();
    state.saveRetryCount = 0;
    localStorage.setItem(lsKey('save_sync'), String(state.lastCloudSync));
    const btnSync = document.getElementById('btn-cloud-sync');
    if (btnSync) { btnSync.textContent = '☁️✓'; setTimeout(() => { btnSync.textContent = '☁️ Авто'; }, 1500); }
    return result;
  } catch (e) {
    console.warn(`Cloud save failed (attempt ${attempt + 1}/${MAX_RETRIES})`, e.message);
    if (attempt < MAX_RETRIES - 1) {
      state.saveRetryCount = attempt + 1;
      state.saveInProgress = false;
      const delay = RETRY_DELAYS[attempt];
      state.cloudSaveTimer = setTimeout(() => doCloudSave(attempt + 1), delay);
      return;
    } else {
      state.saveRetryCount = MAX_RETRIES;
      const btnSync = document.getElementById('btn-cloud-sync');
      if (btnSync) { btnSync.textContent = '☁️✗'; setTimeout(() => { btnSync.textContent = '☁️ Авто'; }, 3000); }
    }
  }
  state.saveInProgress = false;

  // If another save was triggered while we were saving, fire it now
  if (state.saveTriggerPending) {
    state.saveTriggerPending = false;
    state.cloudSaveTimer = setTimeout(() => doCloudSave(), 500);
  }
}

export async function cloudLoad() {
  if (!state.tgToken) return null;
  try {
    const res = await fetch(`${API_BASE}/save`, { headers: getCloudAuthHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data.saveData;
  } catch (e) {
    console.warn('Cloud load failed', e);
    return null;
  }
}

export async function applyCloudSave(data) {
  if (!data || !data.myTeam) return;
  // Compare by timestamp (saveVersion can inflate over time — _ts is always monotonic)
  if (data._ts) {
    const localTs = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');
    if (data._ts <= localTs) return;
    console.log(`[sync] Server ts ${data._ts} > local ts ${localTs} — applying server data`);
  } else {
    console.log(`[sync] No timestamp on server data — applying as authoritative`);
  }
  state.currentLocationId = data.currentLocationId || state.currentLocationId;
  state.currentRegion = data.currentRegion || state.currentRegion;
  if (state.currentRegion === 'tevas_islands') state.currentRegion = 'johto' // was southern_archipelago;
  if (!REGIONS[state.currentRegion]) state.currentRegion = 'johto';
  if (!(await getLocationLazy(state.currentLocationId))) {
    state.currentLocationId = 'goldenrod';
    state.currentRegion = 'johto';
  }
  if (data.inventory) state.inventory = { ...data.inventory };
  // credit IS money — fall back to data.money for backward compat
  if (!('credit' in state.inventory)) state.inventory['credit'] = data.money ?? state.inventory['credit'] ?? 500;
  state.badges = data.badges || state.badges;
  state.trainerNickname = data.trainerNickname || state.trainerNickname;
  state.myTeam = data.myTeam || state.myTeam;
  state.myTeam.forEach(m => {
    if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (!m.learnableMoves) m.learnableMoves = [];
    if (!m.berries) m.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
    // Clamp impossible levels
    if (m.baseLevel > 100) m.baseLevel = 100;
    if (m.baseLevel < 1) m.baseLevel = 1;
    if (m.candiesEaten > 0 && m.baseLevel + m.candiesEaten > 100) m.candiesEaten = 100 - m.baseLevel;
  });
  state.currentPokemonIndex = data.currentPokemonIndex ?? state.currentPokemonIndex;
  state.pokedexSeen = new Set(data.pokedexSeen || []);
  state.pokedexCaught = new Set(data.pokedexCaught || []);
  state.pcBoxes = data.pcBoxes || state.pcBoxes;
  state.pcBoxes.forEach(box => box.forEach(m => {
    if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }));
  state.daycareMons = data.daycareMons || state.daycareMons;
  state.daycareEgg = data.daycareEgg || state.daycareEgg;
  state.lastLocation = data.lastLocation || state.lastLocation;
  state.expShareActive = data.expShareActive || state.expShareActive;
  state.breedingPairs = data.breedingPairs || state.breedingPairs;
  state.eggs = data.eggs && data.eggs.length > 0 ? data.eggs : state.eggs;
  state.quests = data.quests || state.quests;
  state.questProgress = data.questProgress || state.questProgress;
  state.completedQuests = data.completedQuests || state.completedQuests;
  state.npcQuestProgress = data.npcQuestProgress || state.npcQuestProgress;
  state.completedNPCQuests = data.completedNPCQuests || state.completedNPCQuests;
  state.tutorialStep = data.tutorialStep || state.tutorialStep;
  state.visitedLocations = new Set(data.visitedLocations || []);
  state.itemsUsedInBattle = data.itemsUsedInBattle || state.itemsUsedInBattle;
  state.itemHistory = data.itemHistory || state.itemHistory;
  const cloudV = data._v;
  state.saveVersion = cloudV !== undefined ? cloudV : Date.now();
  validateGameState();

  // Save reconciled state locally
  saveGame();
  console.log('[sync] Applied server save v' + cloudV);
}

export async function openLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  const list = document.getElementById('leaderboard-list');
  if (!modal) return;

  modal.style.display = 'flex';
  list.innerHTML = '<div class="leaderboard-loading">Загрузка...</div>';

  try {
    const res = await fetch(`${API_BASE}/leaderboard`);
    const data = await res.json();

    if (!data.entries || data.entries.length === 0) {
      list.innerHTML = '<div class="leaderboard-empty">Таблица лидеров пуста</div>';
      return;
    }

    let html = '';
    const escHtml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    data.entries.forEach((entry, i) => {
      let medal = String(i + 1);
      if (i === 0) medal = '🥇';
      else if (i === 1) medal = '🥈';
      else if (i === 2) medal = '🥉';
      const name = entry.trainerNickname || entry.first_name || entry.username || `Trainer#${entry.userId}`;
      const pkmn = entry.pokemon_count || 0;
      const leg = entry.legendary_count || 0;

      html += `
        <div class="leaderboard-entry">
          <span class="leaderboard-rank">${medal}</span>
          <span class="leaderboard-name">${escHtml(name)}</span>
          <span class="leaderboard-badges">🏅${entry.badges_count}</span>
          <span class="leaderboard-stat">🐾${pkmn}</span>
          <span class="leaderboard-stat">✨${leg}</span>
          <!-- money removed from leaderboard -->
        </div>`;
    });
    list.innerHTML = html;
  } catch (e) {
    list.innerHTML = '<div class="leaderboard-error">Не удалось загрузить таблицу лидеров</div>';
  }
}

export function initCloudEvents() {
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('click', openLeaderboard);
  }
  const btnSync = document.getElementById('btn-cloud-sync');
  if (btnSync) {
    btnSync.textContent = state.tgToken ? '☁️ Авто' : '☁️ —';
    btnSync.title = state.tgToken ? 'Авто-синхронизация активна' : 'Оффлайн';
    btnSync.onclick = null; // auto-sync, no manual click needed
  }
  const closeLeaderboard = document.getElementById('btn-close-leaderboard');
  if (closeLeaderboard) {
    closeLeaderboard.addEventListener('click', () => {
      document.getElementById('leaderboard-modal').style.display = 'none';
    });
  }
}
