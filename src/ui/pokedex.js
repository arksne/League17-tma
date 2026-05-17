import { 
  getPokedexState, getTypeColor, getTypeGradient, getEvolutions, 
  evolvesFromMap, getPowerStars, getRarityStars 
} from '../../main.js';
import { gymLeaders } from '../data/gyms.js';

// ================================================================
// FEATURE: POKEDEX
// ================================================================
export function getPokedexId(speciesName) {
  const { POKEDEX_ALL } = getPokedexState();
  const idx = POKEDEX_ALL.indexOf(speciesName);
  return idx >= 0 ? idx + 1 : -1;
}

export function openPokedex() {
  const { pokedexSeen, pokedexCaught, POKEDEX_ALL, pokedexData, pokedexTotal } = getPokedexState();
  const modal = document.getElementById('pokedex-modal');
  if (!modal) return;
  modal.style.display = 'flex';

  const grid = document.getElementById('pokedex-grid');
  const countEl = document.getElementById('pokedex-count');
  const searchEl = document.getElementById('pokedex-search');
  const detailEl = document.getElementById('pokedex-detail');
  const genFilter = document.getElementById('pokedex-gen-filter');
  const statusFilter = document.getElementById('pokedex-status-filter');

  if (detailEl) detailEl.style.display = 'none';
  if (searchEl) { searchEl.value = ''; searchEl.style.display = 'block'; }
  if (grid) { grid.style.display = 'grid'; grid.style.visibility = 'visible'; grid.style.position = 'relative'; }
  if (genFilter) genFilter.value = 'all';
  if (statusFilter) statusFilter.value = 'all';

  function renderGrid() {
    grid.innerHTML = '';
    const searchTerm = searchEl?.value.toLowerCase().trim() || '';
    const genVal = genFilter?.value || 'all';
    const statusVal = statusFilter?.value || 'all';

    let visible = 0;
    POKEDEX_ALL.forEach((name, idx) => {
      const dexId = idx + 1;

      // Generation filter
      if (genVal !== 'all') {
        const gen = parseInt(genVal);
        if (gen === 1 && dexId > 151) return;
        if (gen === 2 && (dexId < 152 || dexId > 251)) return;
        if (gen === 3 && (dexId < 252 || dexId > 386)) return;
        if (gen === 4 && dexId < 387) return;
      }

      // Status filter
      const isCaught = pokedexCaught.has(name);
      const isSeen = pokedexSeen.has(name);
      if (statusVal === 'caught' && !isCaught) return;
      if (statusVal === 'seen' && !isSeen) return;
      if (statusVal === 'unknown' && (isCaught || isSeen)) return;

      // Search filter
      if (searchTerm) {
        if (!name.includes(searchTerm) && String(dexId) !== searchTerm) return;
      }

      visible++;
      const cell = document.createElement('div');
      cell.className = 'pokedex-cell';

      let statusClass = 'unknown';
      if (isCaught) statusClass = 'caught';
      else if (isSeen) statusClass = 'seen';

      cell.classList.add(statusClass);
      cell.innerHTML = `
        <span class="dex-num">#${dexId}</span>
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${name}.png" alt="${name}" loading="lazy" onerror="this.style.opacity='0.3'">
        <span class="poke-name">${name}</span>
      `;
      grid.appendChild(cell);
      cell.addEventListener('click', () => showPokedexInfo(name));
    });

    countEl.innerText = `Поймано: ${pokedexCaught.size} / ${pokedexTotal}`;
  }

  renderGrid();

  searchEl.oninput = renderGrid;
  if (genFilter) genFilter.onchange = renderGrid;
  if (statusFilter) statusFilter.onchange = renderGrid;
}

export async function showPokedexInfo(speciesName) {
  const { pokedexSeen, pokedexCaught, POKEDEX_ALL, pokedexData, pokedexTotal } = getPokedexState();
  const detailEl = document.getElementById('pokedex-detail');
  const gridEl = document.getElementById('pokedex-grid');
  const searchEl = document.getElementById('pokedex-search');
  const filtersEl = document.getElementById('pokedex-filters');
  if (!detailEl || !gridEl) return;

  gridEl.style.visibility = 'hidden';
  gridEl.style.position = 'absolute';
  if (searchEl) searchEl.style.display = 'none';
  if (filtersEl) filtersEl.style.display = 'none';
  detailEl.style.display = 'flex';
  detailEl.innerHTML = '<div class="pokedex-detail-loading">Загрузка...</div>';

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${speciesName}`);
    const data = await res.json();

    const types = data.types.map(t => `<span class="type-badge" style="background-color:${getTypeColor(t.type.name)}">${t.type.name}</span>`).join('');

    let statusText = '❓ Неизвестен';
    let statusClass = 'unknown';
    if (pokedexCaught.has(speciesName)) {
      statusText = '✅ Пойман';
      statusClass = 'caught';
    } else if (pokedexSeen.has(speciesName)) {
      statusText = '👁️ Замечен';
      statusClass = 'seen';
    }

    const statColors = { hp: '#ff3b30', attack: '#ff9500', defense: '#ffcc00', 'special-attack': '#5ac8fa', 'special-defense': '#4cd964', speed: '#007aff' };
    const statNames = { hp: 'HP', attack: 'Атк', defense: 'Защ', 'special-attack': 'СпА', 'special-defense': 'СпЗ', speed: 'Скор' };

    const statsHtml = data.stats.map(s => {
      const base = s.base_stat;
      const pct = Math.min(100, (base / 255) * 100);
      const color = statColors[s.stat.name] || '#777';
      return `<div class="pokedex-detail-stat">
        <span class="stat-label">${statNames[s.stat.name] || s.stat.name}</span>
        <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${pct}%;background:${color}"></div></div>
        <span class="stat-value">${base}</span>
      </div>`;
    }).join('');

    const spriteUrl = data.sprites?.other?.['official-artwork']?.front_default || data.sprites.front_default;
    const shinyUrl = data.sprites?.other?.['official-artwork']?.front_shiny || data.sprites.front_shiny;
    const detailTypeBg = getTypeGradient(data.types);

    // Find gym leaders using this Pokemon
    const gymUsers = [];
    for (const [key, leader] of Object.entries(gymLeaders)) {
      if (leader.team) {
        const names = leader.team.flatMap(m => m.name ? [m.name] : []);
        if (names.some(n => n.replace('_2','') === speciesName)) gymUsers.push(leader.name);
      }
    }

    // Evolution info
    const evolutions = await getEvolutions(speciesName);
    let evoHtml = '';
    if (evolutions.length > 0) {
      evoHtml = `<div class="pokedex-detail-method" style="background:rgba(52,199,89,0.1);border-color:#34c759;">
        <div class="method-row"><b>🔮 Эволюции:</b></div>
        ${evolutions.map(evo => {
          const cond = evo.minLevel ? `Ур.${evo.minLevel}` : evo.trigger === 'use-item' ? (evo.item || 'Камень') : (evo.trigger || 'Особая');
          return `<div class="method-row" style="cursor:pointer;color:var(--tma-primary);margin-top:3px;" onclick="showPokedexInfo('${evo.name}')">→ ${evo.name} (${cond})</div>`;
        }).join('')}
      </div>`;
    }

    // Find pokemon that evolve INTO this one (from reverse map populated by chain fetch above)
    const evolvesFrom = evolvesFromMap[speciesName] || [];
    let prevoHtml = '';
    if (evolvesFrom.length > 0) {
      prevoHtml = `<div class="pokedex-detail-method" style="background:rgba(0,122,255,0.1);border-color:#007aff;">
        <div class="method-row"><b>Эволюция из:</b></div>
        ${evolvesFrom.map(name => `<div class="method-row" style="cursor:pointer;color:var(--tma-primary);margin-top:3px;" onclick="showPokedexInfo('${name}')">← ${name}</div>`).join('')}
      </div>`;
    }

    // Prev/Next navigation
    const curIdx = POKEDEX_ALL.indexOf(speciesName);
    const prevName = curIdx > 0 ? POKEDEX_ALL[curIdx - 1] : null;
    const nextName = curIdx < POKEDEX_ALL.length - 1 ? POKEDEX_ALL[curIdx + 1] : null;

    detailEl.innerHTML = `
      <button class="pokedex-detail-back" id="pokedex-detail-back">← Назад</button>
      <div style="display:flex;gap:8px;margin-bottom:8px;">
        ${prevName ? `<button class="pokedex-detail-back" style="flex:1;text-align:center;margin:0;padding:6px;" onclick="showPokedexInfo('${prevName}')">◀ ${prevName}</button>` : '<span style="flex:1;"></span>'}
        ${nextName ? `<button class="pokedex-detail-back" style="flex:1;text-align:center;margin:0;padding:6px;" onclick="showPokedexInfo('${nextName}')">${nextName} ▶</button>` : '<span style="flex:1;"></span>'}
      </div>
      <div class="pokedex-detail-header">
        <div class="pokedex-detail-sprite-box" style="background:${detailTypeBg};" id="dex-sprite-box">
          <img class="pokedex-detail-sprite" id="dex-sprite" src="${spriteUrl}" alt="${data.name}">
        </div>
        <div class="pokedex-detail-title">
          <h2>${data.name}</h2>
          <span class="dex-number">#${String(data.id).padStart(3, '0')}</span>
          <div class="pokedex-detail-types">${types}</div>
          <button id="btn-shiny-toggle" style="margin-top:4px;padding:2px 8px;font-size:0.7rem;background:var(--tma-bg);border:1px solid var(--tma-border);color:var(--tma-text);border-radius:4px;cursor:pointer;">✨ Шайни</button>
        </div>
      </div>
      <div class="pokedex-detail-status ${statusClass}">${statusText}</div>
      <div style="display:flex;justify-content:space-around;font-size:0.7rem;margin:4px 0;">
        <span>${getPowerStars({apiData:data})}★ мощи</span>
        <span>${getRarityStars({apiData:data})}✦ редкость</span>
      </div>
      ${pokedexData[speciesName] ? `
      <div class="pokedex-detail-method">
        <div class="method-row"><b>Способ:</b> ${pokedexData[speciesName].method}</div>
        <div class="method-row"><b>Где:</b> ${pokedexData[speciesName].location}</div>
      </div>` : ''}
      ${gymUsers.length > 0 ? `
      <div class="pokedex-detail-method" style="background:rgba(175,82,222,0.15);border-color:#af52de;">
        <div class="method-row"><b>⚔ Используется лидерами:</b> ${gymUsers.join(', ')}</div>
      </div>` : ''}
      ${prevoHtml}
      ${evoHtml}
      <div class="pokedex-detail-stats">
        <h4>Базовые статы</h4>
        ${statsHtml}
      </div>
    `;

    // Shiny toggle
    let showingShiny = false;
    document.getElementById('btn-shiny-toggle').addEventListener('click', () => {
      showingShiny = !showingShiny;
      document.getElementById('dex-sprite').src = showingShiny ? (shinyUrl || spriteUrl) : spriteUrl;
      document.getElementById('btn-shiny-toggle').textContent = showingShiny ? '✨ Обычный' : '✨ Шайни';
      if (showingShiny && shinyUrl) {
        document.getElementById('dex-sprite-box').style.background = 'radial-gradient(circle, #3a2a5a 0%, #1a1a3a 100%)';
      } else {
        document.getElementById('dex-sprite-box').style.background = detailTypeBg;
      }
    });

    document.getElementById('pokedex-detail-back').addEventListener('click', () => {
      detailEl.style.display = 'none';
      gridEl.style.visibility = 'visible';
      gridEl.style.position = 'relative';
      if (searchEl) searchEl.style.display = 'block';
      if (filtersEl) filtersEl.style.display = 'flex';
    });

  } catch (e) {
    detailEl.innerHTML = '<div class="pokedex-detail-loading">Ошибка загрузки</div>';
  }
}

window.showPokedexInfo = showPokedexInfo;

