import {
  getTeamState, getInvState, toggleExpShare, 
  addItem, removeItem, getItemQty, itemDef,
  showToast, showConfirmModal, showSelectionModal,
  refreshProfileUI, checkEvolution, triggerEvolution,
  cureStatus, openCrafting, openMoveRelearner,
  hatchEgg, giveBerryToMon, autoSave,
  saveActiveMonData, showItemInfoModal
} from '../../main.js';
import { natures } from '../data/natures.js';

export function initInventoryEvents() {
  // QA button handlers now useItem()
  const qaMap = {
    'qa-potion': 'potion', 'qa-candy': 'candy', 'qa-vitamin': 'vitamin',
    'qa-train': 'train', 'qa-weaken': 'weaken',
    'qa-super-potion': 'superPotion', 'qa-full-restore': 'fullRestore',
    'qa-evolution-stone': 'evolutionStone', 'qa-tm': 'tm',
  };
  for (const [btnId, itemId] of Object.entries(qaMap)) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener('click', () => useItem(itemId));
    }
  }
}

export function updateDynamicEVs(changedInput = null) {
  if (getTeamState().currentPokemonIndex === null) return;
  const mon = getTeamState().myTeam[getTeamState().currentPokemonIndex];

  const maxTotalEV = (mon.candiesEaten * 4) + (mon.vitaminsEaten * 10);
  document.getElementById('ev-total').innerText = maxTotalEV;

  const evInputs = document.querySelectorAll('.reborn-input-ev');
  let currentTotal = 0;
  evInputs.forEach(input => currentTotal += parseInt(input.value) || 0);

  if (currentTotal > maxTotalEV) {
    let diff = currentTotal - maxTotalEV;
    if (changedInput && parseInt(changedInput.value) >= diff) {
      changedInput.value = parseInt(changedInput.value) - diff;
      currentTotal -= diff;
    } else {
      document.querySelectorAll('.reborn-input-ev').forEach(input => {
        let val = parseInt(input.value) || 0;
        if (val > 0 && diff > 0) {
          let toSubtract = Math.min(val, diff);
          input.value = val - toSubtract;
          diff -= toSubtract;
          currentTotal -= toSubtract;
        }
      });
    }
    saveActiveMonData();
  }

  document.getElementById('ev-remaining').innerText = maxTotalEV - currentTotal;
}

function updateStats() {
  if (getTeamState().currentPokemonIndex === null) return;
  const mon = getTeamState().myTeam[getTeamState().currentPokemonIndex];

  const localNature = natures[mon.natureIdx];
  document.getElementById('info-nature').innerText = localNature.name.split(' ')[1].replace(/[()]/g, '');

  const statsMapping = {
    'hp': { idx: 0, el: 'hp' },
    'attack': { idx: 1, el: 'atk' },
    'defense': { idx: 2, el: 'def' },
    'special-attack': { idx: 3, el: 'spa' },
    'special-defense': { idx: 4, el: 'spd' },
    'speed': { idx: 5, el: 'spe' }
  };

  const trainPct = getInvState().trainingStages[mon.trainingStage].pct / 100;
  const curLvl = mon.baseLevel + mon.candiesEaten;

  for (const [statName, info] of Object.entries(statsMapping)) {
    const baseStat = mon.apiData.stats[info.idx].base_stat;
    const ev = mon.evs[info.el];
    const iv = mon.ivs[info.el];

    let natureMod = 1.0;
    let isTrained = false;

    const labelEl = document.getElementById(`label-${info.el}`);
    if (labelEl) {
      labelEl.className = 'stat-name';
      if (localNature.buff === info.el) {
        natureMod = 1.1;
        labelEl.classList.add('nature-buff');
      } else if (localNature.nerf === info.el) {
        natureMod = 0.9;
        labelEl.classList.add('nature-nerf');
      }

      if (mon.trainingStat === info.el) {
        isTrained = true;
      }
    }

    let finalStat = 0;
    if (statName === 'hp') {
      finalStat = Math.floor(0.01 * (2 * baseStat + iv + Math.floor(0.25 * ev)) * curLvl) + curLvl + 10;
    } else {
      finalStat = Math.floor(Math.floor(0.01 * (2 * baseStat + iv + Math.floor(0.25 * ev)) * curLvl) + 5);
      finalStat = Math.floor(finalStat * natureMod);

      if (isTrained) {
        finalStat = Math.floor(finalStat * (1 + trainPct));
      }
    }

    document.getElementById(`val-${info.el}`).innerText = finalStat;

    const valEl = document.getElementById(`val-${info.el}`);
    if (valEl) {
      if (isTrained) {
        valEl.style.color = '#34c759';
        valEl.title = 'Натренировано';
      } else {
        valEl.style.color = '';
        valEl.title = '';
      }
    }
  }
}

export function updateInventoryDisplay() {
  renderInventory();
  renderBattleItemSelect();
  updateQADisplays();
}

export function renderBattleItemSelect() {
  const select = document.getElementById('battle-item-select');
  if (!select) return;
  select.innerHTML = '';
  const battleItems = getInvState().ITEMS.filter(i => i.implemented && getItemQty(i.id) > 0 && (
    i.isBall || i.isUsable || i.category === 'statusCure' || i.category === 'ppRecovery' ||
    i.category === 'evolutionStones'
  ));
  battleItems.forEach(item => {
    const qty = getItemQty(item.id);
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.nameRu} (${qty})`;
    select.appendChild(opt);
  });
}

export function updateQADisplays() {
  const map = {
    'qa-qty-potion': 'potion', 'qa-qty-candy': 'candy', 'qa-qty-vitamin': 'vitamin',
    'qa-qty-train': 'train', 'qa-qty-weaken': 'weaken',
    'qa-qty-super-potion': 'superPotion', 'qa-qty-full-restore': 'fullRestore',
    'qa-qty-evolution-stone': 'evolutionStone', 'qa-qty-tm': 'tm',
  };
  for (const [elId, itemId] of Object.entries(map)) {
    const el = document.getElementById(elId);
    if (el) el.textContent = getItemQty(itemId);
  }
}

export function renderInventory() {
  const container = document.getElementById('inventory-items');
  if (!container) return;

  container.innerHTML = '';

  // Show Money as an item
  const moneyTitle = document.createElement('div');
  moneyTitle.className = 'inv-category-title';
  moneyTitle.textContent = 'Валюта';
  container.appendChild(moneyTitle);
  
  const moneyGrid = document.createElement('div');
  moneyGrid.className = 'inv-grid';
  moneyGrid.innerHTML = `
    <div class="inv-item" style="cursor: default;">
      <div class="inv-item-icon" style="font-size:24px; color:#f0d060;">¥</div>
      <div class="inv-item-name">Кредиты</div>
      <div class="inv-item-qty">x${getInvState().money}</div>
    </div>
  `;
  container.appendChild(moneyGrid);

  // Show getInvState().eggs in inventory
  if (getInvState().eggs.length > 0) {
    const eggTitle = document.createElement('div');
    eggTitle.className = 'inv-category-title';
    eggTitle.textContent = '🥚 Яйца';
    container.appendChild(eggTitle);

    const eggGrid = document.createElement('div');
    eggGrid.className = 'inv-grid';
    const now = Date.now();
    getInvState().eggs.forEach((egg, idx) => {
      const cell = document.createElement('div');
      cell.className = 'inv-grid-item';
      cell.style.cssText = 'cursor:pointer;border-color:#34c759;';

      const emoji = document.createElement('div');
      emoji.style.cssText = 'font-size:24px;';
      emoji.textContent = '🥚';
      cell.appendChild(emoji);

      const name = document.createElement('div');
      name.className = 'inv-grid-name';
      name.textContent = egg.species || 'Яйцо';
      cell.appendChild(name);

      const timeLeft = Math.max(0, egg.readyTime - now);
      const badge = document.createElement('div');
      badge.className = 'inv-grid-badge';
      badge.style.cssText = 'background:#34c759;font-size:0.5rem;min-width:28px;';
      if (timeLeft <= 0) {
        badge.textContent = '✓';
        cell.addEventListener('click', () => hatchEgg(egg));
      } else {
        const mins = Math.ceil(timeLeft / 60000);
        badge.textContent = mins > 60 ? `${Math.floor(mins/60)}ч` : `${mins}м`;
      }
      cell.appendChild(badge);

      eggGrid.appendChild(cell);
    });
    container.appendChild(eggGrid);
  }

  // Group items by category
  const categories = {
    balls: 'Покеболы',
    healing: 'Восстановление HP',
    statusCure: 'Лечение статусов',
    ppRecovery: 'Восстановление PP',
    vitamins: 'Витамины',
    evolutionStones: 'Камни Эволюции',
    berries: 'Ягоды',
    battle: 'Боевые',
    quest: 'Квестовые',
    training: 'Тренировка',
    tickets: 'Билеты',
    crafting: 'Ремесленные',
    artifacts: 'Артефакты',
    awards: 'Награды',
    other: 'Прочее',
  };

  let hasAnyItems = false;
  for (const [catId, catName] of Object.entries(categories)) {
    const catItems = getInvState().ITEMS.filter(item => item.category === catId && getItemQty(item.id) > 0);
    if (catItems.length === 0) continue;
    hasAnyItems = true;

    const title = document.createElement('div');
    title.className = 'inv-category-title';
    title.textContent = catName;
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'inv-grid';

    catItems.forEach(item => {
      const qty = getItemQty(item.id);
      const cell = document.createElement('div');
      cell.className = 'inv-grid-item';
      cell.dataset.itemId = item.id;

      // Sprite
      const img = document.createElement('img');
      img.className = 'inv-grid-sprite';
      if (item.spriteType === 'pokeapi') {
        img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${item.sprite}`;
      } else {
        img.src = `${import.meta.env.BASE_URL}assets/items/${item.sprite}`;
      }
      img.alt = item.nameRu;
      img.loading = 'lazy';
      img.onerror = () => { img.src = `${import.meta.env.BASE_URL}assets/items/1.gif`; img.onerror = null; };
      cell.appendChild(img);

      // Name
      const name = document.createElement('div');
      name.className = 'inv-grid-name';
      name.textContent = item.nameRu;
      cell.appendChild(name);

      // Use button (if usable)
      if (item.isUsable && item.implemented) {
        const useBtn = document.createElement('button');
        useBtn.className = 'inv-grid-use';
        if (item.id === 'weaken') useBtn.classList.add('danger');
        useBtn.textContent = 'Юз';
        useBtn.dataset.itemId = item.id;
        cell.appendChild(useBtn);
      }

      // Badge (quantity)
      const badge = document.createElement('div');
      badge.className = 'inv-grid-badge';
      badge.textContent = qty;
      cell.appendChild(badge);

      grid.appendChild(cell);
    });

    container.appendChild(grid);
  }

  if (!hasAnyItems) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tma-text-muted);font-size:0.9rem;">Рюкзак пуст</div>';
  }

  // Click on item cell → show info
  container.querySelectorAll('.inv-grid-item').forEach(cell => {
    cell.addEventListener('click', (e) => {
      if (e.target.closest('.inv-grid-use')) return;
      const itemId = cell.dataset.itemId;
      const item = getInvState().ITEMS.find(i => i.id === itemId);
      if (!item) return;
      const qty = getItemQty(itemId);
      const priceInfo = item.price > 0 ? `\n💰 Цена: ${item.price.toLocaleString()} кр.` : '';
      const sellInfo = item.sellPrice > 0 ? `\n🏷️ Продажа: ${item.sellPrice.toLocaleString()} кр.` : '';
      showItemInfoModal(item, qty);
    });
  });

  // Delegate click events on use buttons
  container.querySelectorAll('.inv-grid-use').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = btn.dataset.itemId;
      useItem(itemId);
    });
  });
}

export function useItem(itemId) {
  const item = getInvState().ITEMS.find(i => i.id === itemId);
  if (!item) return showToast('Предмет не найден!', true);
  if (getItemQty(itemId) <= 0) return showToast(`Нет ${item.nameRu}!`, true);
  if (!item.isUsable) return showToast(`${item.nameRu} нельзя использовать из рюкзака.`, true);
  if (getTeamState().currentPokemonIndex === null) return showToast('Сначала выберите покемона во вкладке "Команда"!', true);

  const mon = getTeamState().myTeam[getTeamState().currentPokemonIndex];
  if (!mon) return showToast('Покемон не найден!', true);

  switch (itemId) {
    case 'potion': {
      if (mon.currentHp >= mon.maxHp) return showToast('Здоровье уже полное!', true);
      removeItem('potion');
      mon.currentHp += 20;
      if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
      refreshProfileUI();
      showToast(`Вы использовали Аптечку. Здоровье ${mon.apiData.name} восстановлено!`, false);
      break;
    }
    case 'superPotion': {
      if (mon.currentHp >= mon.maxHp) return showToast('Здоровье уже полное!', true);
      removeItem('superPotion');
      mon.currentHp += 50;
      if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
      refreshProfileUI();
      showToast(`Супер Аптечка использована! Здоровье ${mon.nickname || mon.apiData.name} восстановлено.`, false);
      break;
    }
    case 'fullRestore': {
      if (mon.currentHp >= mon.maxHp && !mon.status) return showToast('Здоровье уже полное!', true);
      removeItem('fullRestore');
      mon.currentHp = mon.maxHp;
      cureStatus(mon);
      refreshProfileUI();
      showToast(`Полное Восстановление использовано! ${mon.nickname || mon.apiData.name} полностью здоров!`, false);
      break;
    }
    case 'stimulator': {
      if (mon.currentHp >= mon.maxHp) return showToast('Здоровье уже полное!', true);
      removeItem('stimulator');
      mon.currentHp += 30;
      if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
      refreshProfileUI();
      showToast(`Стимулятор: +30 HP для ${mon.nickname || mon.apiData.name}`, false);
      break;
    }
    case 'superStimulator': {
      if (mon.currentHp >= mon.maxHp) return showToast('Здоровье уже полное!', true);
      removeItem('superStimulator');
      mon.currentHp += 80;
      if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
      refreshProfileUI();
      showToast(`Суперстимулятор: +80 HP для ${mon.nickname || mon.apiData.name}`, false);
      break;
    }
    case 'candy': {
      if (mon.baseLevel + mon.candiesEaten >= 100) return showToast('Достигнут максимальный 100 уровень!', true);
      removeItem('candy');
      mon.candiesEaten++;
      mon.happiness += 2;
      if (mon.happiness > 255) mon.happiness = 255;
      const baseHp = mon.apiData.stats[0].base_stat;
      const curLvl = mon.baseLevel + mon.candiesEaten;
      const oldMax = mon.maxHp;
      mon.maxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
      mon.currentHp += (mon.maxHp - oldMax);
      (async () => {
        const evoTarget = await checkEvolution(mon);
        if (evoTarget) {
          await triggerEvolution(mon, evoTarget.name);
          refreshProfileUI();
        }
      })();
      // Level-up move learning
      (async () => {
        try {
          const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mon.apiData.id}`);
          const pokeData = await res.json();
          const allMoves = pokeData.moves || [];
          const knownNames = new Set((mon.apiData.moves || []).filter(m => m).map(m => m.move.name));
          for (const entry of allMoves) {
            for (const detail of entry.version_group_details) {
              if (detail.move_learn_method.name === 'level-up' && detail.level_learned_at === curLvl) {
                if (!knownNames.has(entry.move.name)) {
                  const emptySlot = (mon.apiData.moves || []).findIndex(m => !m);
                  if (emptySlot >= 0) {
                    const url = entry.move.url;
                    if (!mon.apiData.moves[emptySlot]) {
                      mon.apiData.moves[emptySlot] = { move: { name: entry.move.name, url } };
                    }
                    showToast(`${mon.nickname || mon.apiData.name} выучил ${entry.move.name}!`, false);
                    knownNames.add(entry.move.name);
                  } else {
                    // Show slot picker to choose which move to replace
                    const slotItems = (mon.apiData.moves || []).filter(m => m).map((m, i) => ({
                      label: m.move.name,
                      subtitle: `Слот ${i + 1}`
                    }));
                    slotItems.push({ label: 'Отказаться', subtitle: 'Сохранить в резерв' });
                    showSelectionModal(`Заменить атаку на ${entry.move.name}?`, slotItems, (pick) => {
                      if (pick < 4) {
                        mon.apiData.moves[pick].move = { name: entry.move.name, url: entry.move.url };
                        knownNames.add(entry.move.name);
                        showToast(`${entry.move.name} выучено!`, false);
                      } else {
                        // Save to reserve
                        if (!mon.learnableMoves) mon.learnableMoves = [];
                        if (!mon.learnableMoves.some(m => m.name === entry.move.name)) {
                          mon.learnableMoves.push({ name: entry.move.name, url: entry.move.url, power: 0, type: 'normal' });
                        }
                        showToast(`${entry.move.name} сохранено в резерв!`, false);
                      }
                    }, true);
                  }
                }
                break;
              }
            }
          }
        } catch (e) { console.warn('Failed to load level-up moves', e); }
      })();
      refreshProfileUI();
      showToast(`Вы скормили Сладкую Конфету! Уровень повышен до ${curLvl}.`, false);
      break;
    }
    case 'vitamin': {
      if (mon.vitaminsEaten >= 10) return showToast('Этот покемон уже съел максимум 10 витаминов!', true);
      removeItem('vitamin');
      mon.vitaminsEaten++;
      mon.happiness += 5;
      if (mon.happiness > 255) mon.happiness = 255;
      refreshProfileUI();
      showToast(`Вы скормили Витамин! Доступно +10 EV.`, false);
      break;
    }
    case 'train': {
      if (mon.trainingStage >= 6) return showToast('Тренировка уже на Именной стадии!', true);
      removeItem('train');
      const chances = [1.0, 0.8, 0.5, 0.3, 0.15, 0.05];
      if (Math.random() > chances[mon.trainingStage]) {
        return showToast(`Тренировка не удалась! Набор потрачен.`, false);
      }
      const trainableStats = ['atk', 'def', 'spa', 'spd', 'spe'];
      mon.trainingStat = trainableStats[Math.floor(Math.random() * trainableStats.length)];
      mon.trainingStage++;
      mon.happiness += 10;
      if (mon.happiness > 255) mon.happiness = 255;
      refreshProfileUI();
      showToast(`Успешно! Теперь это ${getInvState().trainingStages[mon.trainingStage].name} тренировка!`, false);
      break;
    }
    case 'weaken': {
      if (mon.trainingStage === 0) return showToast('Покемон ещё не тренирован!', true);
      removeItem('weaken');
      mon.trainingStage--;
      if (mon.trainingStage === 0) mon.trainingStat = null;
      refreshProfileUI();
      break;
    }
    case 'evolutionStone': {
      (async () => {
        const evoTarget = await checkEvolution(mon, true);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать!', true);
        removeItem('evolutionStone');
        await triggerEvolution(mon, evoTarget.name);
        refreshProfileUI();
        showToast(`${mon.nickname || mon.apiData.name} эволюционировал в ${evoTarget.name}!`, false);
      })();
      break;
    }
    case 'tm': {
      openMoveRelearner();
      break;
    }
    case 'sitrusBerry': {
      giveBerryToMon('sitrus');
      break;
    }
    case 'oranBerry': {
      giveBerryToMon('oran');
      break;
    }
    case 'lumBerry': {
      giveBerryToMon('lum');
      break;
    }
    case 'chestoBerry': {
      giveBerryToMon('chesto');
      break;
    }
    case 'rawstBerry': {
      giveBerryToMon('rawst');
      break;
    }
    case 'fireStone': case 'waterStone': case 'leafStone': case 'thunderStone':
    case 'moonStone': case 'sunStone': case 'shinyStone': case 'duskStone':
    case 'iceStone': case 'dawnStone': {
      (async () => {
        const evoTarget = await checkEvolution(mon, true, itemId);
        if (!evoTarget) return showToast('Этот покемон не может эволюционировать с этим камнем!', true);
        removeItem(itemId);
        await triggerEvolution(mon, evoTarget.name);
        refreshProfileUI();
        showToast(`${mon.nickname || mon.apiData.name} эволюционировал в ${evoTarget.name}!`, false);
      })();
      break;
    }
    // Status cures — usable from backpack (uses short status codes)
    case 'antidote': {
      if (!mon.status) return showToast('У покемона нет статуса!', true);
      if (mon.status !== 'psn') return showToast('Антидот лечит только отравление!', true);
      mon.status = null;
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`${mon.nickname || mon.apiData.name} вылечен от отравления!`, false);
      break;
    }
    case 'antiparalyze': {
      if (!mon.status) return showToast('У покемона нет статуса!', true);
      if (mon.status !== 'par') return showToast('Антипаралич лечит только паралич!', true);
      mon.status = null;
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`${mon.nickname || mon.apiData.name} вылечен от паралича!`, false);
      break;
    }
    case 'energyDrink': {
      if (!mon.status) return showToast('У покемона нет статуса!', true);
      if (mon.status !== 'slp') return showToast('Энергетик лечит только сон!', true);
      mon.status = null;
      mon.sleepTurns = 0;
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`${mon.nickname || mon.apiData.name} проснулся!`, false);
      break;
    }
    case 'fireExtinguisher': {
      if (!mon.status) return showToast('У покемона нет статуса!', true);
      if (mon.status !== 'brn') return showToast('Огнетушитель лечит только ожог!', true);
      mon.status = null;
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`${mon.nickname || mon.apiData.name} вылечен от ожога!`, false);
      break;
    }
    case 'antiSputin': case 'healingHerb': {
      if (!mon.status) return showToast('У покемона нет статуса!', true);
      const statusNames = { psn: 'отравления', par: 'паралича', slp: 'сна', brn: 'ожога', frz: 'заморозки' };
      showToast(`${mon.nickname || mon.apiData.name} вылечен от ${statusNames[mon.status] || mon.status}!`, false);
      mon.status = null;
      mon.sleepTurns = 0;
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      break;
    }
    // PP recovery — from backpack
    case 'weakElixir': case 'elixir': case 'strongElixir': {
      const ppRestore = itemId === 'weakElixir' ? 10 : itemId === 'elixir' ? 20 : 40;
      if (!mon.movesPP || mon.movesPP.every(pp => !pp || pp.current >= pp.max)) {
        return showToast('Все PP уже максимальны!', true);
      }
      mon.movesPP.forEach(pp => {
        if (pp) pp.current = Math.min(pp.max, pp.current + ppRestore);
      });
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`PP всех атак восстановлены на ${ppRestore}!`, false);
      break;
    }
    // EXP Share - toggle distribution
    case 'expShare': {
      toggleExpShare();
      showToast(getInvState().expShareActive ? 'Распределитель опыта активирован! Команда будет получать 50% опыта.' : 'Распределитель опыта деактивирован.', false);
      break;
    }
    // Lucky Egg - give to selected pokemon as held item
    case 'luckyEgg': {
      if (mon.heldItem === 'luckyEgg') return showToast('Покемон уже держит Счастливое яйцо!', true);
      if (mon.heldItem) {
        const heldName = itemDef(mon.heldItem).nameRu;
        showConfirmModal('Заменить предмет?', `Покемон уже держит ${heldName}. Заменить на Счастливое яйцо?`, () => {
          addItem(mon.heldItem);
          removeItem('luckyEgg');
          mon.heldItem = 'luckyEgg';
          refreshProfileUI();
          showToast(`${mon.nickname || mon.apiData.name} теперь держит Счастливое яйцо!`, false);
        });
        return;
      }
      removeItem('luckyEgg');
      mon.heldItem = 'luckyEgg';
      refreshProfileUI();
      showToast(`${mon.nickname || mon.apiData.name} теперь держит Счастливое яйцо!`, false);
      break;
    }
    // Crafting kit
    case 'craftersKit': {
      openCrafting();
      break;
    }
    // Fishing rods - passive, auto-hunt on water locations
    case 'oldRod': case 'goodRod': case 'superRod': {
      showToast('Удочка работает пассивно: если вы на водоёме, водные покемоны будут встречаться в автопоиске!', false);
      break;
    }
    // PP Up
    case 'ppUp': {
      if (!mon.movesPP || mon.movesPP.length === 0) return showToast('У покемона нет атак!', true);
      const movesWithPP = mon.movesPP.map((pp, i) => {
        const moveName = mon.apiData?.moves?.[i]?.move?.name || `Атака ${i + 1}`;
        return { ...pp, moveName, index: i };
      }).filter(m => m && m.max > 0);
      if (movesWithPP.length === 0) return showToast('Нет атак для усиления!', true);
      const ppItems = movesWithPP.map(m => ({
        label: `${m.moveName}`,
        subtitle: `PP: ${m.current}/${m.max}`
      }));
      showSelectionModal('Выберите атаку для PP Up', ppItems, (choiceIdx) => {
        const picked = movesWithPP[choiceIdx];
        if (!picked) { showToast('Неверный выбор!', true); return; }
        const basePP = picked.max;
        const newMax = Math.floor(basePP * 1.2);
        if (newMax === basePP) { showToast('PP уже на максимуме!', true); return; }
        mon.movesPP[picked.index].max = newMax;
        mon.movesPP[picked.index].current = Math.min(mon.movesPP[picked.index].current + (newMax - basePP), newMax);
        removeItem('ppUp');
        refreshProfileUI();
        showToast(`PP атаки ${picked.moveName} увеличено до ${newMax}!`, false);
      }, true);
      return;
    }
    // EV vitamins
    case 'protein': case 'iron': case 'calcium': case 'zinc': case 'carbos': {
      const evKey = itemId === 'protein' ? 'atk' : itemId === 'iron' ? 'def' : itemId === 'calcium' ? 'spa' : itemId === 'zinc' ? 'spd' : 'spe';
      const totalEV = Object.values(mon.evs).reduce((s, v) => s + v, 0);
      if (mon.evs[evKey] >= 252) return showToast(`EV ${evKey.toUpperCase()} уже на максимуме (252)!`, true);
      if (totalEV >= 510) return showToast('Суммарные EV уже на максимуме (510)!', true);
      mon.evs[evKey] = Math.min(252, mon.evs[evKey] + 10);
      removeItem(itemId);
      if (getTeamState().currentPokemonIndex !== null) refreshProfileUI();
      showToast(`EV ${evKey.toUpperCase()} +10 (теперь ${mon.evs[evKey]})`, false);
      break;
    }
    default: {
      // Generic equip for battle items + special held items
      if ((item.category === 'battle' || item.id === 'luckyEgg' || item.id === 'expShare') && getItemQty(item.id) > 0) {
        if (!mon) { showToast('Сначала выберите покемона во вкладке Команда!', true); break; }
        if (mon.heldItem === itemId) { showToast('Этот предмет уже надет!', true); break; }
        if (mon.heldItem) {
          const heldName = itemDef(mon.heldItem).nameRu;
          showConfirmModal('Заменить предмет?', `Покемон держит ${heldName}. Заменить на ${item.nameRu}?`, () => {
            addItem(mon.heldItem);
            removeItem(itemId);
            mon.heldItem = itemId;
            refreshProfileUI();
            showToast(`${mon.nickname || mon.apiData.name} теперь держит ${item.nameRu}!`, false);
            autoSave();
          });
        } else {
          removeItem(itemId);
          mon.heldItem = itemId;
          refreshProfileUI();
          showToast(`${mon.nickname || mon.apiData.name} теперь держит ${item.nameRu}!`, false);
          autoSave();
        }
        break;
      }
      showToast(`${item.nameRu} скоро будет доступно!`, true);
      break;
    }
  }

  updateInventoryDisplay();
  autoSave();
}

// HELD_ITEMS array removed in favor of using getInvState().ITEMS directly

export function getHeldItemName(heldItem) {
  if (!heldItem) return 'Пусто';
  const item = getInvState().ITEMS.find(i => i.id === heldItem);
  return item ? item.nameRu : heldItem;
}

export function openHeldItemPicker(monIndex) {
  const mon = getTeamState().myTeam[monIndex];
  if (!mon) return;

  const choices = getInvState().ITEMS.filter(item => {
    return (item.category === 'battle' || item.category === 'berries' || item.category === 'other') && getItemQty(item.id) > 0 && item.isUsable !== false;
  });

  const selectionItems = choices.map((item) => ({
    label: item.nameRu,
    subtitle: item.desc
  }));
  if (mon.heldItem) {
    selectionItems.unshift({ label: 'Снять предмет', subtitle: `Сейчас: ${getHeldItemName(mon.heldItem)}` });
  }

  showSelectionModal(`Предмет для ${mon.nickname || mon.apiData.name}`, selectionItems, (selIdx) => {
    if (mon.heldItem && selIdx === 0) {
      // Remove held item
      const itemId = mon.heldItem;
      addItem(itemId);
      mon.heldItem = null;
      if (mon.berries && mon.berries[itemId] !== undefined) mon.berries[itemId] = 0;
      refreshProfileUI();
      updateInventoryDisplay();
      autoSave();
      return;
    }

    const chosen = mon.heldItem ? choices[selIdx - 1] : choices[selIdx];
    if (chosen) {
      removeItem(chosen.id);

      // Return old held item if any
      if (mon.heldItem) {
        addItem(mon.heldItem);
        if (mon.berries && mon.berries[mon.heldItem] !== undefined) mon.berries[mon.heldItem] = 0;
      }

      mon.heldItem = chosen.id;
      if (chosen.category === 'berries') {
        if (!mon.berries) mon.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
        mon.berries[chosen.id] = 1;
      }
      refreshProfileUI();
      updateInventoryDisplay();
      autoSave();
    }
  }, true);
}

