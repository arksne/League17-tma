console.log("MAIN.JS START");
import { io } from 'socket.io-client';
import { GEN_STARTERS } from './src/data/starters.js';

import { gymLeaders } from './src/data/gyms.js';

import { ITEMS } from './src/data/items.js';

import { NPC_DATA } from './src/data/npc.js';

import { MONSTER_DROP_TABLE } from './src/data/drops.js';
import { natures } from './src/data/natures.js';
import { trainingStages } from './src/data/training.js';
import { STONE_ITEM_MAP } from './src/data/stones.js';
import { TRANSPORT_HUBS } from './src/data/transport.js';
import { openPokedex, showPokedexInfo } from './src/ui/pokedex.js';
import { openShop, initShopEvents, initSellTab } from './src/ui/shop.js';
import { checkEvolution, triggerEvolution, getEvolutions, fetchEvolutionChain } from './src/ui/evolution.js';
export { checkEvolution, triggerEvolution, getEvolutions, fetchEvolutionChain };
import { checkNewMovesOnLevelUp, offerLearnMove } from './src/ui/levelup_moves.js';
export { checkNewMovesOnLevelUp, offerLearnMove };
import { fetchLearnableMoves, openMoveRelearner, showSlotPicker } from './src/ui/tm.js';
export { fetchLearnableMoves, openMoveRelearner, showSlotPicker };
import { editNickname } from './src/ui/nickname.js';
export { editNickname };
import { loadChatMessages, startChatPolling, initChatSocket, stopChatPolling, sendChatMessage } from './src/ui/chat.js';
export { loadChatMessages, startChatPolling, initChatSocket, stopChatPolling, sendChatMessage };
import { loadAllTrainers, initTrainersTab, showAccountPanel } from './src/ui/trainers.js';
export { loadAllTrainers, initTrainersTab, showAccountPanel };

import { initInventoryEvents, updateDynamicEVs, updateInventoryDisplay, renderBattleItemSelect, updateQADisplays, renderInventory, useItem, getHeldItemName, openHeldItemPicker } from './src/ui/inventory.js';
export { initInventoryEvents, updateDynamicEVs, updateInventoryDisplay, renderBattleItemSelect, updateQADisplays, renderInventory, useItem, getHeldItemName, openHeldItemPicker };
import { getDailyWeather, evolutionCache, evolvesFromMap, getWeatherMultiplier, saveBattleState, clearBattleState, restoreBattleState, renderBattleUI, getTypeMultiplier, calculateStat, appendToLog, getAbilityName, statStageModify, updateStatBadges, clearUsedItem, checkBerryAutoUse, giveBerryToMon, generateDailyQuests, checkQuestProgress, claimQuestReward, openQuests, renderQuests, loadPokedexData, getStatusIcon, applyStatusEffect, cureStatus, checkStatusTurn, applyStatusEndOfTurn, switchPokemon, pickWeightedEncounter, getWildLevel, getLocationEncounters, startAutoHunt, stopAutoHunt, getBestRod, startHunt, loadMoveButtons, updateMoveButtonUI, updateMoveButtonUIs, updateWildHpUI, updatePlayerHpUI, useMove, handlePlayerFaint, enemyTurn, initEncounterEvents, openGymModal, initGymEvents, startGymBattle, startGymNextPokemon, useMoveGym, enemyTurnGym, handleGymPlayerFaint, openEliteModal, startEliteBattle, startEliteNextMember, startEliteNextPokemon, championBattle, startChampionNextPokemon, getBattleVars, setBattleVars, POKEDEX_ALL, pokedexData, pokedexTotal, WEATHER_ICONS, WEATHER_NAMES, huntActive, huntTimer } from './src/battle/core.js';
export { getDailyWeather, evolutionCache, evolvesFromMap, getWeatherMultiplier, saveBattleState, clearBattleState, restoreBattleState, renderBattleUI, getTypeMultiplier, calculateStat, appendToLog, getAbilityName, statStageModify, updateStatBadges, clearUsedItem, checkBerryAutoUse, giveBerryToMon, generateDailyQuests, checkQuestProgress, claimQuestReward, openQuests, renderQuests, loadPokedexData, getStatusIcon, applyStatusEffect, cureStatus, checkStatusTurn, applyStatusEndOfTurn, switchPokemon, pickWeightedEncounter, getWildLevel, getLocationEncounters, startAutoHunt, stopAutoHunt, getBestRod, startHunt, loadMoveButtons, updateMoveButtonUI, updateMoveButtonUIs, updateWildHpUI, updatePlayerHpUI, useMove, handlePlayerFaint, enemyTurn, initEncounterEvents, openGymModal, initGymEvents, startGymBattle, startGymNextPokemon, useMoveGym, enemyTurnGym, handleGymPlayerFaint, openEliteModal, startEliteBattle, startEliteNextMember, startEliteNextPokemon, championBattle, startChampionNextPokemon, getBattleVars, setBattleVars, POKEDEX_ALL, pokedexData, pokedexTotal, WEATHER_ICONS, WEATHER_NAMES, huntActive, huntTimer };
import { REGIONS } from './src/data/regions.js';


window.onerror = function(msg, src, line, col, err) {
  document.body.innerHTML += '<div style="position:fixed;top:0;left:0;right:0;background:#ff3b30;color:#fff;padding:10px;z-index:99999;font-size:12px;white-space:pre-wrap"><b>JS ERROR:</b> ' + msg + '<br>at ' + src + ':' + line + ':' + col + '</div>';
  console.error(msg, err);
};

export function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

// --- GAME DATA (REGIONS & LOCATIONS) ---
// --- GAME DATA (REGIONS & LOCATIONS) ---
// Based on wiki.league17.ru structure


export function getLocation(locId) {
  for (const region of Object.values(REGIONS)) {
    if (region.locations[locId]) return region.locations[locId];
  }
  return null;
}
export function getRegionOfLocation(locId) {
  for (const [key, region] of Object.entries(REGIONS)) {
    if (region.locations[locId]) return key;
  }
  return 'kanto';
}

// Transport hubs between regions



export function travelToRegion(targetRegion, targetLoc, ticketItemId) {
  if (!hasItem(ticketItemId)) {
    showToast(`Нужен билет: ${itemDef(ticketItemId).nameRu}!`, true);
    return;
  }
  
  const currentHour = new Date().getHours();
  let schedule = [];
  
  if (ticketItemId === 'ticketBoatJK' || ticketItemId === 'ticketBoatJS') {
    schedule = [10, 14, 18, 22];
  } else if (ticketItemId === 'ticketTrainJK') {
    schedule = [8, 12, 16, 20];
  } else if (ticketItemId === 'ticketBusJ') {
    schedule = [9, 13, 17, 21];
  } else if (ticketItemId === 'ticketFerryKS') {
    schedule = [15]; // Only at 15:00
    const day = new Date().getDate();
    if (day % 2 === 0) {
      showToast('Паром в Южный Архипелаг ходит только по нечётным числам месяца!', true);
      return;
    }
  }

  if (!schedule.includes(currentHour)) {
    showToast(`Транспорт сейчас недоступен! Расписание отправлений: ${schedule.map(h => h + ':00').join(', ')}. Текущее время сервера: ${currentHour}:00`, true);
    return;
  }

  removeItem(ticketItemId, 1);
  currentRegion = targetRegion;
  appendToLog(`Вы отправились в регион ${REGIONS[targetRegion].name}!`, false, 'quest');
  renderLocation(targetLoc);
}

let currentLocationId = 'pallet_town';
let pokedexSeen = new Set();
let pokedexCaught = new Set();
let isDaytime = true;
let itemsUsedInBattle = 0;
let lastLocation = null;
let currentRegion = 'kanto';
let expShareActive = false;

// --- EXISTING PROFILE DATA ---




// ==================== ITEMS DATABASE ====================
// Карта камней эволюции → PokeAPI триггер-названия


// Централизованная база всех предметов в игре


// --- MONSTER DROP TABLE (wiki + original) ---


const UNIVERSAL_DROPS = [
  { item: 'quartz', chance: 0.03, qty: 1 },
  { item: 'malachite', chance: 0.01, qty: 1 },
  { item: 'goldNugget', chance: 0.01, qty: 1 },
];

function processMonsterDrop(pokemonName) {
  const drops = [];
  const speciesTable = MONSTER_DROP_TABLE[pokemonName] || [];
  for (const entry of speciesTable) {
    if (Math.random() < entry.chance) {
      addItem(entry.item, entry.qty);
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  for (const entry of UNIVERSAL_DROPS) {
    if (Math.random() < entry.chance) {
      addItem(entry.item, entry.qty);
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  return drops;
}

// --- NPC DATA ---


// Centralized inventory
let inventory = {};
let itemHistory = [];

function logItemHistory(itemId, qty, source) {
  itemHistory.push({
    itemId, qty, source,
    timestamp: Date.now(),
    trainerId: getTrainerId()
  });
  if (itemHistory.length > 500) itemHistory = itemHistory.slice(-500);
}

function initInventory() {
  // Give infinite (9999) of every item for beta testing
  ITEMS.forEach(item => {
    inventory[item.id] = 9999;
    logItemHistory(item.id, 9999, 'init');
  });
}

// ═══════════════════════════════════════════
// 🛠 АДМИН-КОНСОЛЬ (вызывай в F12 → Console)
// ═══════════════════════════════════════════
window.help = function() {
  console.log(`
🛠 Админ-команды (вводи в консоли):
──────────────────────────────────────────
💰 money(N)         — Добавить N кредитов
🎒 items()          — Все предметы x999
🎒 items10()        — Все предметы x10
🏅 allBadges()      — Все 8 значков Канто
🏥 heal()           — Вылечить всю команду
⭐ maxIV()          — Макс IV (31) всей команде
📈 lvlup(N)         — +N уровней команде
🦄 legendary()      — Добавить легендарного покемона
🦄 mew()            — Добавить Мью
🗺️  goto(locId)      — Телепорт в локацию
📋 cmds()           — Показать это меню
──────────────────────────────────────────
  `);
};
window.cmds = window.help;

window.money = function(n = 100000) { money += Number(n); updateMoneyDisplay(); autoSave(); console.log('+¥' + n); };
window.items = function() { ITEMS.forEach(i => { inventory[i.id] = 999; }); updateInventoryDisplay(); autoSave(); console.log('Все предметы x999'); };
window.items10 = function() { ITEMS.forEach(i => { inventory[i.id] = 10; }); updateInventoryDisplay(); autoSave(); console.log('Все предметы x10'); };
window.allBadges = function() {
  badges = ['Boulder Badge','Cascade Badge','Thunder Badge','Rainbow Badge','Marsh Badge','Soul Badge','Volcano Badge','Earth Badge'];
  updateBadgeDisplay(); autoSave(); console.log('8 значков получено!');
};
window.heal = function() {
  myTeam.forEach(m => { m.currentHp = m.maxHp; m.status = null; m.sleepTurns = 0;
    if (m.movesPP) m.movesPP.forEach(pp => { if (pp) pp.current = pp.max; });
  });
  updatePlayerHpUI(); autoSave(); console.log('Команда вылечена');
};
window.maxIV = function() {
  myTeam.forEach(m => { m.ivs = { hp:31, atk:31, def:31, spa:31, spd:31, spe:31 }; });
  autoSave(); console.log('IV 31 всей команде');
};
window.lvlup = function(n = 10) {
  myTeam.forEach(m => { for(let i=0;i<n;i++) { m.baseLevel++; m.maxHp = calculateStat(m,'hp',false); m.currentHp = m.maxHp; } });
  refreshProfileUI(); renderTeamGrid(); autoSave(); console.log('+' + n + ' уровней команде');
};
window.legendary = async function() {
  const leg = ['mewtwo','mew','lugia','ho-oh','celebi','rayquaza','groudon','kyogre','dialga','palkia','giratina','arceus','zekrom','reshiram','xerneas','yveltal','solgaleo','lunala','marshadow','zeraora'];
  const pick = leg[Math.floor(Math.random()*leg.length)];
  await giveStarterMon(pick);
  renderTeamGrid(); autoSave(); console.log('Легендарный ' + pick + ' добавлен!');
};
window.mew = async function() { await giveStarterMon('mew'); renderTeamGrid(); autoSave(); console.log('Мью добавлен!'); };
window.goto = function(locId) {
  if (!REGIONS[currentRegion]?.locations[locId] && !Object.values(REGIONS).some(r => r.locations[locId])) {
    console.log('Локация не найдена. Примеры: pallet_town, viridian_city, goldenrod, indigo_plateau');
    return;
  }
  currentLocationId = locId;
  for (const [reg, data] of Object.entries(REGIONS)) {
    if (data.locations[locId]) { currentRegion = reg; break; }
  }
  renderLocation(locId); autoSave(); console.log('Телепорт: ' + locId);
};

// Авто-список ID локаций
window.locations = function() {
  const all = [];
  for (const [reg, data] of Object.entries(REGIONS)) {
    for (const [id, loc] of Object.entries(data.locations)) {
      all.push({ id, name: loc.name, region: reg, hasHeal: loc.hasHeal, hasWater: loc.hasWater });
    }
  }
  console.table(all);
  return all;
};

window.myId = function() { console.log('Твой Telegram ID:', tgUser?.id || 'не авторизован'); console.log('Твой username:', tgUser?.username || 'нет'); return tgUser?.id; };
window.adminAdd = function(id) { if(!id) { console.log('Используй: adminAdd(ТВОЙ_ID_ИЗ_myId())'); return; } ADMIN_IDS.add(id); console.log('Админ добавлен:', id); };
window.adminList = function() { console.log('Админы:', Array.from(ADMIN_IDS)); return Array.from(ADMIN_IDS); };

console.log('🛠 PokeMatrix Admin готов. Введи help() для списка команд.');
console.log('📱 Твой Telegram ID: введи myId()');

// 📱 Админ-панель для телефона (кнопка в интерфейсе)
function initAdminPanel() {
  // Floating admin button
  const fab = document.createElement('button');
  fab.id = 'admin-fab';
  fab.innerHTML = '🛠';
  fab.title = 'Админ-панель';
  fab.style.cssText = 'position:fixed;bottom:120px;right:16px;width:48px;height:48px;border-radius:50%;background:#af52de;color:#fff;border:none;font-size:1.4rem;z-index:250;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(fab);

  // Admin modal
  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="selection-modal-card" style="max-width:380px;width:95%;max-height:85vh;overflow-y:auto;">
      <h3>🛠 Админ-панель</h3>
      <p style="font-size:0.75rem;color:var(--tma-text-muted);margin:0 0 8px;">Мой ID: ${tgUser?.id || '?'} | ${tgUser?.username || ''}</p>
      <div style="display:flex;gap:4px;margin-bottom:6px;">
        <select id="admin-user-select" style="flex:1;padding:6px;font-size:0.78rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);max-width:60%;">
          <option value="">— Выбрать —</option>
        </select>
        <input id="admin-target-id" type="text" placeholder="или ID" style="flex:1;padding:6px 8px;font-size:0.78rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);">
        <button class="tma-btn" id="admin-lookup" style="padding:6px 10px;font-size:0.8rem;background:#007aff;">🔍</button>
      </div>
      <div id="admin-target-info" style="font-size:0.72rem;color:var(--tma-text-muted);margin-bottom:8px;"></div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
        <button class="tma-btn admin-id-act" data-act="items" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#34c759;">🎒</button>
        <button class="tma-btn admin-id-act" data-act="money" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#ff9500;">💰</button>
        <button class="tma-btn admin-id-act" data-act="badges" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#ff3b30;">🏅</button>
        <button class="tma-btn admin-id-act" data-act="heal" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#007aff;">🏥</button>
        <button class="tma-btn admin-id-act" data-act="iv" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#af52de;">⭐</button>
        <button class="tma-btn admin-id-act" data-act="lvl50" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#5856d6;">📈</button>
        <button class="tma-btn admin-id-act" data-act="legend" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#ff6482;">🦄</button>
        <button class="tma-btn admin-id-act" data-act="teleport_pallet" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#5ac8fa;">🗺️</button>
        <button class="tma-btn admin-id-act" data-act="reset" style="flex:1;font-size:0.7rem;padding:6px 4px;background:#ff3b30;">💣</button>
      </div>
      <div id="admin-buttons" style="display:flex;flex-direction:column;gap:4px;"></div>
      <button class="tma-btn" id="btn-admin-close" style="width:100%;margin-top:8px;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  const btns = [
    ['💰 +100 000 кредитов', () => { money += 100000; updateMoneyDisplay(); autoSave(); showToast('+100 000¥', false); }],
    ['🎒 Предметы x999', () => { ITEMS.forEach(i => { inventory[i.id] = 999; }); updateInventoryDisplay(); autoSave(); showToast('Предметы x999', false); }],
    ['🏅 Все 8 значков', () => { badges = ['Boulder Badge','Cascade Badge','Thunder Badge','Rainbow Badge','Marsh Badge','Soul Badge','Volcano Badge','Earth Badge']; updateBadgeDisplay(); autoSave(); showToast('8 значков!', false); }],
    ['🏥 Лечить команду', () => { myTeam.forEach(m => { m.currentHp = m.maxHp; m.status = null; m.sleepTurns = 0; if (m.movesPP) m.movesPP.forEach(pp => { if (pp) pp.current = pp.max; }); }); refreshProfileUI(); autoSave(); showToast('Вылечено!', false); }],
    ['⭐ Макс IV (31)', () => { myTeam.forEach(m => { m.ivs = { hp:31,atk:31,def:31,spa:31,spd:31,spe:31 }; }); refreshProfileUI(); autoSave(); showToast('IV 31!', false); }],
    ['📈 +10 уровней', () => { myTeam.forEach(m => { for(let i=0;i<10;i++) { m.baseLevel++; m.maxHp = calculateStat(m,'hp',false); m.currentHp = m.maxHp; } }); refreshProfileUI(); renderTeamGrid(); autoSave(); showToast('+10 lvl!', false); }],
    ['🦄 Случайный легендарный', async () => { const leg = ['mewtwo','mew','lugia','ho-oh','rayquaza','groudon','kyogre','dialga','palkia','giratina','zekrom','reshiram','xerneas','yveltal','solgaleo','lunala','zeraora']; const pick = leg[Math.floor(Math.random()*leg.length)]; await giveStarterMon(pick); renderTeamGrid(); autoSave(); showToast(pick + '!', false); }],
    ['🦄 Мью', async () => { await giveStarterMon('mew'); renderTeamGrid(); autoSave(); showToast('Мью!', false); }],
    ['🗺️ Алабастия', () => { currentLocationId = 'pallet_town'; currentRegion = 'kanto'; renderLocation('pallet_town'); autoSave(); showToast('Pallet Town', false); }],
    ['🗺️ Плато Индиго', () => { currentLocationId = 'indigo_plateau'; currentRegion = 'kanto'; renderLocation('indigo_plateau'); autoSave(); showToast('Indigo Plateau', false); }],
    ['🗺️ Голденрод', () => { currentLocationId = 'goldenrod'; currentRegion = 'east_johto'; renderLocation('goldenrod'); autoSave(); showToast('Goldenrod', false); }],
    ['🎣 Дать удочки', () => { ['oldRod','goodRod','superRod'].forEach(id => { inventory[id] = 1; }); updateInventoryDisplay(); autoSave(); showToast('Все удочки получены!', false); }],
    ['🥚 Дать яйцо', () => { addItem('egg', 1); updateInventoryDisplay(); autoSave(); showToast('Яйцо получено!', false); }],
    ['🔔 Графитовый колокол', () => { addItem('graphiteBell', 1); updateInventoryDisplay(); autoSave(); showToast('Графитовый колокол получен!', false); }],
    ['🗺️ Все локации', () => { regions.forEach(r => { r.locations.forEach(l => { if (l.id) discoveredLocations[l.id] = true; }); }); showToast('Все локации открыты!', false); }],
    ['📊 Покедекс ВСЕ', async () => { try { const r = await fetch('/pokedex_data.json'); const pd = await r.json(); Object.keys(pd).forEach(k => { if (!pokedexCaught.includes(k)) pokedexCaught.push(k); if (!pokedexSeen.includes(k)) pokedexSeen.push(k); }); showToast(`Покедекс: ${pokedexCaught.length}/${pokedexTotal}`, false); } catch(e) { showToast('Ошибка', true); } }],
    ['🔁 Сбросить квесты', () => { quests = []; questProgress = {}; completedQuests = []; npcQuestProgress = {}; completedNPCQuests = []; showToast('Квесты сброшены', false); }],
    ['💾 Форс-сейв', () => { saveGame(); cloudSave(); showToast('Сохранено!', false); }],
  ];

  const container = document.getElementById('admin-buttons');
  btns.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'tma-btn';
    b.textContent = label;
    b.style.cssText = 'width:100%;padding:10px;font-size:0.9rem;background:var(--tma-card-bg);color:var(--tma-text);border:1px solid var(--tma-border);';
    b.addEventListener('click', () => { fn(); });
    container.appendChild(b);
  });

  // Populate user dropdown when opening admin panel
  let adminSelectPopulated = false;
  fab.addEventListener('click', async () => {
    modal.style.display = 'flex';
    const select = document.getElementById('admin-user-select');
    if (!adminSelectPopulated) {
      adminSelectPopulated = true;
      try {
        const res = await fetch('/api/profile/trainers/all');
        const data = await res.json();
        if (data.users) {
          data.users.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.first_name||u.username||'?'} (ID:${u.id})`;
            select.appendChild(opt);
          });
        }
      } catch(e) {}
      select.addEventListener('change', () => {
        if (select.value) {
          document.getElementById('admin-target-id').value = select.value;
          document.getElementById('admin-lookup').click();
        }
      });
    }
  });

  // ID-based admin actions
  const targetInfo = document.getElementById('admin-target-info');
  document.getElementById('admin-lookup').addEventListener('click', async () => {
    const tid = document.getElementById('admin-target-id').value.trim();
    if (!tid) { targetInfo.textContent = 'Введите ID'; return; }
    targetInfo.textContent = 'Поиск...';
    try {
      const res = await fetch(`/api/profile/${tid}`);
      const d = await res.json();
      if (d.profile) {
        const p = d.profile;
        targetInfo.innerHTML = `👤 ${p.first_name||p.username} | 🏅${p.badges} | 💰${p.money} | 🐾${p.team?.length||0}`;
        targetInfo.setAttribute('data-found', tid);
      } else { targetInfo.textContent = 'Не найден'; targetInfo.removeAttribute('data-found'); }
    } catch(e) { targetInfo.textContent = 'Ошибка'; }
  });

  document.querySelectorAll('.admin-id-act').forEach(btn => {
    btn.addEventListener('click', async () => {
      const tid = targetInfo.getAttribute('data-found');
      if (!tid) { showToast('Сначала 🔍 найди тренера по ID', true); return; }
      const act = btn.getAttribute('data-act');
      const cmdMap = {
        'items': 'give_items',
        'money': 'give_money',
        'badges': 'give_badges',
        'heal': 'heal_team',
        'iv': 'max_iv',
        'lvl50': 'set_level',
        'legend': 'give_legendary',
        'reset': 'reset_save',
        'teleport_pallet': 'teleport',
      };
      const cmd = cmdMap[act] || act;
      const val = act === 'teleport_pallet' ? 'pallet_town' : null;
      try {
        const headers = tgToken ? { 'Authorization': `Bearer ${tgToken}` } : {};
        const url = `/admin/api?cmd=${cmd}&user=${tid}${val ? '&val='+encodeURIComponent(val) : ''}`;
        const res = await fetch(url, { headers });
        const d = await res.json();
        showToast(d.status === 'ok' ? '✅ Готово' : '❌ ' + (d.error || 'ошибка'), d.status !== 'ok');
      } catch(e) { showToast('Ошибка API', true); }
    });
  });

  document.getElementById('btn-admin-close').addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}

export function getItemQty(itemId) {
  return inventory[itemId] ?? 0;
}

export function hasItem(itemId) {
  return getItemQty(itemId) > 0;
}

export function itemDef(itemId) {
  if (!itemId) return { id: null, nameRu: '???', category: 'other', desc: 'Неизвестный предмет' };
  return ITEMS.find(i => i.id === itemId) || { id: null, nameRu: '???', category: 'other', desc: 'Неизвестный предмет' };
}

function itemCategory(itemId) {
  if (!itemId) return 'other';
  return (ITEMS.find(i => i.id === itemId) || {}).category;
}

export function addItem(itemId, qty = 1) {
  if (!(itemId in inventory)) {
    const def = ITEMS.find(i => i.id === itemId);
    if (!def) { console.warn('Unknown item:', itemId); return false; }
    inventory[itemId] = 0;
  }
  inventory[itemId] += qty;
  logItemHistory(itemId, qty, 'add');
  checkNPCQuestProgress(itemId, qty);
  checkQuestProgress('collect_items', qty, itemId);
  updateInventoryDisplay();
  autoSave();
  return true;
}

export function removeItem(itemId, qty = 1) {
  if (!(itemId in inventory)) return false;
  if (inventory[itemId] < qty) return false;
  inventory[itemId] -= qty;
  updateInventoryDisplay();
  autoSave();
  return true;
}

// Old inventory variables — keep for backward compat during migration
let invPokeballs = 10;
let invGreatBall = 0;
let invUltraBall = 0;
let invPotion = 5;
let invCandy = 20;
let invVitamin = 20;
let invTrain = 50;
let invWeaken = 20;
let invSuperPotion = 0;
let invFullRestore = 0;
let invEvolutionStone = 0;
let invTM = 0;
let invSitrusBerry = 0;
let invOranBerry = 0;
let invLumBerry = 0;
let invChestoBerry = 0;
let invRawstBerry = 0;

// MONEY (NEW)
let money = 500;
let trainerNickname = '';
const LEGENDARY_SET = new Set([
  'articuno', 'zapdos', 'moltres', 'mewtwo', 'mew',
  'raikou', 'entei', 'suicune', 'lugia', 'ho-oh', 'celebi',
  'regirock', 'regice', 'registeel', 'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys',
  'uxie', 'mesprit', 'azelf', 'dialga', 'palkia', 'heatran', 'regigigas', 'giratina', 'cresselia', 'darkrai', 'shaymin', 'arceus',
  'victini', 'cobalion', 'terrakion', 'virizion', 'tornadus', 'thundurus', 'reshiram', 'zekrom', 'landorus', 'kyurem', 'keldeo', 'meloetta', 'genesect',
  'xerneas', 'yveltal', 'zygarde', 'diancie', 'hoopa', 'volcanion',
  'type-null', 'silvally', 'tapu-koko', 'tapu-lele', 'tapu-bulu', 'tapu-fini', 'cosmog', 'cosmoem', 'solgaleo', 'lunala', 'necrozma', 'magearna', 'marshadow', 'zeraora',
  'zacian', 'zamazenta', 'eternatus', 'kubfu', 'urshifu', 'regieleki', 'regidrago', 'glastrier', 'spectrier', 'calyrex',
  'koraidon', 'miraidon', 'ting-lu', 'chien-pao', 'wo-chien', 'chi-yu'
]);

// --- UID SYSTEM ---
let uidCounter = Date.now();
function generateUID() { return (++uidCounter).toString(36) + Math.random().toString(36).substr(2, 6); }
function getTrainerId() { return tgUser?.id || localStorage.getItem('league17_trainer_id') || '0'; }
export function lsKey(name) { return `league17_${name}_${getTrainerId()}`; }

// BADGES (NEW)
let badges = [];

// GYM LEADERS DATA (NEW) — scaled for challenge


// ELITE FOUR DATA (NEW) — scaled up
const eliteFour = [
  {
    name: 'Лорели', title: 'Элитная Четверка — Лед', type: 'ice',
    team: [
      { name: 'dewgong', level: 58, move1: 'aurora-beam', move2: 'rest' },
      { name: 'cloyster', level: 57, move1: 'ice-beam', move2: 'supersonic' },
      { name: 'slowbro', level: 58, move1: 'surf', move2: 'psychic' },
      { name: 'jynx', level: 60, move1: 'blizzard', move2: 'psychic' },
      { name: 'lapras', level: 62, move1: 'ice-beam', move2: 'hydro-pump' }
    ],
    moneyReward: 8000
  },
  {
    name: 'Бруно', title: 'Элитная Четверка — Бой', type: 'fighting',
    team: [
      { name: 'hitmonlee', level: 60, move1: 'jump-kick', move2: 'rolling-kick' },
      { name: 'hitmonchan', level: 60, move1: 'ice-punch', move2: 'fire-punch' },
      { name: 'onix', level: 61, move1: 'rock-slide', move2: 'earthquake' },
      { name: 'machamp', level: 63, move1: 'submission', move2: 'cross-chop' },
      { name: 'machamp', level: 65, move1: 'dynamic-punch', move2: 'earthquake' }
    ],
    moneyReward: 9000
  },
  {
    name: 'Агата', title: 'Элитная Четверка — Призрак', type: 'ghost',
    team: [
      { name: 'gengar', level: 63, move1: 'shadow-ball', move2: 'hypnosis' },
      { name: 'crobat', level: 62, move1: 'wing-attack', move2: 'confuse-ray' },
      { name: 'gengar', level: 64, move1: 'shadow-ball', move2: 'night-shade' },
      { name: 'arbok', level: 63, move1: 'sludge-bomb', move2: 'glare' },
      { name: 'gengar', level: 66, move1: 'shadow-ball', move2: 'dream-eater' }
    ],
    moneyReward: 10000
  },
  {
    name: 'Лэнс', title: 'Элитная Четверка — Дракон', type: 'dragon',
    team: [
      { name: 'gyarados', level: 65, move1: 'hydro-pump', move2: 'hyper-beam' },
      { name: 'dragonair', level: 64, move1: 'dragon-rage', move2: 'thunderbolt' },
      { name: 'dragonair', level: 64, move1: 'dragon-rage', move2: 'ice-beam' },
      { name: 'aerodactyl', level: 66, move1: 'hyper-beam', move2: 'ancient-power' },
      { name: 'dragonite', level: 70, move1: 'hyper-beam', move2: 'dragon-rage' }
    ],
    moneyReward: 12000
  }
];

const champion = {
  name: 'Голд (Чемпион)', title: 'Чемпион Лиги', type: 'water',
  team: [
    { name: 'pidgeot', level: 68, move1: 'fly', move2: 'sky-attack' },
    { name: 'alakazam', level: 70, move1: 'psychic', move2: 'recover' },
    { name: 'rhydon', level: 70, move1: 'earthquake', move2: 'stone-edge' },
    { name: 'exeggutor', level: 68, move1: 'psychic', move2: 'solar-beam' },
    { name: 'gyarados', level: 72, move1: 'hydro-pump', move2: 'hyper-beam' },
    { name: 'blastoise', level: 74, move1: 'hydro-pump', move2: 'ice-beam' }
  ],
  moneyReward: 15000
};

// JOHTO ELITE FOUR — scaled up
const johtoEliteFour = [
  {
    name: 'Уилл', title: 'Элитная Четверка Джото — Экстрасенс', type: 'psychic',
    team: [
      { name: 'xatu', level: 50, move1: 'psychic', move2: 'confuse-ray' },
      { name: 'exeggutor', level: 52, move1: 'psychic', move2: 'solar-beam' },
      { name: 'slowbro', level: 52, move1: 'surf', move2: 'psychic' },
      { name: 'jynx', level: 53, move1: 'ice-punch', move2: 'psychic' },
      { name: 'espeon', level: 55, move1: 'psychic', move2: 'morning-sun' }
    ],
    moneyReward: 7000
  },
  {
    name: 'Кога', title: 'Элитная Четверка Джото — Яд', type: 'poison',
    team: [
      { name: 'ariados', level: 51, move1: 'sludge-bomb', move2: 'spider-web' },
      { name: 'venomoth', level: 52, move1: 'psychic', move2: 'sludge-bomb' },
      { name: 'muk', level: 54, move1: 'sludge', move2: 'minimize' },
      { name: 'weezing', level: 55, move1: 'sludge-bomb', move2: 'explosion' },
      { name: 'crobat', level: 56, move1: 'wing-attack', move2: 'poison-fang' }
    ],
    moneyReward: 8000
  },
  {
    name: 'Бруно', title: 'Элитная Четверка Джото — Бой', type: 'fighting',
    team: [
      { name: 'hitmontop', level: 54, move1: 'rolling-kick', move2: 'quick-attack' },
      { name: 'hitmonlee', level: 55, move1: 'jump-kick', move2: 'rolling-kick' },
      { name: 'hitmonchan', level: 55, move1: 'ice-punch', move2: 'fire-punch' },
      { name: 'machamp', level: 57, move1: 'cross-chop', move2: 'rock-slide' },
      { name: 'machamp', level: 59, move1: 'dynamic-punch', move2: 'strength' }
    ],
    moneyReward: 9000
  },
  {
    name: 'Карен', title: 'Элитная Четверка Джото — Тьма', type: 'dark',
    team: [
      { name: 'umbreon', level: 56, move1: 'faint-attack', move2: 'confuse-ray' },
      { name: 'vileplume', level: 55, move1: 'petal-dance', move2: 'sludge-bomb' },
      { name: 'murkrow', level: 57, move1: 'shadow-ball', move2: 'drill-peck' },
      { name: 'gengar', level: 58, move1: 'shadow-ball', move2: 'destiny-bond' },
      { name: 'houndoom', level: 60, move1: 'crunch', move2: 'flamethrower' }
    ],
    moneyReward: 10000
  }
];

const johtoChampion = {
  name: 'Лэнс (Чемпион Джото)', title: 'Чемпион Лиги Джото', type: 'dragon',
  team: [
    { name: 'gyarados', level: 58, move1: 'hydro-pump', move2: 'dragon-rage' },
    { name: 'dragonite', level: 60, move1: 'hyper-beam', move2: 'dragon-rage' },
    { name: 'charizard', level: 59, move1: 'flamethrower', move2: 'fly' },
    { name: 'aerodactyl', level: 60, move1: 'hyper-beam', move2: 'ancient-power' },
    { name: 'dragonite', level: 62, move1: 'hyper-beam', move2: 'outrage' },
    { name: 'dragonite', level: 64, move1: 'hyper-beam', move2: 'thunder' }
  ],
  moneyReward: 15000
};

// TEAM ROSTER (Max 6)
let myTeam = [];
// PC STORAGE (boxes of 30)
let pcBoxes = [[]];

// NOTIFICATION SYSTEM
let notifications = []; // [{ id, title, text, time, read }]

function addNotification(title, text) {
  notifications.unshift({ id: Date.now(), title, text, time: new Date().toISOString(), read: false });
  if (notifications.length > 50) notifications.length = 50;
  updateNotifBadge();
  saveGame();
}

function updateNotifBadge() {
  const unread = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = unread || '';
    badge.style.display = unread > 0 ? '' : 'none';
  }
}

function openNotifications() {
  const modal = document.getElementById('notif-modal');
  if (!modal) return;
  const list = document.getElementById('notif-list');
  list.innerHTML = notifications.length === 0
    ? '<div style="text-align:center;padding:20px;color:var(--tma-text-muted);">Нет уведомлений</div>'
    : notifications.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <b>${n.title}</b>
        <p>${n.text}</p>
        <small>${new Date(n.time).toLocaleString('ru')}</small>
      </div>
    `).join('');
  notifications.forEach(n => n.read = true);
  updateNotifBadge();
  modal.style.display = 'flex';
}

// BREEDING SYSTEM
let breedingPairs = []; // [{ boxIdx, mon1Uid, mon2Uid, startTime, readyTime }]
let eggs = [];          // [{ uid, species, apiData, readyTime, boxIdx, parent1Uid, parent2Uid }]
const EGG_TIME = 10 * 60 * 1000;      // 10 min to produce egg
const EGG_BONUS_TIME = 5 * 60 * 1000;  // 5 min with matching nature
// Random hatch time between 3-8 days
function randomHatchTime() { return (3 + Math.floor(Math.random() * 6)) * 24 * 60 * 60 * 1000; }
const BREEDING_CHECK_INTERVAL = 60 * 1000; // check every minute

// --- STAR RATINGS ---
const LEGENDARY_NAMES = new Set([
  'articuno','zapdos','moltres','mewtwo','mew','raikou','entei','suicune','lugia','ho-oh','celebi',
  'regirock','regice','registeel','latias','latios','kyogre','groudon','rayquaza','jirachi','deoxys',
  'uxie','mesprit','azelf','dialga','palkia','heatran','regigigas','giratina','cresselia','phione','manaphy','darkrai','shaymin','arceus',
  'victini','reshiram','zekrom','kyurem','keldeo','meloetta','genesect',
  'xerneas','yveltal','zygarde','diancie','hoopa','volcanion',
  'tapu-koko','tapu-lele','tapu-bulu','tapu-fini','cosmog','cosmoem','solgaleo','lunala','necrozma','magearna','marshadow','zeraora',
  'zacian','zamazenta','eternatus','kubfu','urshifu','regieleki','regidrago','glastrier','spectrier','calyrex',
  'koraidon','miraidon'
]);

export function getPowerStars(mon) {
  if (!mon.apiData?.stats) return 1;
  const bst = mon.apiData.stats.reduce((sum, s) => sum + s.base_stat, 0);
  if (bst >= 650) return 10;
  if (bst >= 600) return 9;
  if (bst >= 550) return 8;
  if (bst >= 500) return 7;
  if (bst >= 450) return 6;
  if (bst >= 400) return 5;
  if (bst >= 350) return 4;
  if (bst >= 300) return 3;
  if (bst >= 250) return 2;
  return 1;
}

export function getRarityStars(mon) {
  const name = mon.apiData?.species?.name || mon.apiData?.name;
  if (name && LEGENDARY_NAMES.has(name)) return 5;
  const cr = mon.apiData?.captureRate || mon.apiData?.speciesData?.capture_rate || 255;
  if (cr < 30) return 4;
  if (cr < 80) return 3;
  if (cr < 150) return 2;
  return 1;
}

function renderStars(powerStars, rarityStars) {
  const gold = '★'.repeat(powerStars) + '☆'.repeat(10 - powerStars);
  const black = '✦'.repeat(rarityStars) + '✧'.repeat(5 - rarityStars);
  return `<span style="color:#ff9500;font-size:0.55rem;" title="Мощь: ${powerStars}/10">${gold}</span> <span style="color:#333;font-size:0.55rem;" title="Редкость: ${rarityStars}/5">${black}</span>`;
}

// ACTIVE POKEMON STATE
let currentPokemonIndex = null;

// BATTLE STATE

// GYM/ELITE BATTLE STATE (NEW)


// --- QUESTS (Feature 5) ---
const QUEST_TYPES = ['catch_x', 'defeat_x', 'earn_money', 'explore', 'use_item', 'collect_items'];
const QUEST_CONFIGS = [
  // Original 8
  { id: 'catch_5', type: 'catch_x', target: 5, desc: 'Поймайте 5 покемонов', rewardMoney: 500, rewardItem: 'pokeball', rewardQty: 3 },
  { id: 'defeat_10', type: 'defeat_x', target: 10, desc: 'Победите 10 диких покемонов', rewardMoney: 800, rewardItem: 'potion', rewardQty: 2 },
  { id: 'earn_1000', type: 'earn_money', target: 1000, desc: 'Заработайте $1000', rewardMoney: 300, rewardItem: 'candy', rewardQty: 2 },
  { id: 'explore_5', type: 'explore', target: 5, desc: 'Посетите 5 разных локаций', rewardMoney: 400, rewardItem: 'superPotion', rewardQty: 1 },
  { id: 'use_3', type: 'use_item', target: 3, desc: 'Используйте 3 предмета в бою', rewardMoney: 200, rewardItem: 'candy', rewardQty: 1 },
  { id: 'collect_hair', type: 'collect_items', targetItem: 'venonatHair', target: 3, desc: 'Соберите 3 Волоска Веноната', rewardMoney: 300, rewardItem: 'candy', rewardQty: 1 },
  { id: 'collect_bone', type: 'collect_items', targetItem: 'cuboneBone', target: 2, desc: 'Соберите 2 Кости Кьюбона', rewardMoney: 400, rewardItem: 'greatBall', rewardQty: 2 },
  { id: 'collect_coals', type: 'collect_items', targetItem: 'coals', target: 4, desc: 'Соберите 4 Уголька', rewardMoney: 350, rewardItem: 'potion', rewardQty: 3 },
  // New quests based on wiki references
  { id: 'catch_10', type: 'catch_x', target: 10, desc: 'Поймайте 10 покемонов', rewardMoney: 1200, rewardItem: 'greatBall', rewardQty: 5 },
  { id: 'catch_15', type: 'catch_x', target: 15, desc: 'Поймайте 15 покемонов', rewardMoney: 2000, rewardItem: 'ultraBall', rewardQty: 3 },
  { id: 'defeat_20', type: 'defeat_x', target: 20, desc: 'Победите 20 диких покемонов', rewardMoney: 1500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'defeat_5', type: 'defeat_x', target: 5, desc: 'Победите 5 диких покемонов', rewardMoney: 400, rewardItem: 'pokeball', rewardQty: 3 },
  { id: 'earn_5000', type: 'earn_money', target: 5000, desc: 'Заработайте $5000', rewardMoney: 1000, rewardItem: 'vitamin', rewardQty: 2 },
  { id: 'earn_10000', type: 'earn_money', target: 10000, desc: 'Заработайте $10000', rewardMoney: 2000, rewardItem: 'evolutionStone', rewardQty: 1 },
  { id: 'explore_10', type: 'explore', target: 10, desc: 'Посетите 10 разных локаций', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 1 },
  { id: 'use_8', type: 'use_item', target: 8, desc: 'Используйте 8 предметов в бою', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'collect_fire', type: 'collect_items', targetItem: 'lavaCore', target: 3, desc: 'Соберите 3 Лавовых Ядра', rewardMoney: 900, rewardItem: 'fireStone', rewardQty: 1 },
  { id: 'collect_water', type: 'collect_items', targetItem: 'crystalShard', target: 3, desc: 'Соберите 3 Кристалла', rewardMoney: 600, rewardItem: 'waterStone', rewardQty: 1 },
  { id: 'collect_plant', type: 'collect_items', targetItem: 'plantSample', target: 4, desc: 'Соберите 4 Образца Растений', rewardMoney: 700, rewardItem: 'leafStone', rewardQty: 1 },
  { id: 'collect_venom', type: 'collect_items', targetItem: 'seviperVenom', target: 2, desc: 'Соберите 2 Яда Севайпера', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 2 },
];

let quests = [];
let questProgress = {};
let completedQuests = [];
let npcQuestProgress = {};
let completedNPCQuests = [];
let tutorialStep = 0; // 0=not started, 1-5=tutorial chain
let visitedLocations = new Set();

// --- Cloud sync / Telegram globals ---
let tgUser = null;
let tgToken = null;
let cloudSaveTimer = null;
export const API_BASE = '/api';
// Admin Telegram IDs + usernames
const ADMIN_IDS = new Set([1394113078]);
const ADMIN_USERNAMES = new Set(['DjafarAdjarov', 'nineinchkn5atmythroat']);

document.addEventListener('DOMContentLoaded', async () => {
  try { // GLOBAL INIT ERROR CATCHER
  initAppNav();
  initShopEvents();
  initGymEvents();
  initTrainersTab();

  await authTelegram();

  // Load Pokedex data (wiki-based encounter info)
  loadPokedexData();

  // Update trainer card after auth
  renderTrainerCard();

  // Reset button — admin only
  const isAdmin = tgUser && (ADMIN_IDS.has(tgUser.id) || ADMIN_USERNAMES.has(tgUser.username));
  const resetBtn = document.getElementById('btn-reset-game');
  if (resetBtn) resetBtn.style.display = isAdmin ? '' : 'none';

  // Admin panel button (phone-friendly)
  if (isAdmin) initAdminPanel();

  // Load game: cloud (server) is primary source, localStorage is cache
  let gameLoaded = false;
  if (tgToken) {
    // Always check cloud first — it's the source of truth
    const cloudData = await cloudLoad();
    if (cloudData && cloudData.myTeam && cloudData.myTeam.length > 0) {
      applyCloudSave(cloudData);
      saveGame(); // sync to localStorage
      gameLoaded = true;
    }
  }
  if (!gameLoaded) {
    // Fall back to localStorage
    const localLoaded = loadGame();
    if (localLoaded) {
      gameLoaded = true;
      // Sync local to cloud
      if (tgToken) cloudSave();
    }
  }
  if (!gameLoaded) {
    await giveStarter();
    showToast('Добро пожаловать в Лигу Покемонов!', false);
  } else if (tgToken) {
    // Background sync: push local to cloud if local is newer
    const localTs = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');
    const cloudTs = lastCloudSync || 0;
    if (localTs > cloudTs + 5000) {
      cloudSave();
    }
  }

  try { renderLocation(currentLocationId); } catch(e) { console.error('renderLocation failed:', e); document.body.innerHTML += '<div style="position:fixed;top:30px;left:0;right:0;background:#ff3b30;color:#fff;padding:10px;z-index:99999;font-size:12px">RENDER: '+e.message+' | STACK: '+e.stack+'</div>'; }
  renderTeamGrid();
  updateInventoryDisplay();
  updateMoneyDisplay();
  updateBadgeDisplay();

  initProfileEvents();
  initEncounterEvents();

  // Restore battle if one was in progress before page refresh
  restoreBattleState();

  // Restore hunt toggle state — always restart, tick handles empty locations
  if (localStorage.getItem(lsKey('hunt_active')) === '1' && myTeam.some(m => m.currentHp > 0)) {
    startAutoHunt();
  }

  initInventoryEvents();
  initProfileUXEvents();
  initCloudEvents();

  // Init day/night cycle
  updateTimeOfDay();
  setInterval(updateTimeOfDay, 30000);

  // Periodic breeding & egg hatch check
  setInterval(() => { if (eggs.length > 0 || breedingPairs.length > 0) checkBreeding(); }, BREEDING_CHECK_INTERVAL);

  // Notification bell
  document.getElementById('btn-notifications').addEventListener('click', openNotifications);
  document.getElementById('btn-close-notif').addEventListener('click', () => { document.getElementById('notif-modal').style.display = 'none'; });
  document.getElementById('notif-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.style.display = 'none'; });
  updateNotifBadge();

  // Pokedex events
  const btnOpenPokedex = document.getElementById('btn-open-pokedex');
  if (btnOpenPokedex) btnOpenPokedex.addEventListener('click', openPokedex);
  const btnClosePokedex = document.getElementById('btn-close-pokedex');
  if (btnClosePokedex) btnClosePokedex.addEventListener('click', () => {
    document.getElementById('pokedex-modal').style.display = 'none';
  });

  // TM modal close
  const btnCloseTM = document.getElementById('btn-close-tm');
  if (btnCloseTM) btnCloseTM.addEventListener('click', () => {
    document.getElementById('tm-modal').style.display = 'none';
  });

  // Nickname click on profile
  const pokeNameEl = document.getElementById('poke-name');
  if (pokeNameEl) pokeNameEl.addEventListener('click', editNickname);

  // Sell tab init
  initSellTab();

  // Generate daily quests
  generateDailyQuests();

  // Quests button
  const btnQuests = document.getElementById('btn-quests');
  if (btnQuests) btnQuests.addEventListener('click', openQuests);
  const btnCloseQuests = document.getElementById('btn-close-quests');
  if (btnCloseQuests) btnCloseQuests.addEventListener('click', () => {
    document.getElementById('quest-modal').style.display = 'none';
  });

  // Dark theme toggle
  const themeToggle = document.getElementById('btn-theme-toggle');
  if (themeToggle) {
    const savedTheme = localStorage.getItem(lsKey('theme'));
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggle.innerText = '☀️';
    }
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(lsKey('theme'), 'light');
        themeToggle.innerText = '🌙';
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(lsKey('theme'), 'dark');
        themeToggle.innerText = '☀️';
      }
    });
  }

  // Hunt toggle button (header)
  const huntToggleBtn = document.getElementById('btn-hunt-toggle');
  if (huntToggleBtn) {
    huntToggleBtn.addEventListener('click', () => {
      if (huntActive) {
        stopAutoHunt();
      } else {
        if (!myTeam.some(m => m.currentHp > 0)) {
          showToast('Вам нужен хотя бы один живой покемон!', true);
          return;
        }
        startAutoHunt();
      }
    });
  }

  // Chat events
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-input');
  if (chatSendBtn && chatInput) {
    chatSendBtn.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChatMessage();
    });
  }

  if (tgToken) {
    setTimeout(() => cloudSave(), 2000);
  }

  // Trainer profile modal close
  const btnCloseTrainer = document.getElementById('btn-close-trainer-profile');
  if (btnCloseTrainer) {
    btnCloseTrainer.addEventListener('click', () => {
      document.getElementById('trainer-profile-modal').style.display = 'none';
    });
  }

  // Click overlay to close trainer profile modal
  const trainerModal = document.getElementById('trainer-profile-modal');
  if (trainerModal) {
    trainerModal.addEventListener('click', (e) => {
      if (e.target === trainerModal) {
        trainerModal.style.display = 'none';
      }
    });
  }

  // Starter modal overlay click to close
  const starterModal = document.getElementById('starter-modal');
  if (starterModal) {
    starterModal.addEventListener('click', (e) => {
      if (e.target === starterModal) {
        starterModal.style.display = 'none';
      }
    });
  }
  } catch(e) { document.body.innerHTML += '<div style="position:fixed;top:0;left:0;right:0;background:#ff3b30;color:#fff;padding:15px;z-index:99999;font-size:14px;white-space:pre-wrap"><b>INIT ERROR:</b> '+e.message+'<br><small>'+e.stack+'</small></div>'; console.error(e); }
});

// --- SAVE / LOAD (NEW) ---
function syncOldInventory() {
  // Keep old inv* variables in sync for backward compat
  invPokeballs = getItemQty('pokeball');
  invGreatBall = getItemQty('greatBall');
  invUltraBall = getItemQty('ultraBall');
  invPotion = getItemQty('potion');
  invCandy = getItemQty('candy');
  invVitamin = getItemQty('vitamin');
  invTrain = getItemQty('train');
  invWeaken = getItemQty('weaken');
  invSuperPotion = getItemQty('superPotion');
  invFullRestore = getItemQty('fullRestore');
  invEvolutionStone = getItemQty('evolutionStone');
  invTM = getItemQty('tm');
  invSitrusBerry = getItemQty('sitrusBerry');
  invOranBerry = getItemQty('oranBerry');
  invLumBerry = getItemQty('lumBerry');
  invChestoBerry = getItemQty('chestoBerry');
  invRawstBerry = getItemQty('rawstBerry');
}

// --- DAYCARE ---
let daycareMons = []; // [{ mon, depositTime }]
let daycareEgg = null; // { species, readyTime }

function openDaycareDeposit() {
  const available = myTeam.map((m, i) => ({ m, i })).filter(({ m }) => m.currentHp > 0);
  if (available.length < 2) { showToast('Нужно минимум 2 живых покемона!', true); return; }

  const items = available.map(({ m }) => ({
    label: `Lv.${m.baseLevel + m.candiesEaten} ${m.nickname || m.apiData?.name}`,
    subtitle: `${m.apiData?.gender || '?'} | HP: ${m.currentHp}/${m.maxHp}`
  }));

  showSelectionModal('Питомник — выберите ПЕРВОГО покемона', items, (i1) => {
    // Remove the selected pokemon and show second picker
    const remaining = available.filter((_, i) => i !== i1);
    const items2 = remaining.map(({ m }) => ({
      label: `Lv.${m.baseLevel + m.candiesEaten} ${m.nickname || m.apiData?.name}`,
      subtitle: `${m.apiData?.gender || '?'} | HP: ${m.currentHp}/${m.maxHp}`
    }));

    showSelectionModal('Выберите ВТОРОГО покемона', items2, (i2) => {
      const mon1 = available[i1].m;
      const mon2 = remaining[i2].m;
      const idx1 = myTeam.indexOf(mon1);
      const idx2 = myTeam.indexOf(mon2);
      let hi = Math.max(idx1, idx2);
      let lo = Math.min(idx1, idx2);
      // Remove higher index first (lower index unaffected), then lower
      const depositMon2 = myTeam.splice(hi, 1)[0];
      const depositMon1 = myTeam.splice(lo, 1)[0];
      daycareMons.push({ mon: depositMon2, depositTime: Date.now() });
      daycareMons.push({ mon: depositMon1, depositTime: Date.now() });

      appendToLog(`${mon1.nickname || mon1.apiData?.name} и ${mon2.nickname || mon2.apiData?.name} оставлены в Питомнике!`, false, 'quest');
      showToast('Покемоны оставлены в Питомнике!', false);
      renderTeamGrid();
      autoSave();
    });
  });
}

function checkDaycare() {
  const now = Date.now();
  daycareMons.forEach(entry => {
    const hoursPassed = (now - entry.depositTime) / (1000 * 60 * 60);
    if (hoursPassed >= 1 && entry.mon.baseLevel + (entry.mon.candiesEaten || 0) < 100) {
      const levelsGained = Math.floor(hoursPassed);
      if (levelsGained > 0 && levelsGained > (entry._lastLevelsGained || 0)) {
        const newLevels = levelsGained - (entry._lastLevelsGained || 0);
        for (let i = 0; i < newLevels; i++) {
          entry.mon.baseLevel++;
          entry.mon.maxHp = calculateStat(entry.mon, 'hp', false);
          entry.mon.currentHp = entry.mon.maxHp;
        }
        entry._lastLevelsGained = levelsGained;
      }
    }
  });

  // Egg check: 30% chance per hour after 2 hours
  if (daycareMons.length >= 2 && !daycareEgg) {
    const hoursPassed = Math.min(
      (now - daycareMons[0].depositTime) / (1000 * 60 * 60),
      (now - daycareMons[1].depositTime) / (1000 * 60 * 60)
    );
    if (hoursPassed >= 2 && Math.random() < 0.3) {
      const parent = daycareMons[0].mon;
      daycareEgg = {
        species: parent.apiData?.name || parent.name,
        readyTime: now + 1000 * 60 * 30, // 30 min to hatch
        parent1: daycareMons[0].mon,
        parent2: daycareMons[1].mon
      };
      appendToLog('🥚 В Питомнике появилось яйцо! Заберите его через 30 минут.', false, 'quest');
    }
  }
}

function collectDaycareEgg() {
  if (!daycareEgg) return showToast('Яйца пока нет!', true);
  if (Date.now() < daycareEgg.readyTime) {
    const minsLeft = Math.ceil((daycareEgg.readyTime - Date.now()) / 60000);
    return showToast(`Яйцо ещё не готово! Осталось ~${minsLeft} мин.`, true);
  }
  // Give egg as item
  daycareEgg = null;
  addItem('suspiciousEgg');
  showToast('Вы получили яйцо! Оно добавлено в инвентарь.', false);
  autoSave();
}

function collectDaycareMons() {
  if (daycareMons.length === 0) return showToast('В Питомнике нет покемонов!', true);
  if (myTeam.length >= 6) return showToast('Команда полна! Освободите место.', true);
  checkDaycare();
  const entry = daycareMons.shift();
  myTeam.push(entry.mon);
  if (daycareMons.length > 0 && myTeam.length < 6) {
    const entry2 = daycareMons.shift();
    myTeam.push(entry2.mon);
  }
  appendToLog('Покемоны возвращены из Питомника!', false, 'quest');
  renderTeamGrid();
  autoSave();
}

// --- BREEDING SYSTEM ---
const eggGroupCache = new Map(); // speciesName → egg_groups[]

async function getMonEggGroups(mon) {
  const name = mon.apiData?.species?.name || mon.apiData?.name;
  if (!name) return [];
  if (eggGroupCache.has(name)) return eggGroupCache.get(name);
  try {
    const speciesUrl = mon.apiData?.species?.url || `https://pokeapi.co/api/v2/pokemon-species/${name}`;
    const res = await fetch(speciesUrl);
    const data = await res.json();
    const groups = (data.egg_groups || []).map(g => g.name);
    eggGroupCache.set(name, groups);
    return groups;
  } catch(e) { return []; }
}

function getMonGender(mon) {
  return mon.gender || mon.apiData?.wildGender || null;
}

function areBreedingCompatible(mon1, mon2, groups1, groups2) {
  if (mon1.uid === mon2.uid) return false;
  const g1 = getMonGender(mon1);
  const g2 = getMonGender(mon2);
  if (!g1 || !g2) return false;
  if (g1 === g2) return false;
  // Check shared egg group
  const shared = groups1.filter(g => groups2.includes(g));
  if (shared.length === 0 && !groups1.includes('ditto') && !groups2.includes('ditto')) return false;
  return true;
}

async function checkBreeding() {
  const now = Date.now();

  // Check each box for breeding pairs
  for (let boxIdx = 0; boxIdx < pcBoxes.length; boxIdx++) {
    const box = pcBoxes[boxIdx];
    if (box.length < 2) continue;

    // Find existing pair for this box
    const existingPair = breedingPairs.find(p => p.boxIdx === boxIdx);

    // Check if existing pair is ready → create egg
    if (existingPair && now >= existingPair.readyTime) {
      const m1 = box.find(m => m.uid === existingPair.mon1Uid);
      const m2 = box.find(m => m.uid === existingPair.mon2Uid);
      if (m1 && m2) {
        const eggUid = generateUID();
        const species = m1.apiData?.species?.name || m1.apiData?.name;
        const egg = {
          uid: eggUid,
          species,
          readyTime: now + randomHatchTime(),
          boxIdx,
          parent1Uid: existingPair.mon1Uid,
          parent2Uid: existingPair.mon2Uid
        };
        eggs.push(egg);
        // Permanent breed mark — once bred, never again
        if (m1) m1.hasBred = true;
        if (m2) m2.hasBred = true;
        addNotification('🥚 Новое яйцо!', `В Боксе ${boxIdx + 1} появилось яйцо ${species}!`);
        appendToLog(`🥚 В Боксе ${boxIdx + 1} появилось яйцо! (${species})`, false, 'quest');
      }
      // Remove pair — they produce one egg, need manual re-pair (move out/in PC)
      breedingPairs = breedingPairs.filter(p => p !== existingPair);
    }

    // Find new pairs if no existing pair for this box
    if (!breedingPairs.some(p => p.boxIdx === boxIdx)) {
      for (let i = 0; i < box.length; i++) {
        for (let j = i + 1; j < box.length; j++) {
          const m1 = box[i], m2 = box[j];
          if (!m1.apiData || !m2.apiData) continue;
          // Skip pokemon that have already bred — permanent sterility
          if (m1.hasBred || m2.hasBred) continue;
          const groups1 = await getMonEggGroups(m1);
          const groups2 = await getMonEggGroups(m2);
          if (areBreedingCompatible(m1, m2, groups1, groups2)) {
            const sameNature = m1.natureIdx === m2.natureIdx;
            const readyTime = now + (sameNature ? EGG_BONUS_TIME : EGG_TIME);
            breedingPairs.push({
              boxIdx,
              mon1Uid: m1.uid,
              mon2Uid: m2.uid,
              startTime: now,
              readyTime
            });
            const natureBonus = sameNature ? ' (быстро — одинаковый характер!)' : '';
            appendToLog(`💕 ${m1.apiData.name} и ${m2.apiData.name} в Боксе ${boxIdx + 1} нашли друг друга!${natureBonus}`, false, 'quest');
            break; // One pair per box at a time
          }
        }
        if (breedingPairs.some(p => p.boxIdx === boxIdx)) break;
      }
    }
  }

  // Check egg hatching (eggs in team)
  for (const egg of eggs) {
    if (egg.inTeam && now >= egg.readyTime) {
      await hatchEgg(egg);
    }
  }

  // Clean up eggs from deleted boxes
  eggs = eggs.filter(e => e.boxIdx !== undefined ? pcBoxes[e.boxIdx] !== undefined : true);

  saveGame();
}

export async function hatchEgg(egg) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${egg.species}`);
    const pokeData = await res.json();
    const newMon = {
      uid: generateUID(),
      originalTrainer: getTrainerId(),
      createdAt: Date.now(),
      caughtLocation: 'breeding',
      apiData: pokeData,
      maxHp: 50, currentHp: 50,
      ivs: { hp: Math.floor(Math.random()*32), atk: Math.floor(Math.random()*32), def: Math.floor(Math.random()*32), spa: Math.floor(Math.random()*32), spd: Math.floor(Math.random()*32), spe: Math.floor(Math.random()*32) },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: 1, exp: 0, expToNext: 8,
      candiesEaten: 0, vitaminsEaten: 0,
      training: null, trainingStage: 0, trainingStat: null,
      happiness: 120,
      natureIdx: Math.floor(Math.random() * natures.length),
      breedLetter: ['A','B','C','D'][Math.floor(Math.random()*4)],
      gender: Math.random() < 0.5 ? 'male' : 'female',
      status: null, sleepTurns: 0,
      movesPP: [],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: pokeData.abilities[0]?.ability?.name || null,
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: [],
      isEgg: false,
      hasBred: false
    };
    // Inherit one random IV from each parent
    if (egg.parent1Uid && egg.parent2Uid) {
      const allMons = [...myTeam, ...pcBoxes.flat()];
      const p1 = allMons.find(m => m.uid === egg.parent1Uid);
      const p2 = allMons.find(m => m.uid === egg.parent2Uid);
      if (p1) {
        const stats = ['hp','atk','def','spa','spd','spe'];
        const s1 = stats[Math.floor(Math.random()*stats.length)];
        const s2 = stats[Math.floor(Math.random()*stats.length)];
        if (p1.ivs) newMon.ivs[s1] = p1.ivs[s1];
        if (p2?.ivs) newMon.ivs[s2] = p2.ivs[s2];
      }
    }

    if (myTeam.length < 6) {
      myTeam.push(newMon);
      addNotification('🎉 Яйцо вылупилось!', `${pokeData.name} появился на свет!`);
      appendToLog(`🎉 Из яйца вылупился ${pokeData.name}!`, false, 'quest');
    } else {
      if (pcBoxes.length === 0) pcBoxes.push([]);
      pcBoxes[0].push(newMon);
      addNotification('🎉 Яйцо вылупилось!', `${pokeData.name} вылупился и отправлен в PC (команда полна).`);
      appendToLog(`🎉 Из яйца вылупился ${pokeData.name}! (отправлен в PC)`, false, 'quest');
    }
    eggs = eggs.filter(e => e !== egg);
    renderTeamGrid();
    saveGame();
  } catch(e) {
    console.error('Hatch failed:', e);
  }
}

function collectEgg(eggUid) {
  const egg = eggs.find(e => e.uid === eggUid);
  if (!egg || egg.inTeam) return;
  if (myTeam.length >= 6) { showToast('Команда полна! Освободите место.', true); return; }
  // Move egg to team
  const eggMon = {
    uid: egg.uid,
    apiData: { name: 'яйцо', sprites: { front_default: '' }, types: [], stats: [], moves: [], abilities: [] },
    maxHp: 10, currentHp: 10,
    ivs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    baseLevel: 0, exp: 0, expToNext: 0,
    candiesEaten: 0, vitaminsEaten: 0,
    training: null, trainingStage: 0, trainingStat: null,
    happiness: 0, natureIdx: 0, breedLetter: 'A',
    gender: null, status: null, sleepTurns: 0,
    movesPP: [], statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityName: null, heldItem: null,
    berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
    learnableMoves: [], isEgg: true
  };
  myTeam.push(eggMon);
  egg.inTeam = true;
  eggs = eggs.map(e => e.uid === eggUid ? { ...e, inTeam: true } : e);
  renderTeamGrid();
  saveGame();
  showToast('Яйцо добавлено в команду!', false);
}

// --- PC STORAGE ---
function showPCInfoModal(mon) {
  const curLvl = mon.baseLevel + (mon.candiesEaten || 0);
  const types = mon.apiData?.types?.map(t => t.type.name).join(', ') || '?';
  const ability = mon.abilityName || mon.apiData?.abilities?.[0]?.ability?.name || '-';
  const sprite = mon.apiData?.sprites?.other?.['official-artwork']?.front_default || mon.apiData?.sprites?.front_default || '';
  const moves = (mon.apiData?.moves || []).filter(m => m).map(m => m.move.name).join(', ') || 'Нет атак';
  const ivs = mon.ivs || {};

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="selection-modal-card" style="text-align:center;">
      <img src="${sprite}" style="width:96px;height:96px;image-rendering:pixelated;" onerror="this.style.display='none'">
      <h3 style="margin:8px 0;">${mon.nickname || mon.apiData?.name || '???'} <span style="color:var(--tma-text-muted);">Lv.${curLvl}</span></h3>
      <p style="color:var(--tma-text-muted);margin:4px 0;">Тип: ${types} | Способность: ${ability}</p>
      <p style="margin:4px 0;">HP: ${mon.currentHp}/${mon.maxHp} | Статус: ${getStatusIcon(mon.status) || 'нет'}</p>
      <div style="font-size:0.8rem;color:var(--tma-text-muted);margin:8px 0;">
        <b>IV:</b> HP:${ivs.hp||0} АТК:${ivs.atk||0} ЗАЩ:${ivs.def||0} СП.АТК:${ivs.spa||0} СП.ЗАЩ:${ivs.spd||0} СКОР:${ivs.spe||0}
      </div>
      <p style="font-size:0.8rem;color:var(--tma-text-muted);">Атаки: ${moves}</p>
      ${mon.trainingStage > 0 ? `<p style="font-size:0.8rem;color:${trainingStages[mon.trainingStage].color};">Тренировка: ${trainingStages[mon.trainingStage].name} (+${trainingStages[mon.trainingStage].pct}%)</p>` : ''}
      <button class="tma-btn" id="btn-pc-info-close" style="width:100%;margin-top:12px;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    document.getElementById('btn-pc-info-close')?.removeEventListener('click', cleanup);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onOverlay = (e) => { if (e.target === modal) cleanup(); };

  document.getElementById('btn-pc-info-close').addEventListener('click', cleanup);
  modal.addEventListener('click', onOverlay);
}

function openPC() {
  const modal = document.getElementById('pc-modal');
  const tabsContainer = document.getElementById('pc-tabs');
  const slotsContainer = document.getElementById('pc-slots');
  const teamCount = document.getElementById('pc-team-count');
  teamCount.innerText = `(В команде: ${myTeam.length}/6)`;

  tabsContainer.innerHTML = '<span class="pc-tab active" data-box="team">Команда</span>';
  pcBoxes.forEach((box, i) => {
    tabsContainer.innerHTML += `<span class="pc-tab" data-box="${i}">Бокс ${i + 1}</span>`;
  });
  tabsContainer.innerHTML += '<span class="pc-tab" id="btn-pc-new-box">+ Новый бокс</span>';

  tabsContainer.querySelectorAll('.pc-tab').forEach(tab => {
    tab.onclick = () => {
      tabsContainer.querySelectorAll('.pc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPCSlots(tab.dataset.box);
    };
  });

  document.getElementById('btn-pc-new-box').onclick = () => {
    pcBoxes.push([]);
    openPC();
  };

  renderPCSlots('team');
  modal.style.display = 'flex';
  checkBreeding(); // Check for breeding pairs when PC opens

  document.getElementById('btn-pc-close').onclick = () => {
    modal.style.display = 'none';
    renderTeamGrid();
    autoSave();
  };
}

function renderPCSlots(view) {
  const container = document.getElementById('pc-slots');
  container.innerHTML = '';

  if (view === 'team') {
    myTeam.forEach((mon, i) => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      const spriteUrl = mon.apiData?.sprites?.front_default || '';
      div.innerHTML = `
        <img src="${spriteUrl}" width="40" height="40" onerror="this.style.display='none'">
        <div class="pc-slot-info">
          <b>Lv.${mon.baseLevel + mon.candiesEaten} ${mon.name || mon.apiData?.name}</b>
          <span>HP: ${mon.currentHp}/${mon.maxHp}</span>
        </div>
        <button class="btn-use" style="background:#5856d6;padding:4px 10px;">В PC</button>
      `;
      div.querySelector('button').onclick = () => {
        if (myTeam.length <= 1) { showToast('Нельзя оставить команду пустой!', true); return; }
        const targetBox = pcBoxes.length > 0 ? 0 : (pcBoxes.push([]), 0);
        const movedMon = myTeam.splice(i, 1)[0];
        pcBoxes[targetBox].push(movedMon);
        if (activePlayerMon && activePlayerMon === mon && myTeam.length > 0) {
          activePlayerMon = myTeam[0];
        }
        openPC();
      };
      container.appendChild(div);
    });
  } else {
    const boxIdx = parseInt(view);
    const box = pcBoxes[boxIdx];
    if (!box) return;

    // Show eggs in this box
    const boxEggs = eggs.filter(e => e.boxIdx === boxIdx && !e.inTeam);
    boxEggs.forEach(egg => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      div.style.background = 'rgba(255,215,0,0.1)';
      div.style.borderColor = '#ffd700';
      const remaining = Math.max(0, Math.ceil((egg.readyTime - Date.now()) / (24*60*60*1000)));
      const remainingText = remaining > 0 ? `~${remaining} дн` : 'Готово!';
      div.innerHTML = `
        <span style="font-size:32px;">🥚</span>
        <div class="pc-slot-info">
          <b>Яйцо ${egg.species ? `(${egg.species})` : ''}</b>
          <span style="color:#ffd700;">${remainingText}</span>
        </div>
        <div class="pc-slot-actions">
          <button class="btn-use" style="background:#ff9500;padding:4px 10px;">Забрать</button>
        </div>
      `;
      div.querySelector('button').onclick = () => {
        collectEgg(egg.uid);
        openPC();
      };
      container.appendChild(div);
    });

    box.forEach((mon, i) => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      const spriteUrl = mon.apiData?.sprites?.front_default || '';
      div.innerHTML = `
        <img src="${spriteUrl}" width="40" height="40" onerror="this.style.display='none'">
        <div class="pc-slot-info">
          <b>Lv.${mon.baseLevel + mon.candiesEaten} ${mon.name || mon.apiData?.name}</b>
          <span>HP: ${mon.currentHp}/${mon.maxHp}</span>
          <span style="font-size:0.7rem;color:var(--tma-text-muted)">${mon.apiData?.types?.map(t => t.type.name).join('/') || ''}</span>
        </div>
        <div class="pc-slot-actions">
          <button class="btn-use" style="background:#007aff;padding:4px 8px;" title="Инфо">ℹ</button>
          <button class="btn-use" style="background:#34c759;padding:4px 10px;">В команду</button>
          <button class="btn-use" style="background:#ff3b30;padding:4px 10px;">Отп.</button>
        </div>
      `;
      const [btnInfo, btnTeam, btnRelease] = div.querySelectorAll('button');
      btnInfo.onclick = () => {
        showPCInfoModal(mon);
      };
      btnTeam.onclick = () => {
        if (myTeam.length >= 6) { showToast('Команда полна (6/6)! Освободите место.', true); return; }
        const movedMon = box.splice(i, 1)[0];
        myTeam.push(movedMon);
        if (box.length === 0) { pcBoxes.splice(boxIdx, 1); }
        openPC();
      };
      btnRelease.onclick = () => {
        showConfirmModal('Отпустить покемона?', `${mon.name || mon.apiData?.name} будет отпущен навсегда. Это нельзя отменить.`, () => {
          box.splice(i, 1);
          if (box.length === 0) { pcBoxes.splice(boxIdx, 1); }
          openPC();
        });
      };
      container.appendChild(div);
    });
  }
}

// --- CRAFTING SYSTEM ---
const CRAFTING_RECIPES = [
  // Metallurgy
  { id: 'metalIngot', name: 'Металлический слиток', category: 'Металлургия',
    ingredients: { 'ore': 3 }, result: 'metalIngot', qty: 1 },
  { id: 'glass', name: 'Стекло', category: 'Металлургия',
    ingredients: { 'mountainSand': 2, 'coal': 1 }, result: 'glass', qty: 1 },
  // Medicine
  { id: 'bandage', name: 'Бинт', category: 'Медицина',
    ingredients: { 'cotton': 3 }, result: 'bandage', qty: 1 },
  { id: 'healingPotionCraft', name: 'Лечебное зелье (Аптечка)', category: 'Медицина',
    ingredients: { 'healingHerbs': 2, 'wonderFlower': 1 }, result: 'potion', qty: 1 },
  // Alchemy
  { id: 'sparkles', name: 'Блёстки', category: 'Алхимия',
    ingredients: { 'shinyDust': 3, 'metalIngot': 1 }, result: 'sparkles', qty: 1 },
  { id: 'honeyJar', name: 'Баночка мёда', category: 'Алхимия',
    ingredients: { 'honeycomb': 2, 'woodenApricorn': 1 }, result: 'honeyJar', qty: 1 },
  // Fossils
  { id: 'fossilRevive', name: 'Оживить окаменелость', category: 'Окаменелости',
    ingredients: { 'suspiciousEgg': 1, 'ancientGenome': 1 }, result: 'fossil', qty: 1 },
  // Pokeballs
  { id: 'craftPokeball', name: 'Покебол (x3)', category: 'Покеболы',
    ingredients: { 'woodenApricorn': 1, 'metalIngot': 1 }, result: 'pokeball', qty: 3 },
  { id: 'craftGreatBall', name: 'Гритбол (x2)', category: 'Покеболы',
    ingredients: { 'woodenApricorn': 2, 'metalIngot': 1, 'shinyDust': 1 }, result: 'greatBall', qty: 2 },
  // Vitamins
  { id: 'craftProtein', name: 'Протеин', category: 'Витамины',
    ingredients: { 'healingHerbs': 2, 'honeycomb': 1, 'ore': 1 }, result: 'protein', qty: 1 },
  { id: 'craftIron', name: 'Железо', category: 'Витамины',
    ingredients: { 'ore': 2, 'metalIngot': 1 }, result: 'iron', qty: 1 },
  // Berries
  { id: 'craftOran', name: 'Оран Ягода (x3)', category: 'Ягоды',
    ingredients: { 'cotton': 1, 'honeycomb': 1 }, result: 'oranBerry', qty: 3 },
  // PP recovery
  { id: 'craftWeakElixir', name: 'Слабый эликсир', category: 'Эликсиры',
    ingredients: { 'healingHerbs': 2, 'wonderFlower': 1 }, result: 'weakElixir', qty: 1 },
  { id: 'craftElixir', name: 'Эликсир', category: 'Эликсиры',
    ingredients: { 'healingHerbs': 3, 'wonderFlower': 2, 'honeycomb': 1 }, result: 'elixir', qty: 1 },
];

let activeCraftCategory = null;

export function openCrafting() {
  const modal = document.getElementById('crafting-modal');
  const tabsContainer = document.getElementById('crafting-tabs');
  const recipesContainer = document.getElementById('crafting-recipes');

  const categories = [...new Set(CRAFTING_RECIPES.map(r => r.category))];

  tabsContainer.innerHTML = categories.map(cat =>
    `<span class="crafting-tab${activeCraftCategory === cat ? ' active' : ''}" data-cat="${cat}">${cat}</span>`
  ).join('');

  tabsContainer.querySelectorAll('.crafting-tab').forEach(tab => {
    tab.onclick = () => {
      activeCraftCategory = tab.dataset.cat;
      openCrafting();
    };
  });

  const activeCat = activeCraftCategory || categories[0];
  const recipes = CRAFTING_RECIPES.filter(r => r.category === activeCat);

  recipesContainer.innerHTML = recipes.map(recipe => {
    const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => getItemQty(id) >= qty);
    const ingText = Object.entries(recipe.ingredients)
      .map(([id, qty]) => {
        const item = ITEMS.find(i => i.id === id);
        return `${item?.nameRu || id} x${qty}`;
      }).join(', ');
    return `<div class="crafting-recipe">
      <div class="crafting-recipe-info">
        <div class="crafting-recipe-name">${recipe.name}</div>
        <div class="crafting-recipe-ingredients">${ingText}</div>
      </div>
      <button class="crafting-recipe-btn" data-recipe="${recipe.id}" ${canCraft ? '' : 'disabled'}>Создать</button>
    </div>`;
  }).join('');

  recipesContainer.querySelectorAll('.crafting-recipe-btn').forEach(btn => {
    btn.onclick = () => craftItem(btn.dataset.recipe);
  });

  document.getElementById('btn-crafting-close').onclick = () => {
    modal.style.display = 'none';
    autoSave();
  };

  modal.style.display = 'flex';
}

function craftItem(recipeId) {
  const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return;

  const canCraft = Object.entries(recipe.ingredients).every(([id, qty]) => getItemQty(id) >= qty);
  if (!canCraft) return showToast('Недостаточно ингредиентов!', true);

  Object.entries(recipe.ingredients).forEach(([id, qty]) => {
    for (let i = 0; i < qty; i++) removeItem(id);
  });

  for (let i = 0; i < recipe.qty; i++) addItem(recipe.result);

  const resultItem = ITEMS.find(i => i.id === recipe.result);
  showToast(`Создано: ${resultItem?.nameRu || recipe.result} x${recipe.qty}!`, false);
  updateInventoryDisplay();
  openCrafting();
}

// ═══════════════════════════════════════════
// SAVE SYSTEM v2 — versioned, reliable, server-authoritative
// ═══════════════════════════════════════════
let saveVersion = 0;
let lastCloudSync = 0;
let saveRetryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAYS = [2000, 4000, 8000, 16000, 32000];

function getFullSaveData() {
  return {
    _v: saveVersion,
    _ts: Date.now(),
    currentLocationId, currentRegion,
    inventory: { ...inventory },
    money, badges, trainerNickname,
    myTeam: myTeam.map(m => ({
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
      _learnableFetched: m._learnableFetched,
    })),
    currentPokemonIndex,
    pokedexSeen: Array.from(pokedexSeen),
    pokedexCaught: Array.from(pokedexCaught),
    quests, questProgress, completedQuests, npcQuestProgress, completedNPCQuests, tutorialStep,
    visitedLocations: Array.from(visitedLocations), itemsUsedInBattle, itemHistory,
    pcBoxes: pcBoxes.map(box => box.map(m => ({
      uid: m.uid, originalTrainer: m.originalTrainer, createdAt: m.createdAt,
      caughtLocation: m.caughtLocation, apiData: m.apiData, maxHp: m.maxHp,
      currentHp: m.currentHp, ivs: m.ivs, evs: m.evs, baseLevel: m.baseLevel,
      exp: m.exp, expToNext: m.expToNext, candiesEaten: m.candiesEaten,
      vitaminsEaten: m.vitaminsEaten, trainingStage: m.trainingStage, trainingStat: m.trainingStat,
      happiness: m.happiness, natureIdx: m.natureIdx, breedLetter: m.breedLetter, gender: m.gender,
      status: m.status, sleepTurns: m.sleepTurns, movesPP: m.movesPP,
      statStages: m.statStages, abilityName: m.abilityName, heldItem: m.heldItem,
      berries: m.berries, learnableMoves: m.learnableMoves,
    }))),
    daycareMons, daycareEgg, lastLocation, expShareActive,
    breedingPairs: breedingPairs.map(p => ({ boxIdx: p.boxIdx, mon1Uid: p.mon1Uid, mon2Uid: p.mon2Uid, startTime: p.startTime, readyTime: p.readyTime })),
    eggs: eggs.map(e => ({ uid: e.uid, species: e.species, readyTime: e.readyTime, boxIdx: e.boxIdx, parent1Uid: e.parent1Uid, parent2Uid: e.parent2Uid, inTeam: e.inTeam })),
    notifications: notifications.slice(0, 30),
  };
}

function validateGameState() {
  // Ensure critical structures exist
  if (!myTeam) myTeam = [];
  if (!pcBoxes) pcBoxes = [[]];
  if (!badges) badges = [];
  if (!inventory) inventory = {};
  // Ensure all ITEMS exist in inventory
  ITEMS.forEach(item => { if (!(item.id in inventory)) inventory[item.id] = 0; });
  // Validate team pokemon have required fields
  for (let i = myTeam.length - 1; i >= 0; i--) {
    const m = myTeam[i];
    if (!m.apiData) { console.warn('Pokemon without apiData at index', i, '— removing'); myTeam.splice(i, 1); continue; }
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
  }
}

function saveGame() {
  validateGameState();
  saveVersion++;
  const saveData = getFullSaveData();
  // Sync money ↔ inventory credit (money is canonical source)
  if (inventory['credit'] !== undefined && inventory['credit'] !== money) {
    console.warn('Credit/money desync detected:', { credit: inventory['credit'], money });
    inventory['credit'] = money;
  }

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
    localStorage.setItem(lsKey('save_v'), String(saveVersion));
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

function loadGame() {
  try {
    const raw = localStorage.getItem(lsKey('save'));
    if (!raw) return false;
    const data = JSON.parse(raw);

    // Version tracking
    saveVersion = parseInt(localStorage.getItem(lsKey('save_v')) || '0');
    lastCloudSync = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');

    currentLocationId = data.currentLocationId || 'pallet_town';
    currentRegion = data.currentRegion || 'kanto';
    // Migrate old region keys
    if (currentRegion === 'tevas_islands') currentRegion = 'southern_archipelago';
    if (!REGIONS[currentRegion]) currentRegion = 'kanto';
    // Validate location exists
    if (!getLocation(currentLocationId)) {
      currentLocationId = 'pallet_town';
      currentRegion = 'kanto';
    }

    if (data.inventory) {
      inventory = { ...data.inventory };
    } else {
      const OLD_MAP = {
        invPokeballs: 'pokeball', invGreatBall: 'greatBall', invUltraBall: 'ultraBall',
        invPotion: 'potion', invCandy: 'candy', invVitamin: 'vitamin',
        invTrain: 'train', invWeaken: 'weaken',
        invSuperPotion: 'superPotion', invFullRestore: 'fullRestore',
        invEvolutionStone: 'evolutionStone', invTM: 'tm',
        invSitrusBerry: 'sitrusBerry', invOranBerry: 'oranBerry',
        invLumBerry: 'lumBerry', invChestoBerry: 'chestoBerry', invRawstBerry: 'rawstBerry',
      };
      initInventory();
      for (const [oldKey, newKey] of Object.entries(OLD_MAP)) {
        if (data[oldKey] !== undefined) inventory[newKey] = data[oldKey];
      }
    }
    ITEMS.forEach(item => { if (!(item.id in inventory)) inventory[item.id] = 0; });
    syncOldInventory();
    money = inventory['credit'] ?? data.money ?? 500;
    if (inventory['credit'] === undefined) inventory['credit'] = money;
    badges = data.badges || [];
    trainerNickname = data.trainerNickname || '';
    myTeam = data.myTeam || [];
    // Rehydrate team
    myTeam.forEach(m => {
      if (!m.uid) m.uid = generateUID();
      if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      if (!m.learnableMoves) m.learnableMoves = [];
      if (!m.berries) m.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
      if (m.currentHp === undefined || m.currentHp < 0) m.currentHp = m.maxHp || 50;
    });
    currentPokemonIndex = data.currentPokemonIndex ?? null;
    pokedexSeen = new Set(data.pokedexSeen || []);
    pokedexCaught = new Set(data.pokedexCaught || []);
    quests = data.quests || [];
    questProgress = data.questProgress || {};
    completedQuests = data.completedQuests || [];
    npcQuestProgress = data.npcQuestProgress || {};
    completedNPCQuests = data.completedNPCQuests || [];
    tutorialStep = data.tutorialStep || 0;
    visitedLocations = new Set(data.visitedLocations || []);
    itemsUsedInBattle = data.itemsUsedInBattle || 0;
    itemHistory = data.itemHistory || [];
    pcBoxes = data.pcBoxes || [[]];
    // Rehydrate PC pokemon
    pcBoxes.forEach(box => box.forEach(m => {
      if (!m.uid) m.uid = generateUID();
      if (m.currentHp === undefined || m.currentHp < 0) m.currentHp = m.maxHp || 50;
      if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
      // Migrate old _bredWith to hasBred
      if (m._bredWith !== undefined) { m.hasBred = m._bredWith.length > 0; delete m._bredWith; }
      if (m.hasBred === undefined) m.hasBred = false;
    }));
    // Migrate team pokemon too
    myTeam.forEach(m => {
      if (m._bredWith !== undefined) { m.hasBred = m._bredWith.length > 0; delete m._bredWith; }
      if (m.hasBred === undefined) m.hasBred = false;
    });
    daycareMons = data.daycareMons || [];
    daycareMons.forEach(e => { if (!e.mon.currentHp || e.mon.currentHp < 0) e.mon.currentHp = e.mon.maxHp || 50; });
    daycareEgg = data.daycareEgg || null;
    lastLocation = data.lastLocation || null;
    expShareActive = data.expShareActive || false;
    breedingPairs = data.breedingPairs || [];
    eggs = data.eggs || [];
    notifications = data.notifications || [];

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

function resetGame() {
  showConfirmModal('Сброс прогресса', 'Это действие необратимо! Вы уверены?', () => {
    localStorage.removeItem(lsKey('save'));
    location.reload();
  });
}

// --- STARTER ---


async function giveStarter() {
  const modal = document.getElementById('starter-modal');
  const grid = document.getElementById('starter-grid');
  if (!modal || !grid) {
    await giveStarterMon('bulbasaur');
    return;
  }

  grid.innerHTML = '';
  const title = document.querySelector('#starter-modal h2');
  if (title) title.innerText = 'Выберите карту (Поколения 1-9)';

  GEN_STARTERS.forEach((gen, idx) => {
    const div = document.createElement('div');
    div.className = 'starter-option';
    div.style.background = 'linear-gradient(135deg, #2a5298, #1e3c72)';
    div.style.color = '#fff';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontSize = '3rem';
    div.style.fontWeight = 'bold';
    div.style.cursor = 'pointer';
    div.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    div.style.borderRadius = '10px';
    div.style.height = '150px';
    div.style.transition = 'transform 0.2s';
    div.innerText = '?';

    div.addEventListener('mouseenter', () => div.style.transform = 'scale(1.05)');
    div.addEventListener('mouseleave', () => div.style.transform = 'scale(1)');

    div.addEventListener('click', () => {
      const chosenStarter = gen[Math.floor(Math.random() * gen.length)];
      modal.style.display = 'none';
      giveStarterMon(chosenStarter);
      showToast(`Вам выпал покемон: ${chosenStarter.toUpperCase()}! (Gen ${idx + 1})`, false);
    });
    grid.appendChild(div);
  });

  modal.style.display = 'flex';
}

async function giveStarterMon(pokemonName) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const starterData = await res.json();
    const baseLevel = 5;
    
    // Filter moves to only those learned at level <= 5
    let learnedMoves = starterData.moves.filter(m => {
      return m.version_group_details.some(v => v.move_learn_method.name === 'level-up' && v.level_learned_at <= baseLevel);
    }).slice(0, 4);
    
    if (learnedMoves.length === 0) {
      learnedMoves.push({ move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' } });
    }
    starterData.moves = learnedMoves;

    const exp = Math.pow(baseLevel, 3);
    const expToNext = Math.pow(baseLevel + 1, 3);

    const newMon = {
      uid: generateUID(),
      originalTrainer: getTrainerId(),
      createdAt: Date.now(),
      caughtLocation: currentLocationId,
      apiData: starterData,
      maxHp: 100,
      currentHp: 100,
      ivs: { hp: 30, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: baseLevel,
      exp: exp,
      expToNext: expToNext,
      candiesEaten: 0,
      vitaminsEaten: 0,
      training: null,
      trainingStage: 0,
      trainingStat: null,
      happiness: 70,
      natureIdx: 0,
      breedLetter: 'A',
      gender: Math.random() < 0.5 ? 'male' : 'female',
      status: null,
      sleepTurns: 0,
      movesPP: [],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: starterData.abilities[0]?.ability?.name || null,
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: []
    };

    const baseHp = starterData.stats[0].base_stat;
    const maxHp = Math.floor(0.01 * (2 * baseHp + newMon.ivs.hp + Math.floor(0.25 * newMon.evs.hp)) * newMon.baseLevel) + newMon.baseLevel + 10;
    newMon.currentHp = maxHp;
    newMon.maxHp = maxHp;

    if (myTeam.length < 6) {
      myTeam.push(newMon);
    } else {
      if (pcBoxes.length === 0) pcBoxes.push([]);
      pcBoxes[0].push(newMon);
    }
    pokedexSeen.add(pokemonName);
    pokedexCaught.add(pokemonName);
    renderLocation(currentLocationId);
    renderTeamGrid();
    autoSave();
  } catch (e) {
    console.error('Failed to give starter', e);
  }
}

// --- APP NAVIGATION ---
function initAppNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.app-view');
  const headerTitle = document.getElementById('header-title');

  const titles = {
    'view-world': 'Мир',
    'view-backpack': 'Рюкзак',
    'view-team': 'Команда Покемонов',
    'view-chat': 'Чат',
    'view-trainers': 'Тренеры',
    'view-info': 'Инфо'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active-view'));

      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active-view');
      headerTitle.innerText = titles[targetId];
      if (targetId === 'view-world') {
        headerTitle.innerText = `Мир (${REGIONS[currentRegion]?.name || ''})`;
      }

      if (targetId === 'view-backpack') {
        renderInventory();
      }

      if (targetId === 'view-team') {
        renderTeamGrid();
        document.getElementById('team-roster').style.display = 'block';
        document.getElementById('pokedex-display').style.display = 'none';
      }

      if (targetId === 'view-trainers') {
        loadAllTrainers();
      }

      if (targetId === 'view-chat') {
        loadChatMessages();
        renderTrainerCard();
        startChatPolling();
      } else {
        stopChatPolling();
      }
    });
  });

  document.getElementById('btn-back-team').addEventListener('click', () => {
    document.getElementById('pokedex-display').style.display = 'none';
    document.getElementById('team-roster').style.display = 'block';
    renderTeamGrid();
  });

  // Reset button
  document.getElementById('btn-reset-game').addEventListener('click', resetGame);

  // NPC modal close
  document.getElementById('btn-close-npc').addEventListener('click', () => {
    document.getElementById('npc-modal').style.display = 'none';
  });
}

// --- NPC ENGINE ---
function openNPCDialog(npcId) {
  const npc = NPC_DATA[npcId];
  if (!npc) return;
  const modal = document.getElementById('npc-modal');
  document.getElementById('npc-sprite').innerText = npc.sprite;
  document.getElementById('npc-name').innerText = npc.name;

  const availableQuests = npc.quests.filter(q =>
    !completedNPCQuests.includes(q.id) &&
    (!q.prereqQuest || completedNPCQuests.includes(q.prereqQuest))
  );
  const allDone = npc.quests.every(q => completedNPCQuests.includes(q.id));
  const activeQuest = npc.quests.find(q =>
    !completedNPCQuests.includes(q.id) && q.id in npcQuestProgress
  );

  let dialogText = npc.dialog.greet;
  if (allDone && npc.quests.length > 0) {
    dialogText = npc.dialog.default;
  } else if (activeQuest) {
    const progress = npcQuestProgress[activeQuest.id] || 0;
    dialogText = progress >= activeQuest.targetQty
      ? npc.dialog.quest_complete
      : npc.dialog.quest_incomplete;
  } else if (availableQuests.length > 0) {
    const q = availableQuests[0];
    dialogText = npc.dialog.quest_offer
      .replace('{target}', q.targetQty);
    if (q.targetItem) {
      dialogText = dialogText.replace('{item}', itemDef(q.targetItem).nameRu);
    } else {
      dialogText = dialogText.replace('{item}', '').replace('  ', ' ').trim();
    }
  }

  document.getElementById('npc-dialog').innerText = dialogText;
  renderNPCQuests(npc);
  modal.style.display = 'flex';

  // Special NPC actions
  const actionsContainer = document.getElementById('npc-actions');
  // Remove old extra buttons (keep close button)
  actionsContainer.querySelectorAll('.npc-action-extra').forEach(b => b.remove());

  if (npcId === 'joy_pokecenter') {
    const btnHeal = document.createElement('button');
    btnHeal.className = 'tma-btn npc-action-extra';
    btnHeal.style.backgroundColor = '#34c759';
    btnHeal.innerText = '🏥 Вылечить команду';
    btnHeal.onclick = () => {
      myTeam.forEach(mon => {
        const baseHp = mon.apiData.stats[0].base_stat;
        const curLvl = mon.baseLevel + mon.candiesEaten;
        mon.maxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
        mon.currentHp = mon.maxHp;
        mon.status = null;
        mon.sleepTurns = 0;
        mon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (mon.movesPP) mon.movesPP.forEach(pp => { if (pp) pp.current = pp.max; });
      });
      showToast('Ваша команда полностью вылечена!', false);
      modal.style.display = 'none';
      autoSave();
    };
    actionsContainer.insertBefore(btnHeal, document.getElementById('btn-close-npc'));
  }

  if (npcId === 'daycare_pokecenter') {
    const btnDeposit = document.createElement('button');
    btnDeposit.className = 'tma-btn npc-action-extra';
    btnDeposit.style.backgroundColor = '#5856d6';
    btnDeposit.innerText = '💻 Открыть PC';
    btnDeposit.onclick = () => {
      modal.style.display = 'none';
      openPC();
    };
    actionsContainer.insertBefore(btnDeposit, document.getElementById('btn-close-npc'));

    const btnDaycare = document.createElement('button');
    btnDaycare.className = 'tma-btn npc-action-extra';
    btnDaycare.style.backgroundColor = '#ff9500';
    btnDaycare.innerText = '🥚 Оставить в Питомнике';
    btnDaycare.onclick = () => {
      if (myTeam.length < 2) { showToast('Нужно минимум 2 покемона в команде!', true); return; }
      openDaycareDeposit();
      modal.style.display = 'none';
    };
    actionsContainer.insertBefore(btnDaycare, document.getElementById('btn-close-npc'));
  }

}

function renderNPCQuests(npc) {
  const container = document.getElementById('npc-quests');
  container.innerHTML = '';

  npc.quests.forEach(q => {
    if (completedNPCQuests.includes(q.id)) {
      const el = document.createElement('div');
      el.className = 'npc-quest-item';
      el.innerHTML = `<div class="npc-quest-info"><div class="npc-quest-name">✅ ${q.desc}</div></div>`;
      container.appendChild(el);
      return;
    }

    const prereqMet = !q.prereqQuest || completedNPCQuests.includes(q.prereqQuest);
    if (!prereqMet) return;

    const progress = npcQuestProgress[q.id] || 0;
    const isActive = q.id in npcQuestProgress;
    const isReady = progress >= q.targetQty;
    const pct = Math.min(100, Math.round((progress / q.targetQty) * 100));

    const el = document.createElement('div');
    el.className = 'npc-quest-item';
    el.innerHTML = `
      <div class="npc-quest-info">
        <div class="npc-quest-name">${q.desc}</div>
        <div class="npc-quest-reward">Награда: ${q.rewardMoney}💰 + ${q.rewardQty}x ${itemDef(q.rewardItem).nameRu}</div>
        ${isActive ? `<div class="npc-quest-progress">${progress}/${q.targetQty}</div><div class="npc-quest-bar"><div class="npc-quest-bar-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;

    const btn = document.createElement('button');
    btn.className = 'tma-btn';
    btn.style.padding = '4px 8px'; btn.style.fontSize = '0.8rem';

    if (!isActive) {
      btn.innerText = 'Взять';
      btn.onclick = () => {
        npcQuestProgress[q.id] = 0;
        document.getElementById('npc-dialog').innerText = npc.dialog.quest_incomplete;
        renderNPCQuests(npc);
        autoSave();
      };
    } else if (isReady) {
      btn.innerText = 'Сдать';
      btn.onclick = () => {
        // Tutorial quests: advance to next step
        if (q.id.startsWith('tutorial_')) {
          const step = parseInt(q.id.split('_')[1]);
          if (step === tutorialStep) {
            tutorialStep++;
            completedNPCQuests.push(q.id);
            delete npcQuestProgress[q.id];
            money += q.rewardMoney;
            addItem(q.rewardItem, q.rewardQty);
            addNotification('🎓 Обучение', `Шаг ${step} завершён! Награда: ${q.rewardMoney}💰 + ${q.rewardQty}x ${itemDef(q.rewardItem).nameRu}`);
            appendToLog(`Обучающий квест (шаг ${step}) выполнен!`, false, 'quest');
          }
        } else {
          for (let i = 0; i < q.targetQty; i++) removeItem(q.targetItem, 1);
          completedNPCQuests.push(q.id);
          delete npcQuestProgress[q.id];
          money += q.rewardMoney;
          addItem(q.rewardItem, q.rewardQty);
          appendToLog(`Квест "${q.desc}" выполнен!`, false, 'quest');
        }
        document.getElementById('npc-dialog').innerText = npc.dialog.quest_complete;
        updateMoneyDisplay();
        renderNPCQuests(npc);
        autoSave();
      };
    } else {
      btn.innerText = '...';
      btn.disabled = true;
    }

    el.appendChild(btn);
    container.appendChild(el);
  });
}

export function checkTutorialProgress(type, amount, itemId) {
  if (tutorialStep < 1 || tutorialStep > 5) return;
  const questId = `tutorial_${tutorialStep}`;
  if (completedNPCQuests.includes(questId)) return;
  // Track progress for current tutorial step
  const quest = NPC_DATA['professor_tutorial']?.quests?.find(q => q.id === questId);
  if (!quest || quest.type !== type) return;
  if (!(questId in npcQuestProgress)) npcQuestProgress[questId] = 0;
  npcQuestProgress[questId] += amount;
  if (npcQuestProgress[questId] >= quest.targetQty) {
    npcQuestProgress[questId] = quest.targetQty;
    addNotification('📋 Квест!', `Обучающий квест (шаг ${tutorialStep}): задание выполнено! Вернитесь к Профессору Оуку.`);
  }
  autoSave();
}

function checkNPCQuestProgress(itemId, qty) {
  for (const [npcId, npc] of Object.entries(NPC_DATA)) {
    for (const q of npc.quests) {
      if (q.type === 'collect_items' && q.targetItem === itemId) {
        if (!completedNPCQuests.includes(q.id) && q.id in npcQuestProgress) {
          npcQuestProgress[q.id] += qty;
        }
      }
    }
  }
}

// --- LOCATION ENGINE ---
export function renderLocation(locId) {
  currentLocationId = locId;
  updatePlayerLocation();
  const loc = getLocation(locId);
  if (!loc) return;
  currentRegion = getRegionOfLocation(locId);
  // Update header if on world view
  const headerTitle = document.getElementById('header-title');
  if (headerTitle && headerTitle.innerText.startsWith('Мир')) {
    headerTitle.innerText = `Мир (${REGIONS[currentRegion]?.name || ''})`;
  }

  document.getElementById('loc-name').innerText = loc.name;
  document.getElementById('loc-desc').innerText = loc.desc;
  const img = loc.image;
  const locImgEl = document.getElementById('loc-image');
  if (locImgEl) {
    if (img && img.length > 0) {
      const imgUrl = img.startsWith('http') ? img : (img.startsWith('/') ? img : '/' + img);
      locImgEl.style.backgroundImage = `url('${imgUrl}')`;
    } else {
      locImgEl.style.backgroundImage = 'none';
    }
  }

  // Region display
  const regionEl = document.getElementById('loc-region');
  if (regionEl) regionEl.innerText = REGIONS[currentRegion]?.name || '';

  // Weather display
  const weather = getDailyWeather(locId);
  const weatherEl = document.getElementById('loc-weather');
  if (weatherEl) {
    weatherEl.innerText = `${WEATHER_ICONS[weather]} ${WEATHER_NAMES[weather]}`;
  }

  updateTimeOfDay();
  const locNameEl = document.getElementById('loc-name');
  locNameEl.innerText = `${isDaytime ? '☀️' : '🌙'} ${loc.name}`;

  const actionsContainer = document.getElementById('loc-actions');
  actionsContainer.innerHTML = '';
  actionsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:4px';

  // Pokemarket — shop button
  if (locId.endsWith('_pokemarket') || locId === 'pokemarket') {
    const btnShop = document.createElement('button');
    btnShop.className = 'btn-use';
    btnShop.style.backgroundColor = '#ff9500';
    btnShop.innerText = '🛒 Магазин';
    btnShop.onclick = () => openShop();
    actionsContainer.appendChild(btnShop);
  }

  // Pokemon Center location
  if (locId === 'pokecenter' || locId.endsWith('_pokecenter')) {
    checkDaycare();

    const btnTrade = document.createElement('button');
    btnTrade.className = 'btn-use';
    btnTrade.style.backgroundColor = '#007aff';
    btnTrade.innerText = '🤝 Обменник (Игроки)';
    btnTrade.onclick = () => openTradeCenter();
    actionsContainer.appendChild(btnTrade);

    const btnHeal = document.createElement('button');
    btnHeal.className = 'btn-use';
    btnHeal.style.backgroundColor = '#34c759';
    btnHeal.innerText = '🏥 Вылечить команду';
    btnHeal.onclick = () => {
      if (myTeam.length === 0) { showToast('У вас нет покемонов!', true); return; }
      let healed = false;
      myTeam.forEach(mon => {
        if (!mon || !mon.apiData) return;
        const baseHp = mon.apiData.stats[0].base_stat;
        const curLvl = mon.baseLevel + mon.candiesEaten;
        const newMaxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
        if (mon.currentHp < newMaxHp || mon.status || mon.maxHp !== newMaxHp) healed = true;
        mon.maxHp = newMaxHp;
        mon.currentHp = newMaxHp;
        mon.status = null;
        mon.sleepTurns = 0;
        mon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (mon.movesPP) mon.movesPP.forEach(pp => { if (pp && pp.current < pp.max) { pp.current = pp.max; healed = true; } });
      });
      const msg = healed ? 'Сестра Джой вылечила всю команду!' : 'Все покемоны уже здоровы!';
      const descEl = document.getElementById('loc-desc');
      const oldText = descEl.innerText;
      descEl.innerText = msg;
      descEl.style.color = 'var(--tma-accent)';
      setTimeout(() => { descEl.innerText = oldText; descEl.style.color = ''; }, 2000);
      autoSave();
    };
    actionsContainer.appendChild(btnHeal);

    const btnPC = document.createElement('button');
    btnPC.className = 'btn-use';
    btnPC.style.backgroundColor = '#5856d6';
    btnPC.innerText = '💻 Терминал PC';
    btnPC.onclick = () => openPC();
    actionsContainer.appendChild(btnPC);

    if (daycareMons.length > 0) {
      const btnCollect = document.createElement('button');
      btnCollect.className = 'btn-use';
      btnCollect.style.backgroundColor = '#ff9500';
      btnCollect.innerText = `🐣 Забрать из Питомника (${daycareMons.length})`;
      btnCollect.onclick = () => collectDaycareMons();
      actionsContainer.appendChild(btnCollect);
    }
    if (daycareEgg && Date.now() >= daycareEgg.readyTime) {
      const btnEgg = document.createElement('button');
      btnEgg.className = 'btn-use';
      btnEgg.style.backgroundColor = '#ffcc00';
      btnEgg.style.color = '#000';
      btnEgg.innerText = '🥚 Забрать яйцо!';
      btnEgg.onclick = () => collectDaycareEgg();
      actionsContainer.appendChild(btnEgg);
    }
  }

  // Gym leader button
  if (gymLeaders[locId] && !badges.includes(gymLeaders[locId].badgeName)) {
    const btnGym = document.createElement('button');
    btnGym.className = 'btn-use';
    btnGym.style.backgroundColor = '#af52de';
    btnGym.innerText = `⚔ ${gymLeaders[locId].name} (${gymLeaders[locId].title})`;
    btnGym.onclick = () => openGymModal(locId);
    actionsContainer.appendChild(btnGym);
  }

  // Elite Four button
  if (locId === 'indigo_plateau' && badges.length >= 8) {
    const btnElite = document.createElement('button');
    btnElite.className = 'btn-use';
    btnElite.style.backgroundColor = '#ff3b30';
    btnElite.innerText = '🏆 Элитная Четверка';
    btnElite.onclick = () => openEliteModal();
    actionsContainer.appendChild(btnElite);
  }

  let huntEncounters = loc.encounters;
  if (loc.dayEncounters && isDaytime) huntEncounters = loc.dayEncounters;
  else if (loc.nightEncounters && !isDaytime) huntEncounters = loc.nightEncounters;

  // Hunt persists across locations — tick handles empty encounter tables

  // NPC panel
  const npcPanel = document.getElementById('npc-panel');
  const npcButtons = document.getElementById('npc-buttons');
  npcButtons.innerHTML = '';
  npcButtons.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px';
  let npcsHere = Object.values(NPC_DATA).filter(n => n.location === locId);
  if (locId.endsWith('_pokecenter')) {
    const pcNpcs = Object.values(NPC_DATA).filter(n => n.location === 'pokecenter');
    npcsHere = [...npcsHere, ...pcNpcs];
  }
  if (npcsHere.length > 0) {
    npcPanel.style.display = 'block';
    npcsHere.forEach(npc => {
      const npcBtn = document.createElement('button');
      npcBtn.className = 'btn-nav';
      npcBtn.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px';
      npcBtn.innerHTML = `<span>${npc.sprite} ${npc.name}</span>`;
      npcBtn.onclick = () => openNPCDialog(npc.id);
      npcButtons.appendChild(npcBtn);
    });
  } else {
    npcPanel.style.display = 'none';
  }

  const navContainer = document.getElementById('nav-buttons');
  navContainer.innerHTML = '';
  navContainer.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:4px';

  // Split: external routes vs sub-locations
  const subLinks = [], extLinks = [];
  loc.links.forEach(linkId => {
    const linkLoc = getLocation(linkId);
    if (!linkLoc) return;
    if (linkId.startsWith(locId + '_')) subLinks.push({ id: linkId, loc: linkLoc });
    else extLinks.push({ id: linkId, loc: linkLoc });
  });

  extLinks.forEach(({ id: linkId, loc: linkLoc }) => {
    const btn = document.createElement('button');
    btn.className = 'btn-nav';
    btn.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px';
    btn.innerHTML = `<span>➔ ${linkLoc.name}</span>`;
    btn.onclick = () => {
      if (!visitedLocations.has(linkId)) { visitedLocations.add(linkId); checkQuestProgress('explore'); }
      renderLocation(linkId);
    };
    navContainer.appendChild(btn);
  });

  if (subLinks.length > 0) {
    const sep = document.createElement('div');
    sep.style.cssText = 'grid-column:1/-1;font-size:11px;color:#888;text-align:center;padding:4px 0 2px';
    sep.innerText = '🏙 В городе';
    navContainer.appendChild(sep);
    subLinks.forEach(({ id: linkId, loc: linkLoc }) => {
      const btn = document.createElement('button');
      btn.className = 'btn-nav';
      btn.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px;border-color:#555';
      btn.innerHTML = `<span>🏠 ${linkLoc.name}</span>`;
      btn.onclick = () => {
        if (!visitedLocations.has(linkId)) { visitedLocations.add(linkId); checkQuestProgress('explore'); }
        renderLocation(linkId);
      };
      navContainer.appendChild(btn);
    });
  }

  // Back from pokecenter
  if ((locId === 'pokecenter' || locId.endsWith('_pokecenter')) && lastLocation) {
    const backLoc = getLocation(lastLocation);
    if (backLoc) {
      const btnBack = document.createElement('button');
      btnBack.className = 'btn-nav';
      btnBack.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px;border-color:var(--tma-accent)';
      btnBack.innerHTML = `<span>↩ ${backLoc.name}</span>`;
      btnBack.onclick = () => {
        renderLocation(lastLocation);
        lastLocation = null;
      };
      navContainer.appendChild(btnBack);
    }
  }

  // Transport hub buttons (region travel)
  const hubs = TRANSPORT_HUBS[locId];
  if (hubs) {
    hubs.forEach(hub => {
      const btn = document.createElement('button');
      btn.className = 'btn-nav';
      btn.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px;border-color:var(--tma-accent)';
      btn.innerHTML = `<span>🎫 ${hub.label}</span>`;
      btn.onclick = () => travelToRegion(hub.targetRegion, hub.targetLoc, hub.ticket);
      navContainer.appendChild(btn);
    });
  }

  autoSave();
}

// --- SHOP SYSTEM (NEW) ---
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
  if (item.spriteType === 'pokeapi') {
    return `<img src="${ITEM_SPRITE_BASE}${item.sprite}" style="width:${size}px;height:${size}px;vertical-align:middle;image-rendering:auto" alt="">`;
  }
  return `<img src="${LOCAL_ITEM_SPRITE_BASE}${item.sprite}" style="width:${size}px;height:${size}px;vertical-align:middle;image-rendering:auto" alt="">`;
}

// Auto-generated from ITEMS database
// --- DISPLAY UPDATES ---
export function updateMoneyDisplay() {
  inventory['credit'] = money;
  const el = document.getElementById('money-display');
  if (el) el.innerText = `¥${money}`;
}

function updateBadgeDisplay() {
  const el = document.getElementById('badge-display');
  if (el) el.innerText = `Значки: ${badges.length}/8`;
}

// --- TEAM ROSTER ---
function renderTeamGrid() {
  document.getElementById('team-count').innerText = `(${myTeam.length}/6)`;
  const grid = document.getElementById('team-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 6; i++) {
    const slot = document.createElement('div');
    if (i < myTeam.length) {
      const mon = myTeam[i];
      const curLvl = mon.baseLevel + mon.candiesEaten;
      const statusIcon = getStatusIcon(mon.status);
      slot.className = 'team-slot';
      const reorderHtml = (myTeam.length > 1) ?
        `<div class="team-reorder">
          ${i > 0 ? `<button class="team-move-btn" data-index="${i}" data-dir="-1" title="Вверх">▲</button>` : '<span></span>'}
          ${i < myTeam.length - 1 ? `<button class="team-move-btn" data-index="${i}" data-dir="1" title="Вниз">▼</button>` : '<span></span>'}
        </div>` : '';
      const types = mon.apiData.types;
      const typeBg = getTypeGradient(types);
      const trainStage = mon.trainingStage || 0;
      const trainLabel = trainStage > 0
        ? `<div class="train-label" style="background:${trainingStages[trainStage].color};" title="${trainingStages[trainStage].name} (+${trainingStages[trainStage].pct}%)">${trainingStages[trainStage].name}</div>`
        : '';
      if (mon.isEgg) {
        const eggData = eggs.find(e => e.uid === mon.uid);
        const remaining = eggData ? Math.max(0, Math.ceil((eggData.readyTime - Date.now()) / 60000)) : '?';
        slot.innerHTML = `
          <div class="team-sprite-wrap">
            <span style="font-size:48px;">🥚</span>
          </div>
          <div class="slot-name">Яйцо</div>
          <div class="slot-lvl">Вылупится через ~${remaining} мин</div>
        `;
      } else {
        const pwStars2 = getPowerStars(mon);
        const rStars2 = getRarityStars(mon);
        slot.innerHTML = `
          ${reorderHtml}
          <div class="team-sprite-wrap">
            <img src="${mon.apiData.sprites?.other?.['official-artwork']?.front_default || mon.apiData.sprites.front_default}" alt="sprite" style="background:${typeBg};">
            ${trainLabel}
          </div>
          <div class="slot-name">${escHtml(mon.nickname || mon.apiData.name)} ${statusIcon}</div>
          <div class="slot-lvl">${renderStars(pwStars2, rStars2)} Lvl ${curLvl} | ${mon.currentHp}/${mon.maxHp} HP</div>
        `;
      }
      slot.setAttribute('data-poke-index', i);
      slot.addEventListener('click', (e) => {
        if (e.target.closest('.team-move-btn')) return;
        openPokemonProfile(i);
      });
    } else {
      slot.className = 'team-slot empty';
      slot.innerText = 'Пустой слот';
    }
    grid.appendChild(slot);
  }

  // Set up event delegation for reorder buttons if not already done
  if (!grid._reorderSetup) {
    grid._reorderSetup = true;
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('.team-move-btn');
      if (!btn) return;
      const idx = parseInt(btn.getAttribute('data-index'));
      const dir = parseInt(btn.getAttribute('data-dir'));
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= myTeam.length) return;
      [myTeam[idx], myTeam[swapIdx]] = [myTeam[swapIdx], myTeam[idx]];
      renderTeamGrid();
      autoSave();
    });
  }
}

// --- POKEMON PROFILE ---
function openPokemonProfile(index) {
  currentPokemonIndex = index;
  refreshProfileUI();

  document.getElementById('team-roster').style.display = 'none';
  document.getElementById('pokedex-display').style.display = 'flex';
}

export function refreshProfileUI() {
  if (currentPokemonIndex === null) return;
  const mon = myTeam[currentPokemonIndex];

  const curLvl = mon.baseLevel + mon.candiesEaten;

  document.getElementById('poke-name').innerText = `${mon.nickname || mon.apiData.name} #${mon.apiData.id}`;
  const animSprite = mon.apiData?.sprites?.other?.['official-artwork']?.front_default || mon.apiData?.sprites?.front_default || '';
  document.getElementById('poke-sprite').src = animSprite;
  document.getElementById('poke-sprite').style.background = getTypeGradient(mon.apiData.types);

  const typesHtml = mon.apiData.types.map(t => `<span class="type-badge" style="background-color: ${getTypeColor(t.type.name)}">${t.type.name}</span>`).join('');
  document.getElementById('poke-types').innerHTML = typesHtml;

  const ability = mon.apiData.abilities.length > 0 ? mon.apiData.abilities[0].ability.name : 'Unknown';
  document.getElementById('info-ability').innerText = ability.charAt(0).toUpperCase() + ability.slice(1);
  const tera = mon.apiData.types[0].type.name;
  document.getElementById('info-tera').innerText = tera.charAt(0).toUpperCase() + tera.slice(1);

  const heldEl = document.getElementById('info-held-item');
  const heldItemName = getHeldItemName(mon.heldItem);
  heldEl.innerText = heldItemName;
  heldEl.title = 'Нажмите чтобы сменить';
  heldEl.style.cursor = 'pointer';
  heldEl.onclick = () => openHeldItemPicker(currentPokemonIndex);

  document.getElementById('info-cur-hp').innerText = mon.currentHp;
  document.getElementById('info-max-hp').innerText = mon.maxHp;

  for(let i=0; i<4; i++) {
    if(mon.apiData.moves[i]) {
      const ppDisplay = (mon.movesPP && mon.movesPP[i]) ? `${mon.movesPP[i].current}/${mon.movesPP[i].max}` : '30/30';
      document.getElementById(`move-${i}-name`).innerText = mon.apiData.moves[i].move.name;
      document.getElementById(`move-${i}-pp`).innerText = `PP ${ppDisplay}`;
    } else {
      document.getElementById(`move-${i}-name`).innerText = '-';
      document.getElementById(`move-${i}-pp`).innerText = `PP 0/0`;
    }
  }

  // Learnable moves
  const learnableDiv = document.getElementById('content-moves');
  let learnableHTML = '';
  if (mon.learnableMoves && mon.learnableMoves.length > 0) {
    learnableHTML = '<div class="learnable-section" style="margin-top:12px;"><h4 style="margin:0 0 8px;font-size:0.9rem;">📥 Резерв атак:</h4>';
    mon.learnableMoves.forEach((lm, i) => {
      learnableHTML += `<div class="learnable-move" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;margin:4px 0;background:var(--tma-bg);border-radius:6px;font-size:0.85rem;">
        <span>${lm.name} (⚡${lm.power || '?'} | ${lm.type || '?'})</span>
        <button class="btn-use learn-btn" data-lm="${i}" style="background:#34c759;padding:3px 8px;font-size:0.75rem;">Выучить</button>
      </div>`;
    });
    learnableHTML += '</div>';
  }
  // Add to moves tab
  let movesContent = document.getElementById('content-moves');
  // Remove old learnable section if exists
  const oldSec = movesContent.querySelector('.learnable-section');
  if (oldSec) oldSec.remove();
  if (learnableHTML) {
    movesContent.insertAdjacentHTML('beforeend', learnableHTML);
    movesContent.querySelectorAll('.learn-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-lm'));
        const move = mon.learnableMoves[idx];
        const slotItems = (mon.apiData.moves || []).filter(m => m).map((m, i) => ({
          label: m.move.name, subtitle: `Слот ${i + 1}`
        }));
        showSelectionModal(`Выучить ${move.name} (⚡${move.power}) в какой слот?`, slotItems, (slotPick) => {
          if (!mon.apiData.moves[slotPick]) mon.apiData.moves[slotPick] = {};
          mon.apiData.moves[slotPick].move = { name: move.name, url: move.url };
          mon.learnableMoves.splice(idx, 1);
          refreshProfileUI();
          showToast(`${move.name} выучено в слот ${slotPick + 1}!`, false);
          autoSave();
        }, true);
      });
    });
  }

  document.getElementById('info-lvl').innerText = curLvl;
  document.getElementById('stat-lvl-display').innerText = curLvl;
  document.getElementById('stat-vit-display').innerText = `${mon.vitaminsEaten}/10`;

  document.getElementById('iv-hp').value = mon.ivs.hp;
  document.getElementById('iv-atk').value = mon.ivs.atk;
  document.getElementById('iv-def').value = mon.ivs.def;
  document.getElementById('iv-spa').value = mon.ivs.spa;
  document.getElementById('iv-spd').value = mon.ivs.spd;
  document.getElementById('iv-spe').value = mon.ivs.spe;

  document.getElementById('ev-hp').value = mon.evs.hp;
  document.getElementById('ev-atk').value = mon.evs.atk;
  document.getElementById('ev-def').value = mon.evs.def;
  document.getElementById('ev-spa').value = mon.evs.spa;
  document.getElementById('ev-spd').value = mon.evs.spd;
  document.getElementById('ev-spe').value = mon.evs.spe;

  updateTrainingUI_Profile(mon);
  updateHappinessUI_Profile(mon);
  updateGenecodeDisplay_Profile(mon);
  updateStatusDisplay_Profile(mon);

  updateDynamicEVs();
  updateStats();
}

function updateStatusDisplay_Profile(mon) {
  const el = document.getElementById('profile-status-display');
  if (!el) return;
  if (mon.status) {
    el.innerText = `Статус: ${getStatusIcon(mon.status)} ${STATUS_NAMES[mon.status]}`;
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

// ... keeping rest identical down to end
function updateTrainingUI_Profile(mon) {
  const stageName = trainingStages[mon.trainingStage].name;
  const pct = trainingStages[mon.trainingStage].pct;

  document.getElementById('train-stage').innerText = stageName;
  document.getElementById('train-pct').innerText = pct > 0 ? `(+${pct}%)` : '';

  const statNames = { 'atk': 'Атака', 'def': 'Защита', 'spa': 'Сп.Атака', 'spd': 'Сп.Защита', 'spe': 'Скорость' };
  document.getElementById('train-stat').innerText = mon.trainingStat ? `(${statNames[mon.trainingStat]})` : '';
}

function updateHappinessUI_Profile(mon) {
  document.getElementById('status-happiness').innerText = mon.happiness;
  const baseCrit = 7.0;
  const maxCrit = 11.0;
  const currentCrit = baseCrit + ((mon.happiness / 255) * (maxCrit - baseCrit));
  document.getElementById('info-crit').innerText = `${currentCrit.toFixed(1)}%`;
}

function updateGenecodeDisplay_Profile(mon) {
  const vitStr = (mon.vitaminsEaten > 0) ? `.${mon.vitaminsEaten*10}` : '.0';
  const genecodeStr = `h${mon.ivs.hp}a${mon.ivs.atk}d${mon.ivs.def}s${mon.ivs.spe}sa${mon.ivs.spa}sd${mon.ivs.spd}${vitStr}${mon.breedLetter}`;
  document.getElementById('info-genecode').innerText = genecodeStr;
  // Show UID & original trainer
  const uidEl = document.getElementById('info-uid');
  if (uidEl) {
    uidEl.innerText = mon.uid || '?';
    uidEl.title = mon.originalTrainer ? `Тренер ID: ${mon.originalTrainer}` : '';
  }
}

export function saveActiveMonData() {
  if (currentPokemonIndex === null) return;
  const mon = myTeam[currentPokemonIndex];

  mon.evs.hp = parseInt(document.getElementById('ev-hp').value) || 0;
  mon.evs.atk = parseInt(document.getElementById('ev-atk').value) || 0;
  mon.evs.def = parseInt(document.getElementById('ev-def').value) || 0;
  mon.evs.spa = parseInt(document.getElementById('ev-spa').value) || 0;
  mon.evs.spd = parseInt(document.getElementById('ev-spd').value) || 0;
  mon.evs.spe = parseInt(document.getElementById('ev-spe').value) || 0;

  const baseHp = mon.apiData.stats[0].base_stat;
  const curLvl = mon.baseLevel + mon.candiesEaten;
  mon.maxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
  if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
  document.getElementById('info-max-hp').innerText = mon.maxHp;
  document.getElementById('info-cur-hp').innerText = mon.currentHp;
}

function initProfileEvents() {
  const evInputs = document.querySelectorAll('.reborn-input-ev');
  evInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      let val = parseInt(e.target.value) || 0;
      if (val < 0) val = 0;
      if (val > 126) val = 126;
      e.target.value = val;

      saveActiveMonData();
      updateDynamicEVs(e.target);
      updateStats();
    });
  });
}

function updateStats() {
  if (currentPokemonIndex === null) return;
  const mon = myTeam[currentPokemonIndex];
  const stats = [
    { name: 'hp', el: 'val-hp' },
    { name: 'attack', el: 'val-atk' },
    { name: 'defense', el: 'val-def' },
    { name: 'special-attack', el: 'val-spa' },
    { name: 'special-defense', el: 'val-spd' },
    { name: 'speed', el: 'val-spe' }
  ];
  stats.forEach(s => {
    const val = calculateStat(mon, s.name, false);
    const el = document.getElementById(s.el);
    if (el) el.innerText = val;
  });
}

export function getTypeColor(type) {
  const colors = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705898',
    steel: '#B7B7CE', fairy: '#D685AD'
  };
  return colors[type] || '#777';
}

export function getTypeGradient(types) {
  if (!types || types.length === 0) return 'radial-gradient(circle at 50% 50%, #1a3050 0%, #0d1b2a 100%)';
  const c1 = getTypeColor(types[0].type.name);
  const c2 = types.length > 1 ? getTypeColor(types[1].type.name) : c1;
  return `radial-gradient(circle at 50% 50%, ${c1}dd 0%, ${c1}55 50%, ${c2}55 80%, ${c2}dd 100%)`;
}

function getSpriteUrl(mon) {
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

function updateBattleSpriteBgs() {
  const playerBox = document.getElementById('player-sprite')?.closest('.reborn-sprite-box');
  if (playerBox && activePlayerMon?.apiData?.types) {
    playerBox.style.background = getTypeGradient(activePlayerMon.apiData.types);
  }
  const wildBox = document.getElementById('wild-sprite')?.closest('.reborn-sprite-box');
  if (wildBox && activeWild?.types) {
    wildBox.style.background = getTypeGradient(activeWild.types);
  }
  updateBattleHeldIcons();
}

const HELD_ITEM_ICONS = {
  sitrus: '🍊',
  oran: '🫐',
  lum: '🌈',
  chesto: '🌰',
  rawst: '🍓'
};

function updateBattleHeldIcons() {
  const playerIcon = document.getElementById('player-held-icon');
  const wildIcon = document.getElementById('wild-held-icon');
  if (playerIcon) {
    const itemId = activePlayerMon?.heldItem;
    if (itemId && HELD_ITEM_ICONS[itemId]) {
      playerIcon.innerText = HELD_ITEM_ICONS[itemId];
      playerIcon.style.display = '';
    } else {
      playerIcon.innerText = '';
      playerIcon.style.display = 'none';
    }
  }
  if (wildIcon) {
    const itemId = activeWild?.heldItem;
    if (itemId && HELD_ITEM_ICONS[itemId]) {
      wildIcon.innerText = HELD_ITEM_ICONS[itemId];
      wildIcon.style.display = '';
    } else {
      wildIcon.innerText = '';
      wildIcon.style.display = 'none';
    }
  }
}

function setTypeBg(id, types) {
  const el = document.getElementById(id);
  if (el && types) {
    if (el.tagName === 'IMG') {
      el.style.background = getTypeGradient(types);
    } else {
      el.style.background = getTypeGradient(types);
    }
  }
}

// --- NEW PROFILE UX LOGIC ---
function initProfileUXEvents() {
  document.getElementById('btn-prev-mon').addEventListener('click', () => {
    if (currentPokemonIndex !== null && myTeam.length > 0) {
      currentPokemonIndex = (currentPokemonIndex - 1 + myTeam.length) % myTeam.length;
      openPokemonProfile(currentPokemonIndex);
    }
  });
  document.getElementById('btn-next-mon').addEventListener('click', () => {
    if (currentPokemonIndex !== null && myTeam.length > 0) {
      currentPokemonIndex = (currentPokemonIndex + 1) % myTeam.length;
      openPokemonProfile(currentPokemonIndex);
    }
  });


  document.querySelectorAll('.reborn-ev-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (currentPokemonIndex === null) return;
      const mon = myTeam[currentPokemonIndex];
      const stat = e.target.getAttribute('data-stat');
      const valStr = e.target.getAttribute('data-val');

      let totalEVs = Object.values(mon.evs).reduce((a, b) => a + b, 0);
      let maxTotal = (mon.candiesEaten * 4) + (mon.vitaminsEaten * 10);

      let currentEV = mon.evs[stat];
      let toAdd = 0;

      if (valStr === 'max') {
        toAdd = Math.min(126 - currentEV, maxTotal - totalEVs);
      } else {
        toAdd = parseInt(valStr);
        if (currentEV + toAdd > 126) toAdd = 126 - currentEV;
        if (totalEVs + toAdd > maxTotal) toAdd = maxTotal - totalEVs;
      }

      if (toAdd > 0) {
        mon.evs[stat] += toAdd;
        refreshProfileUI();
      } else {
        showToast('Нет свободных EV! Дайте покемону Конфеты (+4 EV) или Витамины (+10 EV).', true);
      }
    });
  });
}

// ================================================================
// CLOUD SYNC & TELEGRAM AUTH
// ================================================================

function initTelegram() {
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
  }
}

function showLoginScreen(message, isError) {
  let overlay = document.getElementById('login-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--tma-bg);z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 0.5s;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="text-align:center;max-width:320px;padding:24px;">
      <div style="font-size:4rem;margin-bottom:16px;">${isError ? '🔒' : '🐾'}</div>
      <h2 style="margin:0 0 8px;">PokeMatrix</h2>
      <p style="color:var(--tma-text-muted);margin:0 0 20px;font-size:0.9rem;">${message}</p>
      ${isError ? '<p style="color:var(--tma-text-muted);font-size:0.8rem;">Откройте игру через Telegram бота</p>' : '<div class="login-spinner" style="width:32px;height:32px;border:3px solid var(--tma-border);border-top-color:var(--tma-primary);border-radius:50%;margin:0 auto;animation:spin 0.8s linear infinite;"></div>'}
    </div>
  `;
  overlay.style.display = 'flex';
}

function hideLoginScreen() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }
}

async function showRegistrationScreen(tgData) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'register-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--tma-bg);z-index:1000;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow-y:auto;padding:20px;';
    overlay.innerHTML = `
      <div style="text-align:center;max-width:360px;width:100%;">
        <div style="font-size:4rem;margin-bottom:8px;">👋</div>
        <h2 style="margin:0 0 4px;">Добро пожаловать!</h2>
        <p style="color:var(--tma-text-muted);margin:0 0 20px;font-size:0.85rem;">Давай создадим твой профиль тренера</p>

        <div style="text-align:left;margin-bottom:16px;">
          <label style="font-size:0.8rem;color:var(--tma-text-muted);">Прозвище тренера</label>
          <input id="reg-nickname" type="text" value="${tgData.first_name || tgData.username || ''}" maxlength="20" style="width:100%;padding:10px;margin:4px 0 12px;border:1px solid var(--tma-border);border-radius:8px;background:var(--tma-card-bg);color:var(--tma-text);font-size:1rem;">

          <label style="font-size:0.8rem;color:var(--tma-text-muted);">Аватар</label>
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0 8px;">
            <div id="reg-avatar-preview" style="width:56px;height:56px;border-radius:50%;background:var(--tma-card-bg);display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid var(--tma-primary);flex-shrink:0;">👤</div>
            <input type="file" id="reg-avatar-file" accept="image/*" style="display:none;">
            <button class="tma-btn" id="reg-avatar-camera" style="padding:8px 12px;font-size:0.8rem;background:var(--tma-card-bg);">📷 Фото</button>
          </div>
          <div id="reg-avatars" style="display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px;">
            ${['👤','🧑','👨‍🔬','🎩','🧢','🎓','👑','🤠','🦸','🧙','😎','🤖','👻','🐱','🐶'].map(a => `<span class="reg-avatar-opt" data-av="${a}" style="font-size:1.8rem;cursor:pointer;padding:4px;border-radius:8px;border:2px solid transparent;">${a}</span>`).join('')}
          </div>

        </div>

        <button class="tma-btn" id="btn-register" style="width:100%;padding:12px;background:#34c759;font-size:1rem;">🎮 Начать приключение!</button>
        <p id="reg-error" style="color:#ff3b30;font-size:0.8rem;margin-top:8px;display:none;"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    let selectedAvatar = '👤';
    let customAvatarData = null;

    // Camera/gallery upload
    document.getElementById('reg-avatar-camera').addEventListener('click', () => {
      document.getElementById('reg-avatar-file').click();
    });
    document.getElementById('reg-avatar-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        customAvatarData = ev.target.result;
        document.getElementById('reg-avatar-preview').innerHTML = `<img src="${customAvatarData}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        selectedAvatar = '__custom__';
        overlay.querySelectorAll('.reg-avatar-opt').forEach(el => el.style.borderColor = 'transparent');
      };
      reader.readAsDataURL(file);
    });

    overlay.querySelectorAll('.reg-avatar-opt').forEach(el => {
      el.addEventListener('click', () => {
        overlay.querySelectorAll('.reg-avatar-opt').forEach(e => e.style.borderColor = 'transparent');
        el.style.borderColor = 'var(--tma-primary)';
        selectedAvatar = el.getAttribute('data-av');
      });
    });

    document.getElementById('btn-register').addEventListener('click', async () => {
      const nickname = document.getElementById('reg-nickname').value.trim();
      if (!nickname) { document.getElementById('reg-error').style.display = 'block'; document.getElementById('reg-error').textContent = 'Введи прозвище!'; return; }

      try {
        // Upload custom avatar first if selected
        let finalAvatar = selectedAvatar;
        if (customAvatarData) {
          const upRes = await fetch('/api/auth/avatar', {
            method: 'POST',
            headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: customAvatarData })
          });
          if (upRes.ok) {
            const upData = await upRes.json();
            finalAvatar = upData.avatarUrl;
          }
        }

        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname, avatar: finalAvatar })
        });
        trainerNickname = nickname;
        localStorage.setItem(lsKey('avatar'), selectedAvatar);
        localStorage.setItem(lsKey('nickname_'), nickname);
        tgUser.registered = 1;
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.5s';
        setTimeout(() => { overlay.remove(); resolve(true); }, 500);
      } catch(e) { document.getElementById('reg-error').style.display = 'block'; document.getElementById('reg-error').textContent = 'Ошибка сервера'; }
    });
  });
}

async function authTelegram() {
  initTelegram();
  showLoginScreen('Авторизация через Telegram...', false);

  // Dev mode: allow localhost testing without Telegram
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const devMode = new URLSearchParams(window.location.search).has('dev');

  if (!window.Telegram || !window.Telegram.WebApp || !window.Telegram.WebApp.initData) {
    if (isLocalhost || devMode) {
      console.log('🔧 Dev mode: bypassing Telegram auth');
    } else {
      showLoginScreen('Игра доступна только через Telegram', true);
      return;
    }
  }

  try {
    const initData = (isLocalhost || devMode) ? 'test' : window.Telegram.WebApp.initData;
    const res = await fetch(`${API_BASE}/auth/tg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: initData })
    });
    if (!res.ok) {
      showLoginScreen('Ошибка авторизации. Попробуйте перезапустить бота.', true);
      return;
    }
    const data = await res.json();
    tgToken = data.token;
    tgUser = data.user;
    localStorage.setItem('league17_trainer_id', String(tgUser.id));

    hideLoginScreen();

    // Check if registration needed — wait for it
    if (!data.user.registered) {
      await showRegistrationScreen(data.user);
      // Reload user data after registration
      tgUser.registered = 1;
    }
  } catch (e) {
    console.warn('Auth failed (offline?)', e);
    showLoginScreen('Нет соединения с сервером. Проверьте интернет.', true);
  }
}

export function getCloudAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(tgToken ? { 'Authorization': `Bearer ${tgToken}` } : {})
  };
}

function getLeaderboardData() {
  const badgesCount = badges ? badges.length : 0;
  const teamLevelSum = myTeam.reduce((sum, mon) => sum + (mon.baseLevel || 1), 0);
  const pokemonCount = pokedexCaught.size;
  const legendaryCount = myTeam.reduce((c, m) => c + (m.apiData?.name && LEGENDARY_SET.has(m.apiData.name) ? 1 : 0), 0);
  return { badgesCount, teamLevelSum, money, pokemonCount, legendaryCount };
}

function cloudSave() {
  if (!tgToken) return;
  if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
  cloudSaveTimer = setTimeout(() => doCloudSave(), 2000);
}

async function doCloudSave(attempt = 0) {
  validateGameState();
  const saveData = getFullSaveData();
  const lb = getLeaderboardData();

  try {
    const res = await fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: getCloudAuthHeaders(),
      body: JSON.stringify({ saveData, ...lb, saveVersion })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    lastCloudSync = Date.now();
    saveRetryCount = 0;
    localStorage.setItem(lsKey('save_sync'), String(lastCloudSync));
    const btnSync = document.getElementById('btn-cloud-sync');
    if (btnSync) { btnSync.textContent = '☁️✓'; setTimeout(() => { btnSync.textContent = '☁️ Авто'; }, 1500); }
    return result;
  } catch (e) {
    console.warn(`Cloud save failed (attempt ${attempt + 1}/${MAX_RETRIES})`, e.message);
    if (attempt < MAX_RETRIES - 1) {
      saveRetryCount = attempt + 1;
      const delay = RETRY_DELAYS[attempt];
      setTimeout(() => doCloudSave(attempt + 1), delay);
    } else {
      saveRetryCount = MAX_RETRIES;
      const btnSync = document.getElementById('btn-cloud-sync');
      if (btnSync) { btnSync.textContent = '☁️✗'; setTimeout(() => { btnSync.textContent = '☁️ Авто'; }, 3000); }
    }
  }
}

async function cloudLoad() {
  if (!tgToken) return null;
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

function applyCloudSave(data) {
  if (!data || !data.myTeam) return;
  const cloudV = data._v || 0;
  if (cloudV <= saveVersion) return; // Server is older or same — skip

  // Server has newer data — use it
  console.log(`[sync] Server v${cloudV} > local v${saveVersion} — applying server data`);
  currentLocationId = data.currentLocationId || currentLocationId;
  currentRegion = data.currentRegion || currentRegion;
  if (currentRegion === 'tevas_islands') currentRegion = 'southern_archipelago';
  if (!REGIONS[currentRegion]) currentRegion = 'kanto';
  if (!getLocation(currentLocationId)) {
    currentLocationId = 'pallet_town';
    currentRegion = 'kanto';
  }
  if (data.inventory) inventory = { ...data.inventory };
  money = data.money ?? money;
  badges = data.badges || badges;
  trainerNickname = data.trainerNickname || trainerNickname;
  myTeam = data.myTeam || myTeam;
  myTeam.forEach(m => {
    if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (!m.learnableMoves) m.learnableMoves = [];
    if (!m.berries) m.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
  });
  currentPokemonIndex = data.currentPokemonIndex ?? currentPokemonIndex;
  pokedexSeen = new Set(data.pokedexSeen || []);
  pokedexCaught = new Set(data.pokedexCaught || []);
  pcBoxes = data.pcBoxes || pcBoxes;
  pcBoxes.forEach(box => box.forEach(m => {
    if (!m.statStages) m.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }));
  daycareMons = data.daycareMons || daycareMons;
  daycareEgg = data.daycareEgg || daycareEgg;
  lastLocation = data.lastLocation || lastLocation;
  expShareActive = data.expShareActive || expShareActive;
  breedingPairs = data.breedingPairs || breedingPairs;
  eggs = data.eggs || eggs;
  quests = data.quests || quests;
  questProgress = data.questProgress || questProgress;
  completedQuests = data.completedQuests || completedQuests;
  npcQuestProgress = data.npcQuestProgress || npcQuestProgress;
  completedNPCQuests = data.completedNPCQuests || completedNPCQuests;
  tutorialStep = data.tutorialStep || tutorialStep;
  visitedLocations = new Set(data.visitedLocations || []);
  itemsUsedInBattle = data.itemsUsedInBattle || itemsUsedInBattle;
  itemHistory = data.itemHistory || itemHistory;
  saveVersion = cloudV;
  validateGameState();

  // Save reconciled state locally
  saveGame();
  console.log('[sync] Applied server save v' + cloudV);
}

async function openLeaderboard() {
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
    data.entries.forEach((entry, i) => {
      const name = entry.first_name || entry.username || 'Trainer';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
      const pkmn = entry.pokemon_count || 0;
      const leg = entry.legendary_count || 0;
      html += `
        <div class="leaderboard-entry">
          <span class="leaderboard-rank">${medal}</span>
          <span class="leaderboard-name">${escHtml(name)}</span>
          <span class="leaderboard-badges">🏅${entry.badges_count}</span>
          <span class="leaderboard-stat">🐾${pkmn}</span>
          <span class="leaderboard-stat">✨${leg}</span>
          <span class="leaderboard-money">¥${entry.money || 0}</span>
        </div>`;
    });
    list.innerHTML = html;
  } catch (e) {
    list.innerHTML = '<div class="leaderboard-error">Не удалось загрузить таблицу лидеров</div>';
  }
}

function initCloudEvents() {
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  if (btnLeaderboard) {
    btnLeaderboard.addEventListener('click', openLeaderboard);
  }
  const btnSync = document.getElementById('btn-cloud-sync');
  if (btnSync) {
    btnSync.textContent = tgToken ? '☁️ Авто' : '☁️ —';
    btnSync.title = tgToken ? 'Авто-синхронизация активна' : 'Оффлайн';
    btnSync.onclick = null; // auto-sync, no manual click needed
  }
  const closeLeaderboard = document.getElementById('btn-close-leaderboard');
  if (closeLeaderboard) {
    closeLeaderboard.addEventListener('click', () => {
      document.getElementById('leaderboard-modal').style.display = 'none';
    });
  }
}

// ================================================================
// ================================================================
function updateTimeOfDay() {
  const hour = new Date().getHours();
  isDaytime = hour >= 6 && hour < 18;
  const card = document.querySelector('.location-card');
  if (card) {
    if (isDaytime) {
      card.classList.remove('night');
    } else {
      card.classList.add('night');
    }
  }
}

// ================================================================
// ================================================================
// ================================================================
// FEATURE: SELL ITEMS (Shop Tab)
// ================================================================

// ================================================================
// ================================================================
// ================================================================
// ================================================================
// TRAINER CARD
// ================================================================
export function renderTrainerCard() {
  const nameEl = document.getElementById('trainer-name');
  const moneyEl = document.getElementById('trainer-money');
  const badgesEl = document.getElementById('trainer-badges');
  const caughtEl = document.getElementById('trainer-caught');

  if (trainerNickname) {
    nameEl.textContent = trainerNickname;
  } else if (tgUser) {
    nameEl.textContent = tgUser.first_name || tgUser.username || `ID:${tgUser.id}`;
  } else {
    nameEl.textContent = '---';
  }
  nameEl.style.cursor = 'pointer';
  nameEl.title = 'Нажмите чтобы изменить прозвище';
  nameEl.onclick = () => {
    showTextInputModal('Прозвище тренера', trainerNickname || tgUser?.first_name || '', (newName) => {
      trainerNickname = newName;
      renderTrainerCard();
      autoSave();
    });
  };

  moneyEl.textContent = `¥${money}`;
  badgesEl.textContent = badges.length;
  caughtEl.textContent = `${pokedexCaught.size}/${pokedexTotal || 151}`;

  loadLocationTrainers();
  renderOnlinePlayers();
}

// ================================================================
// TRAINER LOCATION & PROFILES
// ================================================================
async function updatePlayerLocation() {
  const headers = getCloudAuthHeaders();
  if (!headers.Authorization) return;
  try {
    await fetch(`${API_BASE}/profile/location`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: currentLocationId, region: currentRegion })
    });
  } catch (e) {
    // silent
  }
}

async function loadLocationTrainers() {
  const listEl = document.getElementById('trainer-location-list');
  if (!listEl) return;
  try {
    const res = await fetch(`${API_BASE}/profile/trainers?locationId=${encodeURIComponent(currentLocationId)}`);
    const data = await res.json();
    listEl.innerHTML = '';
    if (!data.trainers || data.trainers.length === 0) {
      listEl.textContent = '0';
      return;
    }
    listEl.textContent = data.trainers.length + ' ';
    data.trainers.forEach((t, i) => {
      const span = document.createElement('span');
      span.className = 'chat-trainer-chip';
      span.textContent = t.first_name || t.username || `T${t.id}`;
      span.addEventListener('click', () => openTrainerProfile(t.id));
      listEl.appendChild(span);
    });
  } catch (e) { listEl.textContent = '---'; }
}

function renderOnlinePlayers() {
  const listEl = document.getElementById('chat-online-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (onlinePlayersList.length === 0) {
    listEl.textContent = '0';
    return;
  }
  listEl.textContent = onlinePlayersList.length + ' ';
  onlinePlayersList.forEach((p, i) => {
    const span = document.createElement('span');
    span.className = 'chat-trainer-chip';
    span.textContent = p.username || 'Тренер';
    span.addEventListener('click', () => openTrainerProfile(p.userId));
    listEl.appendChild(span);
  });
}

function updateTrainerLocationList(data) {
  const listEl = document.getElementById('trainer-location-list');
  if (!listEl || !data) return;
  if (data.userId === (tgUser?.id || 0)) return;
  const existing = listEl.querySelector(`[data-trainer-id="${data.userId}"]`);
  if (existing) return;
  if (listEl.textContent === 'никого' || listEl.textContent === '---') listEl.textContent = '';
  const span = document.createElement('span');
  span.className = 'chat-trainer-chip';
  span.setAttribute('data-trainer-id', data.userId);
  span.textContent = data.firstName || data.username || `T${data.userId}`;
  span.addEventListener('click', () => openTrainerProfile(data.userId));
  listEl.appendChild(span);
}

let lastProfileOpen = 0;
let lastSocketAction = 0;
const SOCKET_COOLDOWN = 3000; // 3s between trade/pvp requests

export async function openTrainerProfile(userId) {
  // Rate limit: 500ms between profile views
  const now = Date.now();
  if (now - lastProfileOpen < 500) return;
  lastProfileOpen = now;

  const modal = document.getElementById('trainer-profile-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  document.getElementById('modal-trainer-name').innerText = 'Загрузка...';
  document.getElementById('modal-trainer-money').innerText = '$0';
  document.getElementById('modal-trainer-badges').innerText = '0';
  document.getElementById('modal-trainer-team').innerHTML = '<div class="trainer-team-empty">Загрузка...</div>';

  try {
    const res = await fetch(`${API_BASE}/profile/${userId}`);
    const data = await res.json();
    if (!data.profile) {
      document.getElementById('modal-trainer-name').innerText = 'Тренер не найден';
      return;
    }

    const p = data.profile;
    const isOnline = onlinePlayersList.some(op => op.userId === userId);
    const onlineDot = isOnline
      ? '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#34c759;margin-right:6px;box-shadow:0 0 6px #34c759;vertical-align:middle;"></span>'
      : '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#555;margin-right:6px;vertical-align:middle;"></span>';
    const statusText = isOnline ? ' (В сети)' : ' (Не в сети)';
    document.getElementById('modal-trainer-name').innerHTML = onlineDot + escHtml(p.first_name || p.username || `Trainer#${p.id}`) + `<span style="font-size:0.7rem;color:${isOnline ? '#34c759' : '#888'};">${statusText}</span>`;
    document.getElementById('modal-trainer-money').innerText = `¥${p.money}`;
    document.getElementById('modal-trainer-badges').innerText = p.badges;

    // Show Trade/Battle buttons if trainer is online
    const actionsDiv = document.getElementById('modal-trainer-actions');
    const onlinePlayer = onlinePlayersList.find(op => op.userId === userId);
    if (actionsDiv && onlinePlayer && onlinePlayer.id !== socket?.id) {
      actionsDiv.style.display = 'flex';
      const tradeBtn = document.getElementById('btn-trainer-trade');
      const battleBtn = document.getElementById('btn-trainer-battle');
      tradeBtn.onclick = () => {
        const now = Date.now();
        if (now - lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто! Подождите...', true); return; }
        lastSocketAction = now;
        modal.style.display = 'none';
        initTradeSocket();
        if (!socket || !socket.connected) {
          showToast('Подключение к серверу...', true);
          return;
        }
        socket.emit('trade_request', onlinePlayer.id);
        showToast('Запрос на обмен отправлен!', false);
      };
      battleBtn.onclick = () => {
        const now = Date.now();
        if (now - lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто! Подождите...', true); return; }
        lastSocketAction = now;
        if (!myTeam.some(m => m.currentHp > 0)) { showToast('Нужен живой покемон!', true); return; }
        modal.style.display = 'none';
        initTradeSocket();
        socket.emit('pvp_challenge', onlinePlayer.id);
        showToast('Вызов на бой отправлен!', false);
      };
    } else if (actionsDiv) {
      actionsDiv.style.display = 'none';
    }

    const teamEl = document.getElementById('modal-trainer-team');
    teamEl.innerHTML = '';
    if (!p.team || p.team.length === 0) {
      teamEl.innerHTML = '<div class="trainer-team-empty">Нет покемонов</div>';
      return;
    }
    p.team.forEach(mon => {
      const div = document.createElement('div');
      div.className = 'trainer-team-mon';
      div.innerHTML = `
        <div class="trainer-team-mon-img-box">
          <img class="trainer-team-mon-img" src="${mon.sprite || ''}" alt="">
        </div>
        <div class="trainer-team-mon-info">
          <div class="trainer-team-mon-name">${mon.nickname || mon.name}</div>
          <div class="trainer-team-mon-lvl">Lv${mon.level}</div>
        </div>`;
      teamEl.appendChild(div);
    });
  } catch (e) {
    document.getElementById('modal-trainer-name').innerText = 'Ошибка загрузки';
  }
}

// --- P2P TRADING VIA SOCKET.IO ---
export let socket = null;
let onlinePlayersList = [];
let activeTradeId = null;
let myTradeOffer = null;
let partnerTradeOffer = null;
let iAmP1 = false;

export function showToast(msg, isError) {
  let toast = document.getElementById('trade-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'trade-toast';
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:10px 24px;border-radius:8px;font-weight:600;font-size:0.9rem;z-index:300;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.style.background = isError ? '#ff3b30' : '#34c759';
  toast.style.color = '#fff';
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// --- Reusable Modal Helpers ---

export function showConfirmModal(title, message, onConfirm, onCancel) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="confirm-modal-card">
      <h3>${title}</h3>
      <p>${message}</p>
      <div class="confirm-modal-buttons">
        <button class="confirm-btn confirm-btn-yes" id="confirm-yes">Да</button>
        <button class="confirm-btn confirm-btn-no" id="confirm-no">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    document.getElementById('confirm-yes').removeEventListener('click', onYes);
    document.getElementById('confirm-no').removeEventListener('click', onNo);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onYes = () => { cleanup(); if (onConfirm) onConfirm(); };
  const onNo = () => { cleanup(); if (onCancel) onCancel(); };
  const onOverlay = (e) => { if (e.target === modal) onNo(); };

  document.getElementById('confirm-yes').addEventListener('click', onYes);
  document.getElementById('confirm-no').addEventListener('click', onNo);
  modal.addEventListener('click', onOverlay);
}

export function showSelectionModal(title, items, callback, allowCancel) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  const itemsHTML = items.map((item, i) => `
    <button class="selection-item-btn" data-index="${i}">
      ${item.label}
      ${item.subtitle ? `<span class="item-subtitle">${item.subtitle}</span>` : ''}
    </button>
  `).join('');
  modal.innerHTML = `
    <div class="selection-modal-card">
      <h3>${title}</h3>
      <div class="selection-items">${itemsHTML}</div>
      ${allowCancel ? '<button class="confirm-btn confirm-btn-no" id="selection-cancel" style="width:100%;margin-top:8px;">Отмена</button>' : ''}
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    modal.querySelectorAll('.selection-item-btn').forEach(btn => {
      btn.removeEventListener('click', onItemClick);
    });
    if (allowCancel) {
      document.getElementById('selection-cancel').removeEventListener('click', onCancelClick);
    }
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };

  const onItemClick = (e) => {
    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
    cleanup();
    if (callback) callback(idx);
  };
  const onCancelClick = () => { cleanup(); };
  const onOverlay = (e) => { if (e.target === modal) { cleanup(); } };

  modal.querySelectorAll('.selection-item-btn').forEach(btn => {
    btn.addEventListener('click', onItemClick);
  });
  if (allowCancel) {
    document.getElementById('selection-cancel').addEventListener('click', onCancelClick);
  }
  modal.addEventListener('click', onOverlay);
}

export function showTextInputModal(title, defaultText, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="selection-modal-card">
      <h3>${title}</h3>
      <input type="text" class="text-input-modal" id="text-input-field" value="${defaultText || ''}" maxlength="20" autocomplete="off">
      <div class="confirm-modal-buttons" style="margin-top:12px;">
        <button class="confirm-btn confirm-btn-yes" id="text-input-ok">OK</button>
        <button class="confirm-btn confirm-btn-no" id="text-input-cancel">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = document.getElementById('text-input-field');
  input.focus();
  input.select();

  const cleanup = () => {
    document.getElementById('text-input-ok').removeEventListener('click', onOk);
    document.getElementById('text-input-cancel').removeEventListener('click', onCancel);
    modal.removeEventListener('click', onOverlay);
    input.removeEventListener('keydown', onKey);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const submit = () => {
    const val = input.value.trim();
    cleanup();
    if (callback && val) callback(val);
  };
  const onOk = () => submit();
  const onCancel = () => { cleanup(); };
  const onOverlay = (e) => { if (e.target === modal) { cleanup(); } };
  const onKey = (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') cleanup(); };

  document.getElementById('text-input-ok').addEventListener('click', onOk);
  document.getElementById('text-input-cancel').addEventListener('click', onCancel);
  modal.addEventListener('click', onOverlay);
  input.addEventListener('keydown', onKey);
}

export function showItemInfoModal(item, qty) {
  const priceInfo = item.price > 0 ? `\n💰 Цена: ${item.price.toLocaleString()} кр.` : '';
  const sellInfo = item.sellPrice > 0 ? `\n🏷️ Продажа: ${item.sellPrice.toLocaleString()} кр.` : '';
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="item-info-card">
      <h3>📦 ${item.nameRu}</h3>
      <p>📝 ${item.desc}</p>
      <div class="item-info-details">📊 Кол-во: ${qty}${priceInfo}${sellInfo}</div>
      <button class="tma-btn" id="btn-item-info-close" style="width:100%;margin-top:12px;">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    document.getElementById('btn-item-info-close').removeEventListener('click', cleanup);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onOverlay = (e) => { if (e.target === modal) cleanup(); };

  document.getElementById('btn-item-info-close').addEventListener('click', cleanup);
  modal.addEventListener('click', onOverlay);
}

// --- PvP Battle ---
let pvpBattleId = null;
let pvpOpponentName = '';
let pvpMyMon = null;
let pvpOppMon = null;
let pvpMyTurn = false;

function openPvPArena(battleId, opponent, myFirst) {
  pvpBattleId = battleId;
  pvpOpponentName = opponent;
  pvpMyTurn = myFirst;
  const alive = myTeam.find(m => m.currentHp > 0);
  if (!alive) { showToast('Нет живых покемонов!', true); return; }
  pvpMyMon = alive;

  let modal = document.getElementById('pvp-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pvp-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="reborn-battle-arena" style="max-width:440px;width:95%;">
        <div style="text-align:center;padding:8px;"><span id="pvp-opponent-name" style="font-weight:bold;"></span></div>
        <div style="text-align:center;font-size:0.9rem;" id="pvp-turn-indicator"></div>
        <div class="reborn-pokemon-row">
          <div class="reborn-side-panel">
            <div class="reborn-poke-header"><span id="pvp-my-name"></span> <span id="pvp-my-lvl"></span></div>
            <div class="reborn-hp-bar"><div class="reborn-hp-fill" id="pvp-my-hp-fill"></div></div>
            <div class="reborn-hp-text" id="pvp-my-hp"></div>
            <div class="reborn-sprite-box"><img class="reborn-sprite" id="pvp-my-sprite" src=""></div>
          </div>
          <div class="reborn-side-panel">
            <div class="reborn-poke-header"><span id="pvp-opp-name"></span> <span id="pvp-opp-lvl"></span></div>
            <div class="reborn-hp-bar"><div class="reborn-hp-fill" id="pvp-opp-hp-fill"></div></div>
            <div class="reborn-hp-text" id="pvp-opp-hp"></div>
            <div class="reborn-sprite-box"><img class="reborn-sprite" id="pvp-opp-sprite" src=""></div>
          </div>
        </div>
        <div class="reborn-center-panel">
          <div class="reborn-moves" id="pvp-moves"></div>
          <div class="reborn-log-container"><div class="reborn-battle-log" id="pvp-log"></div></div>
        </div>
        <button class="tma-btn" id="btn-pvp-leave" style="width:100%;margin-top:8px;">Сдаться</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-pvp-leave').addEventListener('click', () => {
      modal.style.display = 'none';
      socket.emit('pvp_end', { battleId: pvpBattleId, action: { type: 'surrender' } });
      pvpBattleId = null;
      autoSave();
      updateMoneyDisplay();
    });
  }

  document.getElementById('pvp-opponent-name').textContent = `⚔ Бой с ${opponent}`;
  document.getElementById('pvp-opp-name').textContent = opponent;
  document.getElementById('pvp-opp-lvl').textContent = '';
  document.getElementById('pvp-opp-hp').textContent = '?/?';
  document.getElementById('pvp-opp-hp-fill').style.width = '100%';
  document.getElementById('pvp-opp-sprite').src = '';
  document.getElementById('pvp-log').innerHTML = '';
  updatePvPUI();
  modal.style.display = 'flex';

  // Send my pokemon data to opponent
  const mon = pvpMyMon;
  socket.emit('pvp_action', { battleId, action: {
    type: 'mon_data',
    name: mon.nickname || mon.apiData?.name,
    lvl: mon.baseLevel + (mon.candiesEaten || 0),
    hp: mon.currentHp,
    maxHp: mon.maxHp,
    sprite: mon.apiData?.sprites?.other?.['official-artwork']?.front_default || mon.apiData?.sprites?.front_default || ''
  }});
}

function updatePvPUI() {
  if (!pvpMyMon) return;
  const mon = pvpMyMon;
  const curLvl = mon.baseLevel + (mon.candiesEaten || 0);
  document.getElementById('pvp-my-name').textContent = mon.nickname || mon.apiData?.name;
  document.getElementById('pvp-my-lvl').textContent = `Lv${curLvl}`;
  document.getElementById('pvp-my-hp').textContent = `${mon.currentHp}/${mon.maxHp}`;
  document.getElementById('pvp-my-hp-fill').style.width = `${Math.max(0, (mon.currentHp / mon.maxHp) * 100)}%`;
  const sprite = mon.apiData?.sprites?.other?.['official-artwork']?.front_default || mon.apiData?.sprites?.front_default || '';
  document.getElementById('pvp-my-sprite').src = sprite;

  document.getElementById('pvp-turn-indicator').textContent = pvpMyTurn ? '🎯 Ваш ход!' : '⏳ Ожидание хода соперника...';
  document.getElementById('pvp-turn-indicator').style.color = pvpMyTurn ? '#34c759' : '#ff9500';

  const movesDiv = document.getElementById('pvp-moves');
  movesDiv.innerHTML = '';
  const moves = mon.apiData?.moves?.filter(m => m) || [];
  moves.forEach((m, i) => {
    const btn = document.createElement('span');
    btn.className = 'reborn-move-link';
    btn.textContent = m.move.name;
    btn.style.opacity = pvpMyTurn ? '1' : '0.5';
    btn.onclick = () => {
      if (!pvpMyTurn) { showToast('Сейчас ход соперника!', true); return; }
      doPvPAttack(i);
    };
    movesDiv.appendChild(btn);
  });
}

function doPvPAttack(moveIdx) {
  if (!pvpMyMon || !pvpBattleId) return;
  const move = pvpMyMon.apiData?.moves?.[moveIdx]?.move;
  const moveName = move?.name || 'Атака';
  const lvl = pvpMyMon.baseLevel + (pvpMyMon.candiesEaten || 0);
  const atk = (pvpMyMon.apiData?.stats?.[1]?.base_stat || 60);
  const power = move ? (move.power || 60) : 60;
  const rawDmg = Math.floor(((lvl * power * (atk / 100)) / 15) * (0.85 + Math.random() * 0.3));
  const crit = Math.random() < 0.0625;
  const dmg = crit ? Math.floor(rawDmg * 1.5) : rawDmg;

  const logEl = document.getElementById('pvp-log');
  logEl.innerHTML = `Вы: ${moveName}! ${crit ? '💥Крит! ' : ''}(-${dmg})\n${logEl.innerHTML}`;

  pvpMyTurn = false;
  socket.emit('pvp_action', { battleId: pvpBattleId, action: { type: 'attack', moveName, dmg, crit } });
  updatePvPUI();
}

function endPvP(won) {
  showToast(won ? '🏆 Победа в PvP! +500¥' : '💀 Поражение в PvP...', !won);
  if (won) { money += 500; updateMoneyDisplay(); }
  document.getElementById('pvp-modal').style.display = 'none';
  socket.emit('pvp_end', { battleId: pvpBattleId, action: { type: won ? 'win' : 'lose' } });
  pvpBattleId = null;
  autoSave();
}

function initTradeSocket() {
  if (socket) return;
  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : API_BASE.replace('/api', '');
  socket = io(serverUrl);

  socket.on('connect', () => {
    socket.emit('join_lobby', { username: tgUser?.first_name || tgUser?.username || 'Тренер', userId: tgUser?.id });
    initChatSocket();
  });

  socket.on('disconnect', () => {
    onlinePlayersList = [];
    renderOnlinePlayers();
  });

  // Real-time location updates for trainer list
  socket.on('location_update', (data) => {
    if (data.locationId === currentLocationId && data.userId !== (tgUser?.id || 0)) {
      updateTrainerLocationList(data);
    }
  });

  socket.on('online_players', (players) => {
    onlinePlayersList = players.filter(p => p.id !== socket.id);
    renderTradePlayerList();
    renderOnlinePlayers();
  });

  socket.on('trade_request_received', (data) => {
    showTradeRequestModal(data.fromUsername, data.fromId);
  });

  socket.on('trade_rejected', () => {
    showToast('Тренер отклонил предложение обмена', true);
  });

  socket.on('trade_started', (data) => {
    activeTradeId = data.tradeId;
    iAmP1 = data.tradeId.startsWith(socket.id);
    myTradeOffer = null;
    partnerTradeOffer = null;
    openTradeWindow(data.partnerUsername);
  });

  socket.on('trade_partner_offer', (offer) => {
    partnerTradeOffer = offer;
    renderTradeOffers();
  });

  socket.on('trade_confirm_status', (status) => {
    updateTradeConfirmUI(status);
  });

  socket.on('trade_execute', (receivedOffer) => {
    // Remove what I offered
    if (myTradeOffer) {
      if (myTradeOffer.type === 'pokemon') {
        const idx = myTeam.findIndex(m => m.uid === myTradeOffer.data.uid || m === myTradeOffer.data);
        if (idx !== -1) myTeam.splice(idx, 1);
      } else if (myTradeOffer.type === 'item') {
        removeItem(myTradeOffer.data.id, myTradeOffer.data.qty || 1);
      }
    }

    // Receive what partner offered
    if (receivedOffer) {
      if (receivedOffer.type === 'pokemon') {
        receivedOffer.data.previousOwner = receivedOffer.data.originalTrainer;
        receivedOffer.data.uid = generateUID();
        receivedOffer.data.originalTrainer = getTrainerId();
        receivedOffer.data.createdAt = Date.now();
        myTeam.push(receivedOffer.data);
      } else if (receivedOffer.type === 'item') {
        addItem(receivedOffer.data.id, receivedOffer.data.qty || 1);
        showToast(`Получено: ${receivedOffer.data.name} x${receivedOffer.data.qty || 1}!`, false);
      }
    }

    showToast('Обмен успешно завершён!', false);
    closeTradeWindow();
    autoSave();
    refreshProfileUI();
  });

  socket.on('trade_cancelled', (msg) => {
    showToast(msg || 'Обмен отменён', true);
    closeTradeWindow();
  });

  // PvP handlers
  socket.on('pvp_challenge_received', (data) => {
    showConfirmModal('⚔ Вызов на бой!', `Тренер ${data.fromName} вызывает вас на битву!`, () => {
      if (!myTeam.some(m => m.currentHp > 0)) {
        showToast('Нужен хотя бы один живой покемон!', true);
        socket.emit('pvp_decline', data.fromId);
        return;
      }
      socket.emit('pvp_accept', data.fromId);
    }, () => { socket.emit('pvp_decline', data.fromId); });
  });

  socket.on('pvp_declined', (data) => {
    showToast(`${data.fromName} отклонил вызов`, true);
  });

  socket.on('pvp_start', (data) => {
    openPvPArena(data.battleId, data.opponent, data.first || false);
  });

  socket.on('pvp_opponent_action', (action) => {
    if (!pvpBattleId) return;
    if (action.type === 'mon_data') {
      // Opponent sent their pokemon data
      document.getElementById('pvp-opp-name').textContent = action.name;
      document.getElementById('pvp-opp-lvl').textContent = `Lv${action.lvl}`;
      document.getElementById('pvp-opp-hp').textContent = `${action.hp}/${action.maxHp}`;
      document.getElementById('pvp-opp-hp-fill').style.width = `${(action.hp / action.maxHp) * 100}%`;
      if (action.sprite) document.getElementById('pvp-opp-sprite').src = action.sprite;
      // Store opponent HP for tracking
      if (!pvpOppMon) pvpOppMon = {};
      pvpOppMon.currentHp = action.hp;
      pvpOppMon.maxHp = action.maxHp;
    }
    if (action.type === 'attack') {
      if (pvpMyMon) {
        pvpMyMon.currentHp -= action.dmg;
        if (pvpMyMon.currentHp < 0) pvpMyMon.currentHp = 0;
        updatePvPUI();
      }
      const logEl = document.getElementById('pvp-log');
      logEl.innerHTML = `${pvpOpponentName}: ${action.moveName}! ${action.crit ? '💥Крит! ' : ''}(-${action.dmg})\n${logEl.innerHTML}`;
      pvpMyTurn = true;
      updatePvPUI();
      if (pvpMyMon && pvpMyMon.currentHp <= 0) endPvP(false);
    }
    if (action.type === 'surrender') {
      showToast('🏆 Соперник сдался! Победа!', false);
      money += 500; updateMoneyDisplay();
      document.getElementById('pvp-modal').style.display = 'none';
      pvpBattleId = null;
      autoSave();
    }
    if (action.type === 'win' || action.type === 'lose') {
      document.getElementById('pvp-modal').style.display = 'none';
      pvpBattleId = null;
      autoSave();
    }
  });
}

// --- Trade Request Modal (instead of confirm()) ---
function showTradeRequestModal(fromUsername, fromId) {
  let rm = document.getElementById('trade-request-modal');
  if (!rm) {
    rm = document.createElement('div');
    rm.id = 'trade-request-modal';
    rm.className = 'trade-request-overlay';
    rm.innerHTML = `
      <div class="trade-request-box">
        <h3>🤝 Предложение обмена</h3>
        <p>Тренер <strong id="trade-req-username"></strong> хочет обменяться с вами!</p>
        <div class="trade-request-buttons">
          <button class="trade-btn accept" id="btn-trade-accept">Принять</button>
          <button class="trade-btn reject" id="btn-trade-reject">Отклонить</button>
        </div>
      </div>
    `;
    document.body.appendChild(rm);
  }

  // Clean up previous listeners if modal was already visible
  if (rm._cleanup) rm._cleanup();

  document.getElementById('trade-req-username').textContent = fromUsername;
  rm.style.display = 'flex';

  const accept = () => {
    socket.emit('trade_accept', fromId);
    rm.style.display = 'none';
    cleanup();
  };
  const reject = () => {
    socket.emit('trade_reject', fromId);
    rm.style.display = 'none';
    cleanup();
  };
  const cleanup = () => {
    document.getElementById('btn-trade-accept').removeEventListener('click', accept);
    document.getElementById('btn-trade-reject').removeEventListener('click', reject);
    rm.removeEventListener('click', overlayClick);
    rm._cleanup = null;
  };
  const overlayClick = (e) => { if (e.target === rm) reject(); };

  rm._cleanup = cleanup;
  document.getElementById('btn-trade-accept').addEventListener('click', accept);
  document.getElementById('btn-trade-reject').addEventListener('click', reject);
  rm.addEventListener('click', overlayClick);
}

// --- Trade Center Modal (online players list) ---
function openTradeCenter() {
  initTradeSocket();
  let tc = document.getElementById('trade-center-modal');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'trade-center-modal';
    tc.className = 'modal-overlay';
    tc.style.display = 'none';
    tc.innerHTML = `
      <div class="trade-container">
        <h2 style="margin:0 0 4px 0;">🤝 Глобальный Обменник</h2>
        <p style="color:var(--tma-text-muted);font-size:0.85rem;margin:0 0 12px 0;">Выберите тренера в сети, чтобы предложить обмен</p>
        <div id="trade-players-list" class="trade-players-list"></div>
        <button class="trade-btn" id="btn-trade-center-close" style="width:100%;background:var(--tma-text-muted);">Закрыть</button>
      </div>
    `;
    document.body.appendChild(tc);
    document.getElementById('btn-trade-center-close').addEventListener('click', () => {
      tc.style.display = 'none';
    });
    tc.addEventListener('click', (e) => { if (e.target === tc) tc.style.display = 'none'; });
  }
  renderTradePlayerList();
  tc.style.display = 'flex';
}

function renderTradePlayerList() {
  const list = document.getElementById('trade-players-list');
  if (!list) return;
  list.innerHTML = '';

  if (onlinePlayersList.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:30px 0;">Нет тренеров в сети<br><span style="font-size:0.8rem;">Подождите или зайдите позже</span></div>';
    return;
  }

  onlinePlayersList.forEach(p => {
    const row = document.createElement('div');
    row.className = 'trade-player-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'trade-player-name';
    nameSpan.textContent = p.username || 'Тренер';

    const btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'display:flex;gap:4px;';

    const tradeBtn = document.createElement('button');
    tradeBtn.className = 'trade-btn';
    tradeBtn.textContent = 'Трейд';
    tradeBtn.onclick = () => {
      const now = Date.now();
      if (now - lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто!', true); return; }
      lastSocketAction = now;
      socket.emit('trade_request', p.id);
      tradeBtn.textContent = '✓';
      tradeBtn.disabled = true;
      tradeBtn.style.opacity = '0.5';
      setTimeout(() => { tradeBtn.textContent = 'Трейд'; tradeBtn.disabled = false; tradeBtn.style.opacity = '1'; }, 5000);
    };

    const battleBtn = document.createElement('button');
    battleBtn.className = 'trade-btn';
    battleBtn.style.background = '#ff3b30';
    battleBtn.textContent = '⚔';
    battleBtn.onclick = () => {
      const now = Date.now();
      if (now - lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто!', true); return; }
      lastSocketAction = now;
      if (myTeam.length === 0 || !myTeam.some(m => m.currentHp > 0)) {
        showToast('Нужен хотя бы один живой покемон!', true);
        return;
      }
      socket.emit('pvp_challenge', p.id);
      battleBtn.textContent = '✓';
      battleBtn.disabled = true;
      battleBtn.style.opacity = '0.5';
      setTimeout(() => { battleBtn.textContent = '⚔'; battleBtn.disabled = false; battleBtn.style.opacity = '1'; }, 5000);
    };

    btnWrap.appendChild(tradeBtn);
    btnWrap.appendChild(battleBtn);
    row.appendChild(nameSpan);
    row.appendChild(btnWrap);
    list.appendChild(row);
  });
}

// --- Trade Window Modal (pokemon selection + confirmation) ---
function openTradeWindow(partnerName) {
  let tw = document.getElementById('trade-window-modal');
  if (!tw) {
    tw = document.createElement('div');
    tw.id = 'trade-window-modal';
    tw.className = 'modal-overlay';
    tw.style.display = 'none';
    tw.innerHTML = `
      <div class="trade-window">
        <h2 style="margin:0 0 4px 0;">Обмен с <span id="trade-partner-name"></span></h2>
        <p style="color:var(--tma-text-muted);font-size:0.8rem;margin:0 0 12px 0;">Выберите покемона или предмет — можно дарить без возврата</p>

        <div class="trade-columns">
          <div class="trade-col">
            <h3>Вы предлагаете</h3>
            <div class="trade-offer-slot" id="trade-my-offer"><span style="color:var(--tma-text-muted);">Не выбрано</span></div>
            <button class="trade-btn cancel" id="btn-trade-clear-my" style="width:100%;padding:4px;font-size:0.7rem;margin-bottom:4px;">Очистить</button>
            <div id="trade-my-status" class="trade-status waiting">⏳ Ожидание</div>
          </div>
          <div class="trade-col">
            <h3>Партнёр предлагает</h3>
            <div class="trade-offer-slot" id="trade-partner-offer"><span style="color:var(--tma-text-muted);">Ожидание...</span></div>
            <div id="trade-partner-status" class="trade-status waiting">⏳ Ожидание</div>
          </div>
        </div>

        <div id="trade-pick-area">
          <div class="trade-section-title">🐾 Покемоны:</div>
          <div class="trade-pokemon-grid" id="trade-pick-grid"></div>
          <div class="trade-section-title" style="margin-top:10px;">🎒 Предметы:</div>
          <div class="trade-pokemon-grid" id="trade-item-grid" style="grid-template-columns: repeat(4, 1fr);"></div>
        </div>

        <div class="trade-actions" style="margin-top:12px;">
          <button class="trade-btn confirm" id="btn-trade-confirm">✅ Подтвердить обмен</button>
          <button class="trade-btn cancel" id="btn-trade-cancel">✕ Отменить</button>
        </div>
      </div>
    `;
    document.body.appendChild(tw);

    document.getElementById('btn-trade-cancel').addEventListener('click', () => {
      if (activeTradeId) socket.emit('trade_cancel', activeTradeId);
      closeTradeWindow();
    });

    document.getElementById('btn-trade-confirm').addEventListener('click', () => {
      // Allow one-way: can confirm if you offered something OR partner offered something
      if (!myTradeOffer && !partnerTradeOffer) { showToast('Выберите что-то для обмена или дождитесь предложения!', true); return; }
      socket.emit('trade_confirm', activeTradeId);
      document.getElementById('btn-trade-confirm').textContent = '✓ Ожидание партнёра...';
      document.getElementById('btn-trade-confirm').disabled = true;
      document.getElementById('btn-trade-confirm').style.opacity = '0.5';
    });

    document.getElementById('btn-trade-clear-my').addEventListener('click', () => {
      myTradeOffer = null;
      socket.emit('trade_offer', { tradeId: activeTradeId, offer: null });
      renderTradeOffers();
      renderTradePickGrid();
      renderTradeItemGrid();
      const conf = document.getElementById('btn-trade-confirm');
      conf.textContent = '✅ Подтвердить обмен';
      conf.disabled = false;
      conf.style.opacity = '1';
    });

    tw.addEventListener('click', (e) => { if (e.target === tw) { if (activeTradeId) socket.emit('trade_cancel', activeTradeId); closeTradeWindow(); } });
  }

  myTradeOffer = null;
  partnerTradeOffer = null;
  document.getElementById('trade-partner-name').textContent = partnerName;
  document.getElementById('trade-my-status').textContent = '⏳ Ожидание';
  document.getElementById('trade-my-status').className = 'trade-status waiting';
  document.getElementById('trade-partner-status').textContent = '⏳ Ожидание';
  document.getElementById('trade-partner-status').className = 'trade-status waiting';
  document.getElementById('btn-trade-confirm').textContent = '✅ Подтвердить обмен';
  document.getElementById('btn-trade-confirm').disabled = false;
  document.getElementById('btn-trade-confirm').style.opacity = '1';

  renderTradeOffers();
  renderTradePickGrid();
  renderTradeItemGrid();
  document.getElementById('trade-center-modal').style.display = 'none';
  tw.style.display = 'flex';
}

function renderTradePickGrid() {
  const grid = document.getElementById('trade-pick-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (myTeam.length === 0) {
    grid.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:20px;grid-column:1/-1;">У вас нет покемонов для обмена</div>';
    return;
  }

  myTeam.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'trade-pokemon-card';
    if (myTradeOffer && myTradeOffer.data === m) card.classList.add('selected');

    const untradeable = myTeam.length <= 1;
    if (untradeable) {
      card.classList.add('untradeable');
      card.title = 'Нельзя отдать единственного покемона';
    }

    card.innerHTML = `
      <img src="${m.sprite || m.apiData?.sprites?.front_default || ''}" alt="${m.apiData?.name || '?'}" loading="lazy">
      <div class="name">${escHtml(m.nickname || m.apiData?.name || '???')}</div>
      <div class="lvl">Lv${m.level || 1}</div>
    `;

    if (!untradeable) {
      card.addEventListener('click', () => {
        myTradeOffer = { type: 'pokemon', data: m };
        socket.emit('trade_offer', { tradeId: activeTradeId, offer: myTradeOffer });
        renderTradeOffers();
        renderTradePickGrid();
      });
    }

    grid.appendChild(card);
  });
}

function renderTradeItemGrid() {
  const grid = document.getElementById('trade-item-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const tradeItems = ITEMS.filter(item => (inventory[item.id] || 0) > 0 && item.implemented !== false && item.category !== 'awards');
  if (tradeItems.length === 0) {
    grid.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:10px;grid-column:1/-1;font-size:0.8rem;">Нет предметов</div>';
    return;
  }

  tradeItems.forEach(item => {
    const qty = inventory[item.id] || 0;
    const card = document.createElement('div');
    card.className = 'trade-pokemon-card';
    if (myTradeOffer && myTradeOffer.type === 'item' && myTradeOffer.data.id === item.id) card.classList.add('selected');

    card.innerHTML = `
      <div>${getItemSpriteImg(item.id, 32)}</div>
      <div class="name">${item.nameRu}</div>
      <div class="lvl">x${Math.min(qty, 99)}</div>
    `;

    card.addEventListener('click', () => {
      // Toggle: if already selected, clear; else select this item
      if (myTradeOffer && myTradeOffer.type === 'item' && myTradeOffer.data.id === item.id) {
        myTradeOffer = null;
      } else {
        myTradeOffer = { type: 'item', data: { id: item.id, name: item.nameRu, qty: 1 } };
      }
      socket.emit('trade_offer', { tradeId: activeTradeId, offer: myTradeOffer });
      renderTradeOffers();
      renderTradeItemGrid();
      renderTradePickGrid();
    });

    grid.appendChild(card);
  });
}

function renderTradeOffers() {
  const myDiv = document.getElementById('trade-my-offer');
  const pDiv = document.getElementById('trade-partner-offer');
  if (!myDiv || !pDiv) return;

  const renderOffer = (offer) => {
    if (!offer) return '<span style="color:var(--tma-text-muted);">Не выбрано</span>';
    if (offer.type === 'pokemon') {
      const m = offer.data;
      return `<img class="trade-offer-sprite" src="${m.sprite || m.apiData?.sprites?.front_default || ''}" alt="${escHtml(m.apiData?.name || '?')}"><div class="trade-offer-name">${escHtml(m.nickname || m.apiData?.name || '???')}</div><div class="trade-offer-level">Lv${m.level || 1}</div>`;
    }
    if (offer.type === 'item') {
      const it = offer.data;
      return `<div>${getItemSpriteImg(it.id, 40)}</div><div class="trade-offer-name">${it.name}</div><div class="trade-offer-level">x${it.qty || 1}</div>`;
    }
    return '<span style="color:var(--tma-text-muted);">Не выбрано</span>';
  };

  myDiv.innerHTML = renderOffer(myTradeOffer);
  myDiv.className = myTradeOffer ? 'trade-offer-slot filled' : 'trade-offer-slot';
  pDiv.innerHTML = renderOffer(partnerTradeOffer);
  pDiv.className = partnerTradeOffer ? 'trade-offer-slot filled' : 'trade-offer-slot';
}

function updateTradeConfirmUI(status) {
  const myEl = document.getElementById('trade-my-status');
  const partnerEl = document.getElementById('trade-partner-status');
  if (!myEl || !partnerEl) return;

  let myConfirmed, partnerConfirmed;
  if (iAmP1) {
    myConfirmed = status.p1;
    partnerConfirmed = status.p2;
  } else {
    myConfirmed = status.p2;
    partnerConfirmed = status.p1;
  }

  myEl.textContent = myConfirmed ? '✅ Готов' : '⏳ Ожидание';
  myEl.className = myConfirmed ? 'trade-status ready' : 'trade-status waiting';

  partnerEl.textContent = partnerConfirmed ? '✅ Готов' : '⏳ Ожидание';
  partnerEl.className = partnerConfirmed ? 'trade-status ready' : 'trade-status waiting';

  // Disable confirm button if already confirmed
  if (myConfirmed) {
    const btn = document.getElementById('btn-trade-confirm');
    btn.textContent = '✓ Ожидание партнёра...';
    btn.disabled = true;
    btn.style.opacity = '0.5';
  }
}

function closeTradeWindow() {
  const tw = document.getElementById('trade-window-modal');
  if (tw) tw.style.display = 'none';
  activeTradeId = null;
  myTradeOffer = null;
  partnerTradeOffer = null;
}


export function getPokedexState() {
  return { pokedexSeen, pokedexCaught, POKEDEX_ALL, pokedexData, pokedexTotal };
}

export function getShopState() {
  return { money, inventory };
}
export function modifyMoney(delta) {
  money += delta;
}

export function getTeamState() {
  return { myTeam, currentPokemonIndex };
}

export function getSocialState() {
  return { onlinePlayersList, trainerNickname, tgUser };
}
export function setTrainerNickname(name) {
  trainerNickname = name;
}

export function getMapState() { return { currentLocationId, currentRegion, lastLocation }; }
export function setCurrentLocationId(id) { currentLocationId = id; }
export function setCurrentRegion(reg) { currentRegion = reg; }
export function setLastLocation(loc) { lastLocation = loc; }


export function getGameState() {
  return {
    get myTeam() { return myTeam; },
    get pokedexSeen() { return pokedexSeen; },
    get pokedexCaught() { return pokedexCaught; },
    get currentLocationId() { return currentLocationId; },
    get isDaytime() { return isDaytime; },
    get gymLeaders() { return gymLeaders; },
    get eliteFour() { return eliteFour; },
    get champion() { return champion; },
    get gymBadges() { return badges; },
    get expShareActive() { return expShareActive; },
    get quests() { return quests; },
    get questProgress() { return questProgress; },
    get completedQuests() { return completedQuests; },
    get visitedLocations() { return visitedLocations; },
    get inventory() { return inventory; },
    get money() { return money; },
    get QUEST_CONFIGS() { return QUEST_CONFIGS; },
    get itemsUsedInBattle() { return itemsUsedInBattle; },
    set itemsUsedInBattle(v) { itemsUsedInBattle = v; }
  };
}

export function getInvState() { return { money, eggs, ITEMS, trainingStages, expShareActive }; }
export function toggleExpShare() { expShareActive = !expShareActive; }
