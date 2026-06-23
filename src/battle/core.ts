import { showToast, showSelectionModal } from '../utils/dom.js';
import { itemDef } from '../utils/items.js';
import { getSpriteUrl, updateBattleSpriteBgs } from '../utils/sprite.js';
import { fetchPokeAPI } from '../utils/api.js';
import { checkEvolution, triggerEvolution } from '../ui/evolution.js';
import { natures } from '../data/natures.js';
import { ITEMS } from '../data/items.js';
import { checkNewMovesOnLevelUp } from '../ui/levelup_moves.js';
import { calculateStat as calcStat, calculateDamage, getTypeMultiplier, applyStatusEffect as applyStatusEffectLogic, cureStatus as cureStatusLogic, checkStatusTurn as checkStatusTurnLogic, applyStatusEndOfTurn as applyStatusEndOfTurnLogic, statStageModify as statStageModifyLogic, checkAccuracy, isStatusImmune, checkSuckerPunchFail, checkSturdy, getMoveCategory } from './logic.js';
import { selectEnemyMove } from './ai.js';
import { store } from '../game/store.js';
import { state } from '../game/state.js';
import { generateUID, getTrainerId } from '../utils/state.js';
import { itemCategory } from '../utils/items.js';
import { getHeldItemName } from '../ui/inventory.js';
import { WEATHERS, WEATHER_ICONS, WEATHER_NAMES, getDailyWeather, getWeatherMultiplier } from '../data/weather.js';
import { QUEST_CONFIGS } from '../data/quests.js';

// Cross-module references (provided by main.ts at runtime)
declare const pcBoxes: any[];
declare function addNotification(title: string, text: string): void;
declare function updateBadgeDisplay(): void;

import { BattleStateMachine, BattlePhase } from './state-machine.js';

/** Singleton state machine — импортируется тестами и main.ts */
export const battle = new BattleStateMachine();

/** Shortcut to battle.state */
const S = battle.state;

// Reference types - mutations visible across modules (lazy Proxy — populated on first access via state)
let _gsCache = null;
const GS = new Proxy({} as Record<string, any>, {
  get(_, prop) {
    if (!_gsCache) _gsCache = state; // Use the central state singleton
    return _gsCache[prop];
  },
  set(_, prop, value) {
    if (!_gsCache) _gsCache = state;
    _gsCache[prop] = value;
    return true;
  }
});
function initBattleRefs() { _gsCache = state; }

// --- BATTLE STATE PERSISTENCE (survives page refresh) ---
function saveBattleState() {
  const s = battle.state;
  if (!s.battleType || s.battleType === 'none') return;
  const state: Record<string, any> = {};
  state.battleType = s.battleType;
  state.locationId = GS.currentLocationId;
  state.activeMonIndex = GS.myTeam.indexOf(s.activePlayerMon);
  state.activeMonCurHP = s.activePlayerMon?.currentHp;
  state.activeMonMovesPP = s.activePlayerMon?.movesPP;
  state.activeMonStatStages = s.activePlayerMon?.statStages;
  state.activeMonChoiceLocked = s.activePlayerMon?.choiceLockedMove;
  state.currentWeather = s.currentWeather;
  state.escapeAttempts = s.escapeAttempts;
  state.battleRound = s.battleRound;
  state.itemsUsedInBattle = GS.itemsUsedInBattle;
  state.playerReflectTurns = s.playerReflectTurns;
  state.playerLightScreenTurns = s.playerLightScreenTurns;
  state.enemyReflectTurns = s.enemyReflectTurns;
  state.enemyLightScreenTurns = s.enemyLightScreenTurns;
  if (s.activeWild) {
    state.wildPkmName = s.activeWild.name;
    state.wildCurHP = s.wildCurHP;
    state.wildMaxHP = s.wildMaxHP;
    state.wildLvl = s.wildLvl;
    state.wildStatus = s.wildStatus;
    state.wildSleepTurns = s.wildSleepTurns;
    state.wildMovesPP = s.wildMovesPP;
    state.wildMovesDetailed = s.wildMovesDetailed;
    state.wildIsShiny = s.activeWild.isShiny;
  }
  if ((s.battleType === 'gym' || s.battleType === 'elite' || s.battleType === 'GS.champion') && s.gymTeamData) {
    state.gymLeaderKey = s.gymLeaderKey;
    state.gymTeamIndex = s.gymTeamIndex;
    state.gymTeamIndexInMember = s.gymTeamIndexInMember;
    state.gymTeamData = s.gymTeamData;
  }
  try { localStorage.setItem(store.lsKey('battle_state'), JSON.stringify(state)); } catch(e) {}
}

function clearBattleState() {
  try { localStorage.removeItem(store.lsKey('battle_state')); } catch(e) {}
  clearScreens();
}

async function restoreBattleState() {
  let state;
  try {
    const raw = localStorage.getItem(store.lsKey('battle_state'));
    if (!raw) return false;
    state = JSON.parse(raw);
  } catch(e) { return false; }

  if (!state.battleType || !state.locationId || state.locationId !== GS.currentLocationId) {
    clearBattleState();
    return false;
  }

  const activeIdx = state.activeMonIndex;
  if (activeIdx === undefined || activeIdx < 0 || activeIdx >= GS.myTeam.length) return false;
  const mon = GS.myTeam[activeIdx];
  if (!mon || mon.currentHp <= 0) return false;

  // Restore player mon state
  S.activePlayerMon = mon;
  mon.currentHp = state.activeMonCurHP;
  if (state.activeMonMovesPP) mon.movesPP = state.activeMonMovesPP;
  if (state.activeMonStatStages) mon.statStages = state.activeMonStatStages;
  if (state.activeMonChoiceLocked !== undefined) mon.choiceLockedMove = state.activeMonChoiceLocked;

  S.battleType = state.battleType;
  S.currentWeather = state.currentWeather || getDailyWeather(GS.currentLocationId);
  S.escapeAttempts = state.escapeAttempts || 0;
  S.battleRound = state.battleRound || 0;
  GS.itemsUsedInBattle = state.itemsUsedInBattle || 0;
  S.playerReflectTurns = state.playerReflectTurns || 0;
  S.playerLightScreenTurns = state.playerLightScreenTurns || 0;
  S.enemyReflectTurns = state.enemyReflectTurns || 0;
  S.enemyLightScreenTurns = state.enemyLightScreenTurns || 0;

  // Restore gym/elite/champion data if present
  if ((S.battleType === 'gym' || S.battleType === 'elite' || S.battleType === 'GS.champion') && state.gymTeamData) {
    S.gymLeaderKey = state.gymLeaderKey || null;
    S.gymTeamIndex = state.gymTeamIndex || 0;
    S.gymTeamIndexInMember = state.gymTeamIndexInMember || 0;
    S.gymTeamData = state.gymTeamData;
  }

  if (S.battleType === 'wild' && state.wildPkmName) {
    try {
      S.activeWild = await fetchPokeAPI(`pokemon/${state.wildPkmName.toLowerCase()}`);
      GS.pokedexSeen.add(S.activeWild.name);
      S.activeWild.isShiny = state.wildIsShiny || false;

      // Fetch species for catch rate
      try {
        const speciesRes = await fetch(S.activeWild.species.url);
        const speciesData = await speciesRes.json();
        S.activeWild.captureRate = speciesData.capture_rate;
        S.activeWild.speciesData = speciesData;
      } catch(e) {}

      S.wildLvl = state.wildLvl;
      S.wildMaxHP = state.wildMaxHP;
      S.wildCurHP = state.wildCurHP;
      S.wildStatus = state.wildStatus;
      S.wildSleepTurns = state.wildSleepTurns || 0;
      S.wildMovesPP = state.wildMovesPP || [];
      S.activeWild.status = S.wildStatus;
      S.activeWild.heldItem = null;
      S.activeWild.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };

      // Fetch wild moves (or restore from saved state)
      if (state.wildMovesDetailed && state.wildMovesDetailed.length > 0) {
        S.wildMovesDetailed = state.wildMovesDetailed;
      } else {
        S.wildMovesDetailed = [];
        const movePromises = [];
        for (let i = 0; i < S.activeWild.moves.length && i < 20; i++) {
          movePromises.push(
            fetchPokeAPI(S.activeWild.moves[i].move.url).catch(() => null)
          );
        }
        const moveResults = await Promise.all(movePromises);
        S.wildMovesDetailed = moveResults.filter(Boolean);
      }

      if (!S.activeWild.wildIVs) {
        S.activeWild.wildIVs = {
          hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32),
          def: Math.floor(Math.random() * 32), spa: Math.floor(Math.random() * 32),
          spd: Math.floor(Math.random() * 32), spe: Math.floor(Math.random() * 32)
        };
      }

      renderBattleUI();
      loadMoveButtons(S.activePlayerMon, useMove);

      document.getElementById('encounter-modal').style.display = 'flex';
      document.getElementById('battle-main-menu').style.display = 'flex';
      document.getElementById('battle-end-menu').style.display = 'none';
      document.getElementById('battle-gym-info').style.display = 'none';

      appendToLog('⚡ Битва восстановлена!', true);
      appendToLog(`Дикий ${S.activeWild.name.toUpperCase()} всё ещё здесь!`, false, 'battle');

      // Restore battle phase so attacks work
      battle.forcePhase(BattlePhase.PLAYER_TURN);
      return true;
    } catch(e) {
      console.error('Failed to restore wild battle:', e);
      clearBattleState();
      return false;
    }
  }

  // Restore gym/elite/champion battle
  if ((S.battleType === 'gym' || S.battleType === 'elite' || S.battleType === 'GS.champion') && S.gymTeamData && state.wildPkmName) {
    try {
      S.activeWild = await fetchPokeAPI(`pokemon/${state.wildPkmName.toLowerCase()}`);
      S.wildLvl = state.wildLvl;
      S.wildMaxHP = state.wildMaxHP;
      S.wildCurHP = state.wildCurHP;
      S.wildStatus = state.wildStatus;
      S.wildSleepTurns = state.wildSleepTurns || 0;
      S.wildMovesPP = state.wildMovesPP || [];
      S.activeWild.status = S.wildStatus;

      // Fetch wild moves (or restore from saved state)
      if (state.wildMovesDetailed && state.wildMovesDetailed.length > 0) {
        S.wildMovesDetailed = state.wildMovesDetailed;
      } else {
        S.wildMovesDetailed = [];
        const movePromises = [];
        for (let i = 0; i < S.activeWild.moves.length && i < 20; i++) {
          movePromises.push(
            fetchPokeAPI(S.activeWild.moves[i].move.url).catch(() => null)
          );
        }
        const moveResults = await Promise.all(movePromises);
        S.wildMovesDetailed = moveResults.filter(Boolean);
      }

      // Fetch gym leader info
      const leader = S.gymLeaderKey ? GS.gymLeaders[S.gymLeaderKey] : null;
      const leaderName = leader?.name || 'Лидер';

      renderBattleUI();
      loadMoveButtons(S.activePlayerMon, useMove);

      document.getElementById('encounter-modal').style.display = 'flex';
      document.getElementById('battle-main-menu').style.display = 'flex';
      document.getElementById('battle-end-menu').style.display = 'none';
      document.getElementById('battle-gym-info').style.display = 'block';
      document.getElementById('gym-leader-battle-name').innerText = `Лидер: ${leaderName}`;
      document.getElementById('battle-gym-info').querySelector('.reborn-gym-training')?.remove();
      document.getElementById('battle-gym-info').style.display = 'block';

      appendToLog('⚡ Битва восстановлена!', true);
      appendToLog(`${leaderName} всё ещё ждёт вас!`, false, 'battle');

      // Restore battle phase so attacks work
      battle.forcePhase(BattlePhase.PLAYER_TURN);
      return true;
    } catch(e) {
      console.error('Failed to restore gym battle:', e);
      clearBattleState();
      return false;
    }
  }

  return false;
}

function renderBattleUI() {
  document.getElementById('wild-name').innerText = S.activeWild.name;
  document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl}`;
  const wildSpriteUrl = getSpriteUrl({ isShiny: S.activeWild.isShiny, apiData: S.activeWild });
  (document.getElementById('wild-sprite') as HTMLImageElement).src = wildSpriteUrl;
  document.getElementById('wild-status-icon').innerText = getStatusIcon(S.wildStatus);
  updateWildHpUI();

  document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
  (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
  document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
  updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
  updatePlayerHpUI();
  updateAbilityDisplay();
}
const MAX_IV = 70;

function calculateStat(pokemon, statName, isWild) {
  const baseStats = isWild ? pokemon.stats : pokemon.apiData.stats;
  const statObj = baseStats.find(s => s.stat.name === statName);
  const base = statObj ? statObj.base_stat : 50;

  const level = isWild ? S.wildLvl : (pokemon.baseLevel + pokemon.candiesEaten);
  const mapName = { 'hp': 'hp', 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' }[statName] || 'hp';

  const iv = isWild ? (pokemon.wildIVs ? pokemon.wildIVs[mapName] : 15) : (pokemon.ivs?.[mapName] ?? 15);
  const ev = isWild ? 0 : pokemon.evs[mapName];

  // Nature modifier (non-HP stats only, player mons only)
  let natureMod = 1.0;
  if (statName !== 'hp' && !isWild && pokemon.natureIdx !== undefined) {
    const nature = natures[pokemon.natureIdx];
    if (nature) {
      if (nature.buff === mapName) natureMod = 1.1;
      else if (nature.nerf === mapName) natureMod = 0.9;
    }
  }

  let result;
  if (statName === 'hp') {
    result = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
  } else {
    result = Math.floor((Math.floor((2 * base + iv + Math.floor(0.25 * ev)) * level / 100) + 5) * natureMod);
  }

  // Apply stat stages
  if (pokemon.statStages) {
    const stageMapName = { 'hp': 'hp', 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' }[statName];
    if (stageMapName && pokemon.statStages[stageMapName] !== undefined) {
      const stage = pokemon.statStages[stageMapName];
      if (stage !== 0) {
        const stageMult = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        if (statName !== 'hp') {
          result = Math.floor(result * stageMult);
        }
      }
    }
  }

  // Choice item stat multipliers
  if (!isWild && pokemon.heldItem) {
    const choiceMap = { 'choiceBand': 'attack', 'choiceScarf': 'speed', 'choiceSpecs': 'special-attack' };
    if (choiceMap[pokemon.heldItem] === statName) {
      result = Math.floor(result * 1.5);
    }
    // thickClub: x2 Atk for Cubone/Marowak
    if (pokemon.heldItem === 'thickClub' && statName === 'attack') {
      const species = pokemon.apiData?.species?.name || pokemon.apiData?.name || '';
      if (species === 'cubone' || species === 'marowak') result = Math.floor(result * 2);
    }
    // eviolite: x1.5 Def/SpDef if can evolve
    if (pokemon.heldItem === 'eviolite' && (statName === 'defense' || statName === 'special-defense')) {
      if (pokemon.apiData?.species?.url) result = Math.floor(result * 1.5);
    }
    // assaultVest: x1.5 SpDef (status move restriction handled elsewhere)
    if (pokemon.heldItem === 'assaultVest' && statName === 'special-defense') {
      result = Math.floor(result * 1.5);
    }
  }

  return result;
}

function appendToLog(text, clear = false, type?) {
  const logEl = document.getElementById('battle-log');
  if (clear) {
    logEl.innerHTML = '';
  }
  const p = document.createElement('p');
  p.innerText = text;
  if (type) p.className = 'chat-' + type;
  logEl.appendChild(p);
  logEl.scrollTop = logEl.scrollHeight;
}

// --- SCREEN / BARRIER HELPERS ---
function modifyScreenTurns(screen, delta, isPlayer) {
  if (screen === 'reflect') {
    if (isPlayer) S.playerReflectTurns = Math.max(0, S.playerReflectTurns + delta);
    else S.enemyReflectTurns = Math.max(0, S.enemyReflectTurns + delta);
  } else if (screen === 'light-screen') {
    if (isPlayer) S.playerLightScreenTurns = Math.max(0, S.playerLightScreenTurns + delta);
    else S.enemyLightScreenTurns = Math.max(0, S.enemyLightScreenTurns + delta);
  }
}

function applyBarrierMod(damage, move, defenderIsPlayer) {
  const isPhysical = move.damage_class?.name === 'physical';
  if (defenderIsPlayer) {
    if (S.playerReflectTurns > 0 && isPhysical) return 0.5;
    if (S.playerLightScreenTurns > 0 && !isPhysical) return 0.5;
  } else {
    if (S.enemyReflectTurns > 0 && isPhysical) return 0.5;
    if (S.enemyLightScreenTurns > 0 && !isPhysical) return 0.5;
  }
  return 1;
}

function clearScreens() {
  S.playerReflectTurns = 0;
  S.playerLightScreenTurns = 0;
  S.enemyReflectTurns = 0;
  S.enemyLightScreenTurns = 0;
  S.protectActive = false;
  S.substituteHP = 0;
  S.enemyProtectActive = false;
  S.enemySubstituteHP = 0;
}

function handlePlayerStatusEffects(move) {
  // Returns true if anything meaningful happened

  // 1. Healing moves (Recover, Roost, Moonlight, Synthesis, etc.)
  const healPct = move.meta?.healing;
  if (healPct) {
    const healAmount = Math.floor(S.activePlayerMon.maxHp * healPct / 100);
    if (healAmount > 0) {
      S.activePlayerMon.currentHp = Math.min(S.activePlayerMon.maxHp, S.activePlayerMon.currentHp + healAmount);
      updatePlayerHpUI();
      appendToLog(`${S.activePlayerMon.apiData.name} восстановил ${healAmount} HP!`, false, 'heal');
    } else {
      appendToLog('Но HP уже полное...');
    }
    return true;
  }

  // 2. Reflect & Light Screen
  if (move.name === 'reflect') {
    S.playerReflectTurns = 5;
    appendToLog(`${S.activePlayerMon.apiData.name} создал Защиту! Физ. урон снижен вдвое.`, false, 'system');
    return true;
  }
  if (move.name === 'light-screen') {
    S.playerLightScreenTurns = 5;
    appendToLog(`${S.activePlayerMon.apiData.name} создал Световой Экран! Спец. урон снижен вдвое.`, false, 'system');
    return true;
  }

  // 3. Protect
  if (move.name === 'protect') {
    S.protectActive = true;
    appendToLog(`${S.activePlayerMon.apiData.name} защищается!`);
    return true;
  }

  // 4. Substitute
  if (move.name === 'substitute') {
    const cost = Math.max(1, Math.floor(S.activePlayerMon.maxHp * 0.25));
    if (S.activePlayerMon.currentHp > cost) {
      S.activePlayerMon.currentHp -= cost;
      S.substituteHP = Math.floor(S.activePlayerMon.maxHp * 0.25);
      updatePlayerHpUI();
      appendToLog(`${S.activePlayerMon.apiData.name} создал Заменителя! (-${cost} HP)`, false, 'system');
    } else {
      appendToLog('Недостаточно HP для создания Заменителя!');
    }
    return true;
  }

  return false;
}

function handleEnemyStatusEffects(move) {
  // Handle status moves used by gym enemy
  // Returns true if anything meaningful happened

  // 1. Healing for enemy
  const healPct = move.meta?.healing;
  if (healPct) {
    const healAmount = Math.floor(S.wildMaxHP * healPct / 100);
    if (healAmount > 0 && S.wildCurHP < S.wildMaxHP) {
      S.wildCurHP = Math.min(S.wildMaxHP, S.wildCurHP + healAmount);
      updateWildHpUI();
      appendToLog(`${S.activeWild.name} восстановил ${healAmount} HP!`, false, 'heal');
    } else {
      appendToLog('Но HP противника уже полное...');
    }
    return true;
  }

  // 2. Reflect & Light Screen
  if (move.name === 'reflect') {
    S.enemyReflectTurns = 5;
    appendToLog(`${S.activeWild.name} создал Защиту! Физ. урон снижен вдвое.`, false, 'system');
    return true;
  }
  if (move.name === 'light-screen') {
    S.enemyLightScreenTurns = 5;
    appendToLog(`${S.activeWild.name} создал Световой Экран! Спец. урон снижен вдвое.`, false, 'system');
    return true;
  }

  // 3. Protect
  if (move.name === 'protect') {
    S.enemyProtectActive = true;
    appendToLog(`${S.activeWild.name} защищается!`);
    return true;
  }

  // 4. Substitute
  if (move.name === 'substitute') {
    const cost = Math.max(1, Math.floor(S.wildMaxHP * 0.25));
    if (S.wildCurHP > cost) {
      S.wildCurHP -= cost;
      S.enemySubstituteHP = Math.floor(S.wildMaxHP * 0.25);
      updateWildHpUI();
      appendToLog(`${S.activeWild.name} создал Заменителя! (-${cost} HP)`, false, 'system');
    } else {
      appendToLog('Недостаточно HP для создания Заменителя!');
    }
    return true;
  }

  // 5. Enemy stat changes (Swords Dance, etc.)
  if (move.stat_changes && move.stat_changes.length > 0) {
    const monName = S.activeWild.name;
    const statNameMap = { 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' };
    move.stat_changes.forEach(sc => {
      const statKey = statNameMap[sc.stat.name];
      if (statKey) {
        statStageModify(S.activeWild, statKey, sc.change);
        const newStage = S.activeWild.statStages[statKey];
        const sign = newStage >= 0 ? '+' : '';
        const dir = sc.change > 0 ? 'повышена' : 'понижена';
        const labels = { atk: 'Атака', def: 'Защита', spa: 'Сп. Атака', spd: 'Сп. Защита', spe: 'Скорость' };
        appendToLog(`${labels[statKey] || statKey} ${monName} ${dir} (${sign}${newStage})`, false, 'system');
      }
    });
    return true;
  }

  // 6. Enemy status ailment on player
  const ailment = move.meta?.ailment?.name;
  if (ailment && ailment !== 'none' && ailment !== 'unknown') {
    const statusMap = {
      'poison': 'psn', 'badly-poison': 'psn',
      'burn': 'brn', 'paralysis': 'par',
      'sleep': 'slp', 'freeze': 'frz'
    };
    const targetStatus = statusMap[ailment];
    if (targetStatus && !S.activePlayerMon.status) {
      if (applyStatusEffect(S.activePlayerMon, targetStatus)) {
        document.getElementById('player-status-icon').innerText = getStatusIcon(targetStatus);
        appendToLog(`${S.activePlayerMon.apiData.name} получил ${STATUS_NAMES[targetStatus] || targetStatus}!`);
        return true;
      } else {
        appendToLog(`Но ${S.activeWild.name} не удалось наложить статус...`);
        return true;
      }
    }
  }

  return false;
}

// --- ABILITY EFFECTS (Feature 2e) ---
function getAbilityName(pokemon, isWild) {
  if (isWild) return pokemon.abilities?.[0]?.ability?.name || null;
  return pokemon.abilityName || null;
}

function statStageModify(pokemon, stat, delta) {
  if (!pokemon.statStages) pokemon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  pokemon.statStages[stat] = Math.max(-6, Math.min(6, (pokemon.statStages[stat] || 0) + delta));
  updateStatBadges();
}

function updateStatBadges() {
  const labels = { atk: 'Атк', def: 'Защ', spa: 'САт', spd: 'СЗа', spe: 'Скр' };
  // Player badges
  const playerEl = document.getElementById('player-stat-badges');
  if (playerEl && S.activePlayerMon?.statStages) {
    playerEl.innerHTML = Object.entries(S.activePlayerMon.statStages as Record<string, number>)
      .filter(([_, v]) => v !== 0)
      .map(([k, v]) => {
        const sign = v > 0 ? '+' : '';
        return `<span class="stat-badge ${v > 0 ? 'positive' : 'negative'}">${labels[k] || k} ${sign}${v}</span>`;
      }).join('');
  }
  // Wild badges
  const wildEl = document.getElementById('wild-stat-badges');
  if (wildEl && S.activeWild?.statStages) {
    wildEl.innerHTML = Object.entries((S.activeWild?.statStages || {}) as Record<string, number>)
      .filter(([_, v]) => v !== 0)
      .map(([k, v]) => {
        const sign = v > 0 ? '+' : '';
        return `<span class="stat-badge ${v > 0 ? 'positive' : 'negative'}">${labels[k] || k} ${sign}${v}</span>`;
      }).join('');
  }
}

// --- BERRIES (Feature 3) ---
function clearUsedItem(mon) {
  if (mon.berries && mon.heldItem) {
    mon.berries[mon.heldItem] = 0; // backward compat
  }
  mon.heldItem = null;
}

function checkBerryAutoUse(mon, isPlayer) {
  if (!mon || !mon.heldItem) return false;

  // Sitrus: HP < 50% -> +25% maxHP
  if (mon.heldItem === 'sitrusBerry' && mon.currentHp < mon.maxHp * 0.5) {
    const heal = Math.floor(mon.maxHp * 0.25);
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + heal);
    clearUsedItem(mon);
    if (isPlayer) updatePlayerHpUI();
    else updateWildHpUI();
    const monName = mon.name || mon.apiData?.name;
    appendToLog(`${monName} восстановил HP с помощью Ситрус Ягоды! (+${heal} HP)`, false, 'heal');
    return true;
  }

  // Oran: HP < 50% -> +10 HP
  if (mon.heldItem === 'oranBerry' && mon.currentHp < mon.maxHp * 0.5) {
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + 10);
    clearUsedItem(mon);
    if (isPlayer) updatePlayerHpUI();
    else updateWildHpUI();
    appendToLog(`${mon.name || mon.apiData?.name} восстановил HP с помощью Оран Ягоды! (+10 HP)`, false, 'heal');
    return true;
  }

  // Lum: any status -> cure
  if (mon.heldItem === 'lumBerry' && mon.status) {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.name || mon.apiData?.name} вылечился с помощью Лум Ягоды!`);
    return true;
  }

  // Chesto: sleep -> cure
  if (mon.heldItem === 'chestoBerry' && mon.status === 'slp') {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.name || mon.apiData?.name} проснулся с помощью Често Ягоды!`);
    return true;
  }

  // Rawst: burn -> cure
  if (mon.heldItem === 'rawstBerry' && mon.status === 'brn') {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.name || mon.apiData?.name} вылечил ожог с помощью Рост Ягоды!`);
    return true;
  }

  // Leftovers: +1/16 maxHP every turn
  // Note: this should be handled at the end of the turn, but for now we'll put it here if we want auto-use
  // Leftovers is not a berry, so it shouldn't be consumed. Wait, this function is for berries!
  // I will leave leftovers out for now until the battle engine has an end-of-turn event.

  return false;
}

function giveBerryToMon(berryType) {
  showToast('Пожалуйста, используйте экипировку (Держит) в профиле покемона для выдачи ягод и предметов!', true);
}

// --- QUESTS (Feature 5) ---
function generateDailyQuests() {
  const today = new Date().toISOString().slice(0, 10);
  const lastGen = localStorage.getItem(store.lsKey('quest_date'));
  if (lastGen === today && GS.quests.length > 0) return;

  const shuffled = [...QUEST_CONFIGS].sort(() => Math.random() - 0.5);
  const newQuests = shuffled.slice(0, 3).map(q => ({
    ...q,
    progress: 0,
    completed: false,
    claimed: false
  }));
  GS.quests.length = 0;
  GS.quests.push(...newQuests);
  Object.keys(GS.questProgress).forEach(k => delete GS.questProgress[k]);
  GS.quests.forEach(q => { GS.questProgress[q.id] = 0; });
  localStorage.setItem(store.lsKey('quest_date'), today);
  store.autoSave();
}

function checkQuestProgress(type, amount?, itemId?) {
  if (amount === undefined) amount = 1;
  GS.quests.forEach(q => {
    if (q.completed || q.claimed) return;
    if (q.type === type) {
      if (type === 'collect_items' && q.targetItem !== itemId) return;
      q.progress = Math.min(q.target, (q.progress || 0) + amount);
      GS.questProgress[q.id] = q.progress;
      if (q.progress >= q.target) {
        q.completed = true;
        appendToLog(`Задание выполнено: ${q.desc}!`, false, 'quest');
      }
    }
  });
  // Also track tutorial GS.quests
  store.checkTutorialProgress(type, amount, itemId);
}

function claimQuestReward(questId) {
  const q = GS.quests.find(x => x.id === questId);
  if (!q || !q.completed || q.claimed) return showToast('Задание уже выполнено или недоступно!', true);
  q.claimed = true;
  const rItems = q.rewardItem ? [{ id: q.rewardItem, qty: q.rewardQty || 1 }] : [];
  store.giveReward(q.rewardMoney, rItems);
  GS.completedQuests.push({ id: questId, date: new Date().toISOString() });
  store.updateMoneyDisplay();
  store.updateInventoryDisplay();
  store.autoSave();
  showToast(`Награда получена: ¥${q.rewardMoney}${q.rewardItem ? ` + ${q.rewardQty}x ${q.rewardItem}` : ''}!`, false);
  renderQuests();
}

function openQuests() {
  const modal = document.getElementById('quest-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  renderQuests();
}

function renderQuests() {
  const list = document.getElementById('quest-list');
  if (!list) return;
  list.innerHTML = '';
  if (GS.quests.length === 0) {
    list.innerHTML = '<div class="quest-empty">Нет активных заданий</div>';
    return;
  }
  GS.quests.forEach(q => {
    const div = document.createElement('div');
    div.className = 'quest-card';
    const pct = q.target > 0 ? Math.round((q.progress / q.target) * 100) : 0;
    div.innerHTML = `
      <div class="quest-desc">${q.desc} (${q.progress}/${q.target})</div>
      <div class="quest-bar-bg"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
      <div class="quest-reward">Награда: ¥${q.rewardMoney}${q.rewardItem ? ` + ${q.rewardQty}x ${itemDef(q.rewardItem).nameRu || q.rewardItem}` : ''}</div>
      ${q.completed && !q.claimed ? '<button class="btn-use quest-claim-btn" data-quest="'+q.id+'">Получить награду</button>' : ''}
      ${q.claimed ? '<span class="quest-claimed">Получено</span>' : ''}
      ${!q.completed ? '<span class="quest-progress">В процессе...</span>' : ''}
    `;
    list.appendChild(div);
  });

  list.querySelectorAll('.quest-claim-btn').forEach(btn => {
    btn.addEventListener('click', () => claimQuestReward(btn.getAttribute('data-quest')));
  });
}

// --- STATUS EFFECTS (NEW) ---
const STATUS_ICONS = {
  psn: '☠️', brn: '🔥', par: '⚡', slp: '💤', frz: '❄️'
};
const STATUS_NAMES = {
  psn: 'Отравление', brn: 'Ожог', par: 'Паралич', slp: 'Сон', frz: 'Заморозка'
};

export const evolutionCache = {};
export const evolvesFromMap = {}; // reverse: species → [prevo names]

export let POKEDEX_ALL = [];
export let pokedexData = {};
export let pokedexTotal = 0;

async function loadPokedexData() {
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'pokedex_data.json');
    pokedexData = await res.json();
    POKEDEX_ALL = Object.keys(pokedexData);
    pokedexTotal = POKEDEX_ALL.length;
  } catch (e) {
    console.warn('Pokedex data load failed, using Kanto only', e);
    POKEDEX_ALL = ['bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard','squirtle','wartortle','blastoise','caterpie','metapod','butterfree','weedle','kakuna','beedrill','pidgey','pidgeotto','pidgeot','rattata','raticate','spearow','fearow','ekans','arbok','pikachu','raichu','sandshrew','sandslash','nidoran-f','nidorina','nidoqueen','nidoran-m','nidorino','nidoking','clefairy','clefable','vulpix','ninetales','jigglypuff','wigglytuff','zubat','golbat','oddish','gloom','vileplume','paras','parasect','venonat','venomoth','diglett','dugtrio','meowth','persian','psyduck','golduck','mankey','primeape','growlithe','arcanine','poliwag','poliwhirl','poliwrath','abra','kadabra','alakazam','machop','machoke','machamp','bellsprout','weepinbell','victreebel','tentacool','tentacruel','geodude','graveler','golem','ponyta','rapidash','slowpoke','slowbro','magnemite','magneton','farfetchd','doduo','dodrio','seel','dewgong','grimer','muk','shellder','cloyster','gastly','haunter','gengar','onix','drowzee','hypno','krabby','kingler','voltorb','electrode','exeggcute','exeggutor','cubone','marowak','hitmonlee','hitmonchan','lickitung','koffing','weezing','rhyhorn','rhydon','chansey','tangela','kangaskhan','horsea','seadra','goldeen','seaking','staryu','starmie','mr-mime','scyther','jynx','electabuzz','magmar','pinsir','tauros','magikarp','gyarados','lapras','ditto','eevee','vaporeon','jolteon','flareon','porygon','omanyte','omastar','kabuto','kabutops','aerodactyl','snorlax','articuno','zapdos','moltres','dratini','dragonair','dragonite','mewtwo','mew'];
    pokedexData = {};
    pokedexTotal = POKEDEX_ALL.length;
  }
}

// GS.pokedexSeen, GS.pokedexCaught, isDaytime are accessed via GS getter

function getStatusIcon(status) {
  return STATUS_ICONS[status] || '';
}

function applyStatusEffect(target, statusType) {
  if (target.status) return false; // already has a status
  target.status = statusType;
  if (statusType === 'slp') {
    target.sleepTurns = Math.floor(Math.random() * 3) + 1; // 1-3 turns
  }
  return true;
}

function cureStatus(target) {
  target.status = null;
  target.sleepTurns = 0;
}

function checkStatusTurn(target, isPlayer) {
  if (!target.status) return true; // can act normally

  if (target.status === 'slp') {
    target.sleepTurns--;
    if (target.sleepTurns <= 0) {
      cureStatus(target);
      appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} проснулся!`, false, 'system');
      return true;
    } else {
      appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} спит... (осталось ${target.sleepTurns} ходов)`, false, 'status');
      return false;
    }
  }

  if (target.status === 'frz') {
    if (Math.random() < 0.2) {
      cureStatus(target);
      appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} оттаял!`, false, 'system');
      return true;
    } else {
      appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} заморожен!`, false, 'status');
      return false;
    }
  }

  if (target.status === 'par') {
    if (Math.random() < 0.25) {
      appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} парализован и не может двигаться!`, false, 'status');
      return false;
    }
    return true;
  }

  return true;
}

function applyStatusEndOfTurn(target, isPlayer) {
  if (!target.status) return;

  if (target.status === 'psn') {
    const dmg = Math.max(1, Math.floor((isPlayer ? S.activePlayerMon.maxHp : S.wildMaxHP) / 8));
    if (isPlayer) {
      S.activePlayerMon.currentHp -= dmg;
      if (S.activePlayerMon.currentHp < 0) S.activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    } else {
      S.wildCurHP -= dmg;
      if (S.wildCurHP < 0) S.wildCurHP = 0;
      updateWildHpUI();
    }
    appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} теряет HP от яда! (-${dmg} HP)`, false, 'dmg');
  }

  if (target.status === 'brn') {
    const dmg = Math.max(1, Math.floor((isPlayer ? S.activePlayerMon.maxHp : S.wildMaxHP) / 16));
    if (isPlayer) {
      S.activePlayerMon.currentHp -= dmg;
      if (S.activePlayerMon.currentHp < 0) S.activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    } else {
      S.wildCurHP -= dmg;
      if (S.wildCurHP < 0) S.wildCurHP = 0;
      updateWildHpUI();
    }
    appendToLog(`${isPlayer ? S.activePlayerMon.apiData.name : S.activeWild.name} теряет HP от ожога! (-${dmg} HP)`, false, 'dmg');
  }
}

// --- SWITCH POKEMON ---
function switchPokemon() {
  const aliveMons = GS.myTeam.filter((mon, i) => mon.currentHp > 0 && mon !== S.activePlayerMon);
  if (aliveMons.length === 0) { showToast('Нет других покемонов для смены!', true); return; }

  const items = aliveMons.map((m) => ({
    label: `Lv.${m.baseLevel + m.candiesEaten} ${m.name || m.apiData?.name}`,
    subtitle: `HP: ${m.currentHp}/${m.maxHp}`
  }));

  showSelectionModal('Выберите покемона', items, (idx) => {
    const newActive = aliveMons[idx];
    const oldActive = S.activePlayerMon;

    // Don't mutate team order — just set active mon
    S.activePlayerMon = newActive;

    // Clear choice lock
    delete S.activePlayerMon.choiceLockedMove;

    appendToLog(`${oldActive.name || oldActive.apiData?.name}, возвращайся! Вперёд, ${newActive.name || newActive.apiData?.name}!`, false, 'switch');

    // Reload move buttons for the new active pokemon
    S.playerMovesDetailed = [];
    const handler = useMove;
    loadMoveButtons(S.activePlayerMon, handler);

    // Update UI
    document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
    (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
    document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
    updatePlayerHpUI();
    updateAbilityDisplay();

    // Enemy gets a turn after switch
    document.getElementById('battle-main-menu').style.display = 'none';
    setTimeout(() => { enemyTurn(); }, 1500);
  }, true);
}

// --- BATTLE SYSTEM ---
// Encounter weight multiplier (higher = more common). Default 1.0
const ENCOUNTER_WEIGHTS = {
  'pidgey': 2.0, 'rattata': 2.0, 'spearow': 1.8, 'zubat': 2.5,
  'caterpie': 2.2, 'weedle': 2.2, 'geodude': 1.5, 'machop': 1.3,
  'oddish': 1.8, 'bellsprout': 1.8, 'venonat': 1.5, 'paras': 1.4,
  'mankey': 1.2, 'diglett': 1.2, 'meowth': 1.5, 'psyduck': 1.3,
  'growlithe': 1.0, 'vulpix': 1.0, 'poliwag': 1.5, 'tentacool': 1.8,
  'slowpoke': 1.2, 'magnemite': 1.2, 'farfetchd': 0.5, 'doduo': 1.2,
  'seel': 1.0, 'shellder': 1.3, 'gastly': 0.8, 'onix': 0.6,
  'drowzee': 1.3, 'krabby': 1.5, 'voltorb': 1.2, 'exeggcute': 1.0,
  'cubone': 1.0, 'hitmonlee': 0.3, 'hitmonchan': 0.3, 'lickitung': 0.5,
  'koffing': 1.3, 'rhyhorn': 1.0, 'chansey': 0.1, 'tangela': 1.0,
  'kangaskhan': 0.15, 'horsea': 1.3, 'goldeen': 1.5, 'staryu': 1.3,
  'scyther': 0.4, 'jynx': 0.4, 'electabuzz': 0.4, 'magmar': 0.4,
  'pinsir': 0.4, 'tauros': 0.3, 'magikarp': 2.5,
  'lapras': 0.2, 'ditto': 0.3, 'eevee': 0.25,
  'porygon': 0.3, 'omanyte': 0.8, 'kabuto': 0.8,
  'aerodactyl': 0.1, 'snorlax': 0.1,
  'dratini': 0.1, 'dragonair': 0.05,
  'grimer': 1.2, 'muk': 0.4, 'weezing': 0.4,
  'haunter': 0.5, 'gengar': 0.05,
  'sentret': 2.0, 'hoothoot': 2.0, 'murkrow': 1.0,
  'spinarak': 1.5, 'chinchou': 1.3, 'mareep': 1.5,
  'sudowoodo': 0.5, 'aipom': 1.0, 'sunkern': 1.5,
  'yanma': 1.0, 'wooper': 1.5, 'misdreavus': 0.6,
  'wobbuffet': 0.5, 'girafarig': 0.8, 'pineco': 1.3,
  'dunsparce': 0.6, 'gligar': 0.8, 'snubbull': 1.5,
  'qwilfish': 1.0, 'shuckle': 0.3, 'heracross': 0.5,
  'sneasel': 0.6, 'teddiursa': 1.2, 'slugma': 1.3,
  'swinub': 1.3, 'corsola': 1.0, 'remoraid': 1.3,
  'delibird': 0.7, 'mantine': 0.7, 'skarmory': 0.4,
  'houndour': 1.0, 'phanpy': 1.2, 'stantler': 0.8,
  'smeargle': 0.4, 'tyrogue': 0.8, 'miltank': 0.5,
  'larvitar': 0.1, 'pupitar': 0.05,
  'poochyena': 2.0, 'zigzagoon': 2.0, 'wurmple': 2.2,
  'lotad': 1.5, 'seedot': 1.5, 'taillow': 2.0,
  'wingull': 2.0, 'ralts': 0.5, 'surskit': 1.3,
  'shroomish': 1.3, 'slakoth': 1.0, 'nincada': 1.2,
  'whismur': 1.8, 'makuhita': 1.3, 'azurill': 1.0,
  'nosepass': 0.8, 'skitty': 1.5, 'sableye': 0.4,
  'mawile': 0.4, 'aron': 1.2, 'meditite': 1.2,
  'electrike': 1.3, 'plusle': 1.0, 'minun': 1.0,
  'volbeat': 1.0, 'illumise': 1.0, 'roselia': 1.0,
  'gulpin': 1.3, 'carvanha': 1.2, 'wailmer': 1.0,
  'numel': 1.3, 'torkoal': 0.5, 'spoink': 1.3,
  'spinda': 1.0, 'trapinch': 0.8, 'cacnea': 1.3,
  'swablu': 1.3, 'zangoose': 0.8, 'seviper': 0.8,
  'lunatone': 0.5, 'solrock': 0.5, 'barboach': 1.3,
  'corphish': 1.3, 'baltoy': 1.0, 'lileep': 0.5,
  'anorith': 0.5, 'feebas': 0.3, 'castform': 0.6,
  'kecleon': 0.5, 'shuppet': 1.0, 'duskull': 1.0,
  'tropius': 0.8, 'chimecho': 0.4, 'absol': 0.3,
  'wynaut': 0.6, 'snorunt': 1.0, 'spheal': 1.3,
  'clamperl': 1.0, 'relicanth': 0.3, 'luvdisc': 1.3,
  'bagon': 0.15, 'shelgon': 0.05, 'combee': 1.2,
  'shellos': 1.5, 'buneary': 1.5, 'cottonee': 1.3,
  'petilil': 1.3, 'sandile': 1.2, 'trubbish': 1.5,
  'minccino': 1.5, 'swirlix': 1.0, 'pancham': 0.8,
  'pangoro': 0.3, 'tynamo': 0.8, 'golett': 0.5,
  // Legendaries — extremely rare (0.01-0.05)
  'articuno': 0.02, 'zapdos': 0.02, 'moltres': 0.02,
  'mewtwo': 0.01, 'mew': 0.01,
  'raikou': 0.02, 'entei': 0.02, 'suicune': 0.02,
  'lugia': 0.01, 'ho-oh': 0.01, 'celebi': 0.01,
  'latias': 0.02, 'latios': 0.02,
  'kyogre': 0.01, 'groudon': 0.01, 'rayquaza': 0.01,
  'jirachi': 0.01, 'deoxys-normal': 0.01,
  'azelf': 0.02, 'dialga': 0.01, 'palkia': 0.01, 'giratina-altered': 0.01,
  'manaphy': 0.01, 'darkrai': 0.01, 'shaymin-land': 0.01,
  // Fully evolved pseudo-legendaries & starters — very rare (0.03-0.05)
  'charizard': 0.05, 'blastoise': 0.05, 'venusaur': 0.05,
  'dragonite': 0.04, 'tyranitar': 0.03,
  'salamence': 0.03, 'metagross': 0.03,
  'garchomp': 0.03, 'hydreigon': 0.03,
};

function pickWeightedEncounter(encountersArray) {
  const hasBell = (GS.inventory || {})['graphiteBell'] > 0;
  const weights = encountersArray.map(name => {
    const base = ENCOUNTER_WEIGHTS[name] || 1.0;
    // Graphite Bell: x3 weight for rare pokemon (weight <= 0.3)
    return (hasBell && base <= 0.3) ? base * 3 : base;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  for (let i = 0; i < encountersArray.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return encountersArray[i];
  }
  return encountersArray[encountersArray.length - 1];
}

function getWildLevel() {
  // Scale by region and location progression
  const loc = store.getLocation(GS.currentLocationId);
  const name = (loc?.name || '').toLowerCase();
  const id = GS.currentLocationId || '';
  // Johto routes: 5-15 for early, scaling up
  if (id.includes('route29') || id.includes('route30') || id.includes('route31') || id.includes('newBark') || id.includes('cherrygrove')) return Math.floor(Math.random() * 11) + 5;
  if (id.includes('goldenrod') && !id.includes('stadium')) return Math.floor(Math.random() * 6) + 5;
  // Johto mid routes: 15-25
  if (id.includes('route34') || id.includes('route35') || id.includes('route36') || id.includes('route37') || id.includes('route38') || id.includes('route39') || id.includes('ilex') || id.includes('nationalPark')) return Math.floor(Math.random() * 11) + 15;
  if (id.includes('ecruteak') || id.includes('olivine') || id.includes('route42') || id.includes('lakeOfRage')) return Math.floor(Math.random() * 11) + 25;
  if (id.includes('blackthorn') || id.includes('mtSilver') || id.includes('route45') || id.includes('icePath')) return Math.floor(Math.random() * 11) + 35;
  // Victory Road / Indigo Plateau: 40-50
  if (id.includes('victory') || id.includes('indigo')) return Math.floor(Math.random() * 11) + 40;
  // Late-game Kanto routes: 30-40
  if (/route_(1[6-9]|2[0-1])/.test(id) || id.includes('cerulean')) return Math.floor(Math.random() * 11) + 30;
  // Mid-game: 20-30
  if (/route_(1[1-6])/.test(id) || id.includes('safari') || id.includes('fuchsia') || id.includes('lavender')) return Math.floor(Math.random() * 11) + 20;
  // Early-mid: 12-22
  if (/route_[6-9]|10/.test(id) || id.includes('saffron') || id.includes('celadon')) return Math.floor(Math.random() * 11) + 12;
  // Early: 8-16
  if (/route_[4-6]/.test(id) || id.includes('route_9') || id.includes('cerulean')) return Math.floor(Math.random() * 9) + 8;
  // Very early: 5-12
  if (/route_[1-2]|22/.test(id) || id.includes('viridian') || id.includes('forest')) return Math.floor(Math.random() * 8) + 5;
  // Starter area: 3-8
  if (id.includes('pallet')) return Math.floor(Math.random() * 6) + 3;
  // Default for other regions
  return Math.floor(Math.random() * 11) + 10;
}

function getLocationEncounters() {
  const loc = store.getLocation(GS.currentLocationId);
  if (!loc) return [];
  let enc = loc.encounters || [];
  if (loc.dayEncounters && GS.isDaytime) enc = loc.dayEncounters;
  else if (loc.nightEncounters && !GS.isDaytime) enc = loc.nightEncounters;

  // Passive fishing: if on water and has a rod, merge fishing encounters
  if (loc.hasWater) {
    const rod = getBestRod();
    if (rod) {
      const fishTable = FISHING_TABLES[rod];
      if (fishTable) {
        const fishNames = fishTable.map(f => ({ name: f.name, level: f.minLvl + Math.floor(Math.random() * (f.maxLvl - f.minLvl + 1)) }));
        enc = [...new Set([...enc, ...fishNames.map(f => f.name)])];
      }
    }
  }

  return enc;
}

function startAutoHunt() {
  if (S.huntActive) return; // prevent duplicate timer loops
  const encounters = getLocationEncounters();
  if (encounters.length === 0) return;

  S.huntActive = true;
  try { localStorage.setItem(store.lsKey('hunt_active'), '1'); } catch(_) {}
  const btn = document.getElementById('btn-hunt-toggle');
  if (btn) {
    btn.classList.add('active');
    btn.title = 'Прекратить поиск';
  }

  const updateHuntBtn = () => {
    if (!btn || !S.huntActive) return;
    const enc = getLocationEncounters();
    if (enc.length > 0) {
      btn.innerHTML = '🔴';
      btn.style.background = '#ff3b30';
      btn.title = 'Прекратить поиск';
    } else {
      btn.innerHTML = '🟢';
      btn.style.background = '#34c759';
      btn.title = 'Поиск... (нет диких покемонов на этой локации)';
    }
  };
  updateHuntBtn();

  const doTick = () => {
    if (!S.huntActive) return;
    if (huntPending) {
      S.huntTimer = setTimeout(doTick, 2000);
      return;
    }
    if (document.getElementById('encounter-modal')?.style.display === 'flex') {
      S.huntTimer = setTimeout(doTick, 2000);
      return;
    }
    if (document.getElementById('elite-modal')?.style.display === 'flex') {
      S.huntTimer = setTimeout(doTick, 2000);
      return;
    }
    const enc = getLocationEncounters();
    if (enc.length === 0) { updateHuntBtn(); S.huntTimer = setTimeout(doTick, 5000); return; }
    updateHuntBtn();
    // 20% base chance every tick
    if (Math.random() < 0.20) {
      const pkmName = pickWeightedEncounter(enc);
      startHunt([pkmName]);
      S.huntTimer = setTimeout(doTick, 3000);
    } else {
      const delay = 3000 + Math.random() * 5000;
      S.huntTimer = setTimeout(doTick, delay);
    }
  };

  S.huntTimer = setTimeout(doTick, 2000 + Math.random() * 3000);
}

function stopAutoHunt() {
  S.huntActive = false;
  try { localStorage.removeItem(store.lsKey('hunt_active')); } catch(_) {}
  if (S.huntTimer) { clearTimeout(S.huntTimer); S.huntTimer = null; }
  const btn = document.getElementById('btn-hunt-toggle');
  if (btn) {
    btn.innerHTML = '⚪';
    btn.classList.remove('active');
    btn.style.background = '';
    btn.title = 'Искать покемонов';
  }
}

// --- FISHING SYSTEM ---
const FISHING_TABLES = {
  oldRod: [
    { name: 'magikarp', minLvl: 5, maxLvl: 10, weight: 70 },
    { name: 'tentacool', minLvl: 5, maxLvl: 10, weight: 30 },
  ],
  goodRod: [
    { name: 'magikarp', minLvl: 10, maxLvl: 15, weight: 30 },
    { name: 'tentacool', minLvl: 10, maxLvl: 15, weight: 20 },
    { name: 'poliwag', minLvl: 10, maxLvl: 20, weight: 15 },
    { name: 'goldeen', minLvl: 10, maxLvl: 20, weight: 15 },
    { name: 'horsea', minLvl: 10, maxLvl: 20, weight: 10 },
    { name: 'shellder', minLvl: 10, maxLvl: 20, weight: 10 },
    { name: 'staryu', minLvl: 10, maxLvl: 20, weight: 10 },
    { name: 'krabby', minLvl: 10, maxLvl: 20, weight: 10 },
  ],
  superRod: [
    { name: 'magikarp', minLvl: 15, maxLvl: 25, weight: 20 },
    { name: 'tentacool', minLvl: 15, maxLvl: 25, weight: 15 },
    { name: 'poliwag', minLvl: 15, maxLvl: 30, weight: 10 },
    { name: 'goldeen', minLvl: 15, maxLvl: 30, weight: 8 },
    { name: 'horsea', minLvl: 15, maxLvl: 30, weight: 8 },
    { name: 'shellder', minLvl: 15, maxLvl: 30, weight: 8 },
    { name: 'staryu', minLvl: 15, maxLvl: 30, weight: 8 },
    { name: 'krabby', minLvl: 15, maxLvl: 30, weight: 8 },
    { name: 'gyarados', minLvl: 20, maxLvl: 40, weight: 5 },
    { name: 'seaking', minLvl: 20, maxLvl: 35, weight: 5 },
    { name: 'seadra', minLvl: 20, maxLvl: 35, weight: 4 },
    { name: 'cloyster', minLvl: 25, maxLvl: 40, weight: 3 },
    { name: 'starmie', minLvl: 25, maxLvl: 40, weight: 3 },
    { name: 'kingler', minLvl: 25, maxLvl: 40, weight: 3 },
    { name: 'lapras', minLvl: 25, maxLvl: 40, weight: 2 },
    { name: 'dratini', minLvl: 15, maxLvl: 30, weight: 2 },
  ]
};

function getBestRod() {
  if (store.getItemQty('superRod') > 0) return 'superRod';
  if (store.getItemQty('goodRod') > 0) return 'goodRod';
  if (store.getItemQty('oldRod') > 0) return 'oldRod';
  return null;
}

let huntPending = false;

async function startHunt(encountersArray) {
  if (huntPending) return;
  huntPending = true;
    GS.itemsUsedInBattle = 0;
    S.battleRound = 0;
    const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
    if (activeMonIndex === -1) {
      huntPending = false;
      return showToast('Вам нужен хотя бы один живой покемон для битвы!', true);
    }

    // Close any previous battle end menu
    document.getElementById('battle-end-menu').style.display = 'none';

    S.battleType = 'wild';
    S.activePlayerMon = GS.myTeam[activeMonIndex];
  S.activePlayerMon.choiceLockedMove = undefined;
  S.currentWeather = getDailyWeather(GS.currentLocationId);

  const modal = document.getElementById('encounter-modal');
  const battleLog = document.getElementById('battle-log');

  document.getElementById('battle-main-menu').style.display = 'flex';
  document.getElementById('battle-end-menu').style.display = 'none';
  document.getElementById('battle-gym-info').style.display = 'none';
  appendToLog('Ищем...', true);
  modal.style.display = 'flex';

  if (!encountersArray || encountersArray.length === 0) { huntPending = false; return showToast('Нет покемонов для поиска на этой локации!', true); }
  const picked = encountersArray[Math.floor(Math.random() * encountersArray.length)];
  const pkmName = typeof picked === 'string' ? picked : picked.name;
  const presetLvl = typeof picked === 'object' ? picked.level : null;

  try {
    S.activeWild = await fetchPokeAPI(`pokemon/${pkmName.toLowerCase()}`);
    GS.pokedexSeen.add(S.activeWild.name);
    S.wildLvl = presetLvl || getWildLevel();
    S.wildStatus = null;
    S.wildSleepTurns = 0;
    S.activeWild.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    S.activeWild.isShiny = (Math.random() < 1/4096);

    // Fetch species data for catch rate & gender
    try {
      const speciesData = await fetchPokeAPI(S.activeWild.species.url);
      S.activeWild.captureRate = speciesData.capture_rate;
      S.activeWild.speciesData = speciesData;
      // Determine wild gender
      if (speciesData.gender_rate === -1) S.activeWild.wildGender = null; // genderless
      else if (speciesData.gender_rate === 0) S.activeWild.wildGender = 'male';
      else if (speciesData.gender_rate === 8) S.activeWild.wildGender = 'female';
      else S.activeWild.wildGender = Math.random() * 8 < speciesData.gender_rate ? 'female' : 'male';
    } catch (e) { /* keep defaults */ }

    S.activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    S.wildMaxHP = calculateStat(S.activeWild, 'hp', true);
    S.wildCurHP = S.wildMaxHP;
    S.escapeAttempts = 0;

    // 5% chance wild pokemon holds a random berry
    S.activeWild.heldItem = Math.random() < 0.05
      ? ['sitrusBerry', 'oranBerry', 'lumBerry', 'chestoBerry', 'rawstBerry'][Math.floor(Math.random() * 5)]
      : null;
    S.activeWild.berries = S.activeWild.heldItem
      ? { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0, [S.activeWild.heldItem]: 1 }
      : { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };

    S.wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < S.activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetchPokeAPI(S.activeWild.moves[i].move.url).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    S.wildMovesDetailed = moveResults.filter(Boolean);
    S.wildMovesPP = S.wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = S.activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl}`;
    const wildSpriteUrl = getSpriteUrl({ apiData: S.activeWild, isShiny: S.activeWild.isShiny || false });
    (document.getElementById('wild-sprite') as HTMLImageElement).src = wildSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
    (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
    updatePlayerHpUI();

    appendToLog(`Дикий ${S.activeWild.name.toUpperCase()} нападает!`, false, 'battle');
    appendToLog(`Погода: ${WEATHER_ICONS[S.currentWeather]} ${WEATHER_NAMES[S.currentWeather]}`, false, 'system');

    // Intimidate check
    const wildAbility = S.activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(S.activePlayerMon, 'atk', -1);
      appendToLog(`${S.activeWild.name} отпугивает ${S.activePlayerMon.apiData.name}! Атака снижена!`);
    }

    S.playerMovesDetailed = [];
    loadMoveButtons(S.activePlayerMon, useMove);

    battle.transition(BattlePhase.WILD_START);
    battle.transition(BattlePhase.PLAYER_TURN);

  } catch (e) {
    battleLog.innerText = 'Ошибка загрузки...';
    setTimeout(() => { modal.style.display = 'none'; }, 1000);
  } finally {
    huntPending = false;
  }
}

function loadMoveButtons(activeMon, clickHandler) {
  S.playerMovesDetailed = [];

  // Use the 4-slot moveset directly from apiData.moves (matches team page display)
  const knownMoves = [];
  if (activeMon.apiData?.moves) {
    for (let i = 0; i < 4; i++) {
      const entry = activeMon.apiData.moves[i];
      if (entry?.move?.url) {
        knownMoves.push(entry);
      }
    }
  }

  for (let i = 0; i < 4; i++) {
    const mBtn = document.getElementById(`move-btn-${i}`);
    const moveEntry = knownMoves[i];
    if (moveEntry) {
      mBtn.innerText = '...';
      mBtn.classList.add('disabled');
      mBtn.onclick = null;
      fetchPokeAPI(moveEntry.move.url)
        .then(d => {
          S.playerMovesDetailed[i] = d;
          if (!activeMon.movesPP) activeMon.movesPP = [];
          if (!activeMon.movesPP[i]) {
            activeMon.movesPP[i] = { current: d.pp || 30, max: d.pp || 30 };
          }
          mBtn.innerText = d.name || moveEntry.move.name;
          mBtn.classList.remove('disabled');
          mBtn.onclick = () => clickHandler(i);
          updateMoveButtonUI(i, d);
        })
        .catch(() => {
          mBtn.innerText = moveEntry.move.name;
          mBtn.classList.remove('disabled');
          mBtn.onclick = () => clickHandler(i);
        });
    } else {
      mBtn.innerText = '-';
      mBtn.classList.add('disabled');
      mBtn.onclick = null;
    }
  }
}

function updateMoveButtonUI(index, moveData) {
  if (!S.activePlayerMon.movesPP || !S.activePlayerMon.movesPP[index]) return;
  const pp = S.activePlayerMon.movesPP[index];
  const mBtn = document.getElementById(`move-btn-${index}`);
  if (!mBtn) return;
  mBtn.classList.remove('move-type-physical', 'move-type-special', 'move-type-status');
  if (moveData.damage_class?.name) {
    mBtn.classList.add(`move-type-${moveData.damage_class.name}`);
  }
  if (pp.current <= 0) {
    mBtn.innerText = `${moveData.name} (PP: 0/${pp.max})`;
    mBtn.classList.add('disabled');
  } else {
    mBtn.innerText = `${moveData.name} (PP: ${pp.current}/${pp.max})`;
  }
}

function updateMoveButtonUIs() {
  for (let i = 0; i < 4; i++) {
    if (S.playerMovesDetailed[i]) {
      updateMoveButtonUI(i, S.playerMovesDetailed[i]);
    }
  }
}

function updateAbilityDisplay() {
  if (S.activePlayerMon) {
    const abilityName = getAbilityName(S.activePlayerMon, false);
    document.getElementById('player-ability').innerText = abilityName ? `【${abilityName}】` : '';
  }
  if (S.activeWild) {
    const wildAbility = S.activeWild.abilities?.[0]?.ability?.name || '';
    document.getElementById('wild-ability').innerText = wildAbility ? `【${wildAbility}】` : '';
  }
}

function updateWildHpUI() {
  document.getElementById('wild-hp-text').innerText = `${S.wildCurHP}/${S.wildMaxHP}`;
  const pct = Math.max(0, (S.wildCurHP / S.wildMaxHP) * 100);
  const bar = document.getElementById('wild-hp-fill');
  bar.style.width = `${pct}%`;
  bar.className = 'reborn-hp-fill';
  if (pct <= 20) bar.classList.add('hp-low');
  else if (pct <= 50) bar.classList.add('hp-medium');
}

function updatePlayerHpUI() {
  if (!S.activePlayerMon) return;
  document.getElementById('player-hp-text').innerText = `${S.activePlayerMon.currentHp}/${S.activePlayerMon.maxHp}`;
  const pct = Math.max(0, (S.activePlayerMon.currentHp / S.activePlayerMon.maxHp) * 100);
  const bar = document.getElementById('player-hp-fill');
  bar.style.width = `${pct}%`;
  bar.className = 'reborn-hp-fill';
  if (pct <= 20) bar.classList.add('hp-low');
  else if (pct <= 50) bar.classList.add('hp-medium');

  const expToCurrent = Math.pow(S.activePlayerMon.baseLevel, 3);
  const expToNext = S.activePlayerMon.expToNext || Math.pow(S.activePlayerMon.baseLevel + 1, 3);
  let expPct = ((S.activePlayerMon.exp - expToCurrent) / (expToNext - expToCurrent)) * 100;
  if (expPct < 0) expPct = 0;
  if (expPct > 100) expPct = 100;

  const expFill = document.getElementById('player-exp-fill');
  if (expFill) expFill.style.width = `${expPct}%`;
}

// ── Shared wild pokemon reward logic ──
// Collects drop items for a defeated wild mon. Used by both useMove and enemyTurn paths.
function getWildDropItems() {
  const rItems = [];
  const dropResults = store.processMonsterDrop(S.activeWild.name);
  if (dropResults.length > 0) {
    dropResults.forEach(d => rItems.push({id: d.item, qty: d.qty}));
    const dropText = dropResults.map(d => `${d.qty}x ${itemDef(d.item).nameRu}`).join(', ');
    appendToLog(`Добыча: ${dropText}`, false, 'quest');
  }
  return rItems;
}

// ── Shared wild faint reward logic (used by useMove and enemyTurn) ──
async function handleWildFaintRewards(isWild: boolean) {
  if (isWild) {
    appendToLog(`Дикий ${S.activeWild.name} побежден!`);
    checkQuestProgress('defeat_x');
    const rItems = getWildDropItems();
    store.giveReward(S.wildLvl * 20 + 50, rItems);
    checkQuestProgress('earn_money', S.wildLvl * 20 + 50);
  } else {
    appendToLog(`${S.activeWild.name} побежден!`);
    if (S.battleType === 'gym') S.gymTeamIndex++;
    else S.gymTeamIndexInMember++;
  }

  // EXP: not given for gym battles, given for wild and elite/champion
  if (S.battleType !== 'gym') {
    const baseExp = S.activeWild.base_experience || 50;
    let expGain = Math.floor((baseExp * S.wildLvl) / 7);
    if (S.activePlayerMon.heldItem === 'luckyEgg') expGain = Math.floor(expGain * 1.5);
    if (S.activePlayerMon.exp === undefined) {
      S.activePlayerMon.exp = Math.pow(S.activePlayerMon.baseLevel, 3);
      S.activePlayerMon.expToNext = Math.pow(S.activePlayerMon.baseLevel + 1, 3);
    }
    const lvl = S.activePlayerMon.baseLevel + (S.activePlayerMon.candiesEaten || 0);
    if (lvl < 100) {
      S.activePlayerMon.exp += expGain;
      appendToLog(`${S.activePlayerMon.apiData.name} получил ${expGain} EXP!`);
    }
    if (GS.expShareActive) {
      const shareExp = Math.floor(expGain / 2);
      GS.myTeam.forEach(mon => {
        if (mon !== S.activePlayerMon && mon.currentHp > 0 && (mon.baseLevel + (mon.candiesEaten || 0)) < 100) {
          if (mon.exp === undefined) {
            mon.exp = Math.pow(mon.baseLevel, 3);
            mon.expToNext = Math.pow(mon.baseLevel + 1, 3);
          }
          mon.exp += shareExp;
          while (mon.exp >= mon.expToNext && (mon.baseLevel + (mon.candiesEaten || 0)) < 100) {
            mon.baseLevel++;
            mon.expToNext = Math.pow(mon.baseLevel + 1, 3);
            const oldMax = mon.maxHp;
            const newMax = calculateStat(mon, 'hp', false);
            mon.maxHp = newMax;
            mon.currentHp += (newMax - oldMax);
          }
        }
      });
      if (shareExp > 0) appendToLog(`Остальная команда получила по ${shareExp} EXP!`);
    }
    while (S.activePlayerMon.exp >= S.activePlayerMon.expToNext && S.activePlayerMon.baseLevel < 100) {
      S.activePlayerMon.baseLevel++;
      S.activePlayerMon.expToNext = Math.pow(S.activePlayerMon.baseLevel + 1, 3);
      const oldMax = S.activePlayerMon.maxHp;
      const newMax = calculateStat(S.activePlayerMon, 'hp', false);
      S.activePlayerMon.maxHp = newMax;
      S.activePlayerMon.currentHp += (newMax - oldMax);
      appendToLog(`${S.activePlayerMon.apiData.name} достиг ${S.activePlayerMon.baseLevel} уровня!`);
      await checkNewMovesOnLevelUp(S.activePlayerMon, S.activePlayerMon.baseLevel);
    }
    const evoTarget = await checkEvolution(S.activePlayerMon);
    if (evoTarget) {
      await triggerEvolution(S.activePlayerMon, evoTarget.name);
      updatePlayerHpUI();
    }
  }

  if (isWild) {
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    clearBattleState();
    store.updateInventoryDisplay();
    store.updateMoneyDisplay();
    store.autoSave();
  } else {
    setTimeout(() => {
      if (S.battleType === 'gym') startGymNextPokemon();
      else if (S.battleType === 'elite') startEliteNextPokemon();
      else if (S.battleType === 'GS.champion') startChampionNextPokemon();
    }, 1000);
  }
}

async function useMove(moveIndex) {
  const move = S.playerMovesDetailed[moveIndex];
  if (!move) return;

  // Check PP
  if (S.activePlayerMon.movesPP && S.activePlayerMon.movesPP[moveIndex]) {
    if (S.activePlayerMon.movesPP[moveIndex].current <= 0) {
      appendToLog('Нет PP для этой атаки!');
      return;
    }
  }

  // Choice item move lock
  const choiceItems = ['choiceBand', 'choiceScarf', 'choiceSpecs'];
  if (choiceItems.includes(S.activePlayerMon.heldItem) && S.activePlayerMon.choiceLockedMove !== undefined && S.activePlayerMon.choiceLockedMove !== moveIndex) {
    appendToLog('Можно использовать только выбранную атаку!');
    return;
  }

  // Get power for early checks before phase transition
  const power = move.power;
  // Assault Vest: can't use status moves (check before phase transition to avoid deadlock)
  if (!power && S.activePlayerMon.heldItem === 'assaultVest') {
    appendToLog('Штурмовой жилет не позволяет использовать статус-атаки!');
    return;
  }

  // Phase validation (after all early-return checks to avoid freezing state machine)
  if (!battle.canTransition(BattlePhase.ENEMY_TURN)) {
    appendToLog('Подождите... битва ещё не готова.');
    return;
  }
  battle.transition(BattlePhase.ENEMY_TURN);

  // Check player status before attacking (and before consuming PP)
  if (!checkStatusTurn(S.activePlayerMon, true)) {
    document.getElementById('battle-main-menu').style.display = 'none';
    // Apply end-of-turn status damage before enemy
    applyStatusEndOfTurn(S.activePlayerMon, true);
    if (S.activePlayerMon.currentHp <= 0) {
      appendToLog(`${S.activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
      handlePlayerFaint();
      return;
    }
    saveBattleState();
    setTimeout(() => { enemyTurn(); }, 1000);
    return;
  }

  // Decrement PP
  if (S.activePlayerMon.movesPP && S.activePlayerMon.movesPP[moveIndex]) {
    S.activePlayerMon.movesPP[moveIndex].current--;
  }

  // Choice item move lock
  if (choiceItems.includes(S.activePlayerMon.heldItem)) {
    S.activePlayerMon.choiceLockedMove = moveIndex;
  }

  // Accuracy check
  const accResult = checkAccuracy(move);
  if (!accResult.hit) {
    appendToLog(accResult.message);
    document.getElementById('battle-main-menu').style.display = 'none';
    saveBattleState();
    setTimeout(() => { enemyTurn(); }, 1000);
    return;
  }

  // Sucker Punch: fail if opponent uses status move
  if (checkSuckerPunchFail(move, S.enemyChosenMove)) {
    appendToLog(`${S.activePlayerMon.apiData.name} использовал Sucker Punch, но провалился!`);
    document.getElementById('battle-main-menu').style.display = 'none';
    saveBattleState();
    setTimeout(() => { enemyTurn(); }, 1000);
    return;
  }

  appendToLog(`${S.activePlayerMon.apiData.name} использует ${move.name}!`);

  if (!power) {
    // Status move - try apply status effect or stat change
    const ailment = move.meta?.ailment?.name;
    if (ailment && ailment !== 'none' && ailment !== 'unknown') {
      const statusMap = {
        'poison': 'psn', 'badly-poison': 'psn',
        'burn': 'brn', 'paralysis': 'par',
        'sleep': 'slp', 'freeze': 'frz'
      };
      const targetStatus = statusMap[ailment];
      if (targetStatus && !S.wildStatus) {
        // Check type/ability immunity before applying
        if (isStatusImmune(ailment, S.activeWild)) {
          appendToLog(`У дикого ${S.activeWild.name} иммунитет к ${STATUS_NAMES[targetStatus] || targetStatus}!`);
        } else if (applyStatusEffect(S.activeWild, targetStatus)) {
          S.wildStatus = S.activeWild.status;
          document.getElementById('wild-status-icon').innerText = getStatusIcon(S.wildStatus);
          appendToLog(`Дикий ${S.activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
        }
      }
    }

    let appliedStat = false;
    if (move.stat_changes && move.stat_changes.length > 0) {
      const targetMap = { 'user': S.activePlayerMon, 'selected-pokemon': S.activeWild, 'all-opponents': S.activeWild };
      const moveTarget = move.target?.name || 'selected-pokemon';
      const affectedMon = targetMap[moveTarget] || S.activeWild;
      const monName = affectedMon === S.activePlayerMon ? S.activePlayerMon.apiData.name : S.activeWild.name;
      const statNameMap = { 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' };
      
      move.stat_changes.forEach(sc => {
        const statKey = statNameMap[sc.stat.name];
        if (statKey) {
          statStageModify(affectedMon, statKey, sc.change);
          const newStage = affectedMon.statStages[statKey];
          const sign = newStage >= 0 ? '+' : '';
          const dir = sc.change > 0 ? 'повышена' : 'понижена';
          const labels = { atk: 'Атака', def: 'Защита', spa: 'Сп. Атака', spd: 'Сп. Защита', spe: 'Скорость' };
          appendToLog(`${labels[statKey] || statKey} ${monName} ${dir} (${sign}${newStage})`, false, 'system');
          appliedStat = true;
        }
      });
    }

    // Role Play: copy target ability
    if (move.name === 'role-play') {
      const targetAbility = S.activeWild.abilities?.[0]?.ability?.name;
      if (targetAbility) {
        S.activePlayerMon.abilityName = targetAbility;
        appendToLog(`${S.activePlayerMon.apiData.name} скопировал способность ${S.activeWild.name}: ${targetAbility}!`);
        updateAbilityDisplay();
      } else {
        appendToLog('Но не удалось скопировать способность...');
      }
      appliedStat = true;
    }

    // Check special status effects (healing, Reflect, Light Screen, Protect, Substitute)
    const appliedSpecial = handlePlayerStatusEffects(move);

    if (!appliedSpecial && !appliedStat && (!ailment || ailment === 'none' || ailment === 'unknown')) {
      appendToLog('Но ничего не произошло...');
    }
  } else {
    // Check enemy Protect
    if (S.enemyProtectActive) {
      appendToLog(`${S.activeWild.name} защитился от атаки!`);
      S.enemyProtectActive = false;
      document.getElementById('battle-main-menu').style.display = 'none';
      saveBattleState();
      setTimeout(() => { enemyTurn(); }, 1000);
      return;
    }
    // Substitute absorbs damage
    if (S.enemySubstituteHP > 0) {
      appendToLog(`${S.activeWild.name} защищается Заменителем!`);
    }

    // Calculate damage via pure function
    const curLvl = S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten;
    const leekCrit = S.activePlayerMon.heldItem === 'stick' && ['farfetchd', 'sirfetchd'].includes(S.activePlayerMon.apiData?.species?.name || '');
    const dmgResult = calculateDamage({
      move,
      attacker: S.activePlayerMon,
      defender: S.activeWild,
      attackerLevel: curLvl,
      defenderLevel: S.wildLvl,
      isWildAttacker: false,
      isWildDefender: true,
      weather: S.currentWeather,
      attackerStatStages: S.activePlayerMon.statStages,
      defenderStatStages: S.activeWild.statStages,
      attackerHeldItem: S.activePlayerMon.heldItem,
      defenderHeldItem: S.activeWild.heldItem,
      naturesList: natures,
      alwaysCrit: leekCrit ? Math.random() < 0.5 : false,
    });
    let dmg = dmgResult.damage;
    const bMod = applyBarrierMod(1, move, false);
    if (bMod !== 1) dmg = Math.floor(dmg * bMod);
    for (const msg of dmgResult.messages) {
      appendToLog(msg, false, 'dmg');
    }
    const isPhysical = move.damage_class.name === 'physical';

    // Focus Sash: survive at 1 HP (consumed on use)
    if (S.activeWild.heldItem === 'focusSash' && S.wildCurHP === S.wildMaxHP && dmg >= S.wildCurHP) {
      dmg = S.wildCurHP - 1;
      appendToLog(`${S.activeWild.name} держится благодаря Фокусному поясу!`);
      S.activeWild.heldItem = null;
    }

    const preWildHP = S.wildCurHP;
    // Substitute absorbs damage
    if (S.enemySubstituteHP > 0) {
      const subDmg = Math.min(S.enemySubstituteHP, dmg);
      S.enemySubstituteHP -= subDmg;
      dmg -= subDmg;
      if (dmg > 0) appendToLog(`Заменитель поглотил ${subDmg} урона!`);
      if (S.enemySubstituteHP <= 0) {
        appendToLog('Заменитель разрушен!');
        S.enemySubstituteHP = 0;
      }
    }
    S.wildCurHP -= dmg;
    if (S.wildCurHP < 0) S.wildCurHP = 0;

    // Drain healing (Absorb, Giga Drain, etc.)
    if (move.meta?.drain > 0) {
      const drainPct = move.meta.drain / 100;
      let heal = Math.floor(dmg * drainPct);
      // Big Root: x1.3 drain healing
      if (S.activePlayerMon.heldItem === 'bigRoot') {
        heal = Math.floor(heal * 1.3);
      }
      if (heal > 0) {
        S.activePlayerMon.currentHp = Math.min(S.activePlayerMon.maxHp, S.activePlayerMon.currentHp + heal);
        updatePlayerHpUI();
      }
    }

    // Life Orb recoil: -10% max HP
    if (S.activePlayerMon.heldItem === 'lifeOrb' && power) {
      const recoil = Math.max(1, Math.floor(S.activePlayerMon.maxHp / 10));
      S.activePlayerMon.currentHp -= recoil;
      if (S.activePlayerMon.currentHp < 0) S.activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    }

    // Sturdy check: survive OHKO only if at full HP before the hit
    const wildAbil = S.activeWild.abilities?.[0]?.ability?.name;
    if (checkSturdy(wildAbil, preWildHP, S.wildMaxHP, S.wildCurHP)) {
      S.wildCurHP = 1;
      appendToLog(`${S.activeWild.name} выдерживает удар благодаря Прочной Броне!`);
    }

    updateWildHpUI();

    appendToLog(`Нанесено ${dmg} урона!`, false, 'dmg');


    // Apply secondary status effect from move (only if wild still alive)
    if (S.wildCurHP > 0 && move.meta && move.meta.ailment && move.meta.ailment.name !== 'none' && move.meta.ailment.name !== 'unknown') {
      const chance = move.meta.ailment_chance || 10;
      if (Math.random() * 100 < chance) {
        const statusMap = {
          'poison': 'psn', 'badly-poison': 'psn',
          'burn': 'brn', 'paralysis': 'par',
          'sleep': 'slp', 'freeze': 'frz'
        };
        const targetStatus = statusMap[move.meta.ailment.name];
        if (targetStatus && !S.wildStatus && !isStatusImmune(move.meta.ailment.name, S.activeWild)) {
          if (applyStatusEffect(S.activeWild, targetStatus)) {
            S.wildStatus = S.activeWild.status;
            document.getElementById('wild-status-icon').innerText = getStatusIcon(S.wildStatus);
            appendToLog(`Дикий ${S.activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
          }
        }
      }
    }

    // Static / Flame Body / Poison Point: 30% on physical contact (check type immunity)
    const wildAbilityContact = S.activeWild.abilities?.[0]?.ability?.name;
    if (power && isPhysical && ['static', 'flame-body', 'poison-point'].includes(wildAbilityContact)) {
      const statusMapAbility = { 'static': 'par', 'flame-body': 'brn', 'poison-point': 'psn' };
      if (!S.activePlayerMon.status && Math.random() < 0.3) {
        const st = statusMapAbility[wildAbilityContact];
        const ailmentName = { 'par': 'paralysis', 'brn': 'burn', 'psn': 'poison' }[st];
        if (ailmentName && !isStatusImmune(ailmentName, S.activePlayerMon) && applyStatusEffect(S.activePlayerMon, st)) {
          document.getElementById('player-status-icon').innerText = getStatusIcon(st);
          appendToLog(`${S.activePlayerMon.apiData.name} получил ${STATUS_NAMES[st]} от способности ${S.activeWild.name}!`);
        }
      }
    }

    // Berry auto-use for wild
    if (S.wildCurHP > 0) checkBerryAutoUse(S.activeWild, false);

    // Rough Skin / Iron Barbs: 1/8 recoil on physical contact
    if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(wildAbilityContact)) {
      const recoil = Math.max(1, Math.floor(dmg / 8));
      S.activePlayerMon.currentHp -= recoil;
      if (S.activePlayerMon.currentHp < 0) S.activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
      appendToLog(`Шиповатое тело ${S.activeWild.name} ранит ${S.activePlayerMon.apiData.name}! (-${recoil} HP)`);
    }
  }

  document.getElementById('battle-main-menu').style.display = 'none';

  if (S.activePlayerMon.currentHp <= 0) {
    appendToLog(`${S.activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
    handlePlayerFaint();
    return;
  }

  if (S.wildCurHP === 0) {
    await handleWildFaintRewards(S.battleType === 'wild');
  } else {
    setTimeout(() => { enemyTurn(); }, 1000);
  }
}

function handlePlayerFaint() {
  const isGym = S.battleType !== 'wild';
  const nextMon = GS.myTeam.find(m => m.currentHp > 0 && m !== S.activePlayerMon);
  if (nextMon) {
    S.activePlayerMon = nextMon;
    S.activePlayerMon.choiceLockedMove = undefined;
    appendToLog(`${S.activePlayerMon.apiData.name}, вперёд!`);
    document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
    (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
    updatePlayerHpUI();
    updateAbilityDisplay();
    loadMoveButtons(S.activePlayerMon, useMove);
    saveBattleState();
    setTimeout(() => { document.getElementById('battle-main-menu').style.display = 'flex'; }, 1000);
    store.autoSave();
  } else {
    appendToLog(isGym ? 'Вся команда потеряла сознание... Вы проиграли лидеру.' : 'Вся команда потеряла сознание... Вы проиграли.');
    if (isGym) {
      S.gymTeamIndex = 0;
      S.gymTeamIndexInMember = 0;
      S.gymTeamData = null;
      S.battleType = 'wild';
    }
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    clearBattleState();
    store.autoSave();
  }
}

/** Показать меню боя и перевести фазу в PLAYER_TURN */
function showPlayerMenu() {
  document.getElementById('battle-main-menu').style.display = 'flex';
  battle.transition(BattlePhase.PLAYER_TURN);
}

async function enemyTurn() {
  battle.transition(BattlePhase.ENEMY_TURN);
  // Wild end-of-turn damage (poison/burn) — applies once per round at start of enemy turn
  applyStatusEndOfTurn(S.activeWild, false);
  if (S.wildCurHP <= 0) {
    await handleWildFaintRewards(S.battleType === 'wild');
    return;
  }

  // Check wild status (sleep/freeze/paralysis) after EoT damage
  const wildCanAct = checkStatusTurn(S.activeWild, false);
  if (!wildCanAct) {
    S.battleRound++;
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
    return;
  }

  const aiResult = selectEnemyMove({
    moves: S.wildMovesDetailed,
    movesPP: S.wildMovesPP,
    attacker: S.activeWild,
    defender: S.activePlayerMon,
    isTrainer: S.battleType !== 'wild',
    getTypeMultiplier,
  });
  const chosenMove = aiResult?.move || { power: 30, damage_class: { name: 'physical' }, type: { name: 'normal' }, name: 'Атака' };
  const chosenIdx = aiResult?.index ?? -1;
  const isT = S.battleType !== 'wild';
  S.enemyChosenMove = chosenMove;
  const enemyMoveName = chosenMove.name || 'Атака';
  if (chosenIdx >= 0 && S.wildMovesPP && S.wildMovesPP[chosenIdx]) {
    S.wildMovesPP[chosenIdx].current--;
  }

  // Accuracy check for enemy move
  const enemyAcc = checkAccuracy(chosenMove);
  if (!enemyAcc.hit) {
    appendToLog(`${isT ? '' : 'Дикий '}${S.activeWild.name} использует ${enemyMoveName}, но промахнулся!`);
    S.battleRound++;
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
    return;
  }
  const power = chosenMove.power;

  // Handle status moves (no power)
  if (!power) {
    appendToLog(`${isT ? '' : 'Дикий '}${S.activeWild.name} использует ${enemyMoveName}!`);
    handleEnemyStatusEffects(chosenMove);
    S.battleRound++;
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
    return;
  }

  // Player Protect check
  if (S.protectActive && power) {
    appendToLog(`${S.activePlayerMon.apiData.name} защитился от атаки!`);
    S.protectActive = false;
    S.battleRound++;
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
    return;
  }

  // Calculate damage via pure function
  const dmgResult = calculateDamage({
    move: chosenMove,
    attacker: S.activeWild,
    defender: S.activePlayerMon,
    attackerLevel: S.wildLvl,
    defenderLevel: S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten,
    isWildAttacker: true,
    isWildDefender: false,
    weather: S.currentWeather,
    attackerStatStages: S.activeWild.statStages,
    defenderStatStages: S.activePlayerMon.statStages,
    attackerHeldItem: S.activeWild.heldItem,
    defenderHeldItem: S.activePlayerMon.heldItem,
    naturesList: natures,
  });
  let dmg = dmgResult.damage;
  const bMod = applyBarrierMod(1, chosenMove, true);
  if (bMod !== 1) dmg = Math.floor(dmg * bMod);
  for (const msg of dmgResult.messages) {
    appendToLog(msg, false, 'dmg');
  }
  const isPhysical = chosenMove.damage_class.name === 'physical';

  // Focus Sash: player survives at 1 HP (consumed on use)
  if (S.activePlayerMon.heldItem === 'focusSash' && S.activePlayerMon.currentHp === S.activePlayerMon.maxHp && dmg >= S.activePlayerMon.currentHp) {
    dmg = S.activePlayerMon.currentHp - 1;
    appendToLog(`${S.activePlayerMon.apiData.name} держится благодаря Фокусному поясу!`);
    S.activePlayerMon.heldItem = null;
  }

  // Player Substitute absorbs damage
  if (S.substituteHP > 0 && dmg > 0) {
    const subBlock = Math.min(S.substituteHP, dmg);
    S.substituteHP -= subBlock;
    dmg -= subBlock;
    appendToLog(`Заменитель поглотил ${subBlock} урона!`);
    if (S.substituteHP <= 0) {
      appendToLog('Заменитель разрушен!');
      S.substituteHP = 0;
    }
  }

  appendToLog(`${isT ? '' : 'Дикий '}${S.activeWild.name} использует ${enemyMoveName}! (-${dmg} HP)`, false, 'dmg');
  S.activePlayerMon.currentHp -= dmg;
  if (S.activePlayerMon.currentHp < 0) S.activePlayerMon.currentHp = 0;
  updatePlayerHpUI();

  // Rocky Helmet: 1/6 max HP recoil on contact
  if (power && isPhysical && S.activePlayerMon.heldItem === 'rockyHelmet') {
    const recoil = Math.max(1, Math.floor(S.wildMaxHP / 6));
    S.wildCurHP -= recoil;
    if (S.wildCurHP < 0) S.wildCurHP = 0;
    updateWildHpUI();
    appendToLog(`Каменный шлем ${S.activePlayerMon.apiData.name} ранит ${S.activeWild.name}! (-${recoil} HP)`);
  }

  // Wild lifeOrb recoil
  if (S.activeWild.heldItem === 'lifeOrb' && power) {
    S.wildCurHP -= Math.max(1, Math.floor(S.wildMaxHP / 10));
    if (S.wildCurHP < 0) S.wildCurHP = 0;
    updateWildHpUI();
    // Check if Life Orb recoil KO'd the wild mon
    if (S.wildCurHP <= 0) {
      appendToLog(`${S.activeWild.name} потерял сознание от отдачи Life Orb!`, false, 'faint');
      await handleWildFaintRewards(S.battleType === 'wild');
      return;
    }
  }

  // Rough Skin / Iron Barbs: 1/8 recoil on physical contact (player has the ability)
  const playerAbility = getAbilityName(S.activePlayerMon, false);
  if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(playerAbility)) {
    const recoil = Math.max(1, Math.floor(dmg / 8));
    S.wildCurHP -= recoil;
    if (S.wildCurHP < 0) S.wildCurHP = 0;
    updateWildHpUI();
    appendToLog(`Шиповатое тело ${S.activePlayerMon.apiData.name} ранит ${S.activeWild.name}! (-${recoil} HP)`);
  }

  // Decrement player screen turns at end of enemy turn
  if (S.playerReflectTurns > 0) { S.playerReflectTurns--; if (S.playerReflectTurns === 0) appendToLog('Защита рассеялась!', false, 'system'); }
  if (S.playerLightScreenTurns > 0) { S.playerLightScreenTurns--; if (S.playerLightScreenTurns === 0) appendToLog('Световой Экран рассеялся!', false, 'system'); }
  // Reset Protect at end of opponent's turn
  S.protectActive = false;

  // Berry auto-use for player
  if (S.activePlayerMon.currentHp > 0) checkBerryAutoUse(S.activePlayerMon, true);


  if (S.activePlayerMon.currentHp === 0) {
    appendToLog(`${S.activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
    handlePlayerFaint();
    return;
  } else {
    applyStatusEndOfTurn(S.activePlayerMon, true);
    if (S.activePlayerMon.currentHp <= 0) {
      handlePlayerFaint();
      return;
    }
    S.battleRound++;
    // Leftovers end-of-turn healing (player)
    if (S.activePlayerMon.heldItem === 'leftovers' && S.activePlayerMon.currentHp > 0 && S.activePlayerMon.currentHp < S.activePlayerMon.maxHp) {
      const heal = Math.max(1, Math.floor(S.activePlayerMon.maxHp / 16));
      S.activePlayerMon.currentHp = Math.min(S.activePlayerMon.maxHp, S.activePlayerMon.currentHp + heal);
      updatePlayerHpUI();
      appendToLog(`${S.activePlayerMon.apiData.name} восстанавливает HP от Объедков! (+${heal})`);
    }
    // Leftovers end-of-turn healing (wild/gym)
    if (S.activeWild.heldItem === 'leftovers' && S.wildCurHP > 0 && S.wildCurHP < S.wildMaxHP) {
      const heal = Math.max(1, Math.floor(S.wildMaxHP / 16));
      S.wildCurHP = Math.min(S.wildMaxHP, S.wildCurHP + heal);
      updateWildHpUI();
      appendToLog(`${S.activeWild.name} восстанавливает HP от Объедков! (+${heal})`);
    }
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
  }
}

function initEncounterEvents() {
  document.getElementById('btn-run').addEventListener('click', () => {
    if (S.battleType !== 'wild') {
      appendToLog('Нельзя сбежать от лидера!');
      return;
    }
    S.escapeAttempts++;
    const playerSpeed = calculateStat(S.activePlayerMon, 'speed', false);
    const wildSpeed = calculateStat(S.activeWild, 'speed', true);

    let F = Math.floor((playerSpeed * 128 / wildSpeed) + 30 * S.escapeAttempts);

    if (F > 255 || Math.floor(Math.random() * 256) < F) {
      appendToLog('Вам удалось сбежать!');
      setTimeout(() => { document.getElementById('encounter-modal').style.display = 'none'; }, 1000);
    } else {
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog('Не удалось сбежать!');
      setTimeout(() => { enemyTurn(); }, 1500);
    }
  });

  document.getElementById('btn-switch').addEventListener('click', () => {
    if (S.battleType === 'gym' || S.battleType === 'elite' || S.battleType === 'GS.champion') {
      showToast('Нельзя сменить покемона в бою с лидером!', true);
      return;
    }
    switchPokemon();
  });

  document.getElementById('btn-use-item').addEventListener('click', () => {
    const item = (document.getElementById('battle-item-select') as HTMLInputElement).value;

    const BALL_CONFIG = {};
    ITEMS.filter(i => i.isBall && i.implemented).forEach(i => {
      BALL_CONFIG[i.id] = {
        label: i.nameRu,
        mult: i.ballMult,
        qty: store.getItemQty(i.id),
        dec: () => store.removeItem(i.id),
      };
    });
    const ballCfg = BALL_CONFIG[item];
    if (ballCfg) {
      if (S.battleType !== 'wild') {
        return appendToLog('Нельзя ловить в бою с лидером!');
      }
      if (ballCfg.qty <= 0) return showToast(`У вас нет ${ballCfg.label}ов!`, true);
      // If team is full, will auto-send to PC box below

      ballCfg.dec();
      store.updateInventoryDisplay();

      const hpPct = S.wildCurHP / S.wildMaxHP;

      // Species catch rate (0-255, from PokeAPI or default 100)
      const speciesRate = S.activeWild.captureRate || S.activeWild.speciesData?.capture_rate || 100;
      // Standard formula: rate = (3*maxHP - 2*curHP) * rate / (3*maxHP) * ballBonus * statusBonus
      let catchRate = ((3 * S.wildMaxHP - 2 * S.wildCurHP) * speciesRate) / (3 * S.wildMaxHP);
      catchRate = catchRate * ballCfg.mult;

      // Status bonus
      if (S.wildStatus === 'slp' || S.wildStatus === 'frz') catchRate *= 2.5;
      else if (S.wildStatus === 'par' || S.wildStatus === 'brn' || S.wildStatus === 'psn') catchRate *= 1.5;

      // Ball special effects
      if (item === 'quickBall' && S.battleRound < 1) catchRate *= 5;
      if (item === 'duskBall' && !GS.isDaytime) catchRate *= 3;
      if (item === 'timerBall') catchRate *= 1 + S.battleRound * 0.3;

      // Love Ball: x8 if opposite gender
      if (item === 'loveBall') {
        const wildGender = S.activeWild.wildGender;
        const playerGender = S.activePlayerMon?.apiData?.gender || (Math.random() < 0.5 ? 'male' : 'female');
        if (wildGender && playerGender && wildGender !== playerGender) catchRate *= 8;
      }

      // Convert to probability (cap at 95%)
      let catchChance = Math.min(0.95, catchRate / 255);

      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы бросили ${ballCfg.label}...`);

      setTimeout(() => {
        if (Math.random() < catchChance) {
          appendToLog(`Попался! ${S.activeWild.name.toUpperCase()} пойман!`, false, 'catch');

          const newMon = {
            uid: generateUID(),
            originalTrainer: getTrainerId(),
            createdAt: Date.now(),
            caughtLocation: GS.currentLocationId,
            isShiny: S.activeWild.isShiny || false,
            gender: S.activeWild.wildGender || null,
            apiData: S.activeWild,
            maxHp: S.wildMaxHP,
            currentHp: S.wildCurHP,
            ivs: S.activeWild.wildIVs,
            evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            baseLevel: S.wildLvl,
            exp: Math.pow(S.wildLvl, 3),
            expToNext: Math.pow(S.wildLvl + 1, 3),
            candiesEaten: 0,
            vitaminsEaten: 0,
            training: null,
            trainingStage: 0,
            trainingStat: null,
            happiness: 70,
            natureIdx: Math.floor(Math.random() * natures.length),
            breedLetter: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            status: S.wildStatus || null,
            sleepTurns: S.wildSleepTurns || 0,
            movesPP: S.wildMovesPP ? S.wildMovesPP.map(pp => ({ current: pp.max, max: pp.max })) : [],
            statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            abilityName: S.activeWild.abilities[0]?.ability?.name || null,
            heldItem: null,
            berries: S.activeWild.berries || { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
            learnableMoves: []
          };

          // Friend Ball: set happiness to 200
          if (item === 'friendBall') {
            newMon.happiness = 200;
          }

          // DarkBall: +5 to all IVs (max 31)
          if (item === 'darkBall') {
            for (const s of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
              newMon.ivs[s] = Math.min(31, newMon.ivs[s] + 5);
            }
          }

          // Transfer held item from wild pokemon to GS.inventory
          if (S.activeWild.heldItem) {
            const heldLabel = getHeldItemName(S.activeWild.heldItem);
            appendToLog(`Покемон держал ${heldLabel}! Передано в рюкзак.`, false, 'catch');
            store.addItem(S.activeWild.heldItem);
            store.updateInventoryDisplay();
          }

          if (GS.myTeam.length < 6) {
            GS.myTeam.push(newMon);
          } else {
            if (pcBoxes.length === 0) pcBoxes.push([]);
            pcBoxes[0].push(newMon);
            addNotification('📦 Покемон в PC', `${S.activeWild.name} отправлен в Бокс 1 (команда полна).`);
            appendToLog(`${S.activeWild.name} отправлен в PC (команда полна).`, false, 'catch');
          }
          GS.pokedexCaught.add(S.activeWild.name);
          GS.pokedexSeen.add(S.activeWild.name);

          checkQuestProgress('catch_x');

          document.getElementById('battle-main-menu').style.display = 'none';
          document.getElementById('battle-end-menu').style.display = 'flex';
          store.autoSave();
        } else {
          appendToLog(`${S.activeWild.name.toUpperCase()} вырвался!`);
          setTimeout(() => { enemyTurn(); }, 1500);
        }
      }, 1000);

    } else if (item === 'potion') {
      if (store.getItemQty('potion') <= 0) return showToast('У вас нет Аптечек!', true);
      if (S.activePlayerMon.currentHp >= S.activePlayerMon.maxHp) return showToast('Здоровье уже полное!', true);

      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      store.removeItem('potion');
      store.updateInventoryDisplay();

      S.activePlayerMon.currentHp += 20;
      if (S.activePlayerMon.currentHp > S.activePlayerMon.maxHp) S.activePlayerMon.currentHp = S.activePlayerMon.maxHp;
      updatePlayerHpUI();

      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Аптечку! Здоровье ${S.activePlayerMon.apiData.name} восстановлено.`);

      setTimeout(() => {
          enemyTurn();
      }, 1500);
    } else if (item === 'superPotion') {
      if (store.getItemQty('superPotion') <= 0) return showToast('Нет Супер Аптечек!', true);
      if (S.activePlayerMon.currentHp >= S.activePlayerMon.maxHp) return showToast('Здоровье уже полное!', true);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      store.removeItem('superPotion');
      store.updateInventoryDisplay();
      S.activePlayerMon.currentHp += 50;
      if (S.activePlayerMon.currentHp > S.activePlayerMon.maxHp) S.activePlayerMon.currentHp = S.activePlayerMon.maxHp;
      updatePlayerHpUI();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Супер Аптечку! Здоровье ${S.activePlayerMon.apiData.name} восстановлено.`);
      setTimeout(() => {
        enemyTurn();
      }, 1500);
    } else if (item === 'fullRestore') {
      if (store.getItemQty('fullRestore') <= 0) return showToast('Нет Полного Восстановления!', true);
      if (S.activePlayerMon.currentHp >= S.activePlayerMon.maxHp && !S.activePlayerMon.status) return showToast('Здоровье уже полное!', true);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      store.removeItem('fullRestore');
      store.updateInventoryDisplay();
      S.activePlayerMon.currentHp = S.activePlayerMon.maxHp;
      cureStatus(S.activePlayerMon);
      document.getElementById('player-status-icon').innerText = '';
      updatePlayerHpUI();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Полное Восстановление! ${S.activePlayerMon.apiData.name} полностью здоров!`);
      setTimeout(() => {
        enemyTurn();
      }, 1500);
    } else if (item === 'evolutionStone') {
      if (store.getItemQty('evolutionStone') <= 0) return showToast('Нет Камней Эволюции!', true);
      (async () => {
        const evoTarget = await checkEvolution(S.activePlayerMon, true);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать!', true);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        store.removeItem('evolutionStone');
        store.updateInventoryDisplay();
        await triggerEvolution(S.activePlayerMon, evoTarget.name);
        updatePlayerHpUI();
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`${S.activePlayerMon.apiData.name} эволюционировал!`);
        setTimeout(() => {
          enemyTurn();
        }, 1500);
      })();
    } else if (item === 'tm') {
      if (store.getItemQty('tm') <= 0) return showToast('Нет TM-совместимости!', true);
      showToast('Используйте TM из профиля покемона.', true);
    } else if (itemCategory(item) === 'statusCure') {
      const statusCureMap = {
        'antidote': 'psn', 'paralyzeHeal': 'par', 'awakening': 'slp',
        'burnHeal': 'brn', 'antiSputin': null,
      };
      const targetStatus = statusCureMap[item];
      if (store.getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (item === 'healingHerb') {
        if (!S.activePlayerMon.status) return showToast('У покемона нет статуса!', true);
        store.removeItem(item);
        cureStatus(S.activePlayerMon);
        document.getElementById('player-status-icon').innerText = '';
      } else if (targetStatus) {
        if (S.activePlayerMon.status !== targetStatus) return showToast('Этот предмет не лечит текущий статус!', true);
        store.removeItem(item);
        cureStatus(S.activePlayerMon);
        document.getElementById('player-status-icon').innerText = '';
      } else {
        return showToast('Этот предмет пока не работает в бою.', true);
      }
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      store.updateInventoryDisplay();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали ${itemDef(item).nameRu}! Статус ${S.activePlayerMon.apiData.name} исцелён.`);
      setTimeout(() => {
        enemyTurn();
      }, 1500);
    } else if (['ether', 'elixir', 'maxElixir'].includes(item)) {
      const elixirMap = { 'ether': 10, 'elixir': 10, 'maxElixir': 40 };
      const ppRestore = elixirMap[item];
      if (store.getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (!S.activePlayerMon.movesPP || S.activePlayerMon.movesPP.every(pp => pp && pp.current >= pp.max)) {
        return showToast('PP уже полностью!', true);
      }
      store.removeItem(item);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      store.updateInventoryDisplay();
      for (let i = 0; i < 4; i++) {
        if (S.activePlayerMon.movesPP && S.activePlayerMon.movesPP[i]) {
          S.activePlayerMon.movesPP[i].current = Math.min(
            S.activePlayerMon.movesPP[i].max,
            S.activePlayerMon.movesPP[i].current + ppRestore
          );
        }
      }
      updateMoveButtonUIs();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали ${itemDef(item).nameRu}! PP восстановлено.`);
      setTimeout(() => {
        enemyTurn();
      }, 1500);
    } else if (['xAttack', 'xDefense', 'xSpDef', 'xSpAtk', 'xSpeed', 'xAccuracy'].includes(item)) {
      const xMap = { 'xAttack': 'atk', 'xDefense': 'def', 'xSpDef': 'spd', 'xSpAtk': 'spa', 'xSpeed': 'spe', 'xAccuracy': null };
      const stat = xMap[item];
      if (store.getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (stat) {
        if (!S.activePlayerMon.statStages) S.activePlayerMon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (S.activePlayerMon.statStages[stat] >= 6) return showToast('Стат уже максимально повышен!', true);
        store.removeItem(item);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        store.updateInventoryDisplay();
        statStageModify(S.activePlayerMon, stat, 1);
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`Вы использовали ${itemDef(item).nameRu}! ${stat.toUpperCase()} повышен!`);
        setTimeout(() => {
          enemyTurn();
        }, 1500);
      } else {
        return showToast('Этот предмет пока не работает в бою.', true);
      }
    } else if (itemCategory(item) === 'evolutionStones' && item !== 'evolutionStone') {
      if (store.getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      (async () => {
        const evoTarget = await checkEvolution(S.activePlayerMon, true, item);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать с этим камнем!', true);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        store.removeItem(item);
        store.updateInventoryDisplay();
        await triggerEvolution(S.activePlayerMon, evoTarget.name);
        updatePlayerHpUI();
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`${S.activePlayerMon.apiData.name} эволюционировал!`);
        setTimeout(() => {
          enemyTurn();
        }, 1500);
      })();
    } else {
      showToast('Этот предмет нельзя использовать в бою.', true);
    }
  });

  document.getElementById('btn-leave-battle').addEventListener('click', () => {
    document.getElementById('encounter-modal').style.display = 'none';
    clearBattleState();
    S.gymTeamIndex = 0;
    S.gymTeamIndexInMember = 0;
    S.gymTeamData = null;
    S.battleType = 'wild';
    S.battleRound = 0;
    S.wildMovesPP = null;
    if (S.activePlayerMon) S.activePlayerMon.choiceLockedMove = undefined;
    // Clear all team stat stages, status effects, and battle state after battle
    GS.myTeam.forEach(m => {
      m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      m.choiceLockedMove = undefined;
      m.status = null;
      m.sleepTurns = 0;
    });
    // Clear stat badges
    document.getElementById('player-stat-badges').innerHTML = '';
    document.getElementById('wild-stat-badges').innerHTML = '';
  });
}

// --- GYM BATTLE SYSTEM (NEW) ---
function openGymModal(locId) {
  const leader = GS.gymLeaders[locId];
  const modal = document.getElementById('gym-modal');
  document.getElementById('gym-leader-name').innerText = leader.name;
  document.getElementById('gym-leader-title').innerText = leader.title;
  document.getElementById('gym-leader-type').innerText = `Тип: ${leader.type}`;
  document.getElementById('gym-leader-badge-icon').innerText = leader.badgeIcon || '🏅';
  const rewardItemName = itemDef(leader.rewardItem)?.nameRu || leader.rewardItem;
  document.getElementById('gym-reward').innerText = `${leader.badgeIcon || '🏅'} ${leader.badgeName} + ¥${leader.moneyReward} + ${rewardItemName}`;

  // Training display
  const trainInfo = document.getElementById('gym-training-info');
  const stageSymbols = ['','▲','▲','◆','◆','⭐','⭐'];
  const stageNames = ['','Начальная','Расширенная','Мастерская','Знаменитая','Легендарная','Именная'];
  if (leader.trainingStage) {
    const sym = stageSymbols[leader.trainingStage] || '▲';
    trainInfo.innerHTML = `${sym} Тренировка покемонов: <b>${stageNames[leader.trainingStage] || ''}</b> (+${[0,10,18,25,31,36,40][leader.trainingStage]}% к статам)`;
  } else {
    trainInfo.innerHTML = '';
  }

  const teamList = document.getElementById('gym-team-list');
  teamList.innerHTML = '';
  leader.team.forEach((member, i) => {
    const li = document.createElement('li');
    const sym = leader.trainingStage ? (stageSymbols[leader.trainingStage] || '▲') + ' ' : '';
    li.innerText = `${sym}${member.name} Lv${member.level}`;
    teamList.appendChild(li);
  });

  modal.style.display = 'flex';
  document.getElementById('btn-start-gym-battle').onclick = () => {
    // Validate team before battle
    const team = GS.myTeam.filter(m => m.currentHp > 0);
    if (team.length < 4) {
      showToast('У вас должно быть минимум 4 живых покемона для битвы с лидером!', true);
      return;
    }
    // Check level cap: no pokemon above gym leader's level
    const maxGymLvl = Math.max(...leader.team.map(m => m.level));
    const overleveled = team.filter(m => (m.baseLevel + (m.candiesEaten || 0)) > maxGymLvl);
    if (overleveled.length > 0) {
      const names = overleveled.map(m => m.nickname || m.apiData?.name || '?').join(', ');
      showToast(`Ваши покемоны выше уровнем, чем лидер! Уберите: ${names} (макс ${maxGymLvl} лв)`, true);
      return;
    }
    // Check type duplicates: each pokemon must have a unique primary type
    const primaryTypes = team.map(m => m.apiData?.types?.[0]?.type?.name).filter(Boolean);
    const dupes = primaryTypes.filter((t, i) => primaryTypes.indexOf(t) !== i);
    if (dupes.length > 0) {
      const uniqueDupes = [...new Set(dupes)].join(', ');
      showToast(`В команде есть повторяющиеся типы: ${uniqueDupes}. Смените покемонов!`, true);
      return;
    }

    modal.style.display = 'none';
    startGymBattle(locId);
  };
}

document.getElementById('btn-close-gym-modal').addEventListener('click', () => {
  document.getElementById('gym-modal').style.display = 'none';
});

function initGymEvents() {
  document.getElementById('btn-close-gym-modal').addEventListener('click', () => {
    document.getElementById('gym-modal').style.display = 'none';
  });
  document.getElementById('btn-close-elite-modal').addEventListener('click', () => {
    document.getElementById('elite-modal').style.display = 'none';
  });
}

async function startGymBattle(locId) {
  GS.itemsUsedInBattle = 0;
  S.battleRound = 0;
  const leader = GS.gymLeaders[locId];
  const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
  if (activeMonIndex === -1) {
    return showToast('Вам нужен хотя бы один живой покемон для битвы!', true);
  }

  S.battleType = 'gym';
  S.gymLeaderKey = locId;
  S.gymTeamIndex = 0;
  S.gymTeamData = JSON.parse(JSON.stringify(leader.team)); // clone

  battle.transition(BattlePhase.GYM_START);

  S.activePlayerMon = GS.myTeam[activeMonIndex];
  S.activePlayerMon.choiceLockedMove = undefined;

  document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
  (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
  updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
  document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);

  const modal = document.getElementById('encounter-modal');
  document.getElementById('battle-main-menu').style.display = 'flex';
  document.getElementById('battle-end-menu').style.display = 'none';
  document.getElementById('battle-gym-info').style.display = 'block';
  const stageSymbols = ['','▲','▲','◆','◆','⭐','⭐'];
  const stageSym = stageSymbols[leader.trainingStage] || '';
  document.getElementById('gym-leader-battle-name').innerText = `Лидер: ${leader.name} ${stageSym}`;
  const trainEl = document.getElementById('gym-training-display');
  if (leader.trainingStage) {
    const stageName = ['','Начальная','Расширенная','Мастерская','Знаменитая','Легендарная','Именная'][leader.trainingStage] || '';
    trainEl.innerText = `⚡Тренировка: ${stageName} (+${[0,10,18,25,31,36,40][leader.trainingStage]}%)`;
  } else {
    trainEl.innerText = '';
  }
  appendToLog(`Вызов лидера ${leader.name}!`, true);
  modal.style.display = 'flex';

  await startGymNextPokemon();
}

async function startGymNextPokemon() {
  if (S.gymTeamIndex >= S.gymTeamData.length) {
    // Won the gym battle!
    const leader = GS.gymLeaders[S.gymLeaderKey];
    GS.gymBadges.push(leader.badgeName);
    store.giveReward(leader.moneyReward, []);
    checkQuestProgress('earn_money', leader.moneyReward);
    appendToLog(`Победа! Вы получили ${leader.badgeName} и ¥${leader.moneyReward}!`);
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    store.updateMoneyDisplay();
    updateBadgeDisplay();
    // Trigger reward selection modal after a brief pause
    setTimeout(() => store.showGymRewardSelection(S.gymLeaderKey), 300);
    return;
  }

  const member = S.gymTeamData[S.gymTeamIndex];
  try {
    S.activeWild = await fetchPokeAPI(`pokemon/${member.name.replace('_2', '')}`);
    S.wildLvl = member.level;
    S.wildStatus = null;
    S.wildSleepTurns = 0;
    S.currentWeather = getDailyWeather(GS.currentLocationId);

    // Perfect IVs for gym leader pokemon
    S.activeWild.wildIVs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

    // Apply gym leader training boost
    const leaderData = GS.gymLeaders[S.gymLeaderKey];
    if (leaderData.trainingStage) {
      S.activeWild.trainingStage = leaderData.trainingStage;
      const statOrder = ['atk','spa','spe','def','spd'];
      let bestStat = 'atk', bestVal = 0;
      const statNames = { atk: 'attack', spa: 'special-attack', spe: 'speed', def: 'defense', spd: 'special-defense' };
      for (const s of statOrder) {
        const v = S.activeWild.stats.find(st => st.stat.name === statNames[s])?.base_stat || 0;
        if (v > bestVal) { bestVal = v; bestStat = s; }
      }
      S.activeWild.trainingStat = bestStat;
    }

    S.wildMaxHP = calculateStat(S.activeWild, 'hp', true);
    S.wildCurHP = S.wildMaxHP;
    S.escapeAttempts = 0;

    // Smart move selection: ensure type coverage, STAB, 1 status move
    const pokeStats = S.activeWild.stats;
    const spAtk = pokeStats.find(s => s.stat.name === 'special-attack')?.base_stat || 50;
    const atkStat = pokeStats.find(s => s.stat.name === 'attack')?.base_stat || 50;
    const isSpecialAttacker = spAtk > atkStat;
    const wildTypes = S.activeWild.types.map(t => t.type?.name).filter(Boolean);
    const movePool = S.activeWild.moves.slice().sort((a, b) => {
      return (b.version_group_details?.[0]?.level_learned_at || 0) - (a.version_group_details?.[0]?.level_learned_at || 0);
    }).slice(0, 30);
    const moveResults3 = (await Promise.all(movePool.map(m =>
      fetchPokeAPI(m.move.url).catch(() => null)
    ))).filter(Boolean);
    // Categorize moves
    const stabMoves = [], coverageMoves = [], statusMoves = [];
    for (const m of moveResults3) {
      const isSpMove = m.damage_class?.name === 'special';
      const statFit = (isSpecialAttacker && isSpMove) || (!isSpecialAttacker && !isSpMove);
      const isStab = wildTypes.includes(m.type?.name);
      if (m.power) {
        const entry = { move: m, power: m.power, statFit };
        if (isStab) stabMoves.push(entry);
        else coverageMoves.push(entry);
      } else {
        statusMoves.push(m);
      }
    }
    // Sort by power, prefering stat-fit moves
    const sortFn = (a, b) => (b.statFit ? b.power : b.power * 0.8) - (a.statFit ? a.power : a.power * 0.8);
    stabMoves.sort(sortFn);
    coverageMoves.sort(sortFn);
    // Pick best 3 attacking moves: prefer 2 STAB + 1 coverage, avoid duplicate types
    const chosen = [];
    const usedTypes = new Set();
    const picker = (pool, count) => {
      for (const entry of pool) {
        if (chosen.length >= count) break;
        const mType = entry.move.type?.name;
        if (!usedTypes.has(mType) || chosen.length < 2) {
          chosen.push(entry.move);
          usedTypes.add(mType);
        }
      }
    };
    picker(stabMoves, 2); // at least 1 STAB
    picker(coverageMoves, 3); // fill with coverage
    picker(stabMoves, 4); // fallback: any STAB
    // Add best status move if slot remains
    if (chosen.length < 4 && statusMoves.length > 0) {
      const keyStatus = ['will-o-wisp','thunder-wave','toxic','hypnosis','spore','swords-dance','nasty-plot','calm-mind','bulk-up','dragon-dance','agility','recover','roost','moonlight','reflect','light-screen','substitute','protect'];
      const ranked = statusMoves.map(m => ({ move: m, score: keyStatus.includes(m.name) ? 1 : 0 }));
      ranked.sort((a, b) => b.score - a.score);
      chosen.push(ranked[0].move);
    }
    // Trim to 4
    S.wildMovesDetailed = chosen.slice(0, 4);
    S.wildMovesPP = S.wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = S.activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl}`;
    let wildSpriteUrl;
    if (S.battleType === 'gym') {
      wildSpriteUrl = S.activeWild.sprites?.other?.['official-artwork']?.front_shiny || S.activeWild.sprites?.front_shiny || S.activeWild.sprites?.other?.['official-artwork']?.front_default || S.activeWild.sprites.front_default;
    } else {
      wildSpriteUrl = getSpriteUrl({ apiData: S.activeWild, isShiny: S.activeWild.isShiny || false });
    }
    (document.getElementById('wild-sprite') as HTMLImageElement).src = wildSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();
    // Gym visual indicator
    const wildBox = document.querySelector('#wild-sprite').parentElement;
    if (S.battleType === 'gym') {
      wildBox.classList.add('gym-wild');
      const stageSymbols = ['','▲','▲','◆','◆','⭐','⭐'];
      const stageSym = stageSymbols[leaderData.trainingStage] || '';
      document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl} ${stageSym}`;
    } else {
      wildBox.classList.remove('gym-wild');
    }

    appendToLog(`${GS.gymLeaders[S.gymLeaderKey].name} выпускает ${S.activeWild.name}! (${S.gymTeamIndex + 1}/${S.gymTeamData.length})`);

    // Intimidate check
    const wildAbility = S.activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(S.activePlayerMon, 'atk', -1);
      appendToLog(`${S.activeWild.name} отпугивает ${S.activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves
    loadMoveButtons(S.activePlayerMon, useMove);

    // Set phase so player can attack
    battle.transition(BattlePhase.PLAYER_TURN);

  } catch (e) {
    appendToLog('Ошибка загрузки покемона лидера...');
  }
  // Show the battle menu so player can attack next wild pokemon
  document.getElementById('battle-main-menu').style.display = 'flex';
}

async function useMoveGym(moveIndex) {
  return useMove(moveIndex);
}

function enemyTurnGym() {
  return enemyTurn();
}

function handleGymPlayerFaint() {
  return handlePlayerFaint();
}

// --- ELITE FOUR (NEW) ---
function openEliteModal() {
  const modal = document.getElementById('elite-modal');
  const list = document.getElementById('elite-member-list');
  list.innerHTML = '';

  GS.eliteFour.forEach((member, i) => {
    const div = document.createElement('div');
    div.className = 'elite-member-card';
    div.innerHTML = `
      <strong>${member.name}</strong> — ${member.title}
      <span style="font-size:0.75rem;color:#666;">Команда: ${member.team.map(t => t.name).join(', ')}</span>
    `;
    list.appendChild(div);
  });

  const championDiv = document.createElement('div');
  championDiv.className = 'elite-member-card GS.champion';
  championDiv.innerHTML = `
    <strong>${GS.champion.name}</strong> — ${GS.champion.title}
    <span style="font-size:0.75rem;color:#666;">Команда: ${GS.champion.team.map(t => t.name).join(', ')}</span>
  `;
  list.appendChild(championDiv);

  modal.style.display = 'flex';
  document.getElementById('btn-start-elite-battle').onclick = () => {
    modal.style.display = 'none';
    startEliteBattle();
  };
}

async function startEliteBattle() {
  GS.itemsUsedInBattle = 0;
  S.battleRound = 0;
  S.battleType = 'elite';
  S.gymTeamIndex = 0;

  battle.transition(BattlePhase.ELITE_START);

  const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
  if (activeMonIndex === -1) return showToast('Вам нужен хотя бы один живой покемон!', true);
  S.activePlayerMon = GS.myTeam[activeMonIndex];
  S.activePlayerMon.choiceLockedMove = undefined;

  document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
  (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
  updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
  document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);

  const modal = document.getElementById('encounter-modal');
  document.getElementById('battle-main-menu').style.display = 'flex';
  document.getElementById('battle-end-menu').style.display = 'none';
  document.getElementById('battle-gym-info').style.display = 'block';
  document.getElementById('gym-leader-battle-name').innerText = 'Элитная Четверка';
  appendToLog('Элитная Четверка — Начало!', true);
  modal.style.display = 'flex';

  await startEliteNextMember();
}

async function startEliteNextMember() {
  if (S.gymTeamIndex >= GS.eliteFour.length) {
    S.battleType = 'GS.champion';
    await championBattle();
    return;
  }

  const member = GS.eliteFour[S.gymTeamIndex];
  S.gymTeamData = JSON.parse(JSON.stringify(member.team));
  S.gymTeamIndexInMember = 0;
  appendToLog(`--- ${member.name} (${member.title}) ---`);
  await startEliteNextPokemon();
}

async function startEliteNextPokemon() {
  // If all pokemon of this elite member are defeated
  if (S.gymTeamIndexInMember >= S.gymTeamData.length) {
    store.giveReward(GS.eliteFour[S.gymTeamIndex].moneyReward, []);
    checkQuestProgress('earn_money', GS.eliteFour[S.gymTeamIndex].moneyReward);
    store.updateMoneyDisplay();
    S.gymTeamIndex++;
    S.gymTeamData = null;
    S.gymTeamIndexInMember = 0;
    setTimeout(() => { startEliteNextMember(); }, 1500);
    return;
  }

  const member = S.gymTeamData[S.gymTeamIndexInMember];
  try {
    S.activeWild = await fetchPokeAPI(`pokemon/${member.name.replace('_2', '')}`);
    S.wildLvl = member.level;
    S.wildStatus = null;
    S.wildSleepTurns = 0;
    S.currentWeather = getDailyWeather(GS.currentLocationId);

    S.activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    S.wildMaxHP = calculateStat(S.activeWild, 'hp', true);
    S.wildCurHP = S.wildMaxHP;
    S.escapeAttempts = 0;

    S.wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < S.activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetchPokeAPI(S.activeWild.moves[i].move.url).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    S.wildMovesDetailed = moveResults.filter(Boolean);
    S.wildMovesPP = S.wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = S.activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl}`;
    const wildSpriteUrl = getSpriteUrl({ apiData: S.activeWild, isShiny: S.activeWild.isShiny || false });
    (document.getElementById('wild-sprite') as HTMLImageElement).src = wildSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    appendToLog(`${GS.eliteFour[S.gymTeamIndex].name} выпускает ${S.activeWild.name}!`);

    // Intimidate check
    const wildAbility = S.activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(S.activePlayerMon, 'atk', -1);
      appendToLog(`${S.activeWild.name} отпугивает ${S.activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves for elite battle
    loadMoveButtons(S.activePlayerMon, useMove);
    battle.transition(BattlePhase.PLAYER_TURN);

    // Player UI refresh
    document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
    (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
    updatePlayerHpUI();
    document.getElementById('battle-main-menu').style.display = 'flex';

  } catch (e) {
    appendToLog('Ошибка загрузки...');
  }
}

async function championBattle() {
  GS.itemsUsedInBattle = 0;
  S.battleRound = 0;
  S.gymTeamData = JSON.parse(JSON.stringify(GS.champion.team));
  S.gymTeamIndexInMember = 0;
  S.battleType = 'GS.champion';
  appendToLog(`--- ${GS.champion.name} вызывает вас! ---`);
  await startChampionNextPokemon();
}

async function startChampionNextPokemon() {
  if (S.gymTeamIndexInMember >= S.gymTeamData.length) {
    store.giveReward(GS.champion.moneyReward, []);
    checkQuestProgress('earn_money', GS.champion.moneyReward);
    store.updateMoneyDisplay();
    appendToLog('ПОБЕДА! Вы стали Чемпионом Лиги!');
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    S.gymTeamIndex = 0;
    S.gymTeamData = null;
    S.battleType = 'wild';
    store.autoSave();
    return;
  }

  const member = S.gymTeamData[S.gymTeamIndexInMember];
  try {
    S.activeWild = await fetchPokeAPI(`pokemon/${member.name.replace('_2', '')}`);
    S.wildLvl = member.level;
    S.wildStatus = null;
    S.wildSleepTurns = 0;
    S.currentWeather = getDailyWeather(GS.currentLocationId);

    S.activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    S.wildMaxHP = calculateStat(S.activeWild, 'hp', true);
    S.wildCurHP = S.wildMaxHP;

    S.wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < S.activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetchPokeAPI(S.activeWild.moves[i].move.url).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    S.wildMovesDetailed = moveResults.filter(Boolean);
    S.wildMovesPP = S.wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = S.activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${S.wildLvl}`;
    const wildSpriteUrl = getSpriteUrl({ apiData: S.activeWild, isShiny: S.activeWild.isShiny || false });
    (document.getElementById('wild-sprite') as HTMLImageElement).src = wildSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    appendToLog(`${GS.champion.name} выпускает ${S.activeWild.name}!`);

    // Intimidate check
    const wildAbility = S.activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(S.activePlayerMon, 'atk', -1);
      appendToLog(`${S.activeWild.name} отпугивает ${S.activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves for GS.champion battle
    loadMoveButtons(S.activePlayerMon, useMove);
    battle.transition(BattlePhase.PLAYER_TURN);

    // Player UI refresh
    document.getElementById('player-name').innerText = S.activePlayerMon.nickname || S.activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${S.activePlayerMon.baseLevel + S.activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = getSpriteUrl(S.activePlayerMon);
    (document.getElementById('player-sprite') as HTMLImageElement).src = playerSpriteUrl;
    updateBattleSpriteBgs(S.activePlayerMon, S.activeWild);
    document.getElementById('player-status-icon').innerText = getStatusIcon(S.activePlayerMon.status);
    updatePlayerHpUI();
    document.getElementById('battle-main-menu').style.display = 'flex';

  } catch (e) {
    appendToLog('Ошибка загрузки...');
  }
}


// === STATE ACCESSORS ===
function getBattleVars() {
  return { ...battle.state, itemsUsedInBattle: GS.itemsUsedInBattle };
}

function setBattleVars(updates: Record<string, any>) {
  for (const [k, v] of Object.entries(updates)) {
    if (k === 'itemsUsedInBattle') {
      GS.itemsUsedInBattle = v;
    } else {
      (battle.state as any)[k] = v;
    }
  }
}

export { saveBattleState, clearBattleState, restoreBattleState, renderBattleUI, getTypeMultiplier, calculateStat, appendToLog, getAbilityName, statStageModify, updateStatBadges, clearUsedItem, checkBerryAutoUse, giveBerryToMon, generateDailyQuests, checkQuestProgress, claimQuestReward, openQuests, renderQuests, loadPokedexData, getStatusIcon, applyStatusEffect, cureStatus, checkStatusTurn, applyStatusEndOfTurn, switchPokemon, pickWeightedEncounter, getWildLevel, getLocationEncounters, startAutoHunt, stopAutoHunt, getBestRod, startHunt, loadMoveButtons, updateMoveButtonUI, updateMoveButtonUIs, updateWildHpUI, updatePlayerHpUI, useMove, handlePlayerFaint, enemyTurn, initEncounterEvents, openGymModal, initGymEvents, startGymBattle, startGymNextPokemon, useMoveGym, enemyTurnGym, handleGymPlayerFaint, openEliteModal, startEliteBattle, startEliteNextMember, startEliteNextPokemon, championBattle, startChampionNextPokemon, getBattleVars, setBattleVars };
