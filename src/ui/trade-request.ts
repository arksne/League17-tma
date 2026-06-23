import { state } from '../game/state.js';

export function showTradeRequestModal(fromUsername, fromId) {
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

  if (rm._cleanup) rm._cleanup();

  document.getElementById('trade-req-username').textContent = fromUsername || 'Тренер';
  rm.style.display = 'flex';

  const accept = () => {
    state.socket.emit('trade_accept', fromId);
    rm.style.display = 'none';
    cleanup();
  };
  const reject = () => {
    state.socket.emit('trade_reject', fromId);
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
