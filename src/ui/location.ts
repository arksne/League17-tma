import { state } from '../game/state.js';
import { REGIONS } from '../data/regions.js';
import { gymLeaders } from '../data/gyms.js';
import { NPC_DATA } from '../data/npc.js';
import { MONSTER_DROP_TABLE } from '../data/drops.js';
import { ITEMS } from '../data/items.js';
import { TRANSPORT_HUBS } from '../data/transport.js';
import { getDailyWeather, WEATHER_ICONS, WEATHER_NAMES } from '../data/weather.js';
import { checkDaycare, collectDaycareMons, collectDaycareEgg } from './daycare.js';
import { openPC } from './pc.js';
import { openShop } from './shop.js';
import { openNPCDialog, checkNPCQuestProgress, checkTutorialProgress } from './npcs.js';
import { showToast } from '../utils/dom.js';
import { autoSave } from '../game/save.js';
import { API_BASE } from '../game/config.js';

// Lazy load profile to avoid circular dep issues
let profileModule: any = null;
async function getProfileModule() {
  if (!profileModule) profileModule = await import('./profile.js');
  return profileModule;
}

// Lazy load pvp/trade center from main to avoid circular dependencies
let mainModule: any = null;
async function getMainModule() {
  if (!mainModule) mainModule = await import('../../main.js');
  return mainModule;
}

// We will also import battle core functions lazily or statically
let battleCoreModule: any = null;
async function getBattleCore() {
  if (!battleCoreModule) battleCoreModule = await import('../battle/core.js');
  return battleCoreModule;
}

export const DROP_CONFIG_CACHE_KEY = 'pokematrix_drop_config_cache';

export function getLocation(locId: string) {
  for (const region of Object.values(REGIONS)) {
    if (region.locations[locId]) return region.locations[locId];
  }
  return null;
}

export function getRegionOfLocation(locId: string) {
  for (const [key, region] of Object.entries(REGIONS)) {
    if (region.locations[locId]) return key;
  }
  return 'kanto';
}

export async function updatePlayerLocation() {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.tgToken ? { 'Authorization': `Bearer ${state.tgToken}` } : {})
  };
  if (!headers.Authorization) return;
  try {
    await fetch(`${API_BASE}/profile/location`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ locationId: state.currentLocationId, region: state.currentRegion })
    });
  } catch (e) {
    // silent
  }
}

export function travelToRegion(targetRegion: string, targetLoc: string, ticketItemId?: string) {
  state.currentRegion = targetRegion;
  getBattleCore().then(bc => {
    bc.appendToLog(`Вы отправились в регион ${REGIONS[targetRegion].name}!`, false, 'quest');
  });
  renderLocation(targetLoc);
}

export function healTeam() {
  if (state.myTeam.length === 0) { showToast('У вас нет покемонов!', true); return; }
  let healed = false;
  state.myTeam.forEach(mon => {
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
  getProfileModule().then(pm => pm.renderTeamGrid());
  getMainModule().then(mm => mm.refreshProfileUI());
}

export function updateTimeOfDay() {
  const hour = new Date().getHours();
  state.isDaytime = hour >= 6 && hour < 18;
  const card = document.querySelector('.location-card');
  if (card) {
    if (state.isDaytime) {
      card.classList.remove('night');
    } else {
      card.classList.add('night');
    }
  }
}

// Callback hook for main.ts to inject exploration tracking before renderLocation runs
let _beforeRenderLocation: ((locId: string) => void) | null = null;
export function setBeforeRenderLocation(fn: (locId: string) => void) {
  _beforeRenderLocation = fn;
}

export let renderLocation = function(locId: any) {
  if (_beforeRenderLocation) _beforeRenderLocation(locId);
  // Save previous location for back-navigation
  if (state.currentLocationId && state.currentLocationId !== locId) {
    state.lastLocation = state.currentLocationId;
  }
  state.currentLocationId = locId;
  updatePlayerLocation();
  const loc = getLocation(locId);
  if (!loc) return;
  state.currentRegion = getRegionOfLocation(locId);
  
  const headerTitle = document.getElementById('header-title');
  if (headerTitle && headerTitle.innerText.startsWith('Мир')) {
    headerTitle.innerText = `Мир (${REGIONS[state.currentRegion]?.name || ''})`;
  }

  document.getElementById('loc-name').innerText = loc.name;
  document.getElementById('loc-desc').innerText = loc.desc;
  const img = loc.image;
  const locImgEl = document.getElementById('loc-image');
  if (locImgEl) {
    if (img && img.length > 0) {
      const imgUrl = img.startsWith('http') ? img : (img.startsWith('/') ? img : '/' + img);
      locImgEl.style.backgroundImage = `url('${imgUrl}')`;
      locImgEl.style.setProperty('--loc-bg', `url('${imgUrl}')`);
    } else {
      locImgEl.style.backgroundImage = 'none';
    }
  }

  // Region display
  const regionEl = document.getElementById('loc-region');
  if (regionEl) regionEl.innerText = REGIONS[state.currentRegion]?.name || '';

  // Weather display
  const weather = getDailyWeather(locId);
  const weatherEl = document.getElementById('loc-weather');
  if (weatherEl) {
    weatherEl.innerText = `${WEATHER_ICONS[weather]} ${WEATHER_NAMES[weather]}`;
  }

  updateTimeOfDay();
  const locNameEl = document.getElementById('loc-name');
  locNameEl.innerText = `${state.isDaytime ? '☀️' : '🌙'} ${loc.name}`;

  const actionsContainer = document.getElementById('loc-actions');
  actionsContainer.innerHTML = '';
  actionsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:4px';

  // Pokemarket / Supermarket — shop button
  if (locId.endsWith('_pokemarket') || locId === 'pokemarket' || locId.endsWith('_supermarket') || locId.endsWith('_shop')) {
    const btnShop = document.createElement('button');
    btnShop.className = 'btn-use';
    btnShop.style.backgroundColor = '#ff9500';
    btnShop.innerText = '🛒 Магазин';
    btnShop.onclick = () => openShop(locId);
    actionsContainer.appendChild(btnShop);
  }

  // Pokemon Center location
  if (locId === 'pokecenter' || locId.endsWith('_pokecenter')) {
    checkDaycare();

    const btnTrade = document.createElement('button');
    btnTrade.className = 'btn-use';
    btnTrade.style.backgroundColor = '#007aff';
    btnTrade.innerText = '🤝 Обменник (Игроки)';
    btnTrade.onclick = () => getMainModule().then(mm => mm.openTradeCenter());
    actionsContainer.appendChild(btnTrade);

    const btnHeal = document.createElement('button');
    btnHeal.className = 'btn-use';
    btnHeal.style.backgroundColor = '#34c759';
    btnHeal.innerText = '🏥 Вылечить команду';
    btnHeal.onclick = () => healTeam();
    actionsContainer.appendChild(btnHeal);

    const btnPC = document.createElement('button');
    btnPC.className = 'btn-use';
    btnPC.style.backgroundColor = '#5856d6';
    btnPC.innerText = '💻 Терминал PC';
    btnPC.onclick = () => openPC();
    actionsContainer.appendChild(btnPC);

    if (state.daycareMons.length > 0) {
      const btnCollect = document.createElement('button');
      btnCollect.className = 'btn-use';
      btnCollect.style.backgroundColor = '#ff9500';
      btnCollect.innerText = `🐣 Забрать из Питомника (${state.daycareMons.length})`;
      btnCollect.onclick = () => collectDaycareMons();
      actionsContainer.appendChild(btnCollect);
    }
    if (state.daycareEgg && Date.now() >= state.daycareEgg.readyTime) {
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
  if (gymLeaders[locId] && !state.badges.includes(gymLeaders[locId].badgeName)) {
    const btnGym = document.createElement('button');
    btnGym.className = 'btn-use';
    btnGym.style.backgroundColor = '#af52de';
    btnGym.innerText = `⚔ ${gymLeaders[locId].name} (${gymLeaders[locId].title})`;
    btnGym.onclick = () => getBattleCore().then(bc => bc.openGymModal(locId));
    actionsContainer.appendChild(btnGym);
  }

  // Elite Four button (at goldenrod_stadium)
  if (locId === 'goldenrod_stadium' && state.badges.length >= 8) {
    const btnElite = document.createElement('button');
    btnElite.className = 'btn-use';
    btnElite.style.backgroundColor = '#ff3b30';
    btnElite.innerText = '🏆 Элитная Четверка';
    btnElite.onclick = () => getBattleCore().then(bc => bc.openEliteModal());
    actionsContainer.appendChild(btnElite);
  }

  let huntEncounters = loc.encounters;
  if (loc.dayEncounters && state.isDaytime) huntEncounters = loc.dayEncounters;
  else if (loc.nightEncounters && !state.isDaytime) huntEncounters = loc.nightEncounters;

  // NPC panel
  const npcPanel = document.getElementById('npc-panel');
  const npcButtons = document.getElementById('npc-buttons');
  npcButtons.innerHTML = '';
  npcButtons.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px';
  let npcsHere = Object.values(NPC_DATA).filter(n => n.location === locId);
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
      if (!state.visitedLocations.has(linkId)) {
        state.visitedLocations.add(linkId);
        getBattleCore().then(bc => bc.checkQuestProgress('explore'));
      }
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
        if (!state.visitedLocations.has(linkId)) {
          state.visitedLocations.add(linkId);
          getBattleCore().then(bc => bc.checkQuestProgress('explore'));
        }
        renderLocation(linkId);
      };
      navContainer.appendChild(btn);
    });
  }

  // Location info: wild tab content
  const wildTab = document.getElementById('loc-tab-wild');
  const wildlifeEl = document.getElementById('loc-wildlife');
  const wildlifeDetail = document.getElementById('loc-wildlife-detail');
  const wildlifeEmpty = document.getElementById('loc-wildlife-empty');

  if (huntEncounters && huntEncounters.length > 0) {
    const huntFiltered: string[] = huntEncounters.filter(n => typeof n === 'string');
    const uniqueMons = [...new Set(huntFiltered)];
    if (uniqueMons.length > 0) {
      const monList = uniqueMons.slice(0, 10).join(', ') + (uniqueMons.length > 10 ? '...' : '');

      wildlifeDetail.innerHTML = `
        <div class="mb-6"><b>🐾 Покемоны (${uniqueMons.length}):</b><br>${monList}</div>
        <div class="mb-6 fs-085 text-muted"><b>🎒 Дроп:</b><br>${getLocationDropString(uniqueMons)}</div>
      `;
      wildlifeEl.style.display = 'block';
      wildlifeEmpty.style.display = 'none';
    } else {
      wildlifeEl.style.display = 'none';
      wildlifeEmpty.style.display = 'block';
    }
  } else {
    wildlifeEl.style.display = 'none';
    wildlifeEmpty.style.display = 'block';
  }

  // Reset to desc tab on location change
  document.querySelectorAll('.loc-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.loc-tab[data-tab="desc"]')?.classList.add('active');
  const descTab = document.getElementById('loc-tab-desc');
  if (descTab) descTab.style.display = 'block';

  // Back from pokecenter, pokemart, or pokemarket
  const isServiceLoc = locId === 'pokecenter' || locId.endsWith('_pokecenter')
    || locId === 'pokemart' || locId.endsWith('_pokemart')
    || locId === 'pokemarket' || locId.endsWith('_pokemarket')
    || locId.endsWith('_supermarket') || locId.endsWith('_shop');
  if (isServiceLoc && state.lastLocation) {
    const backLoc = getLocation(state.lastLocation);
    if (backLoc) {
      const btnBack = document.createElement('button');
      btnBack.className = 'btn-nav';
      btnBack.style.cssText = 'flex:0 0 auto;min-width:fit-content;padding:6px 10px;font-size:13px;border-color:var(--tma-accent)';
      btnBack.innerHTML = `<span>↩ ${backLoc.name}</span>`;
      btnBack.onclick = () => {
        renderLocation(state.lastLocation);
        state.lastLocation = null;
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

export function getLocationDropString(uniqueMons: string[]) {
  const monsterTable = state.serverDropConfig?.monsterDrops ?? MONSTER_DROP_TABLE;
  const serverUniv = state.serverDropConfig?.universalDrops;
  const univDrops = (Array.isArray(serverUniv) && serverUniv.length > 0) ? serverUniv : UNIVERSAL_DROPS;
  const dropSet = new Set<string>();
  uniqueMons.forEach(name => {
    (monsterTable[name] || []).forEach(d => dropSet.add(d.item));
  });
  univDrops.forEach(d => dropSet.add(d.item));
  const items = [...dropSet].slice(0, 8).map(id => {
    const def = ITEMS.find(i => i.id === id);
    return def ? def.nameRu : id;
  }).join(', ');
  return items || '—';
}

const UNIVERSAL_DROPS = [
  { item: 'prettyWing', chance: 0.04, qty: 1 },
  { item: 'nugget', chance: 0.02, qty: 1 },
  { item: 'starPiece', chance: 0.01, qty: 1 },
];

export async function fetchDropConfig() {
  try {
    const res = await fetch('/api/drops');
    if (res.ok) {
      state.serverDropConfig = await res.json();
      try { sessionStorage.setItem(DROP_CONFIG_CACHE_KEY, JSON.stringify(state.serverDropConfig)); } catch(e) {}
      return;
    }
  } catch (e) {
    // Server not available
  }
  // Fallback to sessionStorage cache
  try {
    const cached = sessionStorage.getItem(DROP_CONFIG_CACHE_KEY);
    if (cached) {
      state.serverDropConfig = JSON.parse(cached);
    }
  } catch(e) {}
}

export function processMonsterDrop(pokemonName: string) {
  const drops = [];
  const monsterTable = state.serverDropConfig?.monsterDrops ?? MONSTER_DROP_TABLE;
  const serverUniv = state.serverDropConfig?.universalDrops;
  const univDrops = (Array.isArray(serverUniv) && serverUniv.length > 0) ? serverUniv : UNIVERSAL_DROPS;
  const speciesTable = monsterTable[pokemonName] || [];
  // 🔧 DEBUG: drop100 — все дропы падают с 100% шансом
  const drop100 = typeof localStorage !== 'undefined' && localStorage.getItem('pokematrix_drop_100') === '1';
  for (const entry of speciesTable) {
    if (drop100 || Math.random() < entry.chance) {
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  for (const entry of univDrops) {
    if (drop100 || Math.random() < entry.chance) {
      drops.push({ item: entry.item, qty: entry.qty });
    }
  }
  return drops;
}

export function updateMoneyDisplay() {
  // money display removed from header — only visible in inventory
}

export function updateBadgeDisplay() {
  const el = document.getElementById('badge-display');
  if (el) {
    const icons = state.badges.map(b => {
      const leader = Object.values(gymLeaders).find(l => l.badgeName === b);
      return leader?.badgeIcon || '🏅';
    });
    el.innerText = `Значки (${state.badges.length}/${Object.keys(gymLeaders).length}): ${icons.join(' ')}`;
  }
}
