import { 
  API_BASE, socket, openTrainerProfile, getCloudAuthHeaders 
} from '../../main.js';

// FEATURE: CHAT SYSTEM
// ================================================================
let chatPollingInterval = null;
let chatLastTimestamp = null;

export async function loadChatMessages() {
  try {
    const url = chatLastTimestamp
      ? `${API_BASE}/chat/messages?since=${encodeURIComponent(chatLastTimestamp)}`
      : `${API_BASE}/chat/messages`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.messages) return;

    const container = document.getElementById('chat-messages');
    if (!chatLastTimestamp && data.messages.length > 0) {
      container.innerHTML = '';
    }

    data.messages.forEach(msg => {
      renderChatMessage(msg, container);
      chatLastTimestamp = msg.created_at;
    });

    container.scrollTop = container.scrollHeight;
  } catch (e) {
    console.warn('Chat load failed', e);
  }
}

function renderChatMessage(msg, container) {
  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.setAttribute('data-msg-id', msg.id);
  const name = msg.first_name || msg.username || `Trainer#${msg.user_id}`;
  const time = msg.created_at ? msg.created_at.slice(11, 16) : '';
  div.innerHTML = `<span class="chat-msg-username" data-user-id="${msg.user_id}">${escapeHtml(name)}:</span><span class="chat-msg-text">${escapeHtml(msg.text)}</span><span class="chat-msg-time">${time}</span>`;
  container.appendChild(div);

  // Click on username -> show trainer profile
  const usernameEl = div.querySelector('.chat-msg-username');
  usernameEl.addEventListener('click', () => openTrainerProfile(msg.user_id));
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export function startChatPolling() {
  stopChatPolling();
  chatPollingInterval = setInterval(loadChatMessages, 30000); // fallback poll every 30s
}

// Listen for real-time chat messages via socket
export function initChatSocket() {
  if (!socket) return;
  socket.off('chat_message');
  socket.on('chat_message', (msg) => {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    // Avoid duplicates if we also poll
    const existing = container.querySelector(`[data-msg-id="${msg.id}"]`);
    if (existing) return;
    renderChatMessage(msg, container);
    container.scrollTop = container.scrollHeight;
    chatLastTimestamp = msg.created_at;
  });
}

export function stopChatPolling() {
  if (chatPollingInterval) {
    clearInterval(chatPollingInterval);
    chatPollingInterval = null;
  }
}

export async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const headers = getCloudAuthHeaders();
  if (!headers.Authorization) {
    input.value = '';
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-system-msg';
    div.innerText = 'Авторизуйтесь через Telegram для отправки сообщений';
    container.appendChild(div);
    return;
  }

  try {
    await fetch(`${API_BASE}/chat/send`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    input.value = '';
    await loadChatMessages();
  } catch (e) {
    console.warn('Chat send failed', e);
  }
}

