import { API_BASE } from '../game/config.js';
import { state } from '../game/state.js';
import { getCloudAuthHeaders } from '../game/save.js';
import { showToast } from '../utils/dom.js';
function getSocket() { return state.socket; }

// PvP Queue state
let pvpSocket = null;
let pvpBattleId = null;
let pvpOpponent = null;
let pvpMyTurn = false;
let isInPvpQueue = false;
let pvpMonData = null;
let queueStatusCallback = null;

// --- Module initialization ---
export function initPvpSocket(clientSocket) {
  pvpSocket = clientSocket;

  if (!pvpSocket) return;

  // Listen for match found
  pvpSocket.on('pvp:matched', (data) => {
    if (!data || !data.battleId) return;
    isInPvpQueue = false;
    pvpBattleId = data.battleId;
    pvpOpponent = data.opponent;
    pvpMyTurn = data.first || false;
    showPvpMatchModal(data.opponent, data.first);
    updateQueueStatusUI({ inQueue: false });
  });

  // Listen for turn result
  pvpSocket.on('pvp:turn_result', (data) => {
    if (!data || !data.turn) return;
    handlePvpTurnResult(data);
  });

  // Listen for battle end
  pvpSocket.on('pvp:battle_end', (data) => {
    if (!data) return;
    endPvpBattle(data);
  });

  // Listen for errors
  pvpSocket.on('pvp:error', (data) => {
    const msg = data?.message || 'Ошибка PvP';
    showToast(msg, true);
  });

  // Listen for queue status
  pvpSocket.on('pvp:queue_status', (data) => {
    updateQueueStatusUI(data);
    if (queueStatusCallback) queueStatusCallback(data);
  });

  // Try to rejoin lobby if needed
  if (pvpSocket.connected && !pvpSocket.recovered) {
    // Already connected, no action needed
  }
}

// --- Queue Management ---
export function joinPvpQueue() {
  if (!pvpSocket || !pvpSocket.connected) {
    showToast('Нет подключения к серверу', true);
    return;
  }

  if (isInPvpQueue) {
    showToast('Вы уже в очереди', false);
    return;
  }

  isInPvpQueue = true;
  pvpSocket.emit('pvp:join_queue');
  updateQueueStatusUI({ position: -1, inQueue: true });
}

export function leavePvpQueue() {
  isInPvpQueue = false;
  if (pvpSocket && pvpSocket.connected) {
    pvpSocket.emit('pvp:leave_queue');
  }
  updateQueueStatusUI({ position: -1, inQueue: false });
}

// --- UI: Queue Status ---
function updateQueueStatusUI(data) {
  const statusEl = document.getElementById('pvp-queue-status');
  if (!statusEl) return;

  if (data.inQueue) {
    statusEl.textContent = 'В поиске соперника...';
    statusEl.className = 'pvp-status searching';
  } else {
    statusEl.textContent = 'Ожидание';
    statusEl.className = 'pvp-status idle';
  }
}

// --- UI: Match Found Modal ---
function showPvpMatchModal(opponent, goesFirst) {
  let modal = document.getElementById('pvp-match-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pvp-match-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="selection-modal-card" style="max-width:360px;text-align:center;padding:24px;">
        <div style="font-size:3rem;margin-bottom:12px;">⚔</div>
        <h3 style="margin:0 0 8px;">Соперник найден!</h3>
        <p style="margin:4px 0;font-size:1.1rem;font-weight:bold;" id="pvp-opponent-name">${opponent?.username || 'Неизвестный'}</p>
        <p style="margin:4px 0;font-size:0.85rem;color:var(--tma-text-muted);" id="pvp-first-info"></p>
        <button class="tma-btn" id="btn-pvp-start" style="margin-top:12px;padding:10px 32px;font-size:1rem;">Начать битву</button>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('pvp-opponent-name').textContent = opponent?.username || 'Неизвестный';
  document.getElementById('pvp-first-info').textContent = goesFirst ? 'Вы ходите первым!' : 'Противник ходит первым!';

  const startBtn = document.getElementById('btn-pvp-start');
  const newBtn = startBtn.cloneNode(true);
  startBtn.parentNode.replaceChild(newBtn, startBtn);
  newBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    openPvpBattleArena();
  });

  modal.style.display = 'flex';
}

// --- UI: Battle Arena ---
function openPvpBattleArena() {
  let arena = document.getElementById('pvp-arena');
  if (!arena) {
    arena = document.createElement('div');
    arena.id = 'pvp-arena';
    arena.className = 'modal-overlay';
    arena.innerHTML = `
      <div class="selection-modal-card" style="max-width:420px;width:95%;padding:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--tma-border);padding-bottom:8px;margin-bottom:12px;">
          <h3 style="margin:0;">⚔ PvP Битва</h3>
          <button class="tma-btn" id="btn-pvp-surrender" style="padding:4px 12px;font-size:0.75rem;background:#ff3b30;margin:0;">Сдаться</button>
        </div>

        <!-- Opponent -->
        <div style="text-align:center;margin-bottom:12px;padding:8px;background:var(--tma-bg-secondary);border-radius:8px;">
          <div style="font-size:2rem;" id="pvp-opp-sprite">❓</div>
          <div style="font-weight:bold;" id="pvp-opp-name">${pvpOpponent?.username || 'Противник'}</div>
          <div style="font-size:0.8rem;" id="pvp-opp-mon-name">-</div>
          <div class="hp-bar-container" style="margin:4px auto;max-width:200px;">
            <div class="hp-bar-fill" id="pvp-opp-hp-fill" style="width:100%;"></div>
          </div>
          <div style="font-size:0.75rem;" id="pvp-opp-hp-text">HP: ?/?</div>
        </div>

        <!-- VS -->
        <div style="text-align:center;font-size:1.2rem;font-weight:bold;margin:4px 0;">VS</div>

        <!-- Player -->
        <div style="text-align:center;margin-bottom:12px;padding:8px;background:var(--tma-bg-secondary);border-radius:8px;">
          <div style="font-weight:bold;" id="pvp-my-name">Вы</div>
          <div style="font-size:0.8rem;" id="pvp-my-mon-name">-</div>
          <div class="hp-bar-container" style="margin:4px auto;max-width:200px;">
            <div class="hp-bar-fill" id="pvp-my-hp-fill" style="width:100%;"></div>
          </div>
          <div style="font-size:0.75rem;" id="pvp-my-hp-text">HP: ?/?</div>
        </div>

        <!-- Battle Log -->
        <div id="pvp-log" style="background:rgba(0,0,0,0.2);border-radius:6px;padding:8px;max-height:80px;overflow-y:auto;font-size:0.75rem;margin-bottom:8px;white-space:pre-wrap;"></div>

        <!-- Move Buttons -->
        <div id="pvp-move-buttons" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"></div>

        <!-- Turn Indicator -->
        <div id="pvp-turn-indicator" style="text-align:center;font-size:0.8rem;margin-top:8px;color:var(--tma-text-muted);">Ожидание хода...</div>
      </div>
    `;
    document.body.appendChild(arena);

    // Surrender button
    arena.querySelector('#btn-pvp-surrender').addEventListener('click', () => {
      if (confirm('Сдаться?')) {
        if (pvpSocket && pvpBattleId) {
          pvpSocket.emit('pvp:surrender', { battleId: pvpBattleId });
        }
        arena.style.display = 'none';
      }
    });
  }

  arena.style.display = 'flex';
}

// --- Submit Move ---
export function submitPvpMove(moveData) {
  if (!pvpSocket || !pvpBattleId || !pvpMyTurn) return;

  // Get current player pokemon data
  // This should be populated by the battle system
  if (!pvpMonData) {
    showToast('Нет данных о покемоне', true);
    return;
  }

  pvpSocket.emit('pvp:submit_move', {
    battleId: pvpBattleId,
    move: moveData,
    pokemon: pvpMonData,
  });

  pvpMyTurn = false;
  updatePvpTurnIndicator(false);
}

// --- Handle Turn Result ---
export function handlePvpTurnResult(result) {
  const logEl = document.getElementById('pvp-log');
  if (!logEl) return;

  // Log actions
  if (result.actions && Array.isArray(result.actions)) {
    result.actions.forEach(action => {
      const who = action.by === 'p1' ? 'Вы' : 'Противник';
      const critText = action.crit ? '💥 Крит! ' : '';
      const faintText = action.fainted ? ' (Покемон потерял сознание!)' : '';
      logEl.innerHTML = `${who}: ${action.move?.name || 'Атака'} (-${action.dmg})${critText}${faintText}\n${logEl.innerHTML}`;
    });
  }

  // Update HP displays
  if (result.yourHp !== null && result.yourMaxHp) {
    updatePvpHp('my', result.yourHp, result.yourMaxHp);
  }
  if (result.opponentHp !== null && result.opponentMaxHp) {
    updatePvpHp('opp', result.opponentHp, result.opponentMaxHp);
  }

  // Set turn if battle continues
  if (!result.battleOver && result.actions) {
    // Determine who goes next based on who acted last
    // For simplicity, alternate turns after both move
    pvpMyTurn = !pvpMyTurn; // If it was opponent's turn, now it's mine
    updatePvpTurnIndicator(pvpMyTurn);
  }

  if (result.battleOver) {
    // Will be handled by pvp:battle_end event
  }
}

// --- End Battle ---
export function endPvpBattle(data) {
  const arena = document.getElementById('pvp-arena');
  if (arena) arena.style.display = 'none';

  pvpBattleId = null;
  pvpOpponent = null;
  pvpMyTurn = false;
  pvpMonData = null;

  if (data.winner === 'draw') {
    showToast('Ничья!', false);
  } else if (data.winner === 'p1') {
    showToast('🏆 Победа!', false);
  } else if (data.winner === 'p2') {
    showToast('Поражение', true);
  }

  if (data.surrender) {
    showToast('Соперник сдался!', false);
  }

  if (data.disconnect) {
    showToast('Соперник отключился! Победа!', false);
  }

  if (data.yourRatingChange) {
    const change = data.yourRatingChange.new - data.yourRatingChange.old;
    const sign = change >= 0 ? '+' : '';
    showToast(`Рейтинг: ${data.yourRatingChange.old} → ${data.yourRatingChange.new} (${sign}${change})`, false);
  }
}

// --- UI Helpers ---
function updatePvpHp(who, current, max) {
  const hpFill = document.getElementById(`pvp-${who}-hp-fill`);
  const hpText = document.getElementById(`pvp-${who}-hp-text`);
  if (hpFill) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    hpFill.style.width = `${pct}%`;
    if (pct < 25) hpFill.style.background = '#ff3b30';
    else if (pct < 50) hpFill.style.background = '#ff9500';
    else hpFill.style.background = '#34c759';
  }
  if (hpText) {
    hpText.textContent = `HP: ${Math.max(0, current)}/${max}`;
  }
}

function updatePvpTurnIndicator(yourTurn) {
  const el = document.getElementById('pvp-turn-indicator');
  if (!el) return;
  if (yourTurn) {
    el.textContent = 'Ваш ход! Выберите атаку.';
    el.style.color = '#34c759';
  } else {
    el.textContent = 'Ожидание хода противника...';
    el.style.color = 'var(--tma-text-muted)';
  }
}

// Show PvP Panel (main entry point)
export function showPvpPanel() {
  // Ensure socket is initialized
  if (!pvpSocket) {
    const _socket = getSocket();
    if (_socket) {
      initPvpSocket(_socket);
    } else {
      showToast('Сокет не инициализирован', true);
      return;
    }
  }

  let panel = document.getElementById('pvp-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'pvp-panel';
    panel.className = 'modal-overlay';
    panel.innerHTML = `
      <div class="selection-modal-card" style="max-width:380px;width:95%;padding:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--tma-border);padding-bottom:8px;margin-bottom:16px;">
          <h3 style="margin:0;">⚔ PvP Арена</h3>
          <button class="tma-btn" id="btn-pvp-panel-close" style="padding:4px 10px;font-size:0.75rem;background:#ff3b30;margin:0;">✕</button>
        </div>

        <!-- Rating info -->
        <div id="pvp-rating-display" style="text-align:center;margin-bottom:16px;padding:12px;background:var(--tma-bg-secondary);border-radius:8px;">
          <div style="font-size:0.75rem;color:var(--tma-text-muted);">Ваш рейтинг</div>
          <div style="font-size:2rem;font-weight:bold;" id="pvp-rating-value">-</div>
          <div style="font-size:0.75rem;color:var(--tma-text-muted);" id="pvp-stats-value">Побед: - | Поражений: -</div>
        </div>

        <!-- Queue controls -->
        <div style="text-align:center;margin-bottom:12px;">
          <div id="pvp-queue-status" class="pvp-status idle">Ожидание</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
            <button class="tma-btn" id="btn-pvp-join-queue" style="padding:10px 24px;font-size:1rem;">🔍 Найти бой</button>
            <button class="tma-btn" id="btn-pvp-leave-queue" style="padding:10px 24px;font-size:1rem;background:#ff3b30;display:none;">Отмена</button>
          </div>
        </div>

        <div style="border-top:1px solid var(--tma-border);padding-top:12px;margin-top:8px;">
          <p style="font-size:0.75rem;color:var(--tma-text-muted);text-align:center;margin:0;">
            После начала битвы выбирайте атаки по очереди.<br>
            Победа повышает рейтинг, поражение — понижает.
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    // Close button
    panel.querySelector('#btn-pvp-panel-close').addEventListener('click', () => {
      panel.style.display = 'none';
    });

    // Join queue
    panel.querySelector('#btn-pvp-join-queue').addEventListener('click', () => {
      joinPvpQueue();
      document.getElementById('btn-pvp-join-queue').style.display = 'none';
      document.getElementById('btn-pvp-leave-queue').style.display = 'inline-block';
    });

    // Leave queue
    panel.querySelector('#btn-pvp-leave-queue').addEventListener('click', () => {
      leavePvpQueue();
      document.getElementById('btn-pvp-join-queue').style.display = 'inline-block';
      document.getElementById('btn-pvp-leave-queue').style.display = 'none';
    });
  }

  // Load rating
  loadPvpRating();

  panel.style.display = 'flex';
}

// Load PvP rating from server
async function loadPvpRating() {
  try {
    const res = await fetch(`${API_BASE}/battle/rating`, {
      headers: getCloudAuthHeaders(),
    });
    const data = await res.json();
    const ratingEl = document.getElementById('pvp-rating-value');
    const statsEl = document.getElementById('pvp-stats-value');
    if (ratingEl) ratingEl.textContent = data.rating ?? 1000;
    if (statsEl) statsEl.textContent = `Побед: ${data.wins || 0} | Поражений: ${data.losses || 0}`;
  } catch (e) {
    console.warn('Failed to load PvP rating:', e);
  }
}

// Set pokemon data for move submission
export function setPvpMonData(monData) {
  pvpMonData = monData;
}

// Set current pokemon in arena display
export function setArenaPokemon(who, monData) {
  const nameEl = document.getElementById(`pvp-${who}-mon-name`);
  const spriteEl = who === 'opp' ? document.getElementById('pvp-opp-sprite') : null;
  if (nameEl && monData) {
    nameEl.textContent = `${monData.name || 'Покемон'} Lv${monData.level || '?'}`;
  }
  if (spriteEl && monData?.sprite) {
    spriteEl.textContent = '';
    spriteEl.innerHTML = `<img src="${monData.sprite}" style="width:64px;height:64px;">`;
  }
  if (monData?.stats) {
    updatePvpHp(who, monData.currentHp || monData.stats.hp, monData.stats.hp);
  }
}

// Add move buttons to the PvP arena
export function setPvpMoveButtons(moves) {
  const container = document.getElementById('pvp-move-buttons');
  if (!container) return;

  container.innerHTML = '';
  if (!moves || moves.length === 0) return;

  moves.forEach((move) => {
    const btn = document.createElement('button');
    btn.className = 'tma-btn';
    btn.textContent = move.name;
    btn.style.fontSize = '0.8rem';
    btn.style.padding = '8px 4px';

    // Type badge
    if (move.type) {
      const typeSpan = document.createElement('span');
      typeSpan.className = `type-badge type-${move.type}`;
      typeSpan.textContent = move.type;
      typeSpan.style.fontSize = '0.6rem';
      typeSpan.style.marginLeft = '4px';
      btn.appendChild(document.createTextNode(' '));
      btn.appendChild(typeSpan);
    }

    btn.addEventListener('click', () => {
      if (!pvpMyTurn) {
        showToast('Сейчас не ваш ход', true);
        return;
      }
      submitPvpMove(move);
      // Disable buttons until next turn
      container.querySelectorAll('button').forEach(b => b.disabled = true);
    });

    container.appendChild(btn);
  });
}
