import { state } from '../game/state.js';
import { store } from '../game/store.js';

export function addNotification(title: string, text: string) {
  state.notifications.unshift({ id: Date.now(), title, text, time: new Date().toISOString(), read: false });
  if (state.notifications.length > 50) state.notifications.length = 50;
  updateNotifBadge();
  store.emit('save');
}

export function updateNotifBadge() {
  const unread = state.notifications.filter((n: any) => !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = String(unread || '');
    badge.style.display = unread > 0 ? '' : 'none';
  }
}

export function openNotifications() {
  const modal = document.getElementById('notif-modal');
  if (!modal) return;
  const list = document.getElementById('notif-list');
  list!.innerHTML = state.notifications.length === 0
    ? '<div class="text-center text-muted" class="p-20">Нет уведомлений</div>'
    : state.notifications.map((n: any) => `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <b>${n.title}</b>
        <p>${n.text}</p>
        <small>${new Date(n.time).toLocaleString('ru')}</small>
      </div>
    `).join('');
  state.notifications.forEach((n: any) => n.read = true);
  updateNotifBadge();
  modal.style.display = 'flex';
}
