import { state } from '../game/state.js';
import { store } from '../game/store.js';
import { showToast, showConfirmModal } from '../utils/dom.js';
import { getStatusIcon } from '../battle/core.js';
import { getTypeColor, getSpriteUrl } from '../utils/sprite.js';
import { trainingStages } from '../data/training.js';
import { hatchEgg, checkBreeding, collectEgg } from './daycare.js';
import { battle } from '../battle/core.js';

function showPCInfoModal(mon: any) {
  const curLvl = mon.baseLevel + (mon.candiesEaten || 0);
  const types = mon.apiData?.types?.map((t: any) => t.type.name).join(', ') || '?';
  const ability = mon.abilityName || mon.apiData?.abilities?.[0]?.ability?.name || '-';
  const sprite = getSpriteUrl(mon);
  const moves = (mon.apiData?.moves || []).filter((m: any) => m).map((m: any) => m.move.name).join(', ') || 'Нет атак';
  const ivs = mon.ivs || {};

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="selection-modal-card text-center">
      <img src="${sprite}" class="sprite-pixel" style="width:96px;height:96px;" onerror="this.style.display='none'">
      <h3 class="m-8-0">${mon.nickname || mon.apiData?.name || '???'} <span class="text-muted">Lv.${curLvl}</span></h3>
      <p class="text-muted" class="m-4-0">Тип: ${types} | Способность: ${ability}</p>
      <p class="m-4-0">HP: ${mon.currentHp}/${mon.maxHp} | Статус: ${getStatusIcon(mon.status) || 'нет'}</p>
      <div class="text-muted fs-08 m-8-0">
        <b>IV:</b> HP:${ivs.hp||0} АТК:${ivs.atk||0} ЗАЩ:${ivs.def||0} СП.АТК:${ivs.spa||0} СП.ЗАЩ:${ivs.spd||0} СКОР:${ivs.spe||0}
      </div>
      <p class="text-muted" class="fs-08">Атаки: ${moves}</p>
      ${mon.trainingStage > 0 ? `<p style="font-size:0.8rem;color:${trainingStages[mon.trainingStage].color};">Тренировка: ${trainingStages[mon.trainingStage].name} (+${trainingStages[mon.trainingStage].pct}%)</p>` : ''}
      <button class="tma-btn w-full mt-12" id="btn-pc-info-close">Закрыть</button>
    </div>
  `;
  document.body.appendChild(modal);

  const cleanup = () => {
    document.getElementById('btn-pc-info-close')?.removeEventListener('click', cleanup);
    modal.removeEventListener('click', onOverlay);
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  const onOverlay = (e: any) => { if (e.target === modal) cleanup(); };

  document.getElementById('btn-pc-info-close')!.addEventListener('click', cleanup);
  modal.addEventListener('click', onOverlay);
}

export function openPC() {
  const modal = document.getElementById('pc-modal');
  const tabsContainer = document.getElementById('pc-tabs')!;
  const slotsContainer = document.getElementById('pc-slots')!;
  const teamCount = document.getElementById('pc-team-count')!;
  teamCount.innerText = `(В команде: ${state.myTeam.length}/6)`;

  const breedingBoxes = new Set(state.breedingPairs.map((p: any) => p.boxIdx));
  const eggBoxes = new Set(state.eggs.filter((e: any) => e.boxIdx !== undefined).map((e: any) => e.boxIdx));
  tabsContainer.innerHTML = '<span class="pc-tab active" data-box="team">Команда</span>';
  state.pcBoxes.forEach((box: any, i: number) => {
    const breedIcon = breedingBoxes.has(i) ? ' ❤️' : '';
    const eggIcon = eggBoxes.has(i) ? ' 🥚' : '';
    tabsContainer.innerHTML += `<span class="pc-tab" data-box="${i}">Бокс ${i + 1}${breedIcon}${eggIcon}</span>`;
  });
  tabsContainer.innerHTML += '<span class="pc-tab" id="btn-pc-new-box">+ Новый бокс</span>';

  tabsContainer.querySelectorAll('.pc-tab').forEach(tab => {
    (tab as HTMLElement).onclick = () => {
      tabsContainer.querySelectorAll('.pc-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderPCSlots((tab as HTMLElement).dataset.box);
    };
  });

  (document.getElementById('btn-pc-new-box') as HTMLElement).onclick = () => {
    state.pcBoxes.push([]);
    openPC();
  };

  renderPCSlots('team');
  modal!.style.display = 'flex';
  checkBreeding();

  const closeBtn = document.getElementById('btn-pc-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal!.style.display = 'none';
      store.emit('team:render');
      store.emit('save');
    };
  }
}

function renderPCSlots(view: string) {
  const container = document.getElementById('pc-slots')!;
  container.innerHTML = '';

  if (view === 'team') {
    state.myTeam.forEach((mon: any, i: number) => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      const spriteUrl = getSpriteUrl(mon);
      div.innerHTML = `
        <img src="${spriteUrl}" width="40" height="40" onerror="this.style.display='none'">
        <div class="pc-slot-info">
          <b>Lv.${mon.baseLevel + mon.candiesEaten} ${mon.name || mon.apiData?.name}</b>
          <span>HP: ${mon.currentHp}/${mon.maxHp}</span>
        </div>
        <button class="btn-use" class="btn-use-pc">В PC</button>
      `;
      div.querySelector('button')!.onclick = () => {
        if (state.myTeam.length <= 1) { showToast('Нельзя оставить команду пустой!', true); return; }
        const targetBox = state.pcBoxes.length > 0 ? 0 : (state.pcBoxes.push([]), 0);
        const movedMon = state.myTeam.splice(i, 1)[0];
        state.pcBoxes[targetBox].push(movedMon);
        if (typeof (battle as any).state.activePlayerMon !== 'undefined' && (battle as any).state.activePlayerMon && (battle as any).state.activePlayerMon === mon && state.myTeam.length > 0) {
          (battle as any).state.activePlayerMon = state.myTeam[0];
        }
        openPC();
      };
      container.appendChild(div);
    });
  } else {
    const boxIdx = parseInt(view);
    const box = state.pcBoxes[boxIdx];
    if (!box) return;

    const pair = state.breedingPairs.find((p: any) => p.boxIdx === boxIdx);
    if (pair) {
      const remaining = Math.max(0, Math.ceil((pair.readyTime - Date.now()) / 60000));
      const progressDiv = document.createElement('div');
      progressDiv.style.cssText = 'text-align:center;padding:8px;margin-bottom:8px;background:#ff950022;border:1px solid #ff9500;border-radius:8px;font-size:0.9rem;';
      progressDiv.innerText = `❤️ Пара найдена! Яйцо через ~${remaining} мин.`;
      container.appendChild(progressDiv);
    } else {
      const breedable = box.filter((m: any) => m.apiData);
      if (breedable.length >= 2) {
        const hintDiv = document.createElement('div');
        hintDiv.className = 'text-muted';
        hintDiv.style.cssText = 'text-align:center;padding:6px;margin-bottom:8px;font-size:0.8rem;border:1px dashed #555;border-radius:8px;';
        hintDiv.innerText = '💕 В этом боксе есть покемоны, но пара ещё не образовалась. Попробуйте переместить их или закройте/откройте PC.';
        container.appendChild(hintDiv);
      }
    }

    const boxEggs = state.eggs.filter((e: any) => e.boxIdx === boxIdx);
    boxEggs.forEach((egg: any) => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      const eggTypes = egg.types || [{ type: { name: 'normal' } }];
      const eggColor = getTypeColor(eggTypes[0]?.type?.name || 'normal');
      div.style.background = `${eggColor}22`;
      div.style.borderColor = eggColor;
      const remaining = Math.max(0, Math.ceil((egg.readyTime - Date.now()) / (24*60*60*1000)));
      const ready = Date.now() >= egg.readyTime;
      const iv = egg.ivs || {};
      const geneStr = `h${iv.hp || 0}a${iv.atk || 0}d${iv.def || 0}s${iv.spe || 0}sa${iv.spa || 0}sd${iv.spd || 0}`;
      div.innerHTML = `
        <img src="assets/egg.png" width="32" height="32" class="sprite-pixel">
        <div class="pc-slot-info">
          <b>Яйцо ${egg.species ? `(${egg.species})` : ''}</b>
          <span style="color:${eggColor};font-size:0.75rem;">${geneStr}</span>
          <span style="color:#ffd700;font-size:0.7rem;">${ready ? 'Готово!' : `~${remaining} дн`}</span>
        </div>
        <div class="pc-slot-actions">
          <button class="btn-use" data-egg-id="${egg.uid}">Забрать</button>
          ${ready ? '<button class="btn-use">Вылупить</button>' : ''}
        </div>
      `;
      (div.querySelector('[data-egg-id]') as HTMLButtonElement).onclick = () => {
        collectEgg(egg.uid);
        openPC();
      };
      if (ready) {
        (div.querySelectorAll('button')[1]!).onclick = async () => {
          await hatchEgg(egg);
          openPC();
        };
      }
    });

    box.forEach((mon: any, i: number) => {
      const div = document.createElement('div');
      div.className = 'pc-slot';
      const spriteUrl = getSpriteUrl(mon);
      div.innerHTML = `
        <img src="${spriteUrl}" width="40" height="40" onerror="this.style.display='none'">
        <div class="pc-slot-info">
          <b>Lv.${mon.baseLevel + mon.candiesEaten} ${mon.name || mon.apiData?.name}</b>
          <span>HP: ${mon.currentHp}/${mon.maxHp}</span>
          <span class="text-muted" class="fs-07">${mon.apiData?.types?.map((t: any) => t.type.name).join('/') || ''}</span>
        </div>
        <div class="pc-slot-actions">
          <button class="btn-use" class="btn-use-info" title="Инфо">ℹ</button>
          <button class="btn-use" class="btn-use-team">В команду</button>
          <button class="btn-use" class="btn-use-release">Отп.</button>
        </div>
      `;
      const [btnInfo, btnTeam, btnRelease] = div.querySelectorAll('button');
      btnInfo.onclick = () => { showPCInfoModal(mon); };
      btnTeam.onclick = () => {
        if (state.myTeam.length >= 6) { showToast('Команда полна (6/6)! Освободите место.', true); return; }
        const movedMon = box.splice(i, 1)[0];
        state.myTeam.push(movedMon);
        if (box.length === 0) { state.pcBoxes.splice(boxIdx, 1); }
        openPC();
      };
      btnRelease.onclick = () => {
        showConfirmModal('Отпустить покемона?', `${mon.name || mon.apiData?.name} будет отпущен навсегда. Это нельзя отменить.`, () => {
          box.splice(i, 1);
          if (box.length === 0) { state.pcBoxes.splice(boxIdx, 1); }
          openPC();
        });
      };
      container.appendChild(div);
    });
  }
}
