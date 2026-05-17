import { getPowerStars, getTypeGradient, evolutionCache, evolvesFromMap } from '../../main.js';
import { STONE_ITEM_MAP } from '../data/stones.js';

// FEATURE: EVOLUTION
// ================================================================
export async function fetchEvolutionChain(pokemonName) {
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
    const speciesData = await speciesRes.json();
    const chainRes = await fetch(speciesData.evolution_chain.url);
    const chainData = await chainRes.json();
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
  } catch (e) {
    console.warn('Evolution fetch failed for', pokemonName, e);
    evolutionCache[pokemonName] = [];
    return [];
  }
}

export async function getEvolutions(pokemonName) {
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
  const evoSprite = document.getElementById('evo-sprite');
  const evoText = document.getElementById('evo-text');
  if (!overlay) return;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  const oldName = pokemon.apiData.name;
  const oldSprite = pokemon.apiData.sprites?.other?.['official-artwork']?.front_default || pokemon.apiData.sprites?.front_default || '';
  const evoBox = evoSprite.closest('.evo-sprite-box');
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
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${targetName}`);
    const newData = await res.json();
    pokemon.apiData = newData;

    const baseHp = newData.stats[0].base_stat;
    const curLvl = pokemon.baseLevel + (pokemon.candiesEaten || 0);
    const newMaxHp = Math.floor(0.01 * (2 * baseHp + pokemon.ivs.hp + Math.floor(0.25 * pokemon.evs.hp)) * curLvl) + curLvl + 10;
    const oldMaxHp = pokemon.maxHp;
    pokemon.maxHp = newMaxHp;
    pokemon.currentHp = Math.min(pokemon.currentHp + (newMaxHp - oldMaxHp), newMaxHp);

    // Stage 4: Reveal new sprite
    evoSprite.src = newData.sprites?.other?.['official-artwork']?.front_default || newData.sprites?.front_default || '';
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
