import { appendToLog } from '../../main.js';

// FEATURE: LEVEL-UP MOVE LEARNING
// ================================================================
export async function checkNewMovesOnLevelUp(pokemon, newLevel) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.apiData.id}`);
    const pokeData = await res.json();
    const allMoves = pokeData.moves || [];
    const knownNames = new Set((pokemon.apiData.moves || []).filter(m => m).map(m => m.move.name));

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
      appendToLog(`${monName} выучил ${moveName}!`, false, 'system');
      resolve(true);
      return;
    }

    // All 4 slots full — send to reserve automatically
    if (!pokemon.learnableMoves) pokemon.learnableMoves = [];
    if (!pokemon.learnableMoves.some(m => m.name === moveName)) {
      pokemon.learnableMoves.push({ name: moveName, url, power: move.power || 0, type: move.type?.name || 'normal' });
    }
    appendToLog(`${monName}: ${moveName} упал в резерв (все слоты заняты).`, false, 'system');
    resolve(false);
  });
}

