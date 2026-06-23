import { API_BASE } from '../game/config.js';
import { state } from '../game/state.js';
import { getCloudAuthHeaders } from '../game/save.js';
import { showToast } from '../utils/dom.js';
function getSocket() { return state.socket; }

// Trade state
let tradeSocket = null;
let activeTradeId = null;
let tradePartner = null;
let myTradeOffers = [];
let partnerTradeOffers = [];
let iAmP1 = true;
let myTradeConfirmed = false;
let partnerTradeConfirmed = false;

// --- Module initialization ---
export function initTradeSocket(sock) {
  tradeSocket = sock;
  if (!tradeSocket) return;

  // Clean up any old listeners to avoid duplicates
  tradeSocket.off('trade:request_received');
  tradeSocket.off('trade:started');
  tradeSocket.off('trade:declined');
  tradeSocket.off('trade:partner_offers');
  tradeSocket.off('trade:confirm_status');
  tradeSocket.off('trade:complete');
  tradeSocket.off('trade:cancelled');
  tradeSocket.off('trade:error');

  // Receive trade request from another user
  tradeSocket.on('trade:request_received', (data) => {
    if (!data || !data.fromId) return;
    showTradeRequestModal(data);
  });

  // Trade started (both accepted)
  tradeSocket.on('trade:started', (data) => {
    if (!data || !data.tradeId) return;
    activeTradeId = data.tradeId;
    tradePartner = data.partnerUsername || 'Партнёр';
    iAmP1 = data.youAreP1 !== undefined ? data.youAreP1 : true;
    myTradeOffers = [];
    partnerTradeOffers = [];
    myTradeConfirmed = false;
    partnerTradeConfirmed = false;
    openTradePanel();
  });

  // Trade declined
  tradeSocket.on('trade:declined', (data) => {
    showToast(data?.message || 'Тренер отклонил предложение обмена', true);
  });

  // Partner updated their offers
  tradeSocket.on('trade:partner_offers', (offers) => {
    partnerTradeOffers = Array.isArray(offers) ? offers : [];
    renderTradeOffers();
  });

  // Confirm status changed
  tradeSocket.on('trade:confirm_status', (status) => {
    if (status) {
      myTradeConfirmed = status.p1 === (iAmP1 ? true : false) ? true : myTradeConfirmed;
      partnerTradeConfirmed = status.p1 === (iAmP1 ? false : true) ? true : partnerTradeConfirmed;
    }
    updateTradeConfirmUI();
  });

  // Trade complete - server executed the trade
  tradeSocket.on('trade:complete', (data) => {
    const receivedOffers = data?.offers || [];

    // Apply received offers (client-side)
    if (Array.isArray(receivedOffers) && receivedOffers.length > 0) {
      receivedOffers.forEach(offer => {
        if (offer.type === 'pokemon') {
          // Add pokemon to team or PC
          const monData = offer.data;
          if (monData) {
            showToast(`Получен покемон: ${monData.name || 'Покемон'}`, false);
          }
        } else if (offer.type === 'item') {
          showToast(`Получен предмет: ${offer.data?.name || 'Предмет'} x${offer.data?.qty || 1}`, false);
        }
      });
    }

    showToast('Обмен успешно завершён!', false);
    closeTradePanel();
    activeTradeId = null;
    tradePartner = null;
    myTradeOffers = [];
    partnerTradeOffers = [];
  });

  // Trade cancelled
  tradeSocket.on('trade:cancelled', (data) => {
    showToast(data?.message || 'Обмен отменён', true);
    closeTradePanel();
    activeTradeId = null;
  });

  // Trade error
  tradeSocket.on('trade:error', (data) => {
    showToast(data?.message || 'Ошибка обмена', true);
  });
}

// --- Request a trade ---
export function requestTrade(userId) {
  if (!tradeSocket || !tradeSocket.connected) {
    showToast('Нет подключения к серверу', true);
    return;
  }

  tradeSocket.emit('trade:request', {
    targetUserId: userId,
    fromUserId: getMyUserId(),
    fromUsername: getMyUsername(),
  });
}

// --- Show trade panel ---
export function openTradePanel() {
  let panel = document.getElementById('trade-panel');
  if (panel) {
    panel.style.display = 'flex';
    return;
  }

  panel = document.createElement('div');
  panel.id = 'trade-panel';
  panel.className = 'modal-overlay';
  panel.innerHTML = `
    <div class="selection-modal-card" style="max-width:420px;width:95%;padding:16px;max-height:90vh;overflow-y:auto;">
      <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--tma-border);padding-bottom:8px;margin-bottom:12px;">
        <h3 style="margin:0;">🤝 Обмен</h3>
        <button class="tma-btn" id="btn-trade-close" style="padding:4px 10px;font-size:0.75rem;background:#ff3b30;margin:0;">✕</button>
      </div>

      <div id="trade-partner-info" style="text-align:center;font-size:0.9rem;margin-bottom:8px;">
        Обмен с: <strong>${tradePartner || 'Партнёр'}</strong>
      </div>

      <!-- My offers -->
      <div style="margin-bottom:8px;">
        <div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">Ваши предложения:</div>
        <div id="trade-my-offers" style="min-height:40px;border:1px dashed var(--tma-border);border-radius:6px;padding:6px;font-size:0.75rem;color:var(--tma-text-muted);">
          Нет предметов
        </div>
        <div style="display:flex;gap:4px;margin-top:4px;">
          <button class="tma-btn" id="btn-trade-add-pokemon" style="font-size:0.72rem;padding:4px 8px;flex:1;margin:0;">+ Покемон</button>
          <button class="tma-btn" id="btn-trade-add-item" style="font-size:0.72rem;padding:4px 8px;flex:1;margin:0;">+ Предмет</button>
        </div>
      </div>

      <!-- Partner offers -->
      <div style="margin-bottom:12px;">
        <div style="font-size:0.8rem;font-weight:bold;margin-bottom:4px;">Предложения партнёра:</div>
        <div id="trade-partner-offers" style="min-height:40px;border:1px dashed var(--tma-border);border-radius:6px;padding:6px;font-size:0.75rem;color:var(--tma-text-muted);">
          Ожидание...
        </div>
      </div>

      <!-- Confirm buttons -->
      <div style="display:flex;gap:8px;justify-content:center;border-top:1px solid var(--tma-border);padding-top:12px;">
        <button class="tma-btn" id="btn-trade-confirm" style="padding:8px 16px;font-size:0.85rem;background:#34c759;flex:1;">Подтвердить</button>
        <button class="tma-btn" id="btn-trade-cancel" style="padding:8px 16px;font-size:0.85rem;background:#ff3b30;flex:1;">Отмена</button>
      </div>
      <div id="trade-confirm-status" style="text-align:center;font-size:0.75rem;margin-top:6px;color:var(--tma-text-muted);"></div>
    </div>
  `;

  document.body.appendChild(panel);

  // Close button
  panel.querySelector('#btn-trade-close').addEventListener('click', closeTradePanel);
  panel.querySelector('#btn-trade-cancel').addEventListener('click', () => {
    if (activeTradeId && tradeSocket) {
      tradeSocket.emit('trade:cancel', { tradeId: activeTradeId });
    }
    closeTradePanel();
  });

  // Confirm button
  panel.querySelector('#btn-trade-confirm').addEventListener('click', confirmTrade);

  // Add pokemon (placeholder - will open team selection)
  panel.querySelector('#btn-trade-add-pokemon').addEventListener('click', () => {
    showToast('Выберите покемона из команды', false);
    // This would ideally open a team selection modal
    // For now, it's a placeholder that main.js should wire up
    if (typeof window.__openTradePokemonSelect === 'function') {
      window.__openTradePokemonSelect();
    }
  });

  // Add item (placeholder)
  panel.querySelector('#btn-trade-add-item').addEventListener('click', () => {
    showToast('Выберите предмет из инвентаря', false);
    if (typeof window.__openTradeItemSelect === 'function') {
      window.__openTradeItemSelect();
    }
  });

  panel.style.display = 'flex';
  renderTradeOffers();
}

// --- Close trade panel ---
function closeTradePanel() {
  const panel = document.getElementById('trade-panel');
  if (panel) panel.style.display = 'none';
}

// --- Add offer ---
export function addTradeOffer(type, id, data) {
  if (!activeTradeId) return;

  // Check for duplicates
  if (myTradeOffers.some(o => o.type === type && o.id === id)) {
    showToast('Это уже добавлено', true);
    return;
  }

  myTradeOffers.push({ type, id, data });
  syncTradeOffers();
  renderTradeOffers();
}

// --- Remove offer ---
export function removeTradeOffer(index) {
  if (index < 0 || index >= myTradeOffers.length) return;
  myTradeOffers.splice(index, 1);
  syncTradeOffers();
  renderTradeOffers();
}

// --- Sync offers with partner ---
function syncTradeOffers() {
  if (!tradeSocket || !activeTradeId) return;
  tradeSocket.emit('trade:update', {
    tradeId: activeTradeId,
    offers: myTradeOffers,
  });
}

// --- Confirm trade ---
export function confirmTrade() {
  if (!tradeSocket || !activeTradeId) {
    showToast('Нет активного обмена', true);
    return;
  }

  if (myTradeOffers.length === 0) {
    showToast('Добавьте хотя бы один предмет для обмена', true);
    return;
  }

  myTradeConfirmed = true;
  tradeSocket.emit('trade:confirm', { tradeId: activeTradeId });
  updateTradeConfirmUI();
}

// --- Decline trade ---
export function declineTrade() {
  // Used when receiving a request
}

// --- Render offers in the panel ---
function renderTradeOffers() {
  const myContainer = document.getElementById('trade-my-offers');
  const partnerContainer = document.getElementById('trade-partner-offers');

  if (myContainer) {
    if (myTradeOffers.length === 0) {
      myContainer.innerHTML = '<span style="color:var(--tma-text-muted);">Нет предметов</span>';
    } else {
      myContainer.innerHTML = myTradeOffers.map((offer, idx) => {
        const name = offer.data?.name || offer.id || 'Предмет';
        const qty = offer.data?.qty ? ` x${offer.data.qty}` : '';
        const icon = offer.type === 'pokemon' ? '🔴' : '📦';
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:2px 0;">
          <span>${icon} ${name}${qty}</span>
          <button class="tma-btn trade-remove-btn" data-idx="${idx}" style="padding:2px 6px;font-size:0.65rem;background:#ff3b30;margin:0;">✕</button>
        </div>`;
      }).join('');

      // Bind remove buttons
      myContainer.querySelectorAll('.trade-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          removeTradeOffer(parseInt(btn.dataset.idx));
        });
      });
    }
  }

  if (partnerContainer) {
    if (partnerTradeOffers.length === 0) {
      partnerContainer.innerHTML = '<span style="color:var(--tma-text-muted);">Ожидание...</span>';
    } else {
      partnerContainer.innerHTML = partnerTradeOffers.map(offer => {
        const name = offer.data?.name || offer.id || 'Предмет';
        const qty = offer.data?.qty ? ` x${offer.data.qty}` : '';
        const icon = offer.type === 'pokemon' ? '🔴' : '📦';
        return `<div style="padding:2px 0;">${icon} ${name}${qty}</div>`;
      }).join('');
    }
  }
}

// --- Update confirm UI ---
function updateTradeConfirmUI() {
  const statusEl = document.getElementById('trade-confirm-status');
  if (!statusEl) return;

  const myStatus = myTradeConfirmed ? '✅ Вы подтвердили' : '⏳ Ожидание вашего подтверждения';
  const partnerStatus = partnerTradeConfirmed ? '✅ Партнёр подтвердил' : '⏳ Ожидание подтверждения партнёра';

  statusEl.innerHTML = `${myStatus}<br>${partnerStatus}`;

  // Update confirm button
  const confirmBtn = document.getElementById('btn-trade-confirm');
  if (confirmBtn) {
    confirmBtn.textContent = myTradeConfirmed ? 'Ожидание партнёра...' : 'Подтвердить';
    confirmBtn.disabled = myTradeConfirmed;
  }
}

// --- Show trade request modal ---
function showTradeRequestModal(data) {
  let modal = document.getElementById('trade-request-modal-v2');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'trade-request-modal-v2';
    modal.className = 'trade-request-overlay';
    modal.innerHTML = `
      <div class="trade-request-box" style="padding:20px;text-align:center;">
        <h3 style="margin-top:0;">🤝 Предложение обмена</h3>
        <p>Тренер <strong id="trade-req-username-v2"></strong> хочет обменяться с вами!</p>
        <div class="trade-request-buttons" style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
          <button class="trade-btn accept" id="btn-trade-accept-v2" style="padding:8px 20px;">Принять</button>
          <button class="trade-btn reject" id="btn-trade-reject-v2" style="padding:8px 20px;">Отклонить</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('trade-req-username-v2').textContent = data.fromUsername || 'Тренер';

  const acceptBtn = document.getElementById('btn-trade-accept-v2');
  const rejectBtn = document.getElementById('btn-trade-reject-v2');

  // Clone to remove old listeners
  const newAccept = acceptBtn.cloneNode(true);
  acceptBtn.parentNode.replaceChild(newAccept, acceptBtn);
  newAccept.addEventListener('click', () => {
    modal.style.display = 'none';
    if (tradeSocket) {
      tradeSocket.emit('trade:accept', {
        fromSocketId: data.fromSocketId,
        fromUserId: data.fromId,
        fromUsername: data.fromUsername,
      });
    }
  });

  const newReject = rejectBtn.cloneNode(true);
  rejectBtn.parentNode.replaceChild(newReject, rejectBtn);
  newReject.addEventListener('click', () => {
    modal.style.display = 'none';
    if (tradeSocket) {
      tradeSocket.emit('trade:decline', { fromSocketId: data.fromSocketId });
    }
    showToast('Вы отклонили обмен', false);
  });

  modal.style.display = 'flex';
}

// --- Helper: get user info ---
function getMyUserId() {
  // Try to get from global state
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  }
  return null;
}

function getMyUsername() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user.first_name || window.Telegram.WebApp.initDataUnsafe.user.username || 'Тренер';
  }
  return 'Тренер';
}
