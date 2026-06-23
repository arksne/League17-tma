import { state } from '../game/state.js';
import { SOCKET_COOLDOWN } from '../game/config.js';
import { showToast } from '../utils/dom.js';
import { initTradeSocket } from '../network/socket.js';

export function openTradeCenter() {
  initTradeSocket();
  let tc = document.getElementById('trade-center-modal');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'trade-center-modal';
    tc.className = 'modal-overlay';
    tc.style.display = 'none';
    tc.innerHTML = `
      <div class="trade-container">
        <h2 class="m-0-0-4">🤝 Глобальный Обменник</h2>
        <p class="text-muted fs-085 m-0-0-12">Выберите тренера в сети, чтобы предложить обмен</p>
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

export function renderTradePlayerList() {
  const list = document.getElementById('trade-players-list');
  if (!list) return;
  list.innerHTML = '';

  if (state.onlinePlayersList.length === 0) {
    list.innerHTML = '<div class="text-center text-muted p-30-0">Нет тренеров в сети<br><span class="fs-08">Подождите или зайдите позже</span></div>';
    return;
  }

  state.onlinePlayersList.forEach(p => {
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
      if (now - state.lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто!', true); return; }
      state.lastSocketAction = now;
      state.socket.emit('trade_request', p.id);
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
      if (now - state.lastSocketAction < SOCKET_COOLDOWN) { showToast('Слишком часто!', true); return; }
      state.lastSocketAction = now;
      if (state.myTeam.length === 0 || !state.myTeam.some(m => m.currentHp > 0)) {
        showToast('Нужен хотя бы один живой покемон!', true);
        return;
      }
      state.socket.emit('pvp_challenge', p.id);
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
