import { state } from '../game/state.js';
import { trainingStages } from '../data/training.js';
import { natures } from '../data/natures.js';
import { STATUS_NAMES } from '../battle/logic.js';
import { getPowerStars, getRarityStars } from '../utils/state.js';
import { getTypeGradient, getSpriteUrl, getTypeColor } from '../utils/sprite.js';
import { escHtml, renderStars, showSelectionModal, showToast } from '../utils/dom.js';
import { getHeldItemName, openHeldItemPicker, updateDynamicEVs, applyEVs } from './inventory.js';
import { autoSave } from '../game/save.js';

// Lazy load core to avoid circular dep issues
let battleCoreModule: any = null;
async function getBattleCore() {
  if (!battleCoreModule) battleCoreModule = await import('../battle/core.js');
  return battleCoreModule;
}

export function renderTeamGrid() {
  const teamCountEl = document.getElementById('team-count');
  if (teamCountEl) teamCountEl.innerText = `(${state.myTeam.length}/6)`;
  const grid = document.getElementById('team-grid');
  if (!grid) return;
  grid.innerHTML = '';

  getBattleCore().then(bc => {
    for (let i = 0; i < 6; i++) {
      const slot = document.createElement('div');
      if (i < state.myTeam.length) {
        const mon = state.myTeam[i];
        const curLvl = mon.baseLevel + mon.candiesEaten;
        const statusIcon = bc.getStatusIcon(mon.status);
        slot.className = 'team-slot';
        const reorderHtml = (state.myTeam.length > 1) ?
          `<div class="team-reorder">
            ${i > 0 ? `<button class="team-move-btn" data-index="${i}" data-dir="-1" title="Вверх">▲</button>` : '<span></span>'}
            ${i < state.myTeam.length - 1 ? `<button class="team-move-btn" data-index="${i}" data-dir="1" title="Вниз">▼</button>` : '<span></span>'}
          </div>` : '';
        const types = mon.apiData.types;
        const typeBg = getTypeGradient(types);
        const trainStage = mon.trainingStage || 0;
        const trainLabel = trainStage > 0
          ? `<div class="train-label" style="background:${trainingStages[trainStage].color};" title="${trainingStages[trainStage].name} (+${trainingStages[trainStage].pct}%)">${trainingStages[trainStage].name}</div>`
          : '';
        if (mon.isEgg) {
          const eggData = state.eggs.find(e => e.uid === mon.uid);
          if (!eggData) { slot.className = 'team-slot empty'; slot.innerText = 'Пусто'; grid.appendChild(slot); continue; }
          const ready = Date.now() >= eggData.readyTime;
          const remaining = Math.max(0, Math.ceil((eggData.readyTime - Date.now()) / 60000));
          const eggIvs = eggData.ivs || {};
          const geneDisplay = `h${eggIvs.hp || 0}a${eggIvs.atk || 0}d${eggIvs.def || 0}s${eggIvs.spe || 0}sa${eggIvs.spa || 0}sd${eggIvs.spd || 0}`;
          slot.innerHTML = `
            <div class="team-sprite-wrap">
              <img src="assets/egg.png" width="48" height="48" class="sprite-pixel">
            </div>
            <div class="slot-name">Яйцо</div>
            <div class="slot-lvl fs-065">${ready ? 'Вылупляется...' : `Вылупится через ~${remaining} мин`}</div>
            <div class="slot-lvl" style="font-size:0.6rem;color:#4682B4">${geneDisplay}</div>
          `;
        } else {
          const pwStars2 = getPowerStars(mon);
          const rStars2 = getRarityStars(mon);
          slot.innerHTML = `
            ${reorderHtml}
            <div class="team-sprite-wrap">
              <img src="${getSpriteUrl(mon)}" alt="sprite" style="background:${typeBg};">
              ${trainLabel}
            </div>
            <div class="slot-name">${escHtml(mon.nickname || mon.apiData.name)} ${statusIcon}</div>
            <div class="slot-lvl">${renderStars(pwStars2, rStars2)} Lvl ${curLvl} | ${mon.currentHp}/${mon.maxHp} HP</div>
          `;
        }
        slot.setAttribute('data-poke-index', String(i));
        slot.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('.team-move-btn')) return;
          openPokemonProfile(i);
        });
      } else {
        slot.className = 'team-slot empty';
        slot.innerText = 'Пустой слот';
      }
      grid.appendChild(slot);
    }
  });

  // Set up event delegation for reorder buttons if not already done
  if (!(grid as any)._reorderSetup) {
    (grid as any)._reorderSetup = true;
    grid.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.team-move-btn');
      if (!btn) return;
      const idx = parseInt(btn.getAttribute('data-index') || '0');
      const dir = parseInt(btn.getAttribute('data-dir') || '0');
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= state.myTeam.length) return;
      [state.myTeam[idx], state.myTeam[swapIdx]] = [state.myTeam[swapIdx], state.myTeam[idx]];
      renderTeamGrid();
      autoSave();
    });
  }
}

export function openPokemonProfile(index: number) {
  state.currentPokemonIndex = index;
  refreshProfileUI();

  const roster = document.getElementById('team-roster');
  if (roster) roster.style.display = 'none';
  const display = document.getElementById('pokedex-display');
  if (display) display.style.display = 'flex';
}

export function refreshProfileUI() {
  if (state.currentPokemonIndex === null) return;
  const mon = state.myTeam[state.currentPokemonIndex];

  const curLvl = mon.baseLevel + mon.candiesEaten;

  const pokeName = document.getElementById('poke-name');
  if (pokeName) pokeName.innerText = `${mon.nickname || mon.apiData.name} #${mon.apiData.id}`;
  const animSprite = getSpriteUrl(mon);
  const pokeSprite = document.getElementById('poke-sprite') as HTMLImageElement;
  if (pokeSprite) {
    pokeSprite.src = animSprite;
    pokeSprite.style.background = getTypeGradient(mon.apiData.types);
  }

  const typesHtml = mon.apiData.types.map(t => `<span class="type-badge" style="background-color: ${getTypeColor(t.type.name)}">${t.type.name}</span>`).join('');
  const pokeTypes = document.getElementById('poke-types');
  if (pokeTypes) pokeTypes.innerHTML = typesHtml;

  const ability = mon.apiData.abilities.length > 0 ? mon.apiData.abilities[0].ability.name : 'Unknown';
  const abilityEl = document.getElementById('info-ability');
  if (abilityEl) abilityEl.innerText = ability.charAt(0).toUpperCase() + ability.slice(1);
  const tera = mon.apiData.types[0].type.name;
  const teraEl = document.getElementById('info-tera');
  if (teraEl) teraEl.innerText = tera.charAt(0).toUpperCase() + tera.slice(1);

  // Nature display with boosted/reduced stats
  const natureIdx = mon.natureIdx || 0;
  const nature = natures[natureIdx];
  const natureEl = document.getElementById('info-nature');
  if (nature && natureEl) {
    const statNames = { 'atk': 'Атака', 'def': 'Защита', 'spa': 'Сп.Атака', 'spd': 'Сп.Защита', 'spe': 'Скорость' };
    let natureHtml = nature.name;
    if (nature.buff) natureHtml += ` <span style="color:#4ade80">↑${statNames[nature.buff]}</span>`;
    if (nature.nerf) natureHtml += ` <span style="color:#ff6b4a">↓${statNames[nature.nerf]}</span>`;
    natureEl.innerHTML = natureHtml;
  }

  const heldEl = document.getElementById('info-held-item');
  if (heldEl) {
    const heldItemName = getHeldItemName(mon.heldItem);
    heldEl.innerText = heldItemName;
    heldEl.title = 'Нажмите чтобы сменить';
    heldEl.style.cursor = 'pointer';
    heldEl.onclick = () => openHeldItemPicker(state.currentPokemonIndex!);
  }

  const curHpEl = document.getElementById('info-cur-hp');
  if (curHpEl) curHpEl.innerText = String(mon.currentHp);
  const maxHpEl = document.getElementById('info-max-hp');
  if (maxHpEl) maxHpEl.innerText = String(mon.maxHp);

  for(let i=0; i<4; i++) {
    const moveNameEl = document.getElementById(`move-${i}-name`);
    const movePPEl = document.getElementById(`move-${i}-pp`);
    if(mon.apiData.moves[i]) {
      const ppDisplay = (mon.movesPP && mon.movesPP[i]) ? `${mon.movesPP[i].current}/${mon.movesPP[i].max}` : '30/30';
      if (moveNameEl) moveNameEl.innerText = mon.apiData.moves[i].move.name;
      if (movePPEl) movePPEl.innerText = `PP ${ppDisplay}`;
      const moveUrl = mon.apiData.moves[i].move.url;
      if (moveUrl) colorMoveElement(i, moveUrl);
    } else {
      if (moveNameEl) moveNameEl.innerText = '-';
      if (movePPEl) movePPEl.innerText = `PP 0/0`;
    }
  }

  // Learnable moves
  const movesContent = document.getElementById('content-moves');
  if (movesContent) {
    let learnableHTML = '';
    if (mon.learnableMoves && mon.learnableMoves.length > 0) {
      learnableHTML = '<div class="learnable-section mt-12"><h4 class="m-0-0-8 fs-09">📥 Резерв атак:</h4>';
      mon.learnableMoves.forEach((lm, i) => {
        learnableHTML += `<div class="learnable-move flex-between m-4-0 br-6 fs-085" style="padding:6px 8px;background:var(--tma-bg);">
          <span>${lm.name} (⚡${lm.power || '?'} | ${lm.type || '?'})</span>
          <button class="btn-use learn-btn" data-lm="${i}" class="btn-use-learn">Выучить</button>
        </div>`;
      });
      learnableHTML += '</div>';
    }
    // Remove old learnable section if exists
    const oldSec = movesContent.querySelector('.learnable-section');
    if (oldSec) oldSec.remove();
    if (learnableHTML) {
      movesContent.insertAdjacentHTML('beforeend', learnableHTML);
      movesContent.querySelectorAll('.learn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-lm') || '0');
          const move = mon.learnableMoves[idx];
          const slotItems = (mon.apiData.moves || []).map((m, i) => ({
            label: m ? m.move.name : '(пусто)', subtitle: `Слот ${i + 1}`
          }));
          showSelectionModal(`Выучить ${move.name} (⚡${move.power}) в какой слот?`, slotItems, (slotPick) => {
            if (!mon.apiData.moves[slotPick]) mon.apiData.moves[slotPick] = {};
            mon.apiData.moves[slotPick].move = { name: move.name, url: move.url };
            mon.learnableMoves.splice(idx, 1);
            refreshProfileUI();
            showToast(`${move.name} выучено в слот ${slotPick + 1}!`, false);
            autoSave();
          }, true);
        });
      });
    }
  }

  const lvlEl = document.getElementById('info-lvl');
  if (lvlEl) lvlEl.innerText = String(curLvl);
  const statLvlEl = document.getElementById('stat-lvl-display');
  if (statLvlEl) statLvlEl.innerText = String(curLvl);
  const statVitEl = document.getElementById('stat-vit-display');
  if (statVitEl) statVitEl.innerText = `${mon.vitaminsEaten}/10`;

  const ivs = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
  ivs.forEach(stat => {
    const el = document.getElementById(`iv-${stat}`) as HTMLInputElement;
    if (el) el.value = String((mon.ivs as any)[stat]);
  });
  ivs.forEach(stat => {
    const el = document.getElementById(`ev-${stat}`) as HTMLInputElement;
    if (el) el.value = String((mon.evs as any)[stat]);
  });

  updateTrainingUI_Profile(mon);
  updateHappinessUI_Profile(mon);
  updateGenecodeDisplay_Profile(mon);
  updateStatusDisplay_Profile(mon);

  updateDynamicEVs();
  updateStats();
}

export async function colorMoveElement(index: number, moveUrl: string) {
  try {
    if (!state.moveTypeCache.has(moveUrl)) {
      const res = await fetch(moveUrl);
      const data = await res.json();
      state.moveTypeCache.set(moveUrl, data.damage_class?.name || 'status');
    }
    const dc = state.moveTypeCache.get(moveUrl);
    const el = document.getElementById(`move-${index}-name`);
    if (el) el.classList.add(`move-type-${dc}`);
  } catch (e) { /* ignore failed move fetch */ }
}

export function updateStatusDisplay_Profile(mon: any) {
  const el = document.getElementById('profile-status-display');
  if (!el) return;
  getBattleCore().then(bc => {
    if (mon.status) {
      el.innerText = `Статус: ${bc.getStatusIcon(mon.status)} ${STATUS_NAMES[mon.status]}`;
      el.style.display = 'block';
    } else {
      el.style.display = 'none';
    }
  });
}

export function updateTrainingUI_Profile(mon: any) {
  const stageName = trainingStages[mon.trainingStage].name;
  const pct = trainingStages[mon.trainingStage].pct;

  const stageEl = document.getElementById('train-stage');
  if (stageEl) stageEl.innerText = stageName;
  const pctEl = document.getElementById('train-pct');
  if (pctEl) pctEl.innerText = pct > 0 ? `(+${pct}%)` : '';

  const statNames = { 'atk': 'Атака', 'def': 'Защита', 'spa': 'Сп.Атака', 'spd': 'Сп.Защита', 'spe': 'Скорость' };
  const statEl = document.getElementById('train-stat');
  if (statEl) statEl.innerText = mon.trainingStat ? `(${statNames[mon.trainingStat as keyof typeof statNames]})` : '';
}

export function updateHappinessUI_Profile(mon: any) {
  const hapEl = document.getElementById('status-happiness');
  if (hapEl) hapEl.innerText = String(mon.happiness);
  const baseCrit = 7.0;
  const maxCrit = 11.0;
  const currentCrit = baseCrit + ((mon.happiness / 255) * (maxCrit - baseCrit));
  const critEl = document.getElementById('info-crit');
  if (critEl) critEl.innerText = `${currentCrit.toFixed(1)}%`;
}

export function updateGenecodeDisplay_Profile(mon: any) {
  const iv = mon.ivs;
  const genecodeStr = `h${iv.hp}a${iv.atk}d${iv.def}s${iv.spe}sa${iv.spa}sd${iv.spd}`;
  const geneEl = document.getElementById('info-genecode');
  if (geneEl) geneEl.innerText = genecodeStr;
  // Show UID & original trainer
  const uidEl = document.getElementById('info-uid');
  if (uidEl) {
    uidEl.innerText = mon.uid || '?';
    uidEl.title = mon.originalTrainer ? `Тренер ID: ${mon.originalTrainer}` : '';
  }
}

export function saveActiveMonData() {
  if (state.currentPokemonIndex === null) return;
  const mon = state.myTeam[state.currentPokemonIndex];

  const evHp = document.getElementById('ev-hp') as HTMLInputElement;
  const evAtk = document.getElementById('ev-atk') as HTMLInputElement;
  const evDef = document.getElementById('ev-def') as HTMLInputElement;
  const evSpa = document.getElementById('ev-spa') as HTMLInputElement;
  const evSpd = document.getElementById('ev-spd') as HTMLInputElement;
  const evSpe = document.getElementById('ev-spe') as HTMLInputElement;

  mon.evs.hp = parseInt(evHp?.value || '0') || 0;
  mon.evs.atk = parseInt(evAtk?.value || '0') || 0;
  mon.evs.def = parseInt(evDef?.value || '0') || 0;
  mon.evs.spa = parseInt(evSpa?.value || '0') || 0;
  mon.evs.spd = parseInt(evSpd?.value || '0') || 0;
  mon.evs.spe = parseInt(evSpe?.value || '0') || 0;

  const baseHp = mon.apiData.stats[0].base_stat;
  const curLvl = mon.baseLevel + mon.candiesEaten;
  mon.maxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
  if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
  const infoMaxHp = document.getElementById('info-max-hp');
  if (infoMaxHp) infoMaxHp.innerText = String(mon.maxHp);
  const infoCurHp = document.getElementById('info-cur-hp');
  if (infoCurHp) infoCurHp.innerText = String(mon.currentHp);
}

export function initProfileEvents() {
  const evInputs = document.querySelectorAll('.reborn-input-ev');
  evInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const inputEl = e.target as HTMLInputElement;
      let val = parseInt(inputEl.value) || 0;
      if (val < 0) val = 0;
      if (val > 252) val = 252;
      inputEl.value = String(val);
      updateDynamicEVs();
    });
  });

  const applyBtn = document.getElementById('btn-ev-apply');
  if (applyBtn) applyBtn.onclick = () => { applyEVs(); updateStats(); };
}

export function updateStats() {
  if (state.currentPokemonIndex === null) return;
  const mon = state.myTeam[state.currentPokemonIndex];
  const stats = [
    { name: 'hp', el: 'val-hp' },
    { name: 'attack', el: 'val-atk' },
    { name: 'defense', el: 'val-def' },
    { name: 'special-attack', el: 'val-spa' },
    { name: 'special-defense', el: 'val-spd' },
    { name: 'speed', el: 'val-spe' }
  ];
  getBattleCore().then(bc => {
    stats.forEach(s => {
      const val = bc.calculateStat(mon, s.name, false);
      const el = document.getElementById(s.el);
      if (el) el.innerText = String(val);
    });
  });
}

export function initProfileUXEvents() {
  const prevBtn = document.getElementById('btn-prev-mon');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.currentPokemonIndex !== null && state.myTeam.length > 0) {
        state.currentPokemonIndex = (state.currentPokemonIndex - 1 + state.myTeam.length) % state.myTeam.length;
        openPokemonProfile(state.currentPokemonIndex);
      }
    });
  }
  const nextBtn = document.getElementById('btn-next-mon');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.currentPokemonIndex !== null && state.myTeam.length > 0) {
        state.currentPokemonIndex = (state.currentPokemonIndex + 1) % state.myTeam.length;
        openPokemonProfile(state.currentPokemonIndex);
      }
    });
  }

  document.querySelectorAll('.reborn-ev-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.currentPokemonIndex === null) return;
      const mon = state.myTeam[state.currentPokemonIndex];
      const target = e.target as HTMLElement;
      const stat = target.getAttribute('data-stat') || 'hp';
      const valStr = target.getAttribute('data-val') || '0';

      const evs = mon.evs as Record<string, number>;
      let totalEVs = Object.values(evs).reduce((a, b) => a + b, 0);
      let maxTotal = (mon.candiesEaten * 4) + (mon.vitaminsEaten * 10);

      let currentEV = evs[stat] || 0;
      let toAdd = 0;

      if (valStr === 'max') {
        toAdd = Math.min(126 - currentEV, maxTotal - totalEVs);
      } else {
        toAdd = parseInt(valStr);
        if (currentEV + toAdd > 126) toAdd = 126 - currentEV;
        if (totalEVs + toAdd > maxTotal) toAdd = maxTotal - totalEVs;
      }

      if (toAdd > 0) {
        mon.evs[stat] += toAdd;
        refreshProfileUI();
      } else {
        showToast('Нет свободных EV! Дайте покемону Конфеты (+4 EV) или Витамины (+10 EV).', true);
      }
    });
  });
}
