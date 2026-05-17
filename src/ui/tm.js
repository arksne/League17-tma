import { 
  getTeamState, refreshProfileUI, autoSave, showToast, 
  getItemQty, removeItem, updateInventoryDisplay 
} from '../../main.js';

// FEATURE: TM MOVE RELEARNER
// ================================================================
export async function fetchLearnableMoves(mon) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mon.apiData.id}`);
    const data = await res.json();
    const allMoves = (data.moves || []).slice(0, 100);
    const knownNames = new Set((mon.apiData.moves || []).filter(m => m).map(m => m.move.name));
    const existingNames = new Set((mon.learnableMoves || []).map(m => m.name));
    if (!mon.learnableMoves) mon.learnableMoves = [];

    for (const entry of allMoves) {
      const name = entry.move.name;
      if (knownNames.has(name) || existingNames.has(name)) continue;
      try {
        const moveRes = await fetch(entry.move.url);
        const moveData = await moveRes.json();
        if (moveData.power && moveData.power > 0) {
          mon.learnableMoves.push({
            name: moveData.name,
            url: entry.move.url,
            power: moveData.power,
            type: moveData.type?.name || 'normal'
          });
        }
      } catch (e) { /* skip failed moves */ }
      if (mon.learnableMoves.length >= 50) break;
    }
    refreshProfileUI();
    autoSave();
  } catch (e) { console.warn('fetchLearnableMoves failed', e); }
}

export async function openMoveRelearner() {
  if (getTeamState().currentPokemonIndex === null) return showToast('Сначала выберите покемона во вкладке "Команда"!', true);
  if (getItemQty('tm') <= 0) return showToast('У вас нет TM-совместимости!', true);

  const mon = getTeamState().myTeam[getTeamState().currentPokemonIndex];
  const modal = document.getElementById('tm-modal');
  if (!modal) return;

  document.getElementById('tm-pokemon-name').innerText = `${mon.nickname || mon.apiData.name} (Lv${mon.baseLevel + mon.candiesEaten})`;

  const currentList = document.getElementById('tm-current-list');
  currentList.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const moveEl = document.createElement('div');
    moveEl.className = 'tm-current-move';
    if (mon.apiData.moves[i]) {
      const ppDisplay = (mon.movesPP && mon.movesPP[i]) ? `${mon.movesPP[i].current}/${mon.movesPP[i].max}` : '30/30';
      moveEl.innerText = `${i + 1}. ${mon.apiData.moves[i].move.name} (PP ${ppDisplay})`;
    } else {
      moveEl.innerText = `${i + 1}. -`;
    }
    currentList.appendChild(moveEl);
  }

  const availableList = document.getElementById('tm-available-list');
  availableList.innerHTML = '<div class="tm-loading">Загрузка доступных атак...</div>';
  modal.style.display = 'flex';

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${mon.apiData.id}`);
    const pokeData = await res.json();
    const allMoves = pokeData.moves || [];
    const knownNames = new Set((mon.apiData.moves || []).filter(m => m).map(m => m.move.name));

    const movePromises = [];
    for (let i = 0; i < allMoves.length && i < 50; i++) {
      movePromises.push(
        fetch(allMoves[i].move.url).then(r => r.json()).catch(() => null)
      );
    }
    const moveResults = await Promise.all(movePromises);
    const learnable = moveResults.filter(m => m && m.power && !knownNames.has(m.name));

    availableList.innerHTML = '';
    if (learnable.length === 0) {
      availableList.innerHTML = '<div class="tm-empty">Нет новых атак для изучения</div>';
    } else {
      learnable.forEach((moveData) => {
        const moveEl = document.createElement('div');
        moveEl.className = 'tm-move-cell';
        moveEl.innerText = `${moveData.name} (${moveData.power} | ${moveData.damage_class.name})`;
        moveEl.addEventListener('click', () => {
          showSlotPicker(mon, moveData);
        });
        availableList.appendChild(moveEl);
      });
    }
  } catch (e) {
    availableList.innerHTML = '<div class="tm-error">Ошибка загрузки атак</div>';
  }
}

export function showSlotPicker(mon, moveData) {
  const picker = document.getElementById('tm-slot-picker');
  picker.style.display = 'block';
  picker.innerHTML = '<h4>Выберите слот для замены:</h4>';
  for (let i = 0; i < 4; i++) {
    const btn = document.createElement('button');
    btn.className = 'tma-btn';
    btn.style.margin = '4px';
    const currentName = (mon.apiData.moves[i]) ? mon.apiData.moves[i].move.name : '-';
    btn.innerText = `Слот ${i + 1}: ${currentName}`;
    btn.addEventListener('click', () => {
      const moveUrl = `https://pokeapi.co/api/v2/move/${moveData.id}/`;
      if (!mon.apiData.moves[i]) {
        mon.apiData.moves[i] = { move: { name: moveData.name, url: moveUrl } };
      } else {
        mon.apiData.moves[i].move.name = moveData.name;
        mon.apiData.moves[i].move.url = moveUrl;
      }
      if (!mon.movesPP) mon.movesPP = [];
      mon.movesPP[i] = { current: moveData.pp || 30, max: moveData.pp || 30 };
      removeItem('tm');
      updateInventoryDisplay();
      refreshProfileUI();
      document.getElementById('tm-slot-picker').style.display = 'none';
      document.getElementById('tm-modal').style.display = 'none';
      autoSave();
      showToast(`${mon.nickname || mon.apiData.name} выучил ${moveData.name}!`, false);
    });
    picker.appendChild(btn);
  }
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'tma-btn';
  cancelBtn.style.margin = '4px';
  cancelBtn.style.backgroundColor = '#ff3b30';
  cancelBtn.innerText = 'Отмена';
  cancelBtn.addEventListener('click', () => {
    picker.style.display = 'none';
  });
  picker.appendChild(cancelBtn);
}

