import { state } from '../game/state.js';
import { API_BASE, SOCKET_COOLDOWN } from '../game/config.js';
import { getCloudAuthHeaders } from '../game/save.js';
import { escHtml, showToast } from '../utils/dom.js';
import { initTradeSocket } from '../network/socket.js';

// --- Online players display ---

export function renderOnlinePlayers() {
  const listEl = document.getElementById('chat-online-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  if (state.onlinePlayersList.length === 0) {
    listEl.textContent = '0';
    return;
  }
  listEl.textContent = state.onlinePlayersList.length + ' ';
  state.onlinePlayersList.forEach((p, i) => {
    const span = document.createElement('span');
    span.className = 'chat-trainer-chip';
    span.textContent = p.username || 'Тренер';
    span.addEventListener('click', () => openTrainerProfile(p.userId));
    listEl.appendChild(span);
  });
}

// --- Location-based trainer list ---

async function updatePlayerLocation() {
  const headers = getCloudAuthHeaders();
  if (!headers.Authorization) return;
  try {
    await fetch(`${API_BASE}/profile/location`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId: state.currentLocationId, region: state.currentRegion })
    });
  } catch (e) { /* silent */ }
}

export async function loadLocationTrainers() {
  const listEl = document.getElementById('trainer-location-list');
  if (!listEl) return;
  try {
    const res = await fetch(`${API_BASE}/profile/trainers?locationId=${encodeURIComponent(state.currentLocationId)}`);
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
      span.setAttribute('data-trainer-id', t.id);
      span.textContent = t.first_name || t.username || `T${t.id}`;
      span.addEventListener('click', () => openTrainerProfile(t.id));
      listEl.appendChild(span);
    });
  } catch (e) { listEl.textContent = '---'; }
}

export function updateTrainerLocationList(data) {
  const listEl = document.getElementById('trainer-location-list');
  if (!listEl || !data) return;
  if (data.userId === (state.tgUser?.id || 0)) return;
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

// --- Trainer profile modal ---

export async function openTrainerProfile(userId) {
  const now = Date.now();
  if (now - state.lastProfileOpen < 500) return;
  state.lastProfileOpen = now;

  const modal = document.getElementById('trainer-profile-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  document.getElementById('modal-trainer-name').innerText = 'Загрузка...';
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
    const isOnline = state.onlinePlayersList.some(op => op.userId === userId);
    const onlineDot = isOnline
      ? '<span class="online-dot yes"></span>'
      : '<span class="online-dot no"></span>';
    const statusText = isOnline ? ' (В сети)' : ' (Не в сети)';
    document.getElementById('modal-trainer-name').innerHTML = onlineDot + escHtml(p.first_name || p.username || `Trainer#${p.id}`) + `<span style="font-size:0.7rem;color:${isOnline ? '#34c759' : '#888'};">${statusText}</span>`;
    document.getElementById('modal-trainer-badges').innerText = p.badges;

    const actionsDiv = document.getElementById('modal-trainer-actions');
    const onlinePlayer = state.onlinePlayersList.find(op => op.userId === userId);
    if (actionsDiv && onlinePlayer && onlinePlayer.id !== state.socket?.id) {
      actionsDiv.style.display = 'flex';
      const tradeBtn = document.getElementById('btn-trainer-trade');
      const battleBtn = document.getElementById('btn-trainer-battle');
      tradeBtn.onclick = () => {
        const now = Date.now();
        if (now - state.lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто! Подождите...', true); return; }
        state.lastSocketAction = now;
        modal.style.display = 'none';
        initTradeSocket();
        if (!state.socket || !state.socket.connected) {
          showToast('Подключение к серверу...', true);
          return;
        }
        state.socket.emit('trade_request', onlinePlayer.id);
        showToast('Запрос на обмен отправлен!', false);
      };
      battleBtn.onclick = () => {
        const now = Date.now();
        if (now - state.lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто! Подождите...', true); return; }
        state.lastSocketAction = now;
        if (!state.myTeam.some(m => m.currentHp > 0)) { showToast('Нужен живой покемон!', true); return; }
        modal.style.display = 'none';
        initTradeSocket();
        state.socket.emit('pvp_challenge', onlinePlayer.id);
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
          <div class="trainer-team-mon-name">${escHtml(mon.nickname || mon.name)}</div>
          <div class="trainer-team-mon-lvl">Lv${mon.level}</div>
        </div>`;
      teamEl.appendChild(div);
    });
  } catch (e) {
    console.error('Trainer profile error:', e);
    document.getElementById('modal-trainer-name').innerText = 'Ошибка загрузки';
  }
}
