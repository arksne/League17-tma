import { getSocialState, setTrainerNickname } from '../game/getters.js';
import { openTrainerProfile } from '../social/trainer-profile.js';
import { lsKey } from '../game/state.js';
import { renderTrainerCard } from './trainer-card.js';
import { autoSave } from '../game/save.js';
import { showToast, escHtml } from '../utils/dom.js';

// TRAINERS TAB — all visitors + account
// ================================================================
let trainersAllData = [];

export async function loadAllTrainers() {
  const listEl = document.getElementById('trainers-all-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:20px;">Загрузка...</div>';
  try {
    const res = await fetch('/api/profile/trainers/all');
    const data = await res.json();
    trainersAllData = data.users || [];
    if (trainersAllData.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:30px;">Нет тренеров</div>';
      return;
    }
    listEl.innerHTML = '';
    trainersAllData.forEach(u => {
      const card = document.createElement('div');
      card.className = 'trainer-list-card';
      const avatarHtml = (u.avatar && u.avatar.startsWith('/avatars/'))
        ? `<img src="${u.avatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
        : `<span style="font-size:1.5rem;">${u.avatar || '👤'}</span>`;
      const lastSeen = u.lastSeen ? u.lastSeen.slice(0,16).replace('T',' ') : u.created_at?.slice(0,10) || '';
      const isOnline = getSocialState().onlinePlayersList.some(p => p.userId === u.id);
      const onlineDot = isOnline
        ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34c759;margin-right:4px;box-shadow:0 0 4px #34c759;"></span>'
        : '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#555;margin-right:4px;"></span>';
      card.innerHTML = `
        <div class="trainer-list-avatar">${avatarHtml}</div>
        <div class="trainer-list-info">
          <div class="trainer-list-name">${onlineDot}${escHtml(u.nickname || u.first_name || u.username || 'Тренер')} ${u.registered ? '✅' : '🆕'}</div>
          <div class="trainer-list-id">🏅${u.badges||0} | 🐾${u.teamSize||0}</div>
          <div class="trainer-list-id">📍${u.region || '?'} | 🕐${lastSeen}</div>
        </div>`;
      card.addEventListener('click', () => openTrainerProfile(u.id));
      listEl.appendChild(card);
    });
  } catch(e) { listEl.innerHTML = '<div style="text-align:center;color:var(--tma-text-muted);padding:20px;">Ошибка загрузки</div>'; }
}

export function initTrainersTab() {
  // Tab switching
  document.querySelectorAll('.trainers-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.trainers-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const panel = tab.getAttribute('data-tab');
      document.getElementById('trainers-all-panel').style.display = panel === 'all' ? 'block' : 'none';
      document.getElementById('trainers-account-panel').style.display = panel === 'account' ? 'block' : 'none';
      if (panel === 'all') loadAllTrainers();
      if (panel === 'account') showAccountPanel();
    });
  });

  // Account save
  const saveBtn = document.getElementById('btn-account-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      setTrainerNickname((document.getElementById('account-nickname') as HTMLInputElement).value.trim());
      const avatar = (document.getElementById('account-avatar-select') as HTMLSelectElement).value;
      localStorage.setItem(lsKey('avatar'), avatar);
      localStorage.setItem(lsKey('nickname_'), getSocialState().trainerNickname);
      showAccountPanel();
      renderTrainerCard();
      autoSave();
      showToast('Сохранено!', false);
    });
  }
}

export function showAccountPanel() {
  document.getElementById('account-avatar').textContent = localStorage.getItem(lsKey('avatar')) || '👤';
  document.getElementById('account-name').textContent = getSocialState().trainerNickname || getSocialState().tgUser?.first_name || 'Тренер';
  document.getElementById('account-id').textContent = `Telegram ID: ${getSocialState().tgUser?.id || '?'}`;
  (document.getElementById('account-nickname') as HTMLInputElement).value = getSocialState().trainerNickname || '';
  (document.getElementById('account-avatar-select') as HTMLSelectElement).value = localStorage.getItem(lsKey('avatar')) || '👤';
}

