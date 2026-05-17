console.log("CORE.JS START");
import {
  getLocation, showToast, showSelectionModal, addItem, removeItem, getItemQty, itemDef, autoSave, updateMoneyDisplay, modifyMoney, updateInventoryDisplay, checkEvolution, triggerEvolution, lsKey, checkTutorialProgress,
  getGameState
} from '../../main.js';
import { natures } from '../data/natures.js';

// === BATTLE STATE ===
let activeWild = null;
let wildLvl = 5;
let wildMaxHP = 0;
let wildCurHP = 0;
let wildStatus = null;
let wildSleepTurns = 0;
let escapeAttempts = 0;
let wildMovesDetailed = [];
let wildMovesPP = null;
let battleRound = 0;
let activePlayerMon = null;
let playerMovesDetailed = [];
let battleType = 'wild';
let gymLeaderKey = null;
let gymTeamIndex = 0;
let gymTeamData = null;
let gymTeamIndexInMember = 0;
let huntActive = false;
let huntTimer = null;
let currentWeather = 'clear';

// Reference types - mutations visible across modules
let GS;
function initBattleRefs() {
  GS = getGameState();
}
// Call once after main.js is loaded
setTimeout(initBattleRefs, 0);

// --- WEATHER ---
export const WEATHERS = ['clear', 'rain', 'sun', 'sandstorm', 'hail'];
export const WEATHER_ICONS = { clear: '☀️', rain: '🌧️', sun: '☀️', sandstorm: '🌪️', hail: '❄️' };
export const WEATHER_NAMES = { clear: 'Ясно', rain: 'Дождь', sun: 'Солнце', sandstorm: 'Песчаная буря', hail: 'Град' };

function getDailyWeather(locId) {
  const dateStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  const str = dateStr + locId;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = (Math.abs(hash || 0) || 0) % WEATHERS.length;
  return WEATHERS[idx];
}

function getWeatherMultiplier(moveType, weather) {
  if (weather === 'rain') {
    if (moveType === 'water') return 1.5;
    if (moveType === 'fire') return 0.5;
  }
  if (weather === 'sun') {
    if (moveType === 'fire') return 1.5;
    if (moveType === 'water') return 0.5;
  }
  if (weather === 'sandstorm') {
    if (moveType === 'rock') return 1.5;
  }
  if (weather === 'hail') {
    if (moveType === 'ice') return 1.5;
  }
  return 1.0;
}


// --- BATTLE STATE PERSISTENCE (survives page refresh) ---
function saveBattleState() {
  if (!battleType || battleType === 'none') return;
  const state = {
    battleType,
    locationId: GS.currentLocationId,
    activeMonIndex: GS.myTeam.indexOf(activePlayerMon),
    activeMonCurHP: activePlayerMon?.currentHp,
    activeMonMovesPP: activePlayerMon?.movesPP,
    activeMonStatStages: activePlayerMon?.statStages,
    activeMonChoiceLocked: activePlayerMon?.choiceLockedMove,
    currentWeather,
    escapeAttempts,
    battleRound,
    itemsUsedInBattle: GS.itemsUsedInBattle
  };
  if (battleType === 'wild' && activeWild) {
    state.wildPkmName = activeWild.name;
    state.wildCurHP = wildCurHP;
    state.wildMaxHP = wildMaxHP;
    state.wildLvl = wildLvl;
    state.wildStatus = wildStatus;
    state.wildSleepTurns = wildSleepTurns;
    state.wildMovesPP = wildMovesPP;
    state.wildIsShiny = activeWild.isShiny;
  }
  if ((battleType === 'gym' || battleType === 'elite' || battleType === 'GS.champion') && gymTeamData) {
    state.gymLeaderKey = gymLeaderKey;
    state.gymTeamIndex = gymTeamIndex;
    state.gymTeamIndexInMember = gymTeamIndexInMember;
    state.gymTeamData = gymTeamData;
    if (activeWild) {
      state.wildCurHP = wildCurHP;
      state.wildMaxHP = wildMaxHP;
      state.wildStatus = wildStatus;
      state.wildSleepTurns = wildSleepTurns;
      state.wildMovesPP = wildMovesPP;
    }
  }
  try { localStorage.setItem(lsKey('battle_state'), JSON.stringify(state)); } catch(e) {}
}

function clearBattleState() {
  try { localStorage.removeItem(lsKey('battle_state')); } catch(e) {}
}

async function restoreBattleState() {
  let state;
  try {
    const raw = localStorage.getItem(lsKey('battle_state'));
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
  activePlayerMon = mon;
  mon.currentHp = state.activeMonCurHP;
  if (state.activeMonMovesPP) mon.movesPP = state.activeMonMovesPP;
  if (state.activeMonStatStages) mon.statStages = state.activeMonStatStages;
  if (state.activeMonChoiceLocked !== undefined) mon.choiceLockedMove = state.activeMonChoiceLocked;

  battleType = state.battleType;
  currentWeather = state.currentWeather || getDailyWeather(GS.currentLocationId);
  escapeAttempts = state.escapeAttempts || 0;
  battleRound = state.battleRound || 0;
  GS.itemsUsedInBattle = state.itemsUsedInBattle || 0;

  if (battleType === 'wild' && state.wildPkmName) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${state.wildPkmName.toLowerCase()}`);
      activeWild = await res.json();
      GS.pokedexSeen.add(activeWild.name);
      activeWild.isShiny = state.wildIsShiny || false;

      // Fetch species for catch rate
      try {
        const speciesRes = await fetch(activeWild.species.url);
        const speciesData = await speciesRes.json();
        activeWild.captureRate = speciesData.capture_rate;
        activeWild.speciesData = speciesData;
      } catch(e) {}

      wildLvl = state.wildLvl;
      wildMaxHP = state.wildMaxHP;
      wildCurHP = state.wildCurHP;
      wildStatus = state.wildStatus;
      wildSleepTurns = state.wildSleepTurns || 0;
      wildMovesPP = state.wildMovesPP || [];
      activeWild.status = wildStatus;
      activeWild.heldItem = null; // Can't restore held item reliably
      activeWild.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };

      // Fetch wild moves
      wildMovesDetailed = [];
      const movePromises = [];
      for (let i = 0; i < activeWild.moves.length && i < 20; i++) {
        movePromises.push(
          fetch(activeWild.moves[i].move.url).then(r => r.json()).catch(() => null)
        );
      }
      const moveResults = await Promise.all(movePromises);
      wildMovesDetailed = moveResults.filter(m => m && m.power);

      if (!activeWild.wildIVs) {
        activeWild.wildIVs = {
          hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32),
          def: Math.floor(Math.random() * 32), spa: Math.floor(Math.random() * 32),
          spd: Math.floor(Math.random() * 32), spe: Math.floor(Math.random() * 32)
        };
      }

      renderBattleUI();
      loadMoveButtons(activePlayerMon, battleType === 'wild' ? useMove : useMoveGym);

      document.getElementById('encounter-modal').style.display = 'flex';
      document.getElementById('battle-main-menu').style.display = 'flex';
      document.getElementById('battle-end-menu').style.display = 'none';
      document.getElementById('battle-gym-info').style.display = 'none';

      appendToLog('⚡ Битва восстановлена!', true);
      appendToLog(`Дикий ${activeWild.name.toUpperCase()} всё ещё здесь!`, false, 'battle');

      return true;
    } catch(e) {
      console.error('Failed to restore wild battle:', e);
      clearBattleState();
      return false;
    }
  }

  return false;
}

function renderBattleUI() {
  document.getElementById('wild-name').innerText = activeWild.name;
  document.getElementById('wild-lvl').innerText = `Lv${wildLvl}`;
  const wildSpriteUrl = activeWild.sprites?.other?.['official-artwork']?.front_default || activeWild.sprites.front_default;
  document.getElementById('wild-sprite').src = wildSpriteUrl;
  document.getElementById('wild-status-icon').innerText = getStatusIcon(wildStatus);
  updateWildHpUI();

  document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
  document.getElementById('player-sprite').src = playerSpriteUrl;
  document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
  updateBattleSpriteBgs();
  updatePlayerHpUI();
}
const MAX_IV = 70;

// --- BATTLE SYSTEM UTILS ---
const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

function getTypeMultiplier(attackType, defenderTypes) {
  if (!TYPE_CHART[attackType]) return 1;
  let multiplier = 1;
  defenderTypes.forEach(typeObj => {
    const defType = typeObj.type.name;
    if (TYPE_CHART[attackType][defType] !== undefined) {
      multiplier *= TYPE_CHART[attackType][defType];
    }
  });
  return multiplier;
}

function calculateStat(pokemon, statName, isWild) {
  const baseStats = isWild ? pokemon.stats : pokemon.apiData.stats;
  const statObj = baseStats.find(s => s.stat.name === statName);
  const base = statObj ? statObj.base_stat : 50;

  const level = isWild ? wildLvl : (pokemon.baseLevel + pokemon.candiesEaten);
  const mapName = { 'hp': 'hp', 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' }[statName] || 'hp';

  const iv = isWild ? (pokemon.wildIVs ? pokemon.wildIVs[mapName] : 15) : pokemon.ivs[mapName];
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
  if (!isWild && pokemon.statStages) {
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

function appendToLog(text, clear = false, type) {
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
  if (playerEl && activePlayerMon?.statStages) {
    playerEl.innerHTML = Object.entries(activePlayerMon.statStages)
      .filter(([_, v]) => v !== 0)
      .map(([k, v]) => {
        const sign = v > 0 ? '+' : '';
        return `<span class="stat-badge ${v > 0 ? 'positive' : 'negative'}">${labels[k] || k} ${sign}${v}</span>`;
      }).join('');
  }
  // Wild badges
  const wildEl = document.getElementById('wild-stat-badges');
  if (wildEl && activeWild?.statStages) {
    wildEl.innerHTML = Object.entries(activeWild.statStages || {})
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
    appendToLog(`${mon.apiData.name} восстановил HP с помощью Ситрус Ягоды! (+${heal} HP)`, false, 'heal');
    return true;
  }

  // Oran: HP < 50% -> +10 HP
  if (mon.heldItem === 'oranBerry' && mon.currentHp < mon.maxHp * 0.5) {
    mon.currentHp = Math.min(mon.maxHp, mon.currentHp + 10);
    clearUsedItem(mon);
    if (isPlayer) updatePlayerHpUI();
    else updateWildHpUI();
    appendToLog(`${mon.apiData.name} восстановил HP с помощью Оран Ягоды! (+10 HP)`, false, 'heal');
    return true;
  }

  // Lum: any status -> cure
  if (mon.heldItem === 'lumBerry' && mon.status) {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.apiData.name} вылечился с помощью Лум Ягоды!`);
    return true;
  }

  // Chesto: sleep -> cure
  if (mon.heldItem === 'chestoBerry' && mon.status === 'slp') {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.apiData.name} проснулся с помощью Често Ягоды!`);
    return true;
  }

  // Rawst: burn -> cure
  if (mon.heldItem === 'rawstBerry' && mon.status === 'brn') {
    cureStatus(mon);
    clearUsedItem(mon);
    if (isPlayer) document.getElementById('player-status-icon').innerText = '';
    else document.getElementById('wild-status-icon').innerText = '';
    appendToLog(`${mon.apiData.name} вылечил ожог с помощью Рост Ягоды!`);
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
  const lastGen = localStorage.getItem(lsKey('quest_date'));
  if (lastGen === today && GS.quests.length > 0) return;

  const shuffled = [...GS.QUEST_CONFIGS].sort(() => Math.random() - 0.5);
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
  localStorage.setItem(lsKey('quest_date'), today);
  autoSave();
}

function checkQuestProgress(type, amount, itemId) {
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
  checkTutorialProgress(type, amount, itemId);
}

function claimQuestReward(questId) {
  const q = GS.quests.find(x => x.id === questId);
  if (!q || !q.completed || q.claimed) return showToast('Задание уже выполнено или недоступно!', true);
  q.claimed = true;
  modifyMoney(q.rewardMoney);
  if (q.rewardItem) {
    addItem(q.rewardItem, q.rewardQty);
  }
  GS.completedQuests.push({ id: questId, date: new Date().toISOString() });
  updateMoneyDisplay();
  updateInventoryDisplay();
  autoSave();
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
      appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} проснулся!`, false, 'system');
      return true;
    } else {
      appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} спит... (осталось ${target.sleepTurns} ходов)`, false, 'status');
      return false;
    }
  }

  if (target.status === 'frz') {
    if (Math.random() < 0.2) {
      cureStatus(target);
      appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} оттаял!`, false, 'system');
      return true;
    } else {
      appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} заморожен!`, false, 'status');
      return false;
    }
  }

  if (target.status === 'par') {
    if (Math.random() < 0.25) {
      appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} парализован и не может двигаться!`, false, 'status');
      return false;
    }
    return true;
  }

  return true;
}

function applyStatusEndOfTurn(target, isPlayer) {
  if (!target.status) return;

  if (target.status === 'psn') {
    const dmg = Math.max(1, Math.floor((isPlayer ? activePlayerMon.maxHp : wildMaxHP) / 8));
    if (isPlayer) {
      activePlayerMon.currentHp -= dmg;
      if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    } else {
      wildCurHP -= dmg;
      if (wildCurHP < 0) wildCurHP = 0;
      updateWildHpUI();
    }
    appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} теряет HP от яда! (-${dmg} HP)`, false, 'dmg');
  }

  if (target.status === 'brn') {
    const dmg = Math.max(1, Math.floor((isPlayer ? activePlayerMon.maxHp : wildMaxHP) / 16));
    if (isPlayer) {
      activePlayerMon.currentHp -= dmg;
      if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    } else {
      wildCurHP -= dmg;
      if (wildCurHP < 0) wildCurHP = 0;
      updateWildHpUI();
    }
    appendToLog(`${isPlayer ? activePlayerMon.apiData.name : activeWild.name} теряет HP от ожога! (-${dmg} HP)`, false, 'dmg');
  }
}

// --- SWITCH POKEMON ---
function switchPokemon() {
  const aliveMons = GS.myTeam.filter((mon, i) => mon.currentHp > 0 && mon !== activePlayerMon);
  if (aliveMons.length === 0) { showToast('Нет других покемонов для смены!', true); return; }

  const items = aliveMons.map((m) => ({
    label: `Lv.${m.baseLevel + m.candiesEaten} ${m.name || m.apiData?.name}`,
    subtitle: `HP: ${m.currentHp}/${m.maxHp}`
  }));

  showSelectionModal('Выберите покемона', items, (idx) => {
    const newActive = aliveMons[idx];
    const oldActive = activePlayerMon;

    // Swap positions: put new active first
    const oldIdx = GS.myTeam.indexOf(oldActive);
    const newIdx = GS.myTeam.indexOf(newActive);
    GS.myTeam[oldIdx] = newActive;
    GS.myTeam[newIdx] = oldActive;
    activePlayerMon = newActive;

    // Clear choice lock
    delete activePlayerMon.choiceLockedMove;

    appendToLog(`${oldActive.name || oldActive.apiData?.name}, возвращайся! Вперёд, ${newActive.name || newActive.apiData?.name}!`, false, 'switch');

    // Rebuild player moves
    playerMovesDetailed = activePlayerMon.apiData?.moves?.filter(m => {
      const vgd = m.version_group_details;
      return vgd && vgd.length && activePlayerMon.movesPP?.some(pp => pp?.moveName === m.move.name);
    }) || [];

    // Update UI
    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = playerSpriteUrl;
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();

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
  const loc = getLocation(GS.currentLocationId);
  const name = (loc?.name || '').toLowerCase();
  const id = GS.currentLocationId || '';
  // Victory Road / Indigo Plateau: 40-50
  if (id.includes('victory') || id.includes('indigo')) return Math.floor(Math.random() * 11) + 40;
  // Late-game Kanto routes: 30-40
  if (/route_(1[7-9]|2[0-1])/.test(id) || id.includes('cinnabar') || id.includes('seafoam')) return Math.floor(Math.random() * 11) + 30;
  // Mid-game: 20-30
  if (/route_(1[1-6])/.test(id) || id.includes('safari') || id.includes('fuchsia') || id.includes('lavender')) return Math.floor(Math.random() * 11) + 20;
  // Early-mid: 12-22
  if (/route_[6-9]|10/.test(id) || id.includes('saffron') || id.includes('celadon')) return Math.floor(Math.random() * 11) + 12;
  // Early: 8-16
  if (/route_[3-5]/.test(id) || id.includes('mt_moon') || id.includes('cerulean')) return Math.floor(Math.random() * 9) + 8;
  // Very early: 5-12
  if (/route_[1-2]|22/.test(id) || id.includes('viridian') || id.includes('forest')) return Math.floor(Math.random() * 8) + 5;
  // Starter area: 3-8
  if (id.includes('pallet')) return Math.floor(Math.random() * 6) + 3;
  // Default for other regions
  return Math.floor(Math.random() * 11) + 10;
}

function getLocationEncounters() {
  const loc = getLocation(GS.currentLocationId);
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
  const encounters = getLocationEncounters();
  if (encounters.length === 0) return;

  huntActive = true;
  try { localStorage.setItem(lsKey('hunt_active'), '1'); } catch(_) {}
  const btn = document.getElementById('btn-hunt-toggle');
  if (btn) {
    btn.classList.add('active');
    btn.title = 'Прекратить поиск';
  }

  const updateHuntBtn = () => {
    if (!btn || !huntActive) return;
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
    if (!huntActive) return;
    if (document.getElementById('encounter-modal')?.style.display === 'flex') {
      huntTimer = setTimeout(doTick, 2000);
      return;
    }
    if (document.getElementById('elite-modal')?.style.display === 'flex') {
      huntTimer = setTimeout(doTick, 2000);
      return;
    }
    const enc = getLocationEncounters();
    if (enc.length === 0) { updateHuntBtn(); huntTimer = setTimeout(doTick, 5000); return; }
    updateHuntBtn();
    // 20% base chance every tick
    if (Math.random() < 0.20) {
      const pkmName = pickWeightedEncounter(enc);
      startHunt([pkmName]);
      huntTimer = setTimeout(doTick, 3000);
    } else {
      const delay = 3000 + Math.random() * 5000;
      huntTimer = setTimeout(doTick, delay);
    }
  };

  huntTimer = setTimeout(doTick, 2000 + Math.random() * 3000);
}

function stopAutoHunt() {
  huntActive = false;
  try { localStorage.removeItem(lsKey('hunt_active')); } catch(_) {}
  if (huntTimer) { clearTimeout(huntTimer); huntTimer = null; }
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
  if (getItemQty('superRod') > 0) return 'superRod';
  if (getItemQty('goodRod') > 0) return 'goodRod';
  if (getItemQty('oldRod') > 0) return 'oldRod';
  return null;
}

async function startHunt(encountersArray) {
  GS.itemsUsedInBattle = 0;
  battleRound = 0;
  const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
  if (activeMonIndex === -1) {
    return showToast('Вам нужен хотя бы один живой покемон для битвы!', true);
  }

  battleType = 'wild';
  activePlayerMon = GS.myTeam[activeMonIndex];
  activePlayerMon.choiceLockedMove = undefined;
  currentWeather = getDailyWeather(GS.currentLocationId);

  const modal = document.getElementById('encounter-modal');
  const battleLog = document.getElementById('battle-log');

  document.getElementById('battle-main-menu').style.display = 'flex';
  document.getElementById('battle-end-menu').style.display = 'none';
  document.getElementById('battle-gym-info').style.display = 'none';
  appendToLog('Ищем...', true);
  modal.style.display = 'flex';

  const picked = encountersArray[Math.floor(Math.random() * encountersArray.length)];
  const pkmName = typeof picked === 'string' ? picked : picked.name;
  const presetLvl = typeof picked === 'object' ? picked.level : null;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pkmName.toLowerCase()}`);
    activeWild = await res.json();
    GS.pokedexSeen.add(activeWild.name);
    wildLvl = presetLvl || getWildLevel();
    wildStatus = null;
    wildSleepTurns = 0;
    activeWild.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    activeWild.isShiny = (Math.random() < 1/4096);

    // Fetch species data for catch rate & gender
    try {
      const speciesRes = await fetch(activeWild.species.url);
      const speciesData = await speciesRes.json();
      activeWild.captureRate = speciesData.capture_rate;
      activeWild.speciesData = speciesData;
      // Determine wild gender
      if (speciesData.gender_rate === -1) activeWild.wildGender = null; // genderless
      else if (speciesData.gender_rate === 0) activeWild.wildGender = 'male';
      else if (speciesData.gender_rate === 8) activeWild.wildGender = 'female';
      else activeWild.wildGender = Math.random() * 8 < speciesData.gender_rate ? 'female' : 'male';
    } catch (e) { /* keep defaults */ }

    activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    wildMaxHP = calculateStat(activeWild, 'hp', true);
    wildCurHP = wildMaxHP;
    escapeAttempts = 0;

    // 5% chance wild pokemon holds a random berry
    activeWild.heldItem = Math.random() < 0.05
      ? ['sitrusBerry', 'oranBerry', 'lumBerry', 'chestoBerry', 'rawstBerry'][Math.floor(Math.random() * 5)]
      : null;
    activeWild.berries = activeWild.heldItem
      ? { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0, [activeWild.heldItem]: 1 }
      : { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };

    wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetch(activeWild.moves[i].move.url).then(r => r.json()).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    wildMovesDetailed = moveResults.filter(m => m && m.power);
    wildMovesPP = wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${wildLvl}`;
    const wildSpriteUrl = activeWild.sprites?.other?.['official-artwork']?.front_default || activeWild.sprites.front_default;
    document.getElementById('wild-sprite').src = wildSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = playerSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();

    appendToLog(`Дикий ${activeWild.name.toUpperCase()} нападает!`, false, 'battle');
    appendToLog(`Погода: ${WEATHER_ICONS[currentWeather]} ${WEATHER_NAMES[currentWeather]}`, false, 'system');

    // Intimidate check
    const wildAbility = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(activePlayerMon, 'atk', -1);
      appendToLog(`${activeWild.name} отпугивает ${activePlayerMon.apiData.name}! Атака снижена!`);
    }

    playerMovesDetailed = [];
    loadMoveButtons(activePlayerMon, useMove);

  } catch (e) {
    battleLog.innerText = 'Ошибка загрузки...';
    setTimeout(() => { modal.style.display = 'none'; }, 1000);
  }
}

function loadMoveButtons(activeMon, clickHandler) {
  playerMovesDetailed = [];
  for (let i = 0; i < 4; i++) {
    const mBtn = document.getElementById(`move-btn-${i}`);
    if (activeMon.apiData.moves[i]) {
      mBtn.innerText = '...';
      mBtn.classList.add('disabled');
      mBtn.onclick = null;
      const url = activeMon.apiData.moves[i].move.url;
      fetch(url)
        .then(r => r.json())
        .then(d => {
          playerMovesDetailed[i] = d;
          if (!activeMon.movesPP) activeMon.movesPP = [];
          if (!activeMon.movesPP[i]) {
            activeMon.movesPP[i] = { current: d.pp || 30, max: d.pp || 30 };
          }
          mBtn.innerText = activeMon.apiData.moves[i].move.name;
          mBtn.classList.remove('disabled');
          mBtn.onclick = () => clickHandler(i);
          updateMoveButtonUI(i, d);
        })
        .catch(() => {
          mBtn.innerText = activeMon.apiData.moves[i].move.name;
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
  if (!activePlayerMon.movesPP || !activePlayerMon.movesPP[index]) return;
  const pp = activePlayerMon.movesPP[index];
  const mBtn = document.getElementById(`move-btn-${index}`);
  if (pp.current <= 0) {
    mBtn.innerText = `${moveData.name} (PP: 0/${pp.max})`;
    mBtn.classList.add('disabled');
  } else {
    mBtn.innerText = `${moveData.name} (PP: ${pp.current}/${pp.max})`;
  }
}

function updateMoveButtonUIs() {
  for (let i = 0; i < 4; i++) {
    if (playerMovesDetailed[i]) {
      updateMoveButtonUI(i, playerMovesDetailed[i]);
    }
  }
}

function updateWildHpUI() {
  document.getElementById('wild-hp-text').innerText = `${wildCurHP}/${wildMaxHP}`;
  const pct = Math.max(0, (wildCurHP / wildMaxHP) * 100);
  const bar = document.getElementById('wild-hp-fill');
  bar.style.width = `${pct}%`;
  bar.className = 'reborn-hp-fill';
  if (pct <= 20) bar.classList.add('hp-low');
  else if (pct <= 50) bar.classList.add('hp-medium');
}

function updatePlayerHpUI() {
  if (!activePlayerMon) return;
  document.getElementById('player-hp-text').innerText = `${activePlayerMon.currentHp}/${activePlayerMon.maxHp}`;
  const pct = Math.max(0, (activePlayerMon.currentHp / activePlayerMon.maxHp) * 100);
  const bar = document.getElementById('player-hp-fill');
  bar.style.width = `${pct}%`;
  bar.className = 'reborn-hp-fill';
  if (pct <= 20) bar.classList.add('hp-low');
  else if (pct <= 50) bar.classList.add('hp-medium');

  const expToCurrent = Math.pow(activePlayerMon.baseLevel, 3);
  const expToNext = activePlayerMon.expToNext || Math.pow(activePlayerMon.baseLevel + 1, 3);
  let expPct = ((activePlayerMon.exp - expToCurrent) / (expToNext - expToCurrent)) * 100;
  if (expPct < 0) expPct = 0;
  if (expPct > 100) expPct = 100;

  const expFill = document.getElementById('player-exp-fill');
  if (expFill) expFill.style.width = `${expPct}%`;
}

async function useMove(moveIndex) {
  const move = playerMovesDetailed[moveIndex];
  if (!move) return;

  // Check PP
  if (activePlayerMon.movesPP && activePlayerMon.movesPP[moveIndex]) {
    if (activePlayerMon.movesPP[moveIndex].current <= 0) {
      appendToLog('Нет PP для этой атаки!');
      return;
    }
  }

  // Choice item move lock
  const choiceItems = ['choiceBand', 'choiceScarf', 'choiceSpecs'];
  if (choiceItems.includes(activePlayerMon.heldItem) && activePlayerMon.choiceLockedMove !== undefined && activePlayerMon.choiceLockedMove !== moveIndex) {
    appendToLog('Можно использовать только выбранную атаку!');
    return;
  }

  // Check player status before attacking (and before consuming PP)
  if (!checkStatusTurn(activePlayerMon, true)) {
    document.getElementById('battle-main-menu').style.display = 'none';
    // Apply end-of-turn status damage before enemy
    applyStatusEndOfTurn(activePlayerMon, true);
    if (activePlayerMon.currentHp <= 0) {
      appendToLog(`${activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
      handlePlayerFaint();
      return;
    }
    if (wildCurHP <= 0) return;
    saveBattleState();
    setTimeout(() => { enemyTurn(); }, 1000);
    return;
  }

  // Decrement PP
  if (activePlayerMon.movesPP && activePlayerMon.movesPP[moveIndex]) {
    activePlayerMon.movesPP[moveIndex].current--;
  }

  // Choice item move lock
  if (choiceItems.includes(activePlayerMon.heldItem)) {
    activePlayerMon.choiceLockedMove = moveIndex;
  }

  appendToLog(`${activePlayerMon.apiData.name} использует ${move.name}!`);

  const power = move.power;
  if (!power) {
    // Assault Vest: can't use status moves
    if (activePlayerMon.heldItem === 'assaultVest') {
      appendToLog('Штурмовой жилет не позволяет использовать статус-атаки!');
      return;
    }
    // Status move - try apply status effect or stat change
    const ailment = move.meta?.ailment?.name;
    if (ailment && ailment !== 'none' && ailment !== 'unknown') {
      const statusMap = {
        'poison': 'psn', 'badly-poison': 'psn',
        'burn': 'brn', 'paralysis': 'par',
        'sleep': 'slp', 'freeze': 'frz'
      };
      const targetStatus = statusMap[ailment];
      if (targetStatus && !wildStatus) {
        if (applyStatusEffect(activeWild, targetStatus)) {
          wildStatus = activeWild.status;
          document.getElementById('wild-status-icon').innerText = getStatusIcon(wildStatus);
          appendToLog(`Дикий ${activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
        }
      }
    }

    let appliedStat = false;
    if (move.stat_changes && move.stat_changes.length > 0) {
      const targetMap = { 'user': activePlayerMon, 'selected-pokemon': activeWild, 'all-opponents': activeWild };
      const moveTarget = move.target?.name || 'selected-pokemon';
      const affectedMon = targetMap[moveTarget] || activeWild;
      const monName = affectedMon === activePlayerMon ? activePlayerMon.apiData.name : activeWild.name;
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

    if (!appliedStat && (!ailment || ailment === 'none' || ailment === 'unknown')) {
      appendToLog('Но ничего не произошло...');
    }
  } else {
    const isPhysical = move.damage_class.name === 'physical';
    const attackStat = isPhysical ? 'attack' : 'special-attack';
    const defenseStat = isPhysical ? 'defense' : 'special-defense';

    const A = calculateStat(activePlayerMon, attackStat, false);
    const D = calculateStat(activeWild, defenseStat, true);

    let burnAtkMod = 1.0;
    if (activePlayerMon.status === 'brn' && isPhysical) burnAtkMod = 0.5;

    const curLvl = activePlayerMon.baseLevel + activePlayerMon.candiesEaten;
    let baseDmg = Math.floor((((2 * curLvl / 5 + 2) * power * (A / D)) / 50) + 2);
    baseDmg = Math.floor(baseDmg * burnAtkMod);

    let stab = 1.0;
    activePlayerMon.apiData.types.forEach(t => {
      if (t.type.name === move.type.name) stab = 1.5;
    });

    const typeMult = getTypeMultiplier(move.type.name, activeWild.types);
    const weatherMult = getWeatherMultiplier(move.type.name, currentWeather);
    const randMod = 0.85 + Math.random() * 0.15;

    // Crit rate (base 6.25%, leek +2 stages = 50%)
    let critRate = 0.0625;
    if (activePlayerMon.heldItem === 'leek') {
      const species = activePlayerMon.apiData?.species?.name || '';
      if (species === 'farfetchd' || species === 'sirfetchd') critRate = 0.5;
    }
    const isCrit = Math.random() < critRate;
    const critMult = isCrit ? 1.5 : 1.0;

    // Air Balloon: ground immunity for wild
    let effTypeMult = typeMult;
    if (activeWild.heldItem === 'airBalloon' && move.type.name === 'ground') effTypeMult = 0;

    let heldMult = 1.0;
    // expertBelt: x1.2 on super-effective
    if (activePlayerMon.heldItem === 'expertBelt' && effTypeMult > 1) heldMult = 1.2;
    // lifeOrb: x1.3 damage
    if (activePlayerMon.heldItem === 'lifeOrb') heldMult = 1.3;

    let dmg = Math.floor(baseDmg * stab * effTypeMult * weatherMult * randMod * critMult * heldMult);

    if (isCrit) appendToLog('Критический удар!', false, 'dmg');

    // Focus Sash: survive at 1 HP (consumed on use)
    if (activeWild.heldItem === 'focusSash' && wildCurHP === wildMaxHP && dmg >= wildCurHP) {
      dmg = wildCurHP - 1;
      appendToLog(`${activeWild.name} держится благодаря Фокусному поясу!`);
      activeWild.heldItem = null;
    }

    wildCurHP -= dmg;
    if (wildCurHP < 0) wildCurHP = 0;

    // Big Root: x1.3 drain healing
    if (activePlayerMon.heldItem === 'bigRoot' && move.meta?.drain > 0) {
      const drainPct = move.meta.drain / 100;
      const heal = Math.floor(dmg * drainPct * 1.3);
      if (heal > 0) {
        activePlayerMon.currentHp = Math.min(activePlayerMon.maxHp, activePlayerMon.currentHp + heal);
        updatePlayerHpUI();
      }
    }

    // Life Orb recoil: -10% max HP
    if (activePlayerMon.heldItem === 'lifeOrb' && power) {
      const recoil = Math.max(1, Math.floor(activePlayerMon.maxHp / 10));
      activePlayerMon.currentHp -= recoil;
      if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
    }

    // Sturdy check: survive OHKO from full HP
    const wildAbil = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbil === 'sturdy' && wildCurHP === 0 && dmg >= wildMaxHP) {
      wildCurHP = 1;
      appendToLog(`${activeWild.name} выдерживает удар благодаря Прочной Броне!`);
    }

    updateWildHpUI();

    appendToLog(`Нанесено ${dmg} урона!`, false, 'dmg');

    if (typeMult > 1) {
      appendToLog('Это суперэффективно!', false, 'eff');
    } else if (typeMult < 1 && typeMult > 0) {
      appendToLog('Это малоэффективно...');
    } else if (typeMult === 0) {
      appendToLog('Атака не возымела эффекта...');
    }

    // Apply secondary status effect from move
    if (move.meta && move.meta.ailment && move.meta.ailment.name !== 'none' && move.meta.ailment.name !== 'unknown') {
      const chance = move.meta.ailment_chance || 10;
      if (Math.random() * 100 < chance) {
        const statusMap = {
          'poison': 'psn', 'badly-poison': 'psn',
          'burn': 'brn', 'paralysis': 'par',
          'sleep': 'slp', 'freeze': 'frz'
        };
        const targetStatus = statusMap[move.meta.ailment.name];
        if (targetStatus && !wildStatus) {
          if (applyStatusEffect(activeWild, targetStatus)) {
            wildStatus = activeWild.status;
            document.getElementById('wild-status-icon').innerText = getStatusIcon(wildStatus);
            appendToLog(`Дикий ${activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
          }
        }
      }
    }

    // Static / Flame Body / Poison Point: 30% on physical contact
    const wildAbilityContact = activeWild.abilities?.[0]?.ability?.name;
    if (power && isPhysical && ['static', 'flame-body', 'poison-point'].includes(wildAbilityContact)) {
      const statusMapAbility = { 'static': 'par', 'flame-body': 'brn', 'poison-point': 'psn' };
      if (!activePlayerMon.status && Math.random() < 0.3) {
        const st = statusMapAbility[wildAbilityContact];
        if (applyStatusEffect(activePlayerMon, st)) {
          document.getElementById('player-status-icon').innerText = getStatusIcon(st);
          appendToLog(`${activePlayerMon.apiData.name} получил ${STATUS_NAMES[st]} от способности ${activeWild.name}!`);
        }
      }
    }

    // Berry auto-use for wild
    if (wildCurHP > 0) checkBerryAutoUse(activeWild, false);

    // Rough Skin / Iron Barbs: 1/8 recoil on physical contact
    if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(wildAbilityContact)) {
      const recoil = Math.max(1, Math.floor(dmg / 8));
      activePlayerMon.currentHp -= recoil;
      if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
      appendToLog(`Шиповатое тело ${activeWild.name} ранит ${activePlayerMon.apiData.name}! (-${recoil} HP)`);
    }
  }

  document.getElementById('battle-main-menu').style.display = 'none';

  // Apply end-of-turn damage (poison/burn on player)
  applyStatusEndOfTurn(activePlayerMon, true);
  if (activePlayerMon.currentHp <= 0) {
    appendToLog(`${activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
    handlePlayerFaint();
    return;
  }

  if (wildCurHP <= 0) {
    applyStatusEndOfTurn(activeWild, false);
  }

  if (wildCurHP === 0) {
    appendToLog(`Дикий ${activeWild.name} побежден!`);
    checkQuestProgress('defeat_x');
    if (Math.random() < 0.10) { addItem('candy'); appendToLog('Вы нашли Сладкую Конфету!', false, 'quest'); }
    const dropResults = processMonsterDrop(activeWild.name);
    if (dropResults.length > 0) {
      const dropText = dropResults.map(d => `${d.qty}x ${itemDef(d.item).nameRu}`).join(', ');
      appendToLog(`Добыча: ${dropText}`, false, 'quest');
    }
    modifyMoney(wildLvl * 15);
    checkQuestProgress('earn_money', wildLvl * 15);

    const baseExp = activeWild.base_experience || 50;
    let expGain = Math.floor((baseExp * wildLvl) / 7);

    // luckyEgg: x2.5 EXP for holder
    if (activePlayerMon.heldItem === 'luckyEgg') expGain = Math.floor(expGain * 2.5);

    if (activePlayerMon.exp === undefined) {
      activePlayerMon.exp = Math.pow(activePlayerMon.baseLevel, 3);
      activePlayerMon.expToNext = Math.pow(activePlayerMon.baseLevel + 1, 3);
    }

    const monLvl = activePlayerMon.baseLevel + (activePlayerMon.candiesEaten || 0);
    if (monLvl < 100) {
      activePlayerMon.exp += expGain;
      appendToLog(`${activePlayerMon.apiData.name} получил ${expGain} EXP!`);
    }

    // expShare: 50% EXP to non-active team members
    if (GS.expShareActive) {
      const shareExp = Math.floor(expGain / 2);
      GS.myTeam.forEach(mon => {
        if (mon !== activePlayerMon && mon.currentHp > 0 && (mon.baseLevel + (mon.candiesEaten || 0)) < 100) {
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

    while (activePlayerMon.exp >= activePlayerMon.expToNext && activePlayerMon.baseLevel < 100) {
      activePlayerMon.baseLevel++;
      activePlayerMon.expToNext = Math.pow(activePlayerMon.baseLevel + 1, 3);

      const oldMax = activePlayerMon.maxHp;
      const newMax = calculateStat(activePlayerMon, 'hp', false);
      activePlayerMon.maxHp = newMax;
      activePlayerMon.currentHp += (newMax - oldMax);

      appendToLog(`${activePlayerMon.apiData.name} достиг ${activePlayerMon.baseLevel} уровня!`);
      await checkNewMovesOnLevelUp(activePlayerMon, activePlayerMon.baseLevel);
    }

    const evoTarget = await checkEvolution(activePlayerMon);
    if (evoTarget) {
      await triggerEvolution(activePlayerMon, evoTarget.name);
      updatePlayerHpUI();
    }

    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    clearBattleState();
    updateInventoryDisplay();
    updateMoneyDisplay();
    autoSave();
  } else {
    setTimeout(() => { enemyTurn(); }, 1000);
  }
}

function handlePlayerFaint() {
  // Try next mon regardless of battle type
  const nextMon = GS.myTeam.find(m => m.currentHp > 0 && m !== activePlayerMon);
  if (nextMon) {
    activePlayerMon = nextMon;
    activePlayerMon.choiceLockedMove = undefined;
    appendToLog(`${activePlayerMon.apiData.name}, вперёд!`);
    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const spriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = spriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();

    // Load moves for new mon
    const handler = battleType === 'wild' ? useMove : useMoveGym;
    loadMoveButtons(activePlayerMon, handler);

    saveBattleState();
    setTimeout(() => { document.getElementById('battle-main-menu').style.display = 'flex'; }, 1000);
    autoSave();
  } else {
    appendToLog('Вся команда потеряла сознание... Вы проиграли.');
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    clearBattleState();
    autoSave();
  }
}

function enemyTurn() {
  // Check wild status before attacking
  if (!checkStatusTurn(activeWild, false)) return;
  applyStatusEndOfTurn(activeWild, false);
  if (wildCurHP <= 0) {
    appendToLog(`Дикий ${activeWild.name} побежден!`);
    // Award EXP for status knockout
    const baseExp = wildLvl * 30;
    let expGain = Math.floor(baseExp / activePlayerMon.GS.myTeam.filter(m => m.currentHp > 0).length);
    if (GS.expShareActive) expGain = Math.floor(baseExp / activePlayerMon.GS.myTeam.length);
    activePlayerMon.currentExp = (activePlayerMon.currentExp || 0) + expGain;
    if (activePlayerMon.currentExp >= (activePlayerMon.expToNext || 100)) {
      activePlayerMon.baseLevel++;
      activePlayerMon.currentExp -= activePlayerMon.expToNext;
      activePlayerMon.expToNext = Math.floor(activePlayerMon.expToNext * 1.2);
      appendToLog(`${activePlayerMon.apiData.name} достиг ${activePlayerMon.baseLevel} уровня!`);
    }
    checkQuestProgress('defeat_x');
    if (Math.random() < 0.10) { addItem('candy'); appendToLog('Вы нашли Сладкую Конфету!', false, 'quest'); }
    const dropResults = processMonsterDrop(activeWild.name);
    if (dropResults.length > 0) {
      const dropText = dropResults.map(d => `${d.qty}x ${itemDef(d.item).nameRu}`).join(', ');
      appendToLog(`Добыча: ${dropText}`, false, 'quest');
    }
    modifyMoney(wildLvl * 15);
    checkQuestProgress('earn_money', wildLvl * 15);
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    clearBattleState();
    updateInventoryDisplay();
    updateMoneyDisplay();
    autoSave();
    return;
  }

  let chosenMove = null;
  let chosenIdx = -1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const idx = Math.floor(Math.random() * wildMovesDetailed.length);
    if (wildMovesDetailed[idx] && wildMovesDetailed[idx].power) {
      // Check PP if tracking
      if (wildMovesPP && wildMovesPP[idx] && wildMovesPP[idx].current <= 0) continue;
      chosenMove = wildMovesDetailed[idx];
      chosenIdx = idx;
      break;
    }
  }
  if (!chosenMove) {
    chosenMove = { power: 30, damage_class: { name: 'physical' }, type: { name: 'normal' }, name: 'Атака' };
  }
  const enemyMoveName = chosenMove.name || 'Атака';
  // Decrement wild PP
  if (chosenIdx >= 0 && wildMovesPP && wildMovesPP[chosenIdx]) {
    wildMovesPP[chosenIdx].current--;
  }
  const power = chosenMove.power;
  const isPhysical = chosenMove.damage_class.name === 'physical';
  const attackStat = isPhysical ? 'attack' : 'special-attack';
  const defenseStat = isPhysical ? 'defense' : 'special-defense';

  const A = calculateStat(activeWild, attackStat, true);
  const D = calculateStat(activePlayerMon, defenseStat, false);

  let wildStab = 1.0;
  (activeWild.types || []).forEach(t => {
    if (t.type && t.type.name === chosenMove.type.name) wildStab = 1.5;
  });
  const wildTypeMult = getTypeMultiplier(chosenMove.type.name, activePlayerMon.apiData.types);
  const weatherMult = getWeatherMultiplier(chosenMove.type.name, currentWeather);

  // Air Balloon: ground immunity for player
  let wildEffTypeMult = wildTypeMult;
  if (activePlayerMon.heldItem === 'airBalloon' && chosenMove.type.name === 'ground') wildEffTypeMult = 0;

  let wildHeldMult = 1.0;
  if (activeWild.heldItem === 'expertBelt' && wildEffTypeMult > 1) wildHeldMult = 1.2;
  if (activeWild.heldItem === 'lifeOrb') wildHeldMult = 1.3;

  let baseDmg = Math.floor((((2 * wildLvl / 5 + 2) * power * (A / D)) / 50) + 2);
  let dmg = Math.floor(baseDmg * (0.85 + Math.random() * 0.15));

  const isCrit = Math.random() < 0.0625;
  const critMult = isCrit ? 1.5 : 1.0;

  dmg = Math.floor(dmg * wildStab * wildEffTypeMult * weatherMult * critMult * wildHeldMult);

  if (isCrit) appendToLog('Критический удар!', false, 'dmg');
  if (wildEffTypeMult > 1) {
    appendToLog('Это суперэффективно!', false, 'eff');
  } else if (wildEffTypeMult < 1 && wildEffTypeMult > 0) {
    appendToLog('Это малоэффективно...');
  } else if (wildEffTypeMult === 0) {
    appendToLog('Атака не возымела эффекта...');
  }

  // Focus Sash: player survives at 1 HP (consumed on use)
  if (activePlayerMon.heldItem === 'focusSash' && activePlayerMon.currentHp === activePlayerMon.maxHp && dmg >= activePlayerMon.currentHp) {
    dmg = activePlayerMon.currentHp - 1;
    appendToLog(`${activePlayerMon.apiData.name} держится благодаря Фокусному поясу!`);
    activePlayerMon.heldItem = null;
  }

  appendToLog(`Дикий ${activeWild.name} использует ${enemyMoveName}! (-${dmg} HP)`, false, 'dmg');
  activePlayerMon.currentHp -= dmg;
  if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
  updatePlayerHpUI();

  // Rocky Helmet: 1/6 max HP recoil on contact
  if (power && isPhysical && activePlayerMon.heldItem === 'rockyHelmet') {
    const recoil = Math.max(1, Math.floor(wildMaxHP / 6));
    wildCurHP -= recoil;
    if (wildCurHP < 0) wildCurHP = 0;
    updateWildHpUI();
    appendToLog(`Каменный шлем ${activePlayerMon.apiData.name} ранит ${activeWild.name}! (-${recoil} HP)`);
  }

  // Wild lifeOrb recoil
  if (activeWild.heldItem === 'lifeOrb' && power) {
    wildCurHP -= Math.max(1, Math.floor(wildMaxHP / 10));
    if (wildCurHP < 0) wildCurHP = 0;
    updateWildHpUI();
  }

  // Rough Skin / Iron Barbs: 1/8 recoil on physical contact (player has the ability)
  const playerAbility = getAbilityName(activePlayerMon, false);
  if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(playerAbility)) {
    const recoil = Math.max(1, Math.floor(dmg / 8));
    wildCurHP -= recoil;
    if (wildCurHP < 0) wildCurHP = 0;
    updateWildHpUI();
    appendToLog(`Шиповатое тело ${activePlayerMon.apiData.name} ранит ${activeWild.name}! (-${recoil} HP)`);
  }

  // Berry auto-use for player
  if (activePlayerMon.currentHp > 0) checkBerryAutoUse(activePlayerMon, true);


  if (activePlayerMon.currentHp === 0) {
    appendToLog(`${activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
    handlePlayerFaint();
  } else {
    applyStatusEndOfTurn(activePlayerMon, true);
    if (activePlayerMon.currentHp <= 0) {
      handlePlayerFaint();
      return;
    }
    battleRound++;
    // Leftovers end-of-turn healing
    if (activePlayerMon.heldItem === 'leftovers' && activePlayerMon.currentHp > 0 && activePlayerMon.currentHp < activePlayerMon.maxHp) {
      const heal = Math.max(1, Math.floor(activePlayerMon.maxHp / 16));
      activePlayerMon.currentHp = Math.min(activePlayerMon.maxHp, activePlayerMon.currentHp + heal);
      updatePlayerHpUI();
      appendToLog(`${activePlayerMon.apiData.name} восстанавливает HP от Объедков! (+${heal})`);
    }
    saveBattleState();
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
  }
}

function initEncounterEvents() {
  document.getElementById('btn-run').addEventListener('click', () => {
    if (battleType !== 'wild') {
      appendToLog('Нельзя сбежать от лидера!');
      return;
    }
    escapeAttempts++;
    const playerSpeed = calculateStat(activePlayerMon, 'speed', false);
    const wildSpeed = calculateStat(activeWild, 'speed', true);

    let F = Math.floor((playerSpeed * 128 / wildSpeed) + 30 * escapeAttempts);

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
    if (battleType === 'gym' || battleType === 'elite' || battleType === 'GS.champion') {
      showToast('Нельзя сменить покемона в бою с лидером!', true);
      return;
    }
    switchPokemon();
  });

  document.getElementById('btn-use-item').addEventListener('click', () => {
    const item = document.getElementById('battle-item-select').value;

    const BALL_CONFIG = {};
    ITEMS.filter(i => i.isBall && i.implemented).forEach(i => {
      BALL_CONFIG[i.id] = {
        label: i.nameRu,
        mult: i.ballMult,
        qty: getItemQty(i.id),
        dec: () => removeItem(i.id),
      };
    });
    const ballCfg = BALL_CONFIG[item];
    if (ballCfg) {
      if (battleType !== 'wild') {
        return appendToLog('Нельзя ловить в бою с лидером!');
      }
      if (ballCfg.qty <= 0) return showToast(`У вас нет ${ballCfg.label}ов!`, true);
      // If team is full, will auto-send to PC box below

      ballCfg.dec();
      updateInventoryDisplay();

      const hpPct = wildCurHP / wildMaxHP;

      // Species catch rate (0-255, from PokeAPI or default 100)
      const speciesRate = activeWild.captureRate || activeWild.speciesData?.capture_rate || 100;
      // Standard formula: rate = (3*maxHP - 2*curHP) * rate / (3*maxHP) * ballBonus * statusBonus
      let catchRate = ((3 * wildMaxHP - 2 * wildCurHP) * speciesRate) / (3 * wildMaxHP);
      catchRate = catchRate * ballCfg.mult;

      // Status bonus
      if (wildStatus === 'slp' || wildStatus === 'frz') catchRate *= 2.5;
      else if (wildStatus === 'par' || wildStatus === 'brn' || wildStatus === 'psn') catchRate *= 1.5;

      // Ball special effects
      if (item === 'quickBall' && battleRound <= 1) catchRate *= 5;
      if (item === 'duskBall' && !GS.isDaytime) catchRate *= 3;
      if (item === 'timerBall') catchRate *= 1 + battleRound * 0.3;

      // Love Ball: x8 if opposite gender
      if (item === 'loveBall') {
        const wildGender = activeWild.wildGender;
        const playerGender = activePlayerMon?.apiData?.gender || (Math.random() < 0.5 ? 'male' : 'female');
        if (wildGender && playerGender && wildGender !== playerGender) catchRate *= 8;
      }

      // Convert to probability (cap at 95%)
      let catchChance = Math.min(0.95, catchRate / 255);

      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы бросили ${ballCfg.label}...`);

      setTimeout(() => {
        if (Math.random() < catchChance) {
          appendToLog(`Попался! ${activeWild.name.toUpperCase()} пойман!`, false, 'catch');

          const newMon = {
            uid: generateUID(),
            originalTrainer: getTrainerId(),
            createdAt: Date.now(),
            caughtLocation: GS.currentLocationId,
            isShiny: activeWild.isShiny || false,
            gender: activeWild.wildGender || null,
            apiData: activeWild,
            maxHp: wildMaxHP,
            currentHp: wildCurHP,
            ivs: activeWild.wildIVs,
            evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            baseLevel: wildLvl,
            exp: Math.pow(wildLvl, 3),
            expToNext: Math.pow(wildLvl + 1, 3),
            candiesEaten: 0,
            vitaminsEaten: 0,
            training: null,
            trainingStage: 0,
            trainingStat: null,
            happiness: 70,
            natureIdx: Math.floor(Math.random() * natures.length),
            breedLetter: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
            status: wildStatus || null,
            sleepTurns: wildSleepTurns || 0,
            movesPP: wildMovesPP ? wildMovesPP.map(pp => ({ current: pp.max, max: pp.max })) : [],
            statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
            abilityName: activeWild.abilities[0]?.ability?.name || null,
            heldItem: null,
            berries: activeWild.berries || { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
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
          if (activeWild.heldItem) {
            const heldLabel = getHeldItemName(activeWild.heldItem);
            appendToLog(`Покемон держал ${heldLabel}! Передано в рюкзак.`, false, 'catch');
            addItem(activeWild.heldItem);
            updateInventoryDisplay();
          }

          if (GS.myTeam.length < 6) {
            GS.myTeam.push(newMon);
          } else {
            if (pcBoxes.length === 0) pcBoxes.push([]);
            pcBoxes[0].push(newMon);
            addNotification('📦 Покемон в PC', `${newMon.name || activeWild.name} отправлен в Бокс 1 (команда полна).`);
            appendToLog(`${newMon.name || activeWild.name} отправлен в PC (команда полна).`, false, 'catch');
          }
          GS.pokedexCaught.add(activeWild.name);
          GS.pokedexSeen.add(activeWild.name);

          checkQuestProgress('catch_x');

          document.getElementById('battle-main-menu').style.display = 'none';
          document.getElementById('battle-end-menu').style.display = 'flex';
          autoSave();
        } else {
          appendToLog(`${activeWild.name.toUpperCase()} вырвался!`);
          setTimeout(() => { enemyTurn(); }, 1500);
        }
      }, 1000);

    } else if (item === 'potion') {
      if (getItemQty('potion') <= 0) return showToast('У вас нет Аптечек!', true);
      if (activePlayerMon.currentHp >= activePlayerMon.maxHp) return showToast('Здоровье уже полное!', true);

      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      removeItem('potion');
      updateInventoryDisplay();

      activePlayerMon.currentHp += 20;
      if (activePlayerMon.currentHp > activePlayerMon.maxHp) activePlayerMon.currentHp = activePlayerMon.maxHp;
      updatePlayerHpUI();

      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Аптечку! Здоровье ${activePlayerMon.apiData.name} восстановлено.`);

      setTimeout(() => {
        if (battleType === 'wild') {
          enemyTurn();
        } else {
          enemyTurnGym();
        }
      }, 1500);
    } else if (item === 'superPotion') {
      if (getItemQty('superPotion') <= 0) return showToast('Нет Супер Аптечек!', true);
      if (activePlayerMon.currentHp >= activePlayerMon.maxHp) return showToast('Здоровье уже полное!', true);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      removeItem('superPotion');
      updateInventoryDisplay();
      activePlayerMon.currentHp += 50;
      if (activePlayerMon.currentHp > activePlayerMon.maxHp) activePlayerMon.currentHp = activePlayerMon.maxHp;
      updatePlayerHpUI();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Супер Аптечку! Здоровье ${activePlayerMon.apiData.name} восстановлено.`);
      setTimeout(() => {
        if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
      }, 1500);
    } else if (item === 'fullRestore') {
      if (getItemQty('fullRestore') <= 0) return showToast('Нет Полного Восстановления!', true);
      if (activePlayerMon.currentHp >= activePlayerMon.maxHp && !activePlayerMon.status) return showToast('Здоровье уже полное!', true);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      removeItem('fullRestore');
      updateInventoryDisplay();
      activePlayerMon.currentHp = activePlayerMon.maxHp;
      cureStatus(activePlayerMon);
      document.getElementById('player-status-icon').innerText = '';
      updatePlayerHpUI();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали Полное Восстановление! ${activePlayerMon.apiData.name} полностью здоров!`);
      setTimeout(() => {
        if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
      }, 1500);
    } else if (item === 'evolutionStone') {
      if (getItemQty('evolutionStone') <= 0) return showToast('Нет Камней Эволюции!', true);
      (async () => {
        const evoTarget = await checkEvolution(activePlayerMon, true);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать!', true);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        removeItem('evolutionStone');
        updateInventoryDisplay();
        await triggerEvolution(activePlayerMon, evoTarget.name);
        updatePlayerHpUI();
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`${activePlayerMon.apiData.name} эволюционировал!`);
        setTimeout(() => {
          if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
        }, 1500);
      })();
    } else if (item === 'tm') {
      if (getItemQty('tm') <= 0) return showToast('Нет TM-совместимости!', true);
      showToast('Используйте TM из профиля покемона.', true);
    } else if (itemCategory(item) === 'statusCure') {
      const statusCureMap = {
        'antidote': 'psn', 'antiparalyze': 'par', 'energyDrink': 'slp',
        'fireExtinguisher': 'brn', 'antiSputin': null,
      };
      const targetStatus = statusCureMap[item];
      if (getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (item === 'healingHerb') {
        if (!activePlayerMon.status) return showToast('У покемона нет статуса!', true);
        removeItem(item);
        cureStatus(activePlayerMon);
        document.getElementById('player-status-icon').innerText = '';
      } else if (targetStatus) {
        if (activePlayerMon.status !== targetStatus) return showToast('Этот предмет не лечит текущий статус!', true);
        removeItem(item);
        cureStatus(activePlayerMon);
        document.getElementById('player-status-icon').innerText = '';
      } else {
        return showToast('Этот предмет пока не работает в бою.', true);
      }
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      updateInventoryDisplay();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали ${itemDef(item).nameRu}! Статус ${activePlayerMon.apiData.name} исцелён.`);
      setTimeout(() => {
        if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
      }, 1500);
    } else if (['weakElixir', 'elixir', 'strongElixir'].includes(item)) {
      const elixirMap = { 'weakElixir': 10, 'elixir': 20, 'strongElixir': 40 };
      const ppRestore = elixirMap[item];
      if (getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (!activePlayerMon.movesPP || activePlayerMon.movesPP.every(pp => pp && pp.current >= pp.max)) {
        return showToast('PP уже полностью!', true);
      }
      removeItem(item);
      GS.itemsUsedInBattle++;
      checkQuestProgress('use_item');
      updateInventoryDisplay();
      for (let i = 0; i < 4; i++) {
        if (activePlayerMon.movesPP && activePlayerMon.movesPP[i]) {
          activePlayerMon.movesPP[i].current = Math.min(
            activePlayerMon.movesPP[i].max,
            activePlayerMon.movesPP[i].current + ppRestore
          );
        }
      }
      updateMoveButtonUIs();
      document.getElementById('battle-main-menu').style.display = 'none';
      appendToLog(`Вы использовали ${itemDef(item).nameRu}! PP восстановлено.`);
      setTimeout(() => {
        if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
      }, 1500);
    } else if (['xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy'].includes(item)) {
      const xMap = { 'xAttack': 'atk', 'xDefense': 'def', 'xSpDefense': 'spd', 'xSpAttack': 'spa', 'xSpeed': 'spe', 'xAccuracy': null };
      const stat = xMap[item];
      if (getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      if (stat) {
        if (!activePlayerMon.statStages) activePlayerMon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (activePlayerMon.statStages[stat] >= 6) return showToast('Стат уже максимально повышен!', true);
        removeItem(item);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        updateInventoryDisplay();
        statStageModify(activePlayerMon, stat, 1);
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`Вы использовали ${itemDef(item).nameRu}! ${stat.toUpperCase()} повышен!`);
        setTimeout(() => {
          if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
        }, 1500);
      } else {
        return showToast('Этот предмет пока не работает в бою.', true);
      }
    } else if (itemCategory(item) === 'evolutionStones' && item !== 'evolutionStone') {
      if (getItemQty(item) <= 0) return showToast(`Нет ${itemDef(item).nameRu}!`, true);
      (async () => {
        const evoTarget = await checkEvolution(activePlayerMon, true, item);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать с этим камнем!', true);
        GS.itemsUsedInBattle++;
        checkQuestProgress('use_item');
        removeItem(item);
        updateInventoryDisplay();
        await triggerEvolution(activePlayerMon, evoTarget.name);
        updatePlayerHpUI();
        document.getElementById('battle-main-menu').style.display = 'none';
        appendToLog(`${activePlayerMon.apiData.name} эволюционировал!`);
        setTimeout(() => {
          if (battleType === 'wild') { enemyTurn(); } else { enemyTurnGym(); }
        }, 1500);
      })();
    }
  });

  document.getElementById('btn-leave-battle').addEventListener('click', () => {
    document.getElementById('encounter-modal').style.display = 'none';
    clearBattleState();
    gymTeamIndex = 0;
    gymTeamIndexInMember = 0;
    gymTeamData = null;
    battleType = 'wild';
    battleRound = 0;
    wildMovesPP = null;
    if (activePlayerMon) activePlayerMon.choiceLockedMove = undefined;
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
  document.getElementById('gym-reward').innerText = `Награда: ${leader.badgeName} + ¥${leader.moneyReward}`;

  const teamList = document.getElementById('gym-team-list');
  teamList.innerHTML = '';
  leader.team.forEach((member, i) => {
    const li = document.createElement('li');
    li.innerText = `${member.name} Lv${member.level}`;
    teamList.appendChild(li);
  });

  modal.style.display = 'flex';
  document.getElementById('btn-start-gym-battle').onclick = () => {
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
  battleRound = 0;
  const leader = GS.gymLeaders[locId];
  const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
  if (activeMonIndex === -1) {
    return showToast('Вам нужен хотя бы один живой покемон для битвы!', true);
  }

  battleType = 'gym';
  gymLeaderKey = locId;
  gymTeamIndex = 0;
  gymTeamData = JSON.parse(JSON.stringify(leader.team)); // clone

  activePlayerMon = GS.myTeam[activeMonIndex];
  activePlayerMon.choiceLockedMove = undefined;

  document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
  document.getElementById('player-sprite').src = playerSpriteUrl;
  updateBattleSpriteBgs();
  document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);

  const modal = document.getElementById('encounter-modal');
  document.getElementById('battle-main-menu').style.display = 'flex';
  document.getElementById('battle-end-menu').style.display = 'none';
  document.getElementById('battle-gym-info').style.display = 'block';
  document.getElementById('gym-leader-battle-name').innerText = `Лидер: ${leader.name}`;
  appendToLog(`Вызов лидера ${leader.name}!`, true);
  modal.style.display = 'flex';

  await startGymNextPokemon();
}

async function startGymNextPokemon() {
  if (gymTeamIndex >= gymTeamData.length) {
    // Won the gym battle!
    const leader = GS.gymLeaders[gymLeaderKey];
    badges.push(leader.badgeName);
    modifyMoney(leader.moneyReward);
    checkQuestProgress('earn_money', leader.moneyReward);
    appendToLog(`Победа! Вы получили ${leader.badgeName} и ¥${leader.moneyReward}!`);
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    updateMoneyDisplay();
    updateBadgeDisplay();
    autoSave();
    return;
  }

  const member = gymTeamData[gymTeamIndex];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${member.name.replace('_2', '')}`);
    activeWild = await res.json();
    wildLvl = member.level;
    wildStatus = null;
    wildSleepTurns = 0;
    currentWeather = getDailyWeather(GS.currentLocationId);

    activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    wildMaxHP = calculateStat(activeWild, 'hp', true);
    wildCurHP = wildMaxHP;
    escapeAttempts = 0;

    wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetch(activeWild.moves[i].move.url).then(r => r.json()).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    wildMovesDetailed = moveResults.filter(m => m && m.power);
    wildMovesPP = wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${wildLvl}`;
    const wildSpriteUrl = activeWild.sprites?.other?.['official-artwork']?.front_default || activeWild.sprites.front_default;
    document.getElementById('wild-sprite').src = wildSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    appendToLog(`${GS.gymLeaders[gymLeaderKey].name} выпускает ${activeWild.name}! (${gymTeamIndex + 1}/${gymTeamData.length})`);

    // Intimidate check
    const wildAbility = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(activePlayerMon, 'atk', -1);
      appendToLog(`${activeWild.name} отпугивает ${activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves
    loadMoveButtons(activePlayerMon, useMoveGym);

  } catch (e) {
    appendToLog('Ошибка загрузки покемона лидера...');
  }
  // Show the battle menu so player can attack next wild pokemon
  document.getElementById('battle-main-menu').style.display = 'flex';
}

async function useMoveGym(moveIndex) {
  const move = playerMovesDetailed[moveIndex];
  if (!move) return;

  if (activePlayerMon.movesPP && activePlayerMon.movesPP[moveIndex]) {
    if (activePlayerMon.movesPP[moveIndex].current <= 0) {
      appendToLog('Нет PP для этой атаки!');
      return;
    }
    activePlayerMon.movesPP[moveIndex].current--;
  }

  // Choice item move lock
  const choiceItems = ['choiceBand', 'choiceScarf', 'choiceSpecs'];
  if (choiceItems.includes(activePlayerMon.heldItem) && activePlayerMon.choiceLockedMove !== undefined && activePlayerMon.choiceLockedMove !== moveIndex) {
    appendToLog('Можно использовать только выбранную атаку!');
    return;
  }

  if (!checkStatusTurn(activePlayerMon, true)) {
    document.getElementById('battle-main-menu').style.display = 'none';
    applyStatusEndOfTurn(activePlayerMon, true);
    if (activePlayerMon.currentHp <= 0) {
      handleGymPlayerFaint();
      return;
    }
    if (wildCurHP <= 0) return;
    setTimeout(() => { enemyTurnGym(); }, 1000);
    return;
  }

  appendToLog(`${activePlayerMon.apiData.name} использует ${move.name}!`);

  const power = move.power;
  if (!power) {
    const ailment = move.meta?.ailment?.name;
    if (ailment && ailment !== 'none' && ailment !== 'unknown') {
      const statusMap = { 'poison': 'psn', 'badly-poison': 'psn', 'burn': 'brn', 'paralysis': 'par', 'sleep': 'slp', 'freeze': 'frz' };
      const targetStatus = statusMap[ailment];
      if (targetStatus && !wildStatus) {
        if (applyStatusEffect(activeWild, targetStatus)) {
          wildStatus = activeWild.status;
          document.getElementById('wild-status-icon').innerText = getStatusIcon(wildStatus);
          appendToLog(`${activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
        }
      }
    }
    // Stat changes for non-damaging moves in gym battles
    const statChanges = move.stat_changes || [];
    for (const sc of statChanges) {
      const change = sc.change;
      const statName = sc.stat.name;
      const statMap = { 'attack': 'atk', 'defense': 'def', 'special-attack': 'spa', 'special-defense': 'spd', 'speed': 'spe' };
      const short = statMap[statName];
      if (short) {
        if (change > 0) statStageModify(activePlayerMon, short, change);
        else statStageModify(activeWild, short, change);
      }
    }
    appendToLog('Но ничего не произошло...');
  } else {
    const isPhysical = move.damage_class.name === 'physical';
    const attackStat = isPhysical ? 'attack' : 'special-attack';
    const defenseStat = isPhysical ? 'defense' : 'special-defense';

    const A = calculateStat(activePlayerMon, attackStat, false);
    const D = calculateStat(activeWild, defenseStat, true);

    let burnAtkMod = 1.0;
    if (activePlayerMon.status === 'brn' && isPhysical) burnAtkMod = 0.5;

    const curLvl = activePlayerMon.baseLevel + activePlayerMon.candiesEaten;
    let baseDmg = Math.floor((((2 * curLvl / 5 + 2) * power * (A / D)) / 50) + 2);
    baseDmg = Math.floor(baseDmg * burnAtkMod);

    let stab = 1.0;
    activePlayerMon.apiData.types.forEach(t => {
      if (t.type.name === move.type.name) stab = 1.5;
    });

    const typeMult = getTypeMultiplier(move.type.name, activeWild.types);
    const weatherMult = getWeatherMultiplier(move.type.name, currentWeather);
    const randMod = 0.85 + Math.random() * 0.15;
    let dmg = Math.floor(baseDmg * stab * typeMult * weatherMult * randMod);

    wildCurHP -= dmg;
    if (wildCurHP < 0) wildCurHP = 0;

    // Sturdy check
    const wildAbil = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbil === 'sturdy' && wildCurHP === 0 && dmg >= wildMaxHP) {
      wildCurHP = 1;
      appendToLog(`${activeWild.name} выдерживает удар благодаря Прочной Броне!`);
    }

    updateWildHpUI();

    appendToLog(`Нанесено ${dmg} урона!`, false, 'dmg');

    if (typeMult > 1) appendToLog('Это суперэффективно!', false, 'eff');
    else if (typeMult < 1 && typeMult > 0) appendToLog('Это малоэффективно...');
    else if (typeMult === 0) appendToLog('Атака не возымела эффекта...');

    if (move.meta && move.meta.ailment && move.meta.ailment.name !== 'none' && move.meta.ailment.name !== 'unknown') {
      const chance = move.meta.ailment_chance || 10;
      if (Math.random() * 100 < chance) {
        const statusMap = { 'poison': 'psn', 'badly-poison': 'psn', 'burn': 'brn', 'paralysis': 'par', 'sleep': 'slp', 'freeze': 'frz' };
        const targetStatus = statusMap[move.meta.ailment.name];
        if (targetStatus && !wildStatus) {
          if (applyStatusEffect(activeWild, targetStatus)) {
            wildStatus = activeWild.status;
            document.getElementById('wild-status-icon').innerText = getStatusIcon(wildStatus);
            appendToLog(`${activeWild.name} получил ${STATUS_NAMES[targetStatus]}!`);
          }
        }
      }
    }

    // Static / Flame Body / Poison Point: 30% on physical contact
    const wildAbilityContact = activeWild.abilities?.[0]?.ability?.name;
    if (power && isPhysical && ['static', 'flame-body', 'poison-point'].includes(wildAbilityContact)) {
      const statusMapAbility = { 'static': 'par', 'flame-body': 'brn', 'poison-point': 'psn' };
      if (!activePlayerMon.status && Math.random() < 0.3) {
        const st = statusMapAbility[wildAbilityContact];
        if (applyStatusEffect(activePlayerMon, st)) {
          document.getElementById('player-status-icon').innerText = getStatusIcon(st);
          appendToLog(`${activePlayerMon.apiData.name} получил ${STATUS_NAMES[st]} от способности ${activeWild.name}!`);
        }
      }
    }

    // Berry auto-use for wild
    if (wildCurHP > 0) checkBerryAutoUse(activeWild, false);

    // Rough Skin / Iron Barbs: 1/8 recoil on physical contact
    if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(wildAbilityContact)) {
      const recoil = Math.max(1, Math.floor(dmg / 8));
      activePlayerMon.currentHp -= recoil;
      if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
      updatePlayerHpUI();
      appendToLog(`Шиповатое тело ${activeWild.name} ранит ${activePlayerMon.apiData.name}! (-${recoil} HP)`);
    }
  }

  document.getElementById('battle-main-menu').style.display = 'none';

  applyStatusEndOfTurn(activePlayerMon, true);
  if (activePlayerMon.currentHp <= 0) {
    handleGymPlayerFaint();
    return;
  }

  if (wildCurHP === 0) {
    appendToLog(`${activeWild.name} побежден!`);

    if (battleType === 'gym') {
      gymTeamIndex++;
    } else {
      gymTeamIndexInMember++;
    }

    const baseExp = activeWild.base_experience || 50;
    let expGain = Math.floor((baseExp * wildLvl) / 7);
    if (activePlayerMon.heldItem === 'luckyEgg') expGain = Math.floor(expGain * 2.5);

    if (activePlayerMon.exp === undefined) {
      activePlayerMon.exp = Math.pow(activePlayerMon.baseLevel, 3);
      activePlayerMon.expToNext = Math.pow(activePlayerMon.baseLevel + 1, 3);
    }
    const mLvl = activePlayerMon.baseLevel + (activePlayerMon.candiesEaten || 0);
    if (mLvl < 100) {
      activePlayerMon.exp += expGain;
      appendToLog(`${activePlayerMon.apiData.name} получил ${expGain} EXP!`);
    }

    if (GS.expShareActive) {
      const shareExp = Math.floor(expGain / 2);
      GS.myTeam.forEach(mon => {
        if (mon !== activePlayerMon && mon.currentHp > 0 && (mon.baseLevel + (mon.candiesEaten || 0)) < 100) {
          if (mon.exp === undefined) {
            mon.exp = Math.pow(mon.baseLevel, 3);
            mon.expToNext = Math.pow(mon.baseLevel + 1, 3);
          }
          mon.exp += shareExp;
          while (mon.exp >= mon.expToNext && (mon.baseLevel + (mon.candiesEaten || 0)) < 100) {
            mon.baseLevel++;
            mon.expToNext = Math.pow(mon.baseLevel + 1, 3);
            const om = mon.maxHp;
            mon.maxHp = calculateStat(mon, 'hp', false);
            mon.currentHp += (mon.maxHp - om);
          }
        }
      });
      if (shareExp > 0) appendToLog(`Остальная команда получила по ${shareExp} EXP!`);
    }

    while (activePlayerMon.exp >= activePlayerMon.expToNext && activePlayerMon.baseLevel < 100) {
      activePlayerMon.baseLevel++;
      activePlayerMon.expToNext = Math.pow(activePlayerMon.baseLevel + 1, 3);
      const oldMax = activePlayerMon.maxHp;
      const newMax = calculateStat(activePlayerMon, 'hp', false);
      activePlayerMon.maxHp = newMax;
      activePlayerMon.currentHp += (newMax - oldMax);
      appendToLog(`${activePlayerMon.apiData.name} достиг ${activePlayerMon.baseLevel} уровня!`);
      await checkNewMovesOnLevelUp(activePlayerMon, activePlayerMon.baseLevel);
    }

    const evoTarget = await checkEvolution(activePlayerMon);
    if (evoTarget) {
      await triggerEvolution(activePlayerMon, evoTarget.name);
      updatePlayerHpUI();
    }

    setTimeout(() => {
      if (battleType === 'gym') {
        startGymNextPokemon();
      } else if (battleType === 'elite') {
        startEliteNextPokemon();
      } else if (battleType === 'GS.champion') {
        startChampionNextPokemon();
      }
    }, 1000);
  } else {
    setTimeout(() => { enemyTurnGym(); }, 1000);
  }
}

function enemyTurnGym() {
  if (!checkStatusTurn(activeWild, false)) return;
  applyStatusEndOfTurn(activeWild, false);
  if (wildCurHP <= 0) {
    appendToLog(`${activeWild.name} побежден!`);
    if (battleType === 'gym') {
      gymTeamIndex++;
      setTimeout(() => { startGymNextPokemon(); }, 1000);
    } else if (battleType === 'elite') {
      gymTeamIndexInMember++;
      setTimeout(() => { startEliteNextPokemon(); }, 1000);
    } else if (battleType === 'GS.champion') {
      gymTeamIndexInMember++;
      setTimeout(() => { startChampionNextPokemon(); }, 1000);
    }
    return;
  }

  let chosenMove = null;
  let chosenIdx = -1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const idx = Math.floor(Math.random() * wildMovesDetailed.length);
    if (wildMovesDetailed[idx] && wildMovesDetailed[idx].power) {
      if (wildMovesPP && wildMovesPP[idx] && wildMovesPP[idx].current <= 0) continue;
      chosenMove = wildMovesDetailed[idx];
      chosenIdx = idx;
      break;
    }
  }
  if (!chosenMove) {
    chosenMove = { power: 30, damage_class: { name: 'physical' }, type: { name: 'normal' }, name: 'Атака' };
  }
  const enemyMoveName = chosenMove.name || 'Атака';
  if (chosenIdx >= 0 && wildMovesPP && wildMovesPP[chosenIdx]) {
    wildMovesPP[chosenIdx].current--;
  }
  const power = chosenMove.power;
  const isPhysical = chosenMove.damage_class.name === 'physical';
  const attackStat = isPhysical ? 'attack' : 'special-attack';
  const defenseStat = isPhysical ? 'defense' : 'special-defense';

  const A = calculateStat(activeWild, attackStat, true);
  const D = calculateStat(activePlayerMon, defenseStat, false);

  let baseDmg = Math.floor((((2 * wildLvl / 5 + 2) * power * (A / D)) / 50) + 2);
  let dmg = Math.floor(baseDmg * (0.85 + Math.random() * 0.15));

  const isCrit = Math.random() < 0.0625;
  const critMult = isCrit ? 1.5 : 1.0;

  let wildStab = 1.0;
  (activeWild.types || []).forEach(t => {
    if (t.type && t.type.name === chosenMove.type.name) wildStab = 1.5;
  });
  const wildTypeMult = getTypeMultiplier(chosenMove.type.name, activePlayerMon.apiData.types);
  const weatherMult = getWeatherMultiplier(chosenMove.type.name, currentWeather);
  dmg = Math.floor(dmg * wildStab * wildTypeMult * weatherMult * critMult);

  if (isCrit) appendToLog('Критический удар!', false, 'dmg');
  if (wildTypeMult > 1) {
    appendToLog('Это суперэффективно!', false, 'eff');
  } else if (wildTypeMult < 1 && wildTypeMult > 0) {
    appendToLog('Это малоэффективно...');
  } else if (wildTypeMult === 0) {
    appendToLog('Атака не возымела эффекта...');
  }

  appendToLog(`Дикий ${activeWild.name} использует ${enemyMoveName}! (-${dmg} HP)`, false, 'dmg');
  activePlayerMon.currentHp -= dmg;
  if (activePlayerMon.currentHp < 0) activePlayerMon.currentHp = 0;
  updatePlayerHpUI();

  // Rough Skin / Iron Barbs: 1/8 recoil on physical contact (player has the ability)
  const playerAbility = getAbilityName(activePlayerMon, false);
  if (power && isPhysical && ['rough-skin', 'iron-barbs'].includes(playerAbility)) {
    const recoil = Math.max(1, Math.floor(dmg / 8));
    wildCurHP -= recoil;
    if (wildCurHP < 0) wildCurHP = 0;
    updateWildHpUI();
    appendToLog(`Шиповатое тело ${activePlayerMon.apiData.name} ранит ${activeWild.name}! (-${recoil} HP)`);
  }

  // Berry auto-use for player
  if (activePlayerMon.currentHp > 0) checkBerryAutoUse(activePlayerMon, true);

  if (!activePlayerMon.status && Math.random() < 0.1) {
    const statuses = ['psn', 'brn', 'par'];
    const st = statuses[Math.floor(Math.random() * statuses.length)];
    if (applyStatusEffect(activePlayerMon, st)) {
      document.getElementById('player-status-icon').innerText = getStatusIcon(st);
      appendToLog(`${activePlayerMon.apiData.name} получил ${STATUS_NAMES[st]}!`);
    }
  }

  if (activePlayerMon.currentHp === 0) {
    appendToLog(`${activePlayerMon.apiData.name} потерял сознание!`, false, 'faint');
    handleGymPlayerFaint();
  } else {
    applyStatusEndOfTurn(activePlayerMon, true);
    if (activePlayerMon.currentHp <= 0) {
      handleGymPlayerFaint();
      return;
    }
    battleRound++;
    // Leftovers end-of-turn healing
    if (activePlayerMon.heldItem === 'leftovers' && activePlayerMon.currentHp > 0 && activePlayerMon.currentHp < activePlayerMon.maxHp) {
      const heal = Math.max(1, Math.floor(activePlayerMon.maxHp / 16));
      activePlayerMon.currentHp = Math.min(activePlayerMon.maxHp, activePlayerMon.currentHp + heal);
      updatePlayerHpUI();
      appendToLog(`${activePlayerMon.apiData.name} восстанавливает HP от Объедков! (+${heal})`);
    }
    setTimeout(() => {
      document.getElementById('battle-main-menu').style.display = 'flex';
    }, 1000);
  }
}

function handleGymPlayerFaint() {
  const nextMon = GS.myTeam.find(m => m.currentHp > 0 && m !== activePlayerMon);
  if (nextMon) {
    activePlayerMon = nextMon;
    activePlayerMon.choiceLockedMove = undefined;
    appendToLog(`Go! ${activePlayerMon.apiData.name}!`);
    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const spriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = spriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();

    loadMoveButtons(activePlayerMon, useMoveGym);

    setTimeout(() => { document.getElementById('battle-main-menu').style.display = 'flex'; }, 1000);
  } else {
    appendToLog('Вся команда потеряла сознание... Вы проиграли лидеру.');
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    gymTeamIndex = 0;
    gymTeamIndexInMember = 0;
    gymTeamData = null;
    battleType = 'wild';
  }
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
  battleRound = 0;
  battleType = 'elite';
  gymTeamIndex = 0;

  const activeMonIndex = GS.myTeam.findIndex(m => m.currentHp > 0);
  if (activeMonIndex === -1) return showToast('Вам нужен хотя бы один живой покемон!', true);
  activePlayerMon = GS.myTeam[activeMonIndex];
  activePlayerMon.choiceLockedMove = undefined;

  document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
  document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
  const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
  document.getElementById('player-sprite').src = playerSpriteUrl;
  updateBattleSpriteBgs();
  document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);

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
  if (gymTeamIndex >= GS.eliteFour.length) {
    battleType = 'GS.champion';
    await championBattle();
    return;
  }

  const member = GS.eliteFour[gymTeamIndex];
  gymTeamData = JSON.parse(JSON.stringify(member.team));
  gymTeamIndexInMember = 0;
  appendToLog(`--- ${member.name} (${member.title}) ---`);
  await startEliteNextPokemon();
}

async function startEliteNextPokemon() {
  // If all pokemon of this elite member are defeated
  if (gymTeamIndexInMember >= gymTeamData.length) {
    modifyMoney(GS.eliteFour[gymTeamIndex].moneyReward);
    checkQuestProgress('earn_money', GS.eliteFour[gymTeamIndex].moneyReward);
    updateMoneyDisplay();
    gymTeamIndex++;
    gymTeamData = null;
    gymTeamIndexInMember = 0;
    setTimeout(() => { startEliteNextMember(); }, 1500);
    return;
  }

  const member = gymTeamData[gymTeamIndexInMember];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${member.name.replace('_2', '')}`);
    activeWild = await res.json();
    wildLvl = member.level;
    wildStatus = null;
    wildSleepTurns = 0;
    currentWeather = getDailyWeather(GS.currentLocationId);

    activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    wildMaxHP = calculateStat(activeWild, 'hp', true);
    wildCurHP = wildMaxHP;
    escapeAttempts = 0;

    wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetch(activeWild.moves[i].move.url).then(r => r.json()).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    wildMovesDetailed = moveResults.filter(m => m && m.power);
    wildMovesPP = wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${wildLvl}`;
    const wildSpriteUrl = activeWild.sprites?.other?.['official-artwork']?.front_default || activeWild.sprites.front_default;
    document.getElementById('wild-sprite').src = wildSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    appendToLog(`${GS.eliteFour[gymTeamIndex].name} выпускает ${activeWild.name}!`);

    // Intimidate check
    const wildAbility = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(activePlayerMon, 'atk', -1);
      appendToLog(`${activeWild.name} отпугивает ${activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves for elite battle
    loadMoveButtons(activePlayerMon, useMoveGym);

    // Player UI refresh
    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = playerSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();
    document.getElementById('battle-main-menu').style.display = 'flex';

  } catch (e) {
    appendToLog('Ошибка загрузки...');
  }
}

async function championBattle() {
  GS.itemsUsedInBattle = 0;
  battleRound = 0;
  gymTeamData = JSON.parse(JSON.stringify(GS.champion.team));
  gymTeamIndexInMember = 0;
  battleType = 'GS.champion';
  appendToLog(`--- ${GS.champion.name} вызывает вас! ---`);
  await startChampionNextPokemon();
}

async function startChampionNextPokemon() {
  if (gymTeamIndexInMember >= gymTeamData.length) {
    modifyMoney(GS.champion.moneyReward);
    checkQuestProgress('earn_money', GS.champion.moneyReward);
    updateMoneyDisplay();
    appendToLog('ПОБЕДА! Вы стали Чемпионом Лиги!');
    document.getElementById('battle-main-menu').style.display = 'none';
    document.getElementById('battle-end-menu').style.display = 'flex';
    gymTeamIndex = 0;
    gymTeamData = null;
    battleType = 'wild';
    autoSave();
    return;
  }

  const member = gymTeamData[gymTeamIndexInMember];
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${member.name.replace('_2', '')}`);
    activeWild = await res.json();
    wildLvl = member.level;
    wildStatus = null;
    wildSleepTurns = 0;
    currentWeather = getDailyWeather(GS.currentLocationId);

    activeWild.wildIVs = {
      hp: Math.floor(Math.random() * 32),
      atk: Math.floor(Math.random() * 32),
      def: Math.floor(Math.random() * 32),
      spa: Math.floor(Math.random() * 32),
      spd: Math.floor(Math.random() * 32),
      spe: Math.floor(Math.random() * 32)
    };

    wildMaxHP = calculateStat(activeWild, 'hp', true);
    wildCurHP = wildMaxHP;

    wildMovesDetailed = [];
    const movePromises = [];
    for (let i = 0; i < activeWild.moves.length && i < 20; i++) {
      movePromises.push(
        fetch(activeWild.moves[i].move.url).then(r => r.json()).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    wildMovesDetailed = moveResults.filter(m => m && m.power);
    wildMovesPP = wildMovesDetailed.map(m => ({ current: m.pp || 30, max: m.pp || 30 }));

    document.getElementById('wild-name').innerText = activeWild.name;
    document.getElementById('wild-lvl').innerText = `Lv${wildLvl}`;
    const wildSpriteUrl = activeWild.sprites?.other?.['official-artwork']?.front_default || activeWild.sprites.front_default;
    document.getElementById('wild-sprite').src = wildSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('wild-status-icon').innerText = '';
    updateWildHpUI();

    appendToLog(`${GS.champion.name} выпускает ${activeWild.name}!`);

    // Intimidate check
    const wildAbility = activeWild.abilities?.[0]?.ability?.name;
    if (wildAbility === 'intimidate') {
      statStageModify(activePlayerMon, 'atk', -1);
      appendToLog(`${activeWild.name} отпугивает ${activePlayerMon.apiData.name}! Атака снижена!`);
    }

    // Set up player moves for GS.champion battle
    loadMoveButtons(activePlayerMon, useMoveGym);

    // Player UI refresh
    document.getElementById('player-name').innerText = activePlayerMon.nickname || activePlayerMon.apiData.name;
    document.getElementById('player-lvl').innerText = `Lv${activePlayerMon.baseLevel + activePlayerMon.candiesEaten}`;
    const playerSpriteUrl = activePlayerMon.apiData.sprites?.other?.['official-artwork']?.front_default || activePlayerMon.apiData.sprites.front_default;
    document.getElementById('player-sprite').src = playerSpriteUrl;
    updateBattleSpriteBgs();
    document.getElementById('player-status-icon').innerText = getStatusIcon(activePlayerMon.status);
    updatePlayerHpUI();
    document.getElementById('battle-main-menu').style.display = 'flex';

  } catch (e) {
    appendToLog('Ошибка загрузки...');
  }
}


// === STATE ACCESSORS ===
function getBattleVars() {
  return {
    activeWild, wildLvl, wildMaxHP, wildCurHP, wildStatus, wildSleepTurns,
    escapeAttempts, wildMovesDetailed, wildMovesPP, battleRound,
    activePlayerMon, playerMovesDetailed, battleType, gymLeaderKey,
    gymTeamIndex, gymTeamData, gymTeamIndexInMember,
    currentWeather, itemsUsedInBattle: GS.itemsUsedInBattle, huntActive, huntTimer,
  };
}

function setBattleVars(updates) {
  for (const [k, v] of Object.entries(updates)) {
    switch(k) {
      case 'activeWild': activeWild = v; break;
      case 'wildLvl': wildLvl = v; break;
      case 'wildMaxHP': wildMaxHP = v; break;
      case 'wildCurHP': wildCurHP = v; break;
      case 'wildStatus': wildStatus = v; break;
      case 'wildSleepTurns': wildSleepTurns = v; break;
      case 'escapeAttempts': escapeAttempts = v; break;
      case 'wildMovesDetailed': wildMovesDetailed = v; break;
      case 'wildMovesPP': wildMovesPP = v; break;
      case 'battleRound': battleRound = v; break;
      case 'activePlayerMon': activePlayerMon = v; break;
      case 'playerMovesDetailed': playerMovesDetailed = v; break;
      case 'battleType': battleType = v; break;
      case 'gymLeaderKey': gymLeaderKey = v; break;
      case 'gymTeamIndex': gymTeamIndex = v; break;
      case 'gymTeamData': gymTeamData = v; break;
      case 'gymTeamIndexInMember': gymTeamIndexInMember = v; break;
      case 'currentWeather': currentWeather = v; break;
      case 'itemsUsedInBattle': GS.itemsUsedInBattle = v; break;
      case 'huntActive': huntActive = v; break;
      case 'huntTimer': huntTimer = v; break;
    }
  }
}

export { getDailyWeather, getWeatherMultiplier, saveBattleState, clearBattleState, restoreBattleState, renderBattleUI, getTypeMultiplier, calculateStat, appendToLog, getAbilityName, statStageModify, updateStatBadges, clearUsedItem, checkBerryAutoUse, giveBerryToMon, generateDailyQuests, checkQuestProgress, claimQuestReward, openQuests, renderQuests, loadPokedexData, getStatusIcon, applyStatusEffect, cureStatus, checkStatusTurn, applyStatusEndOfTurn, switchPokemon, pickWeightedEncounter, getWildLevel, getLocationEncounters, startAutoHunt, stopAutoHunt, getBestRod, startHunt, loadMoveButtons, updateMoveButtonUI, updateMoveButtonUIs, updateWildHpUI, updatePlayerHpUI, useMove, handlePlayerFaint, enemyTurn, initEncounterEvents, openGymModal, initGymEvents, startGymBattle, startGymNextPokemon, useMoveGym, enemyTurnGym, handleGymPlayerFaint, openEliteModal, startEliteBattle, startEliteNextMember, startEliteNextPokemon, championBattle, startChampionNextPokemon, getBattleVars, setBattleVars, huntActive, huntTimer };
