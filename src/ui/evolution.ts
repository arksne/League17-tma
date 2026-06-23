import { getPowerStars } from '../utils/state.js';
import { getTypeGradient, getSpriteUrl } from '../utils/sprite.js';
import { fetchPokeAPI } from '../utils/api.js';
import { STONE_ITEM_MAP } from '../data/stones.js';
// Lazy imports for cycle-breaking (core.ts ↔ evolution.ts)
let _evolutionCache: Record<string, any> | null = null;
let _evolvesFromMap: Record<string, any> | null = null;
async function getEvolutionData() {
  if (!_evolutionCache) {
    const m = await import('../battle/core.js');
    _evolutionCache = m.evolutionCache;
    _evolvesFromMap = m.evolvesFromMap;
  }
  return { evolutionCache: _evolutionCache, evolvesFromMap: _evolvesFromMap };
}

// FEATURE: EVOLUTION
// ================================================================
// Map form-variant names to their base species name for pokemon-species endpoint
// (e.g. wishiwashi-solo → wishiwashi, because /pokemon-species/wishiwashi-solo 404s)
const SPECIES_NAME_MAP = {
  'wishiwashi-solo': 'wishiwashi',
  'minior-red-meteor': 'minior',
  'minior-orange': 'minior',
  'minior-yellow': 'minior',
  'minior-green': 'minior',
  'minior-blue': 'minior',
  'minior-indigo': 'minior',
  'minior-violet': 'minior',
  'mimikyu-disguised': 'mimikyu',
  'mimikyu-busted': 'mimikyu',
  'toxtricity-amped': 'toxtricity',
  'toxtricity-low-key': 'toxtricity',
  'morpeko-full-belly': 'morpeko',
  'morpeko-hangry': 'morpeko',
  'urshifu-single-strike': 'urshifu',
  'urshifu-rapid-strike': 'urshifu',
  'maushold-family-of-four': 'maushold',
  'maushold-family-of-three': 'maushold',
  'squawkabilly-green-plumage': 'squawkabilly',
  'squawkabilly-blue-plumage': 'squawkabilly',
  'squawkabilly-yellow-plumage': 'squawkabilly',
  'squawkabilly-white-plumage': 'squawkabilly',
  'palafin-zero': 'palafin',
  'palafin-hero': 'palafin',
  'tatsugiri-curly': 'tatsugiri',
  'tatsugiri-droopy': 'tatsugiri',
  'tatsugiri-stretchy': 'tatsugiri',
  'dudunsparce-two-segment': 'dudunsparce',
  'dudunsparce-three-segment': 'dudunsparce',
};

export async function fetchEvolutionChain(pokemonName) {
  const { evolutionCache, evolvesFromMap } = await getEvolutionData();
  async function trySpecies(name) {
    const speciesData = await fetchPokeAPI(`pokemon-species/${name}`);
    const chainData = await fetchPokeAPI(speciesData.evolution_chain.url);
    let chain = chainData.chain;
    // Traverse full chain tree and populate both forward + reverse maps
    const queue = [chain];
    while (queue.length > 0) {
      const node = queue.shift();
      const curName = node.species.name;
      if (!evolutionCache[curName]) evolutionCache[curName] = node.evolves_to;
      for (const child of node.evolves_to) {
        const childName = child.species.name;
        if (!evolvesFromMap[childName]) evolvesFromMap[childName] = [];
        if (!evolvesFromMap[childName].includes(curName)) evolvesFromMap[childName].push(curName);
        queue.push(child);
      }
    }
    return evolutionCache[pokemonName] || [];
  }
  // Use SPECIES_NAME_MAP to avoid 404 on first try for form-variant names
  const speciesName = SPECIES_NAME_MAP[pokemonName] || pokemonName;
  try {
    const result = await trySpecies(speciesName);
    // Map the form variant name to the cache entry
    if (speciesName !== pokemonName) {
      evolutionCache[pokemonName] = evolutionCache[speciesName] || [];
    }
    return result;
  } catch (e) {
    // Fallback: strip everything after first hyphen
    if (pokemonName.includes('-') && speciesName === pokemonName) {
      const baseName = pokemonName.split('-')[0];
      if (baseName !== pokemonName) {
        try {
          const result = await trySpecies(baseName);
          evolutionCache[pokemonName] = evolutionCache[baseName] || [];
          return result;
        } catch (_) {}
      }
    }
    console.warn('Evolution fetch failed for', pokemonName, e);
    evolutionCache[pokemonName] = [];
    return [];
  }
}

export async function getEvolutions(pokemonName) {
  const { evolutionCache, evolvesFromMap } = await getEvolutionData();
  if (evolutionCache[pokemonName] !== undefined) {
    // Reverse map may be empty if cached before the fix — populate it
    if (evolvesFromMap[pokemonName] === undefined) {
      await fetchEvolutionChain(pokemonName);
    }
    return evolutionCache[pokemonName].map(evo => {
      const d = evo.evolution_details && evo.evolution_details[0] ? evo.evolution_details[0] : {};
      return {
        name: evo.species.name,
        minLevel: d.min_level || null,
        trigger: d.trigger ? d.trigger.name : null,
        item: d.item ? d.item.name : null
      };
    });
  }
  const chain = await fetchEvolutionChain(pokemonName);
  return chain.map(evo => {
    const d = evo.evolution_details && evo.evolution_details[0] ? evo.evolution_details[0] : {};
    return {
      name: evo.species.name,
      minLevel: d.min_level || null,
      trigger: d.trigger ? d.trigger.name : null,
      item: d.item ? d.item.name : null
    };
  });
}

export async function checkEvolution(pokemon, useStone = false, stoneItem = null) {
  const evos = await getEvolutions(pokemon.apiData.name);
  const effectiveLevel = pokemon.baseLevel + (pokemon.candiesEaten || 0);
  for (const evo of evos) {
    if (evo.minLevel && effectiveLevel >= evo.minLevel) {
      return evo;
    }
    if (useStone && evo.trigger === 'use-item') {
      if (stoneItem && STONE_ITEM_MAP[stoneItem]) {
        // evo.item is a string (item name), not an object
        if (evo.item && evo.item === STONE_ITEM_MAP[stoneItem]) {
          return evo;
        }
      } else {
        return evo;
      }
    }
  }
  return null;
}

export async function triggerEvolution(pokemon, targetName) {
  const overlay = document.getElementById('evolution-overlay');
  const evoSprite = document.getElementById('evo-sprite') as HTMLImageElement;
  const evoText = document.getElementById('evo-text');
  if (!overlay) return;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const oldName = pokemon.apiData.name;
  const oldSprite = getSpriteUrl(pokemon);
  const evoBox = evoSprite.closest('.evo-sprite-box') as HTMLElement | null;
  overlay.style.display = 'flex';

  // Stage 1: "What?!" — old sprite with shake animation
  evoText.innerHTML = `<span class="evo-shake">Что?!</span><br><small>${oldName} эволюционирует!</small>`;
  evoSprite.src = oldSprite;
  if (evoBox) { evoBox.style.background = getTypeGradient(pokemon.apiData.types); evoBox.classList.add('evo-flash'); }
  await wait(2200);

  // Stage 2: Brightness flashes
  evoText.innerHTML = '✨ <span class="evo-glowing">Эволюция!</span> ✨';
  evoSprite.style.filter = 'brightness(3)';
  await wait(700);
  evoSprite.style.filter = 'brightness(0.3)';
  await wait(400);
  evoSprite.style.filter = 'brightness(2.5)';
  await wait(500);
  evoSprite.style.filter = 'brightness(1)';

  // Stage 3: Fetch new form
  try {
    const newData = await fetchPokeAPI(`pokemon/${targetName}`);
    // Preserve current moves so evolution doesn't wipe them
    const oldMoves = pokemon.apiData.moves ? [...pokemon.apiData.moves] : [];
    const oldPP = pokemon.movesPP ? [...pokemon.movesPP] : [];
    const oldLearnable = pokemon.learnableMoves ? [...pokemon.learnableMoves] : [];
    const oldLastCheckLevel = pokemon.lastMoveCheckLevel;

    pokemon.apiData = newData;

    // Restore the 4-slot moveset (evolution doesn't change known moves)
    if (oldMoves.length > 0) pokemon.apiData.moves = oldMoves;
    if (oldPP.length > 0) pokemon.movesPP = oldPP;
    if (oldLearnable.length > 0) pokemon.learnableMoves = oldLearnable;
    pokemon.lastMoveCheckLevel = oldLastCheckLevel || 1;

    // Auto-add new evolution moves to reserve (learnableMoves)
    const curLvl = pokemon.baseLevel + (pokemon.candiesEaten || 0);
    const knownMoveNames = new Set();
    for (let i = 0; i < 4; i++) {
      if (pokemon.apiData.moves[i]?.move?.name) knownMoveNames.add(pokemon.apiData.moves[i].move.name);
    }
    if (!pokemon.learnableMoves) pokemon.learnableMoves = [];
    const reserveNames = new Set(pokemon.learnableMoves.map(m => m.name));
    for (const entry of (newData.moves || [])) {
      for (const detail of entry.version_group_details) {
        if (detail.move_learn_method.name === 'level-up' && detail.level_learned_at <= curLvl) {
          if (!knownMoveNames.has(entry.move.name) && !reserveNames.has(entry.move.name)) {
            pokemon.learnableMoves.push({ name: entry.move.name, url: entry.move.url, power: 0, type: 'normal' });
          }
          break;
        }
      }
    }

    const baseHp = newData.stats[0].base_stat;
    const newMaxHp = Math.floor(0.01 * (2 * baseHp + pokemon.ivs.hp + Math.floor(0.25 * pokemon.evs.hp)) * curLvl) + curLvl + 10;
    const oldMaxHp = pokemon.maxHp;
    pokemon.maxHp = newMaxHp;
    pokemon.currentHp = Math.min(pokemon.currentHp + (newMaxHp - oldMaxHp), newMaxHp);

    // Stage 4: Reveal new sprite
    evoSprite.src = getSpriteUrl(pokemon); // apiData already updated to newData, isShiny preserved
    if (evoBox) evoBox.style.background = getTypeGradient(newData.types);
    evoText.innerHTML = `<b>${targetName.toUpperCase()}!</b>`;
    evoSprite.style.filter = 'brightness(1.3) drop-shadow(0 0 20px gold)';
    evoBox?.classList.remove('evo-flash');
    evoBox?.classList.add('evo-reveal');
    await wait(1800);

    // Stage 5: Show stats
    const newStars = getPowerStars(pokemon);
    const bst = newData.stats.reduce((s, st) => s + st.base_stat, 0);
    const types = newData.types.map(t => t.type.name).join(', ');
    evoText.innerHTML = `
      <b>${targetName.toUpperCase()}</b><br>
      <small style="color:#aaa">${types} | BST: ${bst}</small><br>
      <span style="color:#ff9500;font-size:1rem;">${'★'.repeat(newStars)}${'☆'.repeat(10-newStars)}</span><br>
      <small style="color:#5af">HP: ${oldMaxHp} → ${newMaxHp}</small>
    `;
    evoBox?.classList.remove('evo-reveal');
    await wait(3000);
  } catch (e) {
    console.warn('Evolution fetch failed for', targetName, e);
    evoText.innerHTML = 'Ошибка эволюции...';
    await wait(2000);
  }

  evoSprite.style.filter = '';
  evoBox?.classList.remove('evo-flash', 'evo-reveal');
  overlay.style.display = 'none';
}

// ================================================================
