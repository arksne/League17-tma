// === PURE BATTLE LOGIC — no DOM, no global state ===

export const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

export const WEATHERS = ['clear', 'rain', 'sun', 'sandstorm', 'hail'];

export function getTypeMultiplier(attackType, defenderTypes) {
  if (!TYPE_CHART[attackType]) return 1;
  let multiplier = 1;
  defenderTypes.forEach(typeObj => {
    const defType = typeof typeObj === 'string' ? typeObj : typeObj.type?.name;
    if (TYPE_CHART[attackType][defType] !== undefined) {
      multiplier *= TYPE_CHART[attackType][defType];
    }
  });
  return multiplier;
}

import { getWeatherMultiplier } from '../data/weather.js';
export { getWeatherMultiplier };

const STAT_MAP = { hp: 'hp', attack: 'atk', defense: 'def', 'special-attack': 'spa', 'special-defense': 'spd', speed: 'spe' };

/**
 * @param {object} pokemon - has .stats (wild) or .apiData.stats (player), .ivs/, .evs/, .natureIdx
 * @param {string} statName - 'hp'|'attack'|'defense'|'special-attack'|'special-defense'|'speed'
 * @param {object} opts - { isWild, level, ivs, evs, natures }
 */
export function calculateStat(pokemon, statName, opts: Record<string, any> = {}) {
  const isWild = opts.isWild || false;
  const baseStats = isWild ? pokemon.stats : pokemon.apiData?.stats;
  const statObj = baseStats?.find(s => s.stat?.name === statName);
  const base = statObj ? statObj.base_stat : 50;

  const level = opts.level ?? (isWild ? 50 : (pokemon.baseLevel + (pokemon.candiesEaten || 0)));
  const mapName = STAT_MAP[statName] || 'hp';

  const iv = isWild
    ? (pokemon.wildIVs?.[mapName] ?? opts.ivs?.[mapName] ?? 15)
    : (opts.ivs?.[mapName] ?? pokemon.ivs?.[mapName] ?? 15);
  const ev = isWild ? 0 : (opts.evs?.[mapName] ?? pokemon.evs?.[mapName] ?? 0);

  let natureMod = 1.0;
  if (statName !== 'hp' && !isWild && pokemon.natureIdx !== undefined) {
    const nature = (opts.natures || [])[pokemon.natureIdx];
    if (nature) {
      if (nature.buff === mapName) natureMod = 1.1;
      else if (nature.nerf === mapName) natureMod = 0.9;
    }
  }

  let result;
  if (statName === 'hp') {
    result = Math.floor(0.01 * (2 * base + iv + Math.floor(0.25 * ev)) * level) + level + 10;
  } else {
    result = Math.floor((Math.floor((2 * base + iv + Math.floor(0.25 * ev)) * level / 100) + 5) * natureMod);
  }

  // Apply stat stages
  if (pokemon.statStages) {
    const stageKey = STAT_MAP[statName];
    if (stageKey && pokemon.statStages[stageKey] !== undefined) {
      const stage = pokemon.statStages[stageKey];
      if (stage !== 0) {
        const stageMult = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        if (statName !== 'hp') result = Math.floor(result * stageMult);
      }
    }
  }

  // Choice item / held item multipliers (player mons only)
  if (!isWild && pokemon.heldItem) {
    const choiceMap = { choiceBand: 'attack', choiceScarf: 'speed', choiceSpecs: 'special-attack' };
    if (choiceMap[pokemon.heldItem] === statName) {
      result = Math.floor(result * 1.5);
    }
    if (pokemon.heldItem === 'thickClub' && statName === 'attack') {
      const species = pokemon.apiData?.species?.name || pokemon.apiData?.name || '';
      if (species === 'cubone' || species === 'marowak') result = Math.floor(result * 2);
    }
    if (pokemon.heldItem === 'eviolite' && (statName === 'defense' || statName === 'special-defense')) {
      if (pokemon.apiData?.species?.url) result = Math.floor(result * 1.5);
    }
    if (pokemon.heldItem === 'assaultVest' && statName === 'special-defense') {
      result = Math.floor(result * 1.5);
    }
  }

  return result;
}

export function getAbilityName(pokemon, isWild) {
  if (isWild) return pokemon.abilities?.[0]?.ability?.name || null;
  return pokemon.abilityName || null;
}

export function getStatusIcon(status) {
  const icons = { psn: '☠️', brn: '🔥', par: '⚡', slp: '💤', frz: '❄️' };
  return icons[status] || '';
}

export const STATUS_NAMES = { psn: 'Отравление', brn: 'Ожог', par: 'Паралич', slp: 'Сон', frz: 'Заморозка' };

/**
 * Apply status to target. Returns false if already has a status.
 */
export function applyStatusEffect(target, statusType) {
  if (target.status) return false;
  target.status = statusType;
  if (statusType === 'slp') {
    target.sleepTurns = Math.floor(Math.random() * 3) + 1;
  }
  return true;
}

export function cureStatus(target) {
  target.status = null;
  target.sleepTurns = 0;
}

/**
 * Check if target can act based on status.
 * @returns {{ canAct: boolean, message: string|null }}
 */
export function checkStatusTurn(target) {
  if (!target.status) return { canAct: true, message: null };

  if (target.status === 'slp') {
    target.sleepTurns--;
    if (target.sleepTurns <= 0) {
      target.status = null;
      target.sleepTurns = 0;
      return { canAct: true, message: 'проснулся!' };
    }
    return { canAct: false, message: 'спит...' };
  }

  if (target.status === 'frz') {
    if (Math.random() < 0.2) {
      target.status = null;
      return { canAct: true, message: 'оттаял!' };
    }
    return { canAct: false, message: 'заморожен!' };
  }

  if (target.status === 'par') {
    if (Math.random() < 0.25) {
      return { canAct: false, message: 'парализован!' };
    }
    return { canAct: true, message: null };
  }

  return { canAct: true, message: null };
}

/**
 * Apply end-of-turn status damage. Returns { damage }.
 */
export function applyStatusEndOfTurn(target, maxHp) {
  if (!target.status) return { damage: 0 };

  if (target.status === 'psn') {
    const dmg = Math.max(1, Math.floor(maxHp / 8));
    return { damage: dmg };
  }

  if (target.status === 'brn') {
    const dmg = Math.max(1, Math.floor(maxHp / 16));
    return { damage: dmg };
  }

  return { damage: 0 };
}

/**
 * Pure stat stage modification. Returns new stages object.
 */
export function statStageModify(stages, stat, delta) {
  const s = { ...stages };
  s[stat] = Math.max(-6, Math.min(6, (s[stat] || 0) + delta));
  return s;
}

/**
 * Check accuracy of a move. Returns { hit: bool, message: string|null }.
 * move.accuracy from PokeAPI: null = never misses, number = percentage.
 * Always-hitting moves: accuracy is null, or the move has "guaranteed" meta.
 */
export function checkAccuracy(move) {
  // null accuracy = never misses (e.g. Swift, Aerial Ace, Shock Wave)
  if (move.accuracy == null) return { hit: true, message: null };
  const acc = Number(move.accuracy);
  if (isNaN(acc) || acc >= 100) return { hit: true, message: null };
  if (Math.random() * 100 < acc) return { hit: true, message: null };
  return { hit: false, message: 'Атака промахнулась!' };
}

/**
 * Check type immunity for status ailments.
 * @param {string} ailment - move ailment name (paralysis, poison, burn, sleep, freeze, etc.)
 * @param {object} target - has .types[] and optionally .abilities[]
 * @param {boolean} checkAbilities - whether to check ability immunities
 */
export function isStatusImmune(ailment, target, checkAbilities = true) {
  if (!target) return false;

  const types = (target.types || []).map(t => (typeof t === 'string' ? t : t.type?.name));
  const abil = target.abilities?.[0]?.ability?.name || target.abilityName || null;

  // Type immunities
  if (ailment === 'paralysis' && types.includes('ground')) return true;
  if (ailment === 'poison' && (types.includes('steel') || types.includes('poison'))) return true;
  if (ailment === 'burn' && types.includes('fire')) return true;
  if (ailment === 'freeze' && types.includes('ice')) return true;

  // Ability immunities
  if (checkAbilities && abil) {
    if (ailment === 'paralysis' && abil === 'limber') return true;
    if ((ailment === 'sleep' || ailment === 'yawn') && (abil === 'insomnia' || abil === 'vital-spirit')) return true;
    if (ailment === 'poison' && (abil === 'immunity' || abil === 'comatose')) return true;
    if (ailment === 'burn' && abil === 'water-veil') return true;
    if (ailment === 'freeze' && abil === 'magma-armor') return true;
  }

  return false;
}

/**
 * Pure damage calculation. Returns { damage, isCrit, messageParts[] }.
 * Does NOT mutate anything.
 */
export function calculateDamage({
  move,                // PokeAPI move data
  attacker,            // pokemon-like obj with apiData.stats / .stats
  defender,            // pokemon-like obj with apiData.stats / .stats
  attackerLevel = 50,
  defenderLevel = 50,
  isWildAttacker = false,
  isWildDefender = false,
  weather = 'clear',
  attackerStatStages = null,
  defenderStatStages = null,
  attackerHeldItem = null,
  defenderHeldItem = null,
  defenderAbilityName = null,
  attackerAbilityName = null,
  naturesList = [],
  alwaysCrit = false,
}) {
  const parts = [];
  const power = move.power;
  if (!power) return { damage: 0, isCrit: false, messageParts: [] };

  const isPhysical = move.damage_class?.name === 'physical';
  const attackStatName = isPhysical ? 'attack' : 'special-attack';
  const defenseStatName = isPhysical ? 'defense' : 'special-defense';

  // Build temp pokemon objects for stat calc
  const attackerPkm = {
    ...attacker,
    statStages: attackerStatStages || attacker.statStages || null,
    heldItem: attackerHeldItem || attacker.heldItem || null,
  };
  const defenderPkm = {
    ...defender,
    statStages: defenderStatStages || defender.statStages || null,
    heldItem: defenderHeldItem || defender.heldItem || null,
  };

  const A = calculateStat(attackerPkm, attackStatName, {
    isWild: isWildAttacker,
    level: attackerLevel,
    natures: naturesList,
  });
  const D = calculateStat(defenderPkm, defenseStatName, {
    isWild: isWildDefender,
    level: defenderLevel,
    natures: naturesList,
  });

  // Burn modifier for physical attacks
  let burnAtkMod = 1.0;
  if (attacker.status === 'brn' && isPhysical) burnAtkMod = 0.5;

  let baseDmg = Math.floor((((2 * attackerLevel / 5 + 2) * power * (A / D)) / 50) + 2);
  baseDmg = Math.floor(baseDmg * burnAtkMod);

  // STAB
  let stab = 1.0;
  const atkTypes = attacker.apiData?.types || attacker.types || [];
  atkTypes.forEach(t => {
    const tn = t.type?.name || t;
    if (tn === move.type?.name) stab = 1.5;
  });

  const typeMult = getTypeMultiplier(move.type?.name, defender.apiData?.types || defender.types || []);
  const weatherMult = getWeatherMultiplier(move.type?.name, weather);
  const randMod = alwaysCrit ? 1.0 : (0.85 + Math.random() * 0.15);

  // Crit
  const critRate = alwaysCrit ? 1.0 : 0.0625;
  const isCrit = Math.random() < critRate;
  const critMult = isCrit ? 1.5 : 1.0;

  // Air Balloon for defender (declare before held items due to Expert Belt check)
  let effectiveTypeMult = typeMult;
  if (defenderHeldItem === 'airBalloon' && move.type?.name === 'ground') effectiveTypeMult = 0;

  // Held items
  let heldMult = 1.0;
  if (attackerHeldItem === 'expertBelt' && effectiveTypeMult > 1) heldMult = 1.2;
  if (attackerHeldItem === 'lifeOrb') heldMult = 1.3;

  let dmg = Math.floor(baseDmg * stab * effectiveTypeMult * weatherMult * randMod * critMult * heldMult);

  if (dmg < 0) dmg = 0;

  // Sucker Punch fail check (handled before calling this)

  const messages = [];
  if (isCrit) messages.push('Критический удар!');
  if (effectiveTypeMult > 1) messages.push('Суперэффективно!');
  else if (effectiveTypeMult < 1 && effectiveTypeMult > 0) messages.push('Малоэффективно...');
  else if (effectiveTypeMult === 0) messages.push('Атака не возымела эффекта...');

  return { damage: dmg, isCrit, messages };
}

/**
 * Check if Sucker Punch fails (opponent using status move).
 */
export function checkSuckerPunchFail(move, enemyChosenMove) {
  if (move.name !== 'sucker-punch') return false;
  if (!enemyChosenMove) return false; // no enemy move info = default to fail (conservative)
  // Sucker punch fails if opponent uses a non-damaging move
  if (!enemyChosenMove.power) return true;
  return false;
}

/**
 * Check Sturdy activation conditions.
 */
export function checkSturdy(abilityName, preHP, maxHP, currentHP) {
  if (abilityName !== 'sturdy') return false;
  // Sturdy only activates if at full HP and would be KO'd
  if (preHP !== maxHP) return false;
  if (currentHP !== 0) return false;
  return true;
}

/**
 * Get the move category string for UI purposes.
 */
export function getMoveCategory(move) {
  if (!move.damage_class?.name) return 'status';
  return move.damage_class.name; // 'physical' | 'special' | 'status'
}
