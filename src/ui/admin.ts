import { getIsAdmin, getGameState, setGameState, getInvState, modifyMoney, getTgUser, setCurrentLocationId, setCurrentRegion } from '../game/getters.js';
import { addItem } from '../game/actions.js';
import { state } from '../game/state.js';
import { refreshProfileUI, renderTeamGrid } from './profile.js';
import { autoSave, saveGame, cloudSave } from '../game/save.js';
import { showToast, showConfirmModal } from '../utils/dom.js';
import { giveStarterMon } from './starter.js';
import { renderLocation } from './location.js';
import { ITEMS } from '../data/items.js';
import { pokedexTotal, calculateStat } from '../battle/core.js';
import { updateInventoryDisplay } from './inventory.js';

export function initAdminPanel() {
  if (!getIsAdmin()) return;

  // FAB button
  const fab = document.createElement('button');
  fab.id = 'admin-fab';
  fab.innerHTML = '🛠';
  fab.title = 'Админ-панель';
  fab.style.cssText = 'position:fixed;bottom:120px;right:16px;width:48px;height:48px;border-radius:50%;background:#af52de;color:#fff;border:none;font-size:1.4rem;z-index:250;box-shadow:0 4px 12px rgba(0,0,0,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;';
  document.body.appendChild(fab);

  // Modal
  const modal = document.createElement('div');
  modal.id = 'admin-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'none';
  modal.innerHTML = `
    <div class="selection-modal-card" style="max-width:390px;width:95%;max-height:85vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--tma-border);padding-bottom:6px;">
        <h3 style="margin:0;">🛠 Админка</h3>
        <button class="tma-btn" id="btn-admin-close" style="padding:4px 8px;font-size:0.75rem;margin:0;background:#ff3b30;">❌</button>
      </div>

      <div style="display:flex;gap:4px;border-bottom:1px solid var(--tma-border);padding-bottom:4px;">
        <button class="tma-btn admin-tab-btn active" data-tab="tab-self" style="flex:1;font-size:0.75rem;padding:6px 2px;margin:0;">👤 Себя</button>
        <button class="tma-btn admin-tab-btn" data-tab="tab-players" style="flex:1;font-size:0.75rem;padding:6px 2px;margin:0;">👥 Игроки</button>
        <button class="tma-btn admin-tab-btn" data-tab="tab-server" style="flex:1;font-size:0.75rem;padding:6px 2px;margin:0;">🌐 Сервер</button>
      </div>

      <div id="tab-self" class="admin-tab-content" style="display:flex;flex-direction:column;gap:4px;">
        <div id="admin-self-buttons" style="display:flex;flex-direction:column;gap:4px;max-height:50vh;overflow-y:auto;padding-right:4px;"></div>
      </div>

      <div id="tab-players" class="admin-tab-content" style="display:none;flex-direction:column;gap:6px;">
        <div style="display:flex;gap:4px;">
          <select id="admin-user-select" style="flex:1.2;padding:6px;font-size:0.75rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);">
            <option value="">— Выбрать тренера —</option>
          </select>
          <input id="admin-target-id" type="text" placeholder="или ID" style="flex:0.8;padding:6px 8px;font-size:0.75rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);">
          <button class="tma-btn" id="admin-lookup" style="padding:6px 10px;font-size:0.75rem;background:#007aff;margin:0;">🔍</button>
        </div>

        <div id="admin-target-info" style="font-size:0.72rem;color:var(--tma-text-muted);background:rgba(0,0,0,0.2);padding:6px;border-radius:6px;min-height:28px;">Сначала найдите или выберите игрока</div>

        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;">
          <button class="tma-btn admin-id-act" data-act="items" style="font-size:0.68rem;padding:6px 2px;background:#34c759;margin:0;">🎒 Итемы x999</button>
          <button class="tma-btn admin-id-act" data-act="money" style="font-size:0.68rem;padding:6px 2px;background:#ff9500;margin:0;">💰 +100к ¥</button>
          <button class="tma-btn admin-id-act" data-act="badges" style="font-size:0.68rem;padding:6px 2px;background:#ff3b30;margin:0;">🏅 Значки</button>
          <button class="tma-btn admin-id-act" data-act="heal" style="font-size:0.68rem;padding:6px 2px;background:#007aff;margin:0;">🏥 Лечить</button>
          <button class="tma-btn admin-id-act" data-act="iv" style="font-size:0.68rem;padding:6px 2px;background:#af52de;margin:0;">⭐ Макс IV</button>
          <button class="tma-btn admin-id-act" data-act="lvl50" style="font-size:0.68rem;padding:6px 2px;background:#5856d6;margin:0;">📈 До 50 lvl</button>
          <button class="tma-btn admin-id-act" data-act="legend" style="font-size:0.68rem;padding:6px 2px;background:#ff6482;margin:0;">🦄 Легенду</button>
          <button class="tma-btn admin-id-act" data-act="teleport_goldenrod" style="font-size:0.68rem;padding:6px 2px;background:#5ac8fa;margin:0;">🗺️ ТП Голденрод</button>
          <button class="tma-btn admin-id-act" data-act="reset" style="font-size:0.68rem;padding:6px 2px;background:#ff3b30;margin:0;">💣 Сброс сэйва</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--tma-border);padding-top:6px;margin-top:4px;">
          <span style="font-size:0.7rem;font-weight:bold;color:var(--tma-text-muted);">🗺️ Телепорт игрока:</span>
          <div style="display:flex;gap:4px;">
            <select id="admin-tp-loc" style="flex:1;padding:6px;font-size:0.72rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);">
              <option value="cerulean_city">Cerulean City (Церулин)</option>
              <option value="vermilion">Vermilion City (Вермилион)</option>
              <option value="lavender_town">Lavender Town (Лавандер)</option>
              <option value="celadon_city">Celadon City (Селадон)</option>
              <option value="fuchsia_city">Fuchsia City (Фуксия)</option>
              <option value="saffron">Saffron City (Шафран)</option>
              <option value="new_bark_town">New Bark Town (Нью-Барк)</option>
              <option value="cherrygrove_city">Cherrygrove City (Черригров)</option>
              <option value="violet_city">Violet City (Вайолет)</option>
              <option value="azalea_town">Azalea Town (Азалия)</option>
              <option value="goldenrod">Goldenrod City (Голденрод)</option>
              <option value="ecruteak_city">Ecruteak City (Экрутик)</option>
            </select>
            <button class="tma-btn" id="admin-tp-btn" style="padding:6px 12px;font-size:0.75rem;background:#5ac8fa;margin:0;">ТП</button>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--tma-border);padding-top:6px;margin-top:4px;">
          <span style="font-size:0.7rem;font-weight:bold;color:var(--tma-text-muted);">✨ Выдать покемона игроку:</span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            <input id="admin-spawn-species" type="text" placeholder="вид (например: pikachu)" style="padding:5px;font-size:0.72rem;border:1px solid var(--tma-border);border-radius:4px;background:var(--tma-bg);color:var(--tma-text);">
            <input id="admin-spawn-level" type="number" placeholder="lvl (1-100)" value="50" style="padding:5px;font-size:0.72rem;border:1px solid var(--tma-border);border-radius:4px;background:var(--tma-bg);color:var(--tma-text);">
          </div>
          <div style="display:flex;gap:4px;align-items:center;justify-content:space-between;margin:2px 0;">
            <label style="font-size:0.68rem;display:flex;align-items:center;gap:3px;color:var(--tma-text);">
              <input id="admin-spawn-shiny" type="checkbox"> Шайни
            </label>
            <label style="font-size:0.68rem;display:flex;align-items:center;gap:3px;color:var(--tma-text);">
              <input id="admin-spawn-maxiv" type="checkbox" checked> Макс IV (31)
            </label>
            <select id="admin-spawn-target" style="padding:4px;font-size:0.68rem;border:1px solid var(--tma-border);border-radius:4px;background:var(--tma-bg);color:var(--tma-text);">
              <option value="team">В команду</option>
              <option value="pc">В PC</option>
            </select>
          </div>
          <button class="tma-btn" id="admin-spawn-btn" style="width:100%;padding:6px;font-size:0.75rem;background:#34c759;margin:2px 0 0;">✨ Выдать</button>
        </div>
      </div>

      <div id="tab-server" class="admin-tab-content" style="display:none;flex-direction:column;gap:6px;">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="font-size:0.7rem;font-weight:bold;color:var(--tma-text-muted);">📢 Глобальный анонс (Broadcast):</span>
          <textarea id="admin-broadcast-msg" placeholder="Введите сообщение для всех игроков..." style="width:100%;height:60px;padding:6px;font-size:0.72rem;border:1px solid var(--tma-border);border-radius:6px;background:var(--tma-bg);color:var(--tma-text);font-family:monospace;resize:none;"></textarea>
          <button class="tma-btn" id="admin-broadcast-btn" style="width:100%;padding:8px;font-size:0.75rem;background:#af52de;margin:0;">📢 Отправить всем</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--tma-border);padding-top:6px;margin-top:4px;">
          <span style="font-size:0.7rem;font-weight:bold;color:var(--tma-text-muted);">⚙️ Переключить фичи:</span>
          <div style="display:grid;grid-template-columns:1fr;gap:4px;">
            <button class="tma-btn admin-toggle-feature" data-feat="double_exp" style="font-size:0.7rem;padding:6px;margin:0;background:#ff9500;">📈 Double EXP</button>
            <button class="tma-btn admin-toggle-feature" data-feat="beta_mode" style="font-size:0.7rem;padding:6px;margin:0;background:#007aff;">🧪 Beta Mode</button>
            <button class="tma-btn admin-toggle-feature" data-feat="shiny_boost" style="font-size:0.7rem;padding:6px;margin:0;background:#34c759;">✨ Shiny Boost (x10)</button>
            <button class="tma-btn admin-toggle-feature" data-feat="free_shop" style="font-size:0.7rem;padding:6px;margin:0;background:#ff3b30;">🛍️ Free Shop</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Tab switching
  const tabBtns = modal.querySelectorAll('.admin-tab-btn');
  const tabContents = modal.querySelectorAll('.admin-tab-content');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => (c as HTMLElement).style.display = 'none');
      btn.classList.add('active');
      const target = modal.querySelector(`#${btn.getAttribute('data-tab')}`) as HTMLElement;
      if (target) target.style.display = 'flex';
    });
  });

  // Self-admin buttons
  const btns: [string, () => void][] = [
    ['💰 +100 000 кредитов', () => { modifyMoney(100000); updateInventoryDisplay(); autoSave(); showToast('+100 000¥', false); }],
    ['🎒 Предметы x999', () => {
      const inv = getGameState().inventory;
      ITEMS.forEach(item => { inv[item.id] = 999; });
      updateInventoryDisplay();
      autoSave();
      showToast('Предметы x999', false);
    }],
    ['🏅 Все 8 значков', () => {
      setGameState({ badges: ['Boulder Badge', 'Cascade Badge', 'Thunder Badge', 'Rainbow Badge', 'Marsh Badge', 'Soul Badge', 'Volcano Badge', 'Earth Badge'] });
      refreshProfileUI();
      autoSave();
      showToast('8 значков!', false);
    }],
    ['🏥 Лечить команду', () => {
      getGameState().myTeam.forEach((m: any) => { m.currentHp = m.maxHp; m.status = null; m.sleepTurns = 0; if (m.movesPP) m.movesPP.forEach((pp: any) => { if (pp) { pp.current = pp.max; } }); });
      renderTeamGrid();
      autoSave();
      showToast('Вылечено!', false);
    }],
    ['⭐ Макс IV (31)', () => {
      getGameState().myTeam.forEach((m: any) => { m.ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }; });
      renderTeamGrid();
      autoSave();
      showToast('IV 31!', false);
    }],
    ['📈 +10 уровней', () => {
      getGameState().myTeam.forEach((m: any) => { for (let i = 0; i < 10; i++) { m.baseLevel++; m.maxHp = calculateStat(m, 'hp', false); m.currentHp = m.maxHp; } });
      refreshProfileUI();
      renderTeamGrid();
      autoSave();
      showToast('+10 lvl!', false);
    }],
    ['🦄 Случайный легендарный', async () => {
      const leg = ['mewtwo', 'mew', 'lugia', 'ho-oh', 'rayquaza', 'groudon', 'kyogre', 'dialga', 'palkia', 'giratina', 'zekrom', 'reshiram', 'xerneas', 'yveltal', 'solgaleo', 'lunala', 'zeraora'];
      const pick = leg[Math.floor(Math.random() * leg.length)];
      await giveStarterMon(pick);
      renderTeamGrid();
      autoSave();
      showToast(pick + '!', false);
    }],
    ['🦄 Мью', async () => { await giveStarterMon('mew'); renderTeamGrid(); autoSave(); showToast('Мью!', false); }],
    ['🗺️ Голденрод', () => { setCurrentLocationId('goldenrod'); setCurrentRegion('johto'); renderLocation('goldenrod'); autoSave(); showToast('Goldenrod', false); }],
    ['🗺️ Оливин', () => { setCurrentLocationId('olivine'); setCurrentRegion('johto'); renderLocation('olivine'); autoSave(); showToast('Olivine', false); }],
    ['🗺️ Голденрод', () => { setCurrentLocationId('goldenrod'); setCurrentRegion('johto'); renderLocation('goldenrod'); autoSave(); showToast('Goldenrod', false); }],
    ['🎣 Дать удочки', () => {
      const inv = getGameState().inventory;
      ['oldRod', 'goodRod', 'superRod'].forEach(id => { inv[id] = 1; });
      updateInventoryDisplay();
      autoSave();
      showToast('Все удочки получены!', false);
    }],
    ['🔔 Графитовый колокол', () => { addItem('graphiteBell', 1); updateInventoryDisplay(); autoSave(); showToast('Графитовый колокол получен!', false); }],
    ['✨ Шайни-команда', () => { getGameState().myTeam.forEach((m: any) => { m.isShiny = true; }); refreshProfileUI(); renderTeamGrid(); autoSave(); showToast('Вся пати теперь шайни!', false); }],
    ['📊 Покедекс ВСЕ', async () => {
      try {
        const r = await fetch('/pokedex_data.json');
        const pd = await r.json();
        const pc = getGameState().pokedexCaught;
        const ps = getGameState().pokedexSeen;
        Object.keys(pd).forEach(k => { if (!pc.has(k)) pc.add(k); if (!ps.has(k)) ps.add(k); });
        autoSave();
        showToast(`Покедекс: ${pc.size}/${pokedexTotal}`, false);
      } catch (e) { showToast('Ошибка', true); }
    }],
    ['🔁 Сбросить квесты', () => {
      setGameState({ quests: [], questProgress: {}, completedQuests: [], npcQuestProgress: {}, completedNPCQuests: [] });
      autoSave();
      showToast('Квесты сброшены', false);
    }],
    ['💾 Форс-сейв', () => { saveGame(); cloudSave(); showToast('Сохранено!', false); }],
    ['🥚 Готовое яйцо', () => {
      state.eggs.push({
        uid: 'egg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        species: 'pikachu',
        types: [{ type: { name: 'electric' } }],
        ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
        readyTime: Date.now(),
        boxIdx: 0
      });
      updateInventoryDisplay();
      autoSave();
      showToast('🥚 Готовое яйцо добавлено в рюкзак!', false);
    }],
  ];

  const container = document.getElementById('admin-self-buttons');
  btns.forEach(([label, fn]) => {
    const b = document.createElement('button');
    b.className = 'tma-btn';
    b.textContent = label;
    b.style.cssText = 'width:100%;padding:10px;font-size:0.9rem;background:var(--tma-card-bg);color:var(--tma-text);border:1px solid var(--tma-border);margin:2px 0;text-align:left;';
    b.addEventListener('click', () => { fn(); });
    container?.appendChild(b);
  });

  // Populate user dropdown when opening admin panel
  let adminSelectPopulated = false;
  fab.addEventListener('click', async () => {
    modal.style.display = 'flex';
    const select = document.getElementById('admin-user-select') as HTMLSelectElement;
    if (!adminSelectPopulated) {
      adminSelectPopulated = true;
      try {
        const res = await fetch('/api/profile/trainers/all');
        const data = await res.json();
        if (data.users) {
          data.users.forEach((u: any) => {
            const opt = document.createElement('option');
            opt.value = u.id;
            opt.textContent = `${u.first_name || u.username || '?'} (ID:${u.id})`;
            select.appendChild(opt);
          });
        }
      } catch (e) { /* ignore */ }
      select.addEventListener('change', () => {
        if (select.value) {
          (document.getElementById('admin-target-id') as HTMLInputElement).value = select.value;
          (document.getElementById('admin-lookup') as HTMLButtonElement).click();
        }
      });
    }
  });

  const targetInfo = document.getElementById('admin-target-info')!;
  document.getElementById('admin-lookup')!.addEventListener('click', async () => {
    const id = (document.getElementById('admin-target-id') as HTMLInputElement).value.trim();
    if (!id) { targetInfo.textContent = 'Введите ID'; return; }
    targetInfo.textContent = 'Поиск...';
    try {
      const res = await fetch(`/api/profile/${id}`);
      const data = await res.json();
      if (data.profile) {
        const p = data.profile;
        targetInfo.innerHTML = `👤 ${p.first_name || p.username} | 🏅${p.badges} | 💰${p.money} | 🐾${p.team?.length || 0}`;
        targetInfo.setAttribute('data-found', id);
      } else {
        targetInfo.textContent = 'Не найден';
        targetInfo.removeAttribute('data-found');
      }
    } catch (e) { targetInfo.textContent = 'Ошибка'; }
  });

  document.querySelectorAll('.admin-id-act').forEach(btn => {
    btn.addEventListener('click', async () => {
      const found = targetInfo.getAttribute('data-found');
      if (!found) { showToast('Сначала 🔍 найди тренера по ID', true); return; }
      const act = btn.getAttribute('data-act');
      const cmdMap: Record<string, string> = {
        items: 'give_items', money: 'give_money', badges: 'give_badges',
        heal: 'heal_team', iv: 'max_iv', lvl50: 'fix_levels',
        legend: 'give_legendary', reset: 'reset_save', teleport_goldenrod: 'teleport'
      };
      const cmd = cmdMap[act!] || act!;
      const val = act === 'teleport_goldenrod' ? 'goldenrod' : null;
      try {
        const url = `/admin/api?token=league17admin2026&cmd=${cmd}&user=${found}${val ? '&val=' + encodeURIComponent(val) : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        showToast(data.status === 'ok' ? '✅ Готово' : '❌ ' + (data.error || 'ошибка'), data.status !== 'ok');
      } catch (e) { showToast('Ошибка API', true); }
    });
  });

  document.getElementById('admin-tp-btn')!.addEventListener('click', async () => {
    const found = targetInfo.getAttribute('data-found');
    if (!found) { showToast('Сначала 🔍 найди тренера по ID', true); return; }
    const loc = (document.getElementById('admin-tp-loc') as HTMLSelectElement).value;
    try {
      const res = await fetch(`/admin/api?token=league17admin2026&cmd=teleport&user=${found}&val=${encodeURIComponent(loc)}`);
      const data = await res.json();
      showToast(data.status === 'ok' ? '✅ Телепортирован' : '❌ Ошибка', data.status !== 'ok');
    } catch (e) { showToast('Ошибка API', true); }
  });

  document.getElementById('admin-spawn-btn')!.addEventListener('click', async () => {
    const found = targetInfo.getAttribute('data-found');
    if (!found) { showToast('Сначала 🔍 найди тренера по ID', true); return; }
    const species = (document.getElementById('admin-spawn-species') as HTMLInputElement).value.trim().toLowerCase();
    if (!species) { showToast('Введите название покемона', true); return; }
    const level = parseInt((document.getElementById('admin-spawn-level') as HTMLInputElement).value) || 50;
    const shiny = (document.getElementById('admin-spawn-shiny') as HTMLInputElement).checked;
    const maxIV = (document.getElementById('admin-spawn-maxiv') as HTMLInputElement).checked;
    const target = (document.getElementById('admin-spawn-target') as HTMLSelectElement).value;
    const val = JSON.stringify({ species, level, shiny, maxIV, target });
    try {
      const res = await fetch(`/admin/api?token=league17admin2026&cmd=add_mon&user=${found}&val=${encodeURIComponent(val)}`);
      const data = await res.json();
      showToast(data.status === 'ok' ? `✅ Выдан ${species}` : '❌ Ошибка: ' + (data.error || ''), data.status !== 'ok');
    } catch (e) { showToast('Ошибка API', true); }
  });

  document.getElementById('admin-broadcast-btn')!.addEventListener('click', async () => {
    const msg = (document.getElementById('admin-broadcast-msg') as HTMLTextAreaElement).value.trim();
    if (!msg) { showToast('Введите сообщение', true); return; }
    try {
      const res = await fetch(`/admin/api?token=league17admin2026&cmd=broadcast&user=1&val=${encodeURIComponent(msg)}`);
      const data = await res.json();
      if (data.status === 'ok') {
        showToast('✅ Анонс отправлен', false);
        (document.getElementById('admin-broadcast-msg') as HTMLTextAreaElement).value = '';
      } else { showToast('❌ Ошибка', true); }
    } catch (e) { showToast('Ошибка API', true); }
  });

  document.querySelectorAll('.admin-toggle-feature').forEach(btn => {
    btn.addEventListener('click', async () => {
      const found = targetInfo.getAttribute('data-found') || getTgUser()?.id || 1;
      const feat = btn.getAttribute('data-feat');
      try {
        const res = await fetch(`/admin/api?token=league17admin2026&cmd=toggle_feature&user=${found}&val=${encodeURIComponent(feat!)}`);
        const data = await res.json();
        showToast(data.status === 'ok' ? `✅ ${feat}: ${data.enabled ? 'ВКЛ' : 'ВЫКЛ'}` : '❌ Ошибка', data.status !== 'ok');
      } catch (e) { showToast('Ошибка API', true); }
    });
  });

  document.getElementById('btn-admin-close')!.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}
