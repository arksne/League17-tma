import { state } from '../game/state.js';
import { store } from '../game/store.js';
import { generateUID, getTrainerId } from '../game/state.js';
import { showToast } from '../utils/dom.js';
import { natures } from '../data/natures.js';
import { GEN_STARTERS } from '../data/starters.js';

export async function giveStarterMon(pokemonName: string) {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    const starterData = await res.json();
    const baseLevel = 5;

    // Filter moves to only those learned at level <= 5
    let learnedMoves = starterData.moves.filter((m: any) => {
      return m.version_group_details.some((v: any) => v.move_learn_method.name === 'level-up' && v.level_learned_at <= baseLevel);
    }).slice(0, 4);

    if (learnedMoves.length === 0) {
      learnedMoves.push({ move: { name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/' } });
    }
    starterData.moves = learnedMoves;

    const exp = Math.pow(baseLevel, 3);
    const expToNext = Math.pow(baseLevel + 1, 3);
    const baseHp = starterData.stats[0].base_stat;
    const maxHp = Math.floor(0.01 * (2 * baseHp + 30) * baseLevel) + baseLevel + 10;

    const newMon: any = {
      uid: generateUID(),
      originalTrainer: getTrainerId(),
      createdAt: Date.now(),
      caughtLocation: state.currentLocationId,
      apiData: starterData,
      maxHp,
      currentHp: maxHp,
      ivs: { hp: 30, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: baseLevel,
      exp: exp,
      expToNext: expToNext,
      candiesEaten: 0,
      vitaminsEaten: 0,
      training: null,
      trainingStage: 0,
      trainingStat: null,
      happiness: 70,
      natureIdx: Math.floor(Math.random() * natures.length),
      breedLetter: 'A',
      gender: Math.random() < 0.5 ? 'male' : 'female',
      status: null,
      sleepTurns: 0,
      movesPP: [],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: starterData.abilities[0]?.ability?.name || null,
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: []
    };

    newMon.maxHp = Math.floor(0.01 * (2 * starterData.stats[0].base_stat + newMon.ivs.hp + Math.floor(0.25 * newMon.evs.hp)) * newMon.baseLevel) + newMon.baseLevel + 10;
    newMon.currentHp = newMon.maxHp;

    if (state.myTeam.length < 6) {
      state.myTeam.push(newMon);
    } else {
      if (state.pcBoxes.length === 0) state.pcBoxes.push([]);
      state.pcBoxes[0].push(newMon);
    }
    state.pokedexSeen.add(pokemonName);
    state.pokedexCaught.add(pokemonName);
    store.emit('location:render', state.currentLocationId);
    store.emit('team:render');
    store.emit('save');

    const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
    if (state.tgToken) authHeaders['Authorization'] = `Bearer ${state.tgToken}`;
    fetch('/api/auth/register', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ starterPokemon: pokemonName })
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to give starter', e);
  }
}

export function giveStarter() {
  const modal = document.getElementById('starter-modal');
  const grid = document.getElementById('starter-grid');
  if (!modal || !grid) {
    giveStarterMon('bulbasaur');
    return;
  }

  grid.innerHTML = '';
  const title = document.querySelector('#starter-modal h2');
  if (title) title.innerText = 'Выберите карту (Поколения 1-9)';

  GEN_STARTERS.forEach((gen: string[], idx: number) => {
    const div = document.createElement('div');
    div.className = 'starter-option';
    div.style.background = 'linear-gradient(135deg, #2a5298, #1e3c72)';
    div.style.color = '#fff';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'center';
    div.style.fontSize = '3rem';
    div.style.fontWeight = 'bold';
    div.style.cursor = 'pointer';
    div.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    div.style.borderRadius = '10px';
    div.style.height = '150px';
    div.style.transition = 'transform 0.2s';
    div.innerText = '?';

    div.addEventListener('mouseenter', () => div.style.transform = 'scale(1.05)');
    div.addEventListener('mouseleave', () => div.style.transform = 'scale(1)');

    div.addEventListener('click', () => {
      const chosenStarter = gen[Math.floor(Math.random() * gen.length)];
      modal.style.display = 'none';
      giveStarterMon(chosenStarter);
      showToast(`Вам выпал покемон: ${chosenStarter.toUpperCase()}! (Gen ${idx + 1})`, false);
    });
    grid.appendChild(div);
  });

  modal.style.display = 'flex';
}
