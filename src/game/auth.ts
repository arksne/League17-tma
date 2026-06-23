import { state, lsKey } from './state.js';
import { getCloudAuthHeaders } from './save.js';
import { showToast } from '../utils/dom.js';
import { API_BASE } from './config.js';

export function initTelegram() {
  if ((window as any).Telegram && (window as any).Telegram.WebApp) {
    (window as any).Telegram.WebApp.ready();
  }
}

export function showLoginScreen(message: string, isError: boolean) {
  let overlay = document.getElementById('login-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--tma-bg);z-index:999;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity 0.5s;';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="text-center p-24" style="max-width:320px;">
      <div class="fs-4 mb-16">${isError ? '🔒' : '🐾'}</div>
      <h2 class="m-0-0-8">PokeMatrix</h2>
      <p class="text-muted m-0-0-20 fs-09">${message}</p>
      ${isError ? '<p class="text-muted fs-08">Откройте игру через Telegram бота</p>' : '<div class="login-spinner" style="width:32px;height:32px;border:3px solid var(--tma-border);border-top-color:var(--tma-primary);border-radius:50%;margin:0 auto;animation:spin 0.8s linear infinite;"></div>'}
    </div>
  `;
  overlay.style.display = 'flex';
}

export function hideLoginScreen() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) {
    overlay.style.opacity = '0';
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  }
}

export async function showRegistrationScreen(tgData: any): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.id = 'register-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--tma-bg);z-index:1000;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow-y:auto;padding:20px;';
    overlay.innerHTML = `
      <div class="text-center w-full" style="max-width:360px;">
        <div class="fs-4 mb-8">👋</div>
        <h2 class="m-0-0-4">Добро пожаловать!</h2>
        <p class="text-muted" style="margin:0 0 20px;font-size:0.85rem;">Давай создадим твой профиль тренера</p>

        <div class="text-left mb-16">
          <label class="text-muted fs-08">Прозвище тренера</label>
          <input id="reg-nickname" type="text" value="${tgData.first_name || tgData.username || ''}" maxlength="20" class="w-full p-10 m-4-0-12 border-card fs-1" style="color:var(--tma-text);">

          <label class="text-muted fs-08">Аватар</label>
          <div class="d-flex flex-gap-8" style="margin:4px 0 8px;">
            <div id="reg-avatar-preview" style="width:56px;height:56px;border-radius:50%;background:var(--tma-card-bg);display:flex;align-items:center;justify-content:center;font-size:2rem;border:2px solid var(--tma-primary);flex-shrink:0;">👤</div>
            <input type="file" id="reg-avatar-file" accept="image/*" style="display:none;">
            <button class="tma-btn" id="reg-avatar-camera" style="padding:8px 12px;font-size:0.8rem;background:var(--tma-card-bg);">📷 Фото</button>
          </div>
          <div id="reg-avatars" class="d-flex flex-wrap gap-6 m-4-0-12">
            ${['👤','🧑','👨‍🔬','🎩','🧢','🎓','👑','🤠','🦸','🧙','😎','🤖','👻','🐱','🐶'].map(a => `<span class="reg-avatar-opt" data-av="${a}" style="font-size:1.8rem;cursor:pointer;padding:4px;border-radius:8px;border:2px solid transparent;">${a}</span>`).join('')}
          </div>

        </div>

        <button class="tma-btn w-full p-12 fs-1" id="btn-register" style="background:#34c759;">🎮 Начать приключение!</button>
        <p id="reg-error" class="fs-08 mt-8" style="color:#ff3b30;display:none;"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    let selectedAvatar = '👤';
    let customAvatarData: any = null;

    // Camera/gallery upload
    const cameraBtn = document.getElementById('reg-avatar-camera');
    const fileInput = document.getElementById('reg-avatar-file') as HTMLInputElement;
    if (cameraBtn && fileInput) {
      cameraBtn.addEventListener('click', () => {
        fileInput.click();
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          customAvatarData = ev.target?.result;
          const preview = document.getElementById('reg-avatar-preview');
          if (preview) preview.innerHTML = `<img src="${customAvatarData}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
          selectedAvatar = '__custom__';
          overlay.querySelectorAll('.reg-avatar-opt').forEach(el => (el as HTMLElement).style.borderColor = 'transparent');
        };
        reader.readAsDataURL(file);
      });
    }

    overlay.querySelectorAll('.reg-avatar-opt').forEach(el => {
      el.addEventListener('click', () => {
        overlay.querySelectorAll('.reg-avatar-opt').forEach(e => (e as HTMLElement).style.borderColor = 'transparent');
        (el as HTMLElement).style.borderColor = 'var(--tma-primary)';
        selectedAvatar = el.getAttribute('data-av') || '👤';
      });
    });

    const regBtn = document.getElementById('btn-register');
    if (regBtn) {
      regBtn.addEventListener('click', async () => {
        const nickInput = document.getElementById('reg-nickname') as HTMLInputElement;
        const nickname = nickInput ? nickInput.value.trim() : '';
        const regError = document.getElementById('reg-error');
        if (!nickname) {
          if (regError) {
            regError.style.display = 'block';
            regError.textContent = 'Введи прозвище!';
          }
          return;
        }

        try {
          // Upload custom avatar first if selected
          let finalAvatar = selectedAvatar;
          if (customAvatarData) {
            const upRes = await fetch('/api/auth/avatar', {
              method: 'POST',
              headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: customAvatarData })
            });
            if (upRes.ok) {
              const upData = await upRes.json();
              finalAvatar = upData.avatarUrl;
            }
          }

          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname, avatar: finalAvatar })
          });
          state.trainerNickname = nickname;
          localStorage.setItem(lsKey('avatar'), selectedAvatar);
          localStorage.setItem(lsKey('nickname_'), nickname);
          state.tgUser.registered = 1;
          overlay.style.opacity = '0';
          overlay.style.transition = 'opacity 0.5s';
          setTimeout(() => { overlay.remove(); resolve(true); }, 500);
        } catch(e) {
          if (regError) {
            regError.style.display = 'block';
            regError.textContent = 'Ошибка сервера';
          }
        }
      });
    }
  });
}

export async function authTelegram() {
  initTelegram();
  showLoginScreen('Авторизация через Telegram...', false);

  // Dev mode: allow localhost testing without Telegram
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const devMode = new URLSearchParams(window.location.search).has('dev');

  if (!(window as any).Telegram || !(window as any).Telegram.WebApp) {
    if (isLocalhost || devMode) {
      console.log('🔧 Dev mode: bypassing Telegram auth');
    } else {
      showLoginScreen('Игра доступна только через Telegram Mini App. Откройте через бота.', true);
      return;
    }
  }

  if (!(window as any).Telegram?.WebApp?.initData) {
    if (isLocalhost || devMode) {
      console.log('🔧 Dev mode: no initData, using test');
    } else {
      // Try expanding the TMA — some clients initData is delayed
      try { (window as any).Telegram.WebApp.ready(); } catch(_) {}
      // Give a brief moment for initData to become available
      await new Promise(r => setTimeout(r, 300));
      if (!(window as any).Telegram?.WebApp?.initData) {
        showLoginScreen('Ошибка инициализации Telegram. Попробуйте перезапустить бота.', true);
        return;
      }
    }
  }

  try {
    // In dev mode, use injected Telegram data (for multi-trainer testing) or fall back to 'test'
    let initData: string;
    if (isLocalhost || devMode) {
      initData = (window as any).Telegram?.WebApp?.initData || 'test';
    } else {
      initData = (window as any).Telegram.WebApp.initData;
    }

    // Create abort controller with 15s timeout to prevent indefinite hang
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${API_BASE}/auth/tg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: initData }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      showLoginScreen('Ошибка авторизации. Попробуйте перезапустить бота.', true);
      return;
    }
    const data = await res.json();
    state.tgToken = data.token;
    state.tgUser = data.user;
    localStorage.setItem('league17_trainer_id', String(state.tgUser.id));

    hideLoginScreen();

    // Check if registration needed — wait for it
    if (!data.user.registered) {
      await showRegistrationScreen(data.user);
      // Reload user data after registration
      state.tgUser.registered = 1;
    }

    // Check admin status from server
    try {
      const adminRes = await fetch(`${API_BASE}/auth/is-admin`, {
        headers: getCloudAuthHeaders()
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        state.isAdmin = adminData.isAdmin;
      }
    } catch(_) { /* admin check failure is non-fatal */ }
  } catch (e: any) {
    console.warn('Auth failed (offline?)', e);
    // Report the error to the server for diagnostics
    try {
      navigator.sendBeacon('/api/log-client-error', JSON.stringify({
        msg: 'Auth fetch failed: ' + (e?.name || e?.message || 'unknown'),
        stack: e?.stack || '', url: location.href, time: Date.now()
      }));
    } catch(_) {}
    if (e?.name === 'AbortError') {
      showLoginScreen('Сервер не отвечает (таймаут). Попробуйте позже.', true);
    } else {
      showLoginScreen('Нет соединения с сервером. Проверьте интернет.', true);
    }
  }
}
