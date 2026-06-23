import { gymLeaders } from '../data/gyms.js';
import { state, getTrainerId } from '../game/state.js';
import { showSelectionModal, showToast } from '../utils/dom.js';
import { addItem } from '../game/actions.js';
import { itemDef } from '../game/state.js';
import { autoSave } from '../game/save.js';
import { renderTeamGrid } from './profile.js';

function getBestNatureIdx(pokeData) {
  const stats = pokeData.stats;
  const atk  = stats.find(s => s.stat.name === 'attack')?.base_stat || 50;
  const def  = stats.find(s => s.stat.name === 'defense')?.base_stat || 50;
  const spa  = stats.find(s => s.stat.name === 'special-attack')?.base_stat || 50;
  const spd  = stats.find(s => s.stat.name === 'special-defense')?.base_stat || 50;
  const spe  = stats.find(s => s.stat.name === 'speed')?.base_stat || 50;
  const entries = [['atk', atk], ['def', def], ['spa', spa], ['spd', spd], ['spe', spe]];
  entries.sort((a, b) => b[1] - a[1]);
  const best = entries[0][0];
  const natureMap = { atk: 3, def: 8, spe: 13, spa: 15, spd: 24 };
  return natureMap[best] || 0;
}

export async function createAndGivePokemon(pokemonName, level = 1, opts: any = {}) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!res.ok) throw new Error(`PokeAPI returned ${res.status}`);
    const pokeData = await res.json();
    const baseHp = pokeData.stats[0].base_stat;
    const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };
    const maxHp = Math.floor(0.01 * (2 * baseHp + ivs.hp) * level) + level + 10;
    const natureIdx = opts.natureIdx !== undefined ? opts.natureIdx : getBestNatureIdx(pokeData);
    const pokemon = {
      uid: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      originalTrainer: getTrainerId(),
      createdAt: Date.now(),
      caughtLocation: state.currentLocationId || 'stadium',
      apiData: pokeData,
      maxHp, currentHp: maxHp, ivs,
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: level, exp: 0, expToNext: 8,
      candiesEaten: 0, vitaminsEaten: 0,
      training: null, trainingStage: 0, trainingStat: null,
      happiness: 120, natureIdx,
      breedLetter: 'S', gender: Math.random() < 0.5 ? 'male' : 'female',
      status: null, sleepTurns: 0, movesPP: [],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: pokeData.abilities[0]?.ability?.name || null,
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: [], isEgg: false, hasBred: false,
      isShiny: !!opts.isShiny
    };
    state.myTeam.push(pokemon);
    renderTeamGrid();
    return pokemon;
  } catch (e) {
    console.error('createAndGivePokemon error:', e);
    showToast('Ошибка создания покемона!', true);
    return null;
  }
}

export function showGymRewardSelection(locId) {
  const leader = gymLeaders[locId];
  if (!leader || !leader.team) return;
  const choices = leader.team.map(m => ({
    label: `🔑 Lv.1 ${m.name}`,
    subtitle: `Тот же покемон, что был в бою — Lv.1, шини, идеальные гены`,
    value: m.name
  }));
  showSelectionModal('🎉 Выберите покемона лидера в награду!', choices, async (idx) => {
    const chosenName = choices[idx]?.value;
    if (!chosenName) return;
    const mon = await createAndGivePokemon(chosenName, 1, { isShiny: true });
    if (mon) {
      addItem(leader.rewardItem, leader.rewardQty || 1);
      addItem('superDarkBall', 10);
      showToast(`Получен Lv.1 ${chosenName} (шини!) + ${itemDef(leader.rewardItem).nameRu} + Супердаркбол×10!`, false);
    }
    autoSave();
    if (typeof renderTeamGrid === 'function') renderTeamGrid();
  }, true);
}
