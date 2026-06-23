import { fetchPokeAPI } from '../utils/api.js';
// Lazy import for cycle-breaking (core.ts ↔ levelup_moves.ts)
let _appendToLog: any = null;
async function appendToLogLazy(...args: any[]) {
  if (!_appendToLog) _appendToLog = (await import('../battle/core.js')).appendToLog;
  return _appendToLog(...args);
}

// FEATURE: LEVEL-UP MOVE LEARNING
// ================================================================
export async function checkNewMovesOnLevelUp(pokemon, newLevel) {
  try {
    const pokeData = await fetchPokeAPI(`pokemon/${pokemon.apiData.id}`);
    const allMoves = pokeData.moves || [];

    // Known moves = current 4-slot moveset (apiData.moves has ALL PokeAPI moves
    // for a fresh pokemon, so we only check the first 4 displayed slots)
    const knownNames = new Set();
    for (let i = 0; i < 4; i++) {
      if (pokemon.apiData.moves[i]?.move?.name) {
        knownNames.add(pokemon.apiData.moves[i].move.name);
      }
    }

    const prevCheckLevel = pokemon.lastMoveCheckLevel || 1;
    const newMoves = [];
    for (const entry of allMoves) {
      for (const detail of entry.version_group_details) {
        if (detail.move_learn_method.name === 'level-up' && detail.level_learned_at > prevCheckLevel && detail.level_learned_at <= newLevel) {
          if (!knownNames.has(entry.move.name)) {
            newMoves.push(entry.move);
          }
          break;
        }
      }
    }
    pokemon.lastMoveCheckLevel = newLevel;

    for (const move of newMoves) {
      const learned = await offerLearnMove(pokemon, move);
      if (learned) {
        knownNames.add(move.name);
        // Ensure PP tracking
        try {
          const moveRes = await fetch(move.url);
          const moveData = await moveRes.json();
          const slot = pokemon.apiData.moves.findIndex(m => m && m.move.name === move.name);
          if (slot >= 0 && moveData.pp) {
            if (!pokemon.movesPP) pokemon.movesPP = [];
            if (!pokemon.movesPP[slot]) pokemon.movesPP[slot] = {};
            pokemon.movesPP[slot] = { current: moveData.pp || 30, max: moveData.pp || 30 };
          }
        } catch (e) { console.warn('Failed to init PP for move', move.name, e); }
      }
    }
  } catch (e) {
    console.warn('Failed to check new moves for', pokemon.apiData.name, e);
  }
}

export function offerLearnMove(pokemon, move) {
  return new Promise((resolve) => {
    const moveName = move.name;
    const monName = pokemon.nickname || pokemon.apiData.name;
    const url = move.url || `https://pokeapi.co/api/v2/move/${moveName}/`;

    // Find empty slot
    const emptySlot = (pokemon.apiData.moves || []).findIndex(m => !m);
    if (emptySlot >= 0) {
      if (!pokemon.apiData.moves[emptySlot]) {
        pokemon.apiData.moves[emptySlot] = { move: { name: moveName, url } };
      }
      appendToLogLazy(`${monName} выучил ${moveName}!`, false, 'system');
      resolve(true);
      return;
    }

    // All 4 slots full — show replacement picker
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    let slotsHTML = '';
    for (let i = 0; i < 4; i++) {
      const currentName = pokemon.apiData.moves[i]?.move?.name || '-';
      slotsHTML += `<button class="selection-item-btn replace-slot" data-slot="${i}">
        Слот ${i + 1}: ${currentName}
      </button>`;
    }
    modal.innerHTML = `
      <div class="selection-modal-card">
        <h3>${monName} хочет выучить ${moveName}</h3>
        <p style="font-size:0.85rem;color:var(--tma-hint);margin:4px 0 12px;">Выберите слот для замены:</p>
        <div class="selection-items">
          ${slotsHTML}
          <button class="selection-item-btn reserve-btn" style="border-color:var(--tma-link);">
            📥 В резерв (не учить сейчас)
          </button>
        </div>
        <button class="confirm-btn confirm-btn-no" id="learn-skip" style="width:100%;margin-top:8px;">Пропустить</button>
      </div>
    `;
    document.body.appendChild(modal);

    const cleanup = () => {
      if (modal.parentNode) modal.parentNode.removeChild(modal);
    };

    modal.querySelectorAll('.replace-slot').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = parseInt(btn.getAttribute('data-slot'));
        const oldName = pokemon.apiData.moves[slot].move.name;
        pokemon.apiData.moves[slot].move = { name: moveName, url };
        appendToLogLazy(`${monName}: ${moveName} заменил ${oldName} в слоте ${slot + 1}!`, false, 'system');
        cleanup();
        resolve(true);
      });
    });
    modal.querySelector('.reserve-btn').addEventListener('click', () => {
      if (!pokemon.learnableMoves) pokemon.learnableMoves = [];
      if (!pokemon.learnableMoves.some(m => m.name === moveName)) {
        pokemon.learnableMoves.push({ name: moveName, url, power: move.power || 0, type: move.type?.name || 'normal' });
      }
      appendToLogLazy(`${monName}: ${moveName} упал в резерв (все слоты заняты).`, false, 'system');
      cleanup();
      resolve(false);
    });
    modal.querySelector('#learn-skip').addEventListener('click', () => {
      appendToLogLazy(`${monName}: пропустил изучение ${moveName}.`, false, 'system');
      cleanup();
      resolve(false);
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        appendToLogLazy(`${monName}: пропустил изучение ${moveName}.`, false, 'system');
        cleanup();
        resolve(false);
      }
    });
  });
}

