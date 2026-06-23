// DOM utilities — no dependencies on main.js or core.js

export function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

export function showToast(msg, isError) {
  let toast = document.getElementById('trade-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'trade-toast';
    toast.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);padding:10px 24px;border-radius:8px;font-weight:600;font-size:0.9rem;z-index:300;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.style.background = isError ? '#ff3b30' : '#34c759';
  toast.style.color = '#fff';
  toast.textContent = msg;
  toast.style.opacity = '1';
  const tid = (toast as any)._timeout;
  if (tid) clearTimeout(tid);
  (toast as any)._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

export function showConfirmModal(title, message, onConfirm?, onCancel?) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="confirm-modal-card">
      <h3>${escHtml(title)}</h3>
      <p>${escHtml(message)}</p>
      <div class="confirm-modal-buttons">
        <button class="confirm-btn confirm-btn-yes" id="confirm-yes">Да</button>
        <button class="confirm-btn confirm-btn-no" id="confirm-no">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    if (yesBtn) yesBtn.removeEventListener('click', onYes);
    if (noBtn) noBtn.removeEventListener('click', onNo);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onYes = () => { cleanup(); if (onConfirm) onConfirm(); };
  const onNo = () => { cleanup(); if (onCancel) onCancel(); };
  const onOverlay = (e) => { if (e.target === modal) onNo(); };

  document.getElementById('confirm-yes').addEventListener('click', onYes);
  document.getElementById('confirm-no').addEventListener('click', onNo);
  modal.addEventListener('click', onOverlay);
}

export function showSelectionModal(title, items, callback, allowCancel?) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  const itemsHTML = items.map((item, i) => `
    <button class="selection-item-btn" data-index="${i}">
      ${item.label}
      ${item.subtitle ? `<span class="item-subtitle">${escHtml(item.subtitle)}</span>` : ''}
    </button>
  `).join('');
  modal.innerHTML = `
    <div class="selection-modal-card">
      <h3>${escHtml(title)}</h3>
      <div class="selection-items">${itemsHTML}</div>
      ${allowCancel ? '<button class="confirm-btn confirm-btn-no" id="selection-cancel" style="width:100%;margin-top:8px;">Отмена</button>' : ''}
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    modal.querySelectorAll('.selection-item-btn').forEach(btn => {
      btn.removeEventListener('click', onItemClick);
    });
    if (allowCancel) {
      const cancelBtn = document.getElementById('selection-cancel');
      if (cancelBtn) cancelBtn.removeEventListener('click', onCancelClick);
    }
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };

  const onItemClick = (e) => {
    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
    cleanup();
    if (callback) callback(idx);
  };
  const onCancelClick = () => { cleanup(); };
  const onOverlay = (e) => { if (e.target === modal) { cleanup(); } };

  modal.querySelectorAll('.selection-item-btn').forEach(btn => {
    btn.addEventListener('click', onItemClick);
  });
  if (allowCancel) {
    document.getElementById('selection-cancel').addEventListener('click', onCancelClick);
  }
  modal.addEventListener('click', onOverlay);
}

export function showTextInputModal(title, defaultText, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="selection-modal-card">
      <h3>${escHtml(title)}</h3>
      <input type="text" class="text-input-modal" id="text-input-field" value="${escHtml(defaultText || '')}" maxlength="20" autocomplete="off">
      <div class="confirm-modal-buttons" style="margin-top:12px;">
        <button class="confirm-btn confirm-btn-yes" id="text-input-ok">OK</button>
        <button class="confirm-btn confirm-btn-no" id="text-input-cancel">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const input = document.getElementById('text-input-field') as HTMLInputElement;
  input.focus();
  input.select();

  const cleanup = () => {
    document.getElementById('text-input-ok').removeEventListener('click', onOk);
    document.getElementById('text-input-cancel').removeEventListener('click', onCancel);
    modal.removeEventListener('click', onOverlay);
    input.removeEventListener('keydown', onKey);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const submit = () => {
    const val = input.value.trim();
    cleanup();
    if (callback && val) callback(val);
  };
  const onOk = () => submit();
  const onCancel = () => { cleanup(); };
  const onOverlay = (e) => { if (e.target === modal) { cleanup(); } };
  const onKey = (e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') cleanup(); };

  document.getElementById('text-input-ok').addEventListener('click', onOk);
  document.getElementById('text-input-cancel').addEventListener('click', onCancel);
  modal.addEventListener('click', onOverlay);
  input.addEventListener('keydown', onKey);
}

export function renderStars(powerStars, rarityStars) {
  const p = powerStars || 0;
  const r = rarityStars || 0;
  const gold = '★'.repeat(p) + '☆'.repeat(10 - p);
  const black = '✦'.repeat(r) + '✧'.repeat(5 - r);
  return `<span style="color:#ff9500;font-size:0.55rem;" title="Мощь: ${p}/10">${gold}</span> <span style="color:#333;font-size:0.55rem;" title="Редкость: ${r}/5">${black}</span>`;
}
