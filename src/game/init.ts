import { state, lsKey } from './state.js';
import { store } from './store.js';
import { REGIONS } from '../data/regions.js';
import { battle, loadPokedexData, generateDailyQuests, startAutoHunt, stopAutoHunt, restoreBattleState, initEncounterEvents, initGymEvents, openQuests, checkQuestProgress } from '../battle/core.js';
import { loadGame, saveGame, cloudLoad, cloudSave, applyCloudSave, validateGameState, getFullSaveData, getLeaderboardData, getCloudAuthHeaders, autoSave, initCloudEvents } from './save.js';
import { authTelegram } from './auth.js';
import { initAppNav } from '../ui/nav.js';
import { renderTrainerCard } from '../ui/trainer-card.js';
import { getLocation, renderLocation, travelToRegion, updateTimeOfDay, updateMoneyDisplay, updateBadgeDisplay, fetchDropConfig, processMonsterDrop } from '../ui/location.js';
import { renderTeamGrid, initProfileEvents, initProfileUXEvents } from '../ui/profile.js';
import { updateInventoryDisplay, initInventoryEvents } from '../ui/inventory.js';
import { initShopEvents, initSellTab } from '../ui/shop.js';
import { initTrainersTab } from '../ui/trainers.js';
import { sendChatMessage } from '../ui/chat.js';
import { openPokedex } from '../ui/pokedex.js';
import { editNickname } from '../ui/nickname.js';
import { openNotifications, updateNotifBadge, addNotification } from '../ui/notifications.js';
import { giveStarter } from '../ui/starter.js';
import { startBreedingCheck } from '../ui/daycare.js';
import { openMap, setTravelCallback, setExploredLocs } from '../ui/map.js';
import { setBeforeRenderLocation } from '../ui/location.js';
import { startOnboarding, markLocationExplored, getExploredLocations, openHelp } from '../ui/tutorial.js';
import { openQuestPanel } from '../ui/quests.js';
import { openAchievements } from '../ui/achievements.js';
import { showToast } from '../utils/dom.js';
import { checkTutorialProgress } from '../ui/npcs.js';
import { checkNPCQuestProgress } from '../ui/npcs.js';
import { logItemHistory } from '../game/actions.js';
import { showGymRewardSelection } from '../ui/gym-reward.js';
import { API_BASE } from './config.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    store.setQuery('lsKey', (name) => lsKey(name));
    store.setQuery('getLocation', (locId) => getLocation(locId));
    store.setQuery('processMonsterDrop', (name) => processMonsterDrop(name));
    store.on('money:changed', () => updateMoneyDisplay());
    store.on('inventory:changed', (itemId, delta) => {
      updateInventoryDisplay();
      if (delta > 0) {
        checkQuestProgress('collect_items', delta, itemId);
        checkNPCQuestProgress(itemId, delta);
        logItemHistory(itemId, delta, 'add');
      }
    });
    store.on('save', () => autoSave());
    store.on('team:render', () => renderTeamGrid());
    store.on('location:render', (locId) => renderLocation(locId));
    store.on('notification:add', (title, text) => addNotification(title, text));
    store.on('tutorial:progress', (type, amount, itemId) => checkTutorialProgress(type, amount, itemId));
    store.on('gym:reward', (locId) => showGymRewardSelection(locId));
    store.on('toast', (msg, isErr) => showToast(msg, isErr));

    initAppNav();
    initShopEvents();
    initGymEvents();
    initTrainersTab();

    const mapHeader = document.getElementById('map-header');
    const mapContainer = document.getElementById('map-container');
    if (mapHeader && mapContainer) {
      mapHeader.addEventListener('click', () => {
        if (mapContainer.style.display === 'none') {
          openMap();
        } else {
          mapContainer.style.display = 'none';
        }
      });
    }

    const infoView = document.getElementById('view-info');
    if (infoView) {
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin:10px 0;';
      btnRow.innerHTML = `
        <button class="tma-btn nav-btn" id="btn-help-system">📖 Справка</button>
        <button class="tma-btn nav-btn" id="btn-quests">📋 Квесты</button>
        <button class="tma-btn nav-btn" id="btn-achievements">🏆 Достижения</button>
        <button class="tma-btn nav-btn" id="btn-tutorial">🎓 Туториал</button>
        <button class="tma-btn nav-btn" id="btn-pvp">⚡ PvP</button>
      `;
      infoView.insertBefore(btnRow, infoView.firstChild);

      document.getElementById('btn-help-system')?.addEventListener('click', () => openHelp());
      document.getElementById('btn-quests')?.addEventListener('click', () => openQuestPanel());
      document.getElementById('btn-achievements')?.addEventListener('click', () => openAchievements());
      document.getElementById('btn-tutorial')?.addEventListener('click', () => startOnboarding());
      document.getElementById('btn-pvp')?.addEventListener('click', async () => {
        const m = await import('../battle/pvp.js');
        m.showPvpPanel();
      });
    }

    setTimeout(() => {
      const tutorialDone = localStorage.getItem('league17_tutorial') === 'complete';
      if (!tutorialDone && state.myTeam && state.myTeam.length > 0) {
        startOnboarding();
      }
    }, 3000);

    await authTelegram();
    loadPokedexData();
    fetchDropConfig();
    renderTrainerCard();

    setTravelCallback((locId) => {
      const locs = REGIONS[state.currentRegion]?.locations;
      if (locs && locs[locId] && state.currentLocationId !== locId) {
        renderLocation(locId);
        return;
      }
      for (const [rk, region] of Object.entries(REGIONS)) {
        if (region.locations && region.locations[locId]) {
          travelToRegion(rk, locId);
          return;
        }
      }
    });
    setExploredLocs(getExploredLocations());

    setBeforeRenderLocation((locId) => {
      if (locId) markLocationExplored(locId);
    });
    if (state.currentLocationId) markLocationExplored(state.currentLocationId);

    // Admin panel — visible only after server confirms via /api/auth/is-admin
    const resetBtn = document.getElementById('btn-reset-game');
    if (resetBtn) resetBtn.style.display = 'none';

    import('../ui/admin.js').then(m => m.initAdminPanel()).catch(e => console.warn('Admin panel init failed', e));

    const localLoaded = await loadGame();
    let gameLoaded = false;
    if (state.tgToken) {
      const cloudData = await cloudLoad();
      if (cloudData && cloudData.myTeam) {
        applyCloudSave(cloudData);
        saveGame();
        if (state.myTeam.length > 0) { gameLoaded = true; }
      }
    }
    if (!gameLoaded) {
      if (localLoaded && state.myTeam.length > 0) {
        gameLoaded = true;
        if (state.tgToken) cloudSave();
      }
    }
    if (!gameLoaded) {
      await giveStarter();
      showToast('Добро пожаловать в Лигу Покемонов!', false);
    } else if (state.tgToken) {
      const localTs = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');
      const cloudTs = state.lastCloudSync || 0;
      if (localTs > cloudTs + 5000) { cloudSave(); }
    }

    // Sync store._state with the actual game state so store.getItemQty() works
    store.setState(state);

    try { renderLocation(state.currentLocationId); } catch(e) { console.error('renderLocation failed:', e); showToast('Ошибка загрузки локации. Нажмите кнопку сброса.', true); }
    renderTeamGrid();
    updateInventoryDisplay();
    updateMoneyDisplay();
    updateBadgeDisplay();

    initProfileEvents();
    initEncounterEvents();
    restoreBattleState();

    if (localStorage.getItem(lsKey('hunt_active')) === '1' && state.myTeam.some(m => m.currentHp > 0)) {
      startAutoHunt();
    }

    initInventoryEvents();
    initProfileUXEvents();
    initCloudEvents();

    updateTimeOfDay();
    setInterval(updateTimeOfDay, 30000);

    startBreedingCheck();

    document.getElementById('btn-notifications').addEventListener('click', openNotifications);
    document.getElementById('btn-close-notif').addEventListener('click', () => { document.getElementById('notif-modal').style.display = 'none'; });
    document.getElementById('notif-modal').addEventListener('click', (e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).style.display = 'none'; });
    updateNotifBadge();

    const btnOpenPokedex = document.getElementById('btn-open-pokedex');
    if (btnOpenPokedex) btnOpenPokedex.addEventListener('click', openPokedex);
    const btnClosePokedex = document.getElementById('btn-close-pokedex');
    if (btnClosePokedex) btnClosePokedex.addEventListener('click', () => {
      document.getElementById('pokedex-modal').style.display = 'none';
    });

    const btnCloseTM = document.getElementById('btn-close-tm');
    if (btnCloseTM) btnCloseTM.addEventListener('click', () => {
      document.getElementById('tm-modal').style.display = 'none';
    });

    const pokeNameEl = document.getElementById('poke-name');
    if (pokeNameEl) pokeNameEl.addEventListener('click', editNickname);

    initSellTab();

    document.querySelectorAll('.loc-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.loc-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.loc-tab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById('loc-tab-' + tab.dataset.tab);
        if (target) target.style.display = 'block';
      });
    });

    generateDailyQuests();

    const btnQuests = document.getElementById('btn-quests');
    if (btnQuests) btnQuests.addEventListener('click', openQuests);

    const btnCloseQuests = document.getElementById('btn-close-quests');
    if (btnCloseQuests) btnCloseQuests.addEventListener('click', () => {
      document.getElementById('quest-modal').style.display = 'none';
    });

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

    const huntToggleBtn = document.getElementById('btn-hunt-toggle');
    if (huntToggleBtn) {
      huntToggleBtn.addEventListener('click', () => {
        if (battle.state.huntActive) {
          stopAutoHunt();
        } else {
          if (!state.myTeam.some(m => m.currentHp > 0)) {
            showToast('Вам нужен хотя бы один живой покемон!', true);
            return;
          }
          startAutoHunt();
        }
      });
    }

    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatInput = document.getElementById('chat-input');
    if (chatSendBtn && chatInput) {
      chatSendBtn.addEventListener('click', sendChatMessage);
      chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendChatMessage();
      });
    }

    if (state.tgToken) {
      setTimeout(() => cloudSave(), 2000);
    }

    document.getElementById('btn-close-trainer-profile')?.addEventListener('click', () => {
      document.getElementById('trainer-profile-modal').style.display = 'none';
    });

    document.getElementById('trainer-profile-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        (e.currentTarget as HTMLElement).style.display = 'none';
      }
    });

    document.getElementById('starter-modal')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        (e.currentTarget as HTMLElement).style.display = 'none';
      }
    });

    // Close modals by clicking overlay background (exclude encounter/battle — has own flow)
    const modalsForOverlayClose = [
      'quest-modal', 'shop-modal', 'gym-modal', 'elite-modal',
      'leaderboard-modal', 'pc-modal', 'crafting-modal', 'pokedex-modal',
      'tm-modal', 'npc-modal'
    ];
    for (const id of modalsForOverlayClose) {
      document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }
      });
    }
  } catch(e) { document.body.innerHTML += '<div class="error-bar" style="font-size:14px;padding:15px;white-space:pre-wrap"><b>INIT ERROR:</b> '+e.message+'<br><small>'+e.stack+'</small></div>'; console.error(e); }
});

window.addEventListener('pagehide', () => {
  if (!state.tgToken) return;
  if (state.cloudSaveTimer) {
    clearTimeout(state.cloudSaveTimer);
    state.cloudSaveTimer = null;
  }
  const localTs = parseInt(localStorage.getItem(lsKey('save_ts')) || '0');
  if (localTs > state.lastCloudSync + 2000) {
    validateGameState();
    const saveData = getFullSaveData();
    const lb = getLeaderboardData();
    fetch(`${API_BASE}/save`, {
      method: 'POST',
      headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ saveData, ...lb, saveVersion: state.saveVersion }),
      keepalive: true
    }).catch(function() {});
  }
});
