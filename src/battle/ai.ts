/**
 * Enemy AI move selection.
 * Pure function — no side effects, no DOM, no module state.
 */
export function selectEnemyMove({
  moves,
  movesPP,
  attacker,
  defender,
  isTrainer,
  getTypeMultiplier,
}) {
  if (!moves || moves.length === 0) return null;

  let chosenMove = null;
  let chosenIdx = -1;

  if (isTrainer) {
    // Smart AI: pick best move by effectiveness × STAB × power
    let bestScore = -1;
    for (let i = 0; i < moves.length; i++) {
      const m = moves[i];
      if (!m) continue;
      const hasPP = movesPP && movesPP[i] && movesPP[i].current > 0;
      if (!hasPP) continue;
      const power = m.power || 1;
      const stab = (attacker.types || []).some(t => t.type?.name === m.type?.name) ? 1.5 : 1.0;
      const mult = getTypeMultiplier(m.type.name, defender.apiData?.types || defender.types || []);
      const score = m.power ? power * stab * mult : 60 * mult;
      if (score > bestScore) { bestScore = score; chosenMove = m; chosenIdx = i; }
    }
  } else {
    // Wild: random move with available PP
    for (let attempt = 0; attempt < 20; attempt++) {
      const idx = Math.floor(Math.random() * moves.length);
      if (moves[idx]) {
        if (movesPP && movesPP[idx] && movesPP[idx].current <= 0) continue;
        chosenMove = moves[idx];
        chosenIdx = idx;
        break;
      }
    }
  }

  if (!chosenMove) {
    chosenMove = { power: 30, damage_class: { name: 'physical' }, type: { name: 'normal' }, name: 'Атака' };
  }

  return { move: chosenMove, index: chosenIdx };
}
