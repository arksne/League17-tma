import { state } from '../game/state.js';
import { showToast } from '../utils/dom.js';
import { getSpriteUrl } from '../utils/sprite.js';
import { autoSave } from '../game/save.js';
import { updateMoneyDisplay } from '../ui/location.js';

export function openPvPArena(battleId, opponent, myFirst) {
  state.pvpBattleId = battleId;
  state.pvpOpponentName = opponent;
  state.pvpMyTurn = myFirst;
  const alive = state.myTeam.find(m => m.currentHp > 0);
  if (!alive) { showToast('Нет живых покемонов!', true); return; }
  state.pvpMyMon = alive;

  let modal = document.getElementById('pvp-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pvp-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="reborn-battle-arena" style="max-width:440px;width:95%;">
        <div class="text-center p-8"><span id="pvp-opponent-name" class="fw-bold"></span></div>
        <div class="text-center fs-09" id="pvp-turn-indicator"></div>
        <div class="reborn-pokemon-row">
          <div class="reborn-side-panel">
            <div class="reborn-poke-header"><span id="pvp-my-name"></span> <span id="pvp-my-lvl"></span></div>
            <div class="reborn-hp-bar"><div class="reborn-hp-fill" id="pvp-my-hp-fill"></div></div>
            <div class="reborn-hp-text" id="pvp-my-hp"></div>
            <div class="reborn-sprite-box"><img class="reborn-sprite" id="pvp-my-sprite" src=""></div>
          </div>
          <div class="reborn-side-panel">
            <div class="reborn-poke-header"><span id="pvp-opp-name"></span> <span id="pvp-opp-lvl"></span></div>
            <div class="reborn-hp-bar"><div class="reborn-hp-fill" id="pvp-opp-hp-fill"></div></div>
            <div class="reborn-hp-text" id="pvp-opp-hp"></div>
            <div class="reborn-sprite-box"><img class="reborn-sprite" id="pvp-opp-sprite" src=""></div>
          </div>
        </div>
        <div class="reborn-center-panel">
          <div class="reborn-moves" id="pvp-moves"></div>
          <div class="reborn-log-container"><div class="reborn-battle-log" id="pvp-log"></div></div>
        </div>
        <button class="tma-btn w-full mt-8" id="btn-pvp-leave">Сдаться</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-pvp-leave').addEventListener('click', () => {
      modal.style.display = 'none';
      state.socket.emit('pvp_end', { battleId: state.pvpBattleId, action: { type: 'surrender' } });
      state.pvpBattleId = null;
      autoSave();
      updateMoneyDisplay();
    });
  }

  document.getElementById('pvp-opponent-name').textContent = `⚔ Бой с ${opponent}`;
  document.getElementById('pvp-opp-name').textContent = opponent;
  document.getElementById('pvp-opp-lvl').textContent = '';
  document.getElementById('pvp-opp-hp').textContent = '?/?';
  document.getElementById('pvp-opp-hp-fill').style.width = '100%';
  document.getElementById('pvp-opp-sprite').src = '';
  document.getElementById('pvp-log').innerHTML = '';
  updatePvPUI();
  modal.style.display = 'flex';

  // Send my pokemon data to opponent
  const mon = state.pvpMyMon;
  state.socket.emit('pvp_action', { battleId, action: {
    type: 'mon_data',
    name: mon.nickname || mon.apiData?.name,
    lvl: mon.baseLevel + (mon.candiesEaten || 0),
    hp: mon.currentHp,
    maxHp: mon.maxHp,
    sprite: getSpriteUrl(mon)
  }});
}

export function updatePvPUI() {
  if (!state.pvpMyMon) return;
  const mon = state.pvpMyMon;
  const curLvl = mon.baseLevel + (mon.candiesEaten || 0);
  document.getElementById('pvp-my-name').textContent = mon.nickname || mon.apiData?.name;
  document.getElementById('pvp-my-lvl').textContent = `Lv${curLvl}`;
  document.getElementById('pvp-my-hp').textContent = `${mon.currentHp}/${mon.maxHp}`;
  document.getElementById('pvp-my-hp-fill').style.width = `${Math.max(0, (mon.currentHp / mon.maxHp) * 100)}%`;
  const sprite = getSpriteUrl(mon);
  document.getElementById('pvp-my-sprite').src = sprite;

  document.getElementById('pvp-turn-indicator').textContent = state.pvpMyTurn ? '🎯 Ваш ход!' : '⏳ Ожидание хода соперника...';
  document.getElementById('pvp-turn-indicator').style.color = state.pvpMyTurn ? '#34c759' : '#ff9500';

  const movesDiv = document.getElementById('pvp-moves');
  movesDiv.innerHTML = '';
  state.pvpMovesDetailed = [];

  const seen = new Set();
  const lm = [];
  if (mon.apiData?.moves) {
    for (const entry of mon.apiData.moves) {
      if (!entry.move?.url) continue;
      const vgd = entry.version_group_details || [];
      let learnLevel = 0;
      let isLevelUp = false;
      for (const detail of vgd) {
        if (detail.move_learn_method?.name === 'level-up') {
          learnLevel = detail.level_learned_at || 0;
          isLevelUp = true;
          break;
        }
      }
      if (isLevelUp && learnLevel <= curLvl && !seen.has(entry.move.name)) {
        seen.add(entry.move.name);
        lm.push({ name: entry.move.name, url: entry.move.url, level: learnLevel });
      }
    }
  }
  lm.sort((a, b) => b.level - a.level);
  const topMoves = lm.slice(0, 4);
  state.pvpMovesDetailed = topMoves.map(() => null);

  topMoves.forEach((m, i) => {
    fetch(m.url).then(r => r.json()).then(d => {
      state.pvpMovesDetailed[i] = d;
      const btns = movesDiv.querySelectorAll('.reborn-move-link');
      if (btns[i]) {
        btns[i].classList.remove('move-type-physical', 'move-type-special', 'move-type-status');
        if (d.damage_class?.name) btns[i].classList.add(`move-type-${d.damage_class.name}`);
      }
    }).catch(() => {});

    const btn = document.createElement('span');
    btn.className = 'reborn-move-link';
    btn.textContent = m.name;
    btn.style.opacity = state.pvpMyTurn ? '1' : '0.5';
    btn.onclick = () => {
      if (!state.pvpMyTurn) { showToast('Сейчас ход соперника!', true); return; }
      doPvPAttack(i);
    };
    movesDiv.appendChild(btn);
  });
}

export function doPvPAttack(moveIdx) {
  if (!state.pvpMyMon || !state.pvpBattleId) return;
  const detailed = state.pvpMovesDetailed[moveIdx];
  const moveName = detailed?.name || 'Атака';
  const lvl = state.pvpMyMon.baseLevel + (state.pvpMyMon.candiesEaten || 0);
  const atk = (state.pvpMyMon.apiData?.stats?.[1]?.base_stat || 60);
  const power = detailed?.power || 60;
  const rawDmg = Math.floor(((lvl * power * (atk / 100)) / 15) * (0.85 + Math.random() * 0.3));
  const crit = Math.random() < 0.0625;
  const dmg = crit ? Math.floor(rawDmg * 1.5) : rawDmg;

  const logEl = document.getElementById('pvp-log');
  logEl.innerHTML = `Вы: ${moveName}! ${crit ? '💥Крит! ' : ''}(-${dmg})\n${logEl.innerHTML}`;

  state.pvpMyTurn = false;
  state.socket.emit('pvp_action', { battleId: state.pvpBattleId, action: { type: 'attack', moveName, dmg, crit } });
  updatePvPUI();
}

export function endPvP(won) {
  showToast(won ? '🏆 Победа в PvP! +500¥' : '💀 Поражение в PvP...', !won);
  if (won) { state.inventory['credit'] = (state.inventory['credit'] || 0) + 500; updateMoneyDisplay(); }
  document.getElementById('pvp-modal').style.display = 'none';
  state.socket.emit('pvp_end', { battleId: state.pvpBattleId, action: { type: won ? 'win' : 'lose' } });
  state.pvpBattleId = null;
  autoSave();
}
