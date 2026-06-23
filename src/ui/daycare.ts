import { state } from '../game/state.js';
import { store } from '../game/store.js';
import { addItem } from '../game/actions.js';
import { generateUID, getTrainerId } from '../game/state.js';
import { showToast, showSelectionModal } from '../utils/dom.js';
import { appendToLog, calculateStat } from '../battle/core.js';
import { natures } from '../data/natures.js';

// --- Constants ---

export const EGG_TIME = 10 * 60 * 1000;      // 10 min to produce egg
export const EGG_BONUS_TIME = 5 * 60 * 1000;  // 5 min with matching nature
const BREEDING_CHECK_INTERVAL = 60 * 1000; // check every minute

function randomHatchTime() { return (3 + Math.floor(Math.random() * 6)) * 24 * 60 * 60 * 1000; }

// --- Daycare ---

export function openDaycareDeposit() {
  const available = state.myTeam.map((m: any, i: number) => ({ m, i })).filter(({ m }: any) => m.currentHp > 0);
  if (available.length < 2) { showToast('Нужно минимум 2 живых покемона!', true); return; }

  const items = available.map(({ m }: any) => ({
    label: `Lv.${m.baseLevel + m.candiesEaten} ${m.nickname || m.apiData?.name}`,
    subtitle: `${m.apiData?.gender || '?'} | HP: ${m.currentHp}/${m.maxHp}`
  }));

  showSelectionModal('Питомник — выберите ПЕРВОГО покемона', items, (i1: number) => {
    const remaining = available.filter((_: any, i: number) => i !== i1);
    const items2 = remaining.map(({ m }: any) => ({
      label: `Lv.${m.baseLevel + m.candiesEaten} ${m.nickname || m.apiData?.name}`,
      subtitle: `${m.apiData?.gender || '?'} | HP: ${m.currentHp}/${m.maxHp}`
    }));

    showSelectionModal('Выберите ВТОРОГО покемона', items2, (i2: number) => {
      const mon1 = available[i1].m;
      const mon2 = remaining[i2].m;
      const idx1 = state.myTeam.indexOf(mon1);
      const idx2 = state.myTeam.indexOf(mon2);
      const hi = Math.max(idx1, idx2);
      const lo = Math.min(idx1, idx2);
      const depositMon2 = state.myTeam.splice(hi, 1)[0];
      const depositMon1 = state.myTeam.splice(lo, 1)[0];
      state.daycareMons.push({ mon: depositMon2, depositTime: Date.now() });
      state.daycareMons.push({ mon: depositMon1, depositTime: Date.now() });

      appendToLog(`${mon1.nickname || mon1.apiData?.name} и ${mon2.nickname || mon2.apiData?.name} оставлены в Питомнике!`, false, 'quest');
      showToast('Покемоны оставлены в Питомнике!', false);
      store.emit('team:render');
      store.emit('save');
    });
  });
}

export function checkDaycare() {
  const now = Date.now();
  state.daycareMons.forEach((entry: any) => {
    const hoursPassed = (now - entry.depositTime) / (1000 * 60 * 60);
    if (hoursPassed >= 1 && entry.mon.baseLevel + (entry.mon.candiesEaten || 0) < 100) {
      const levelsGained = Math.floor(hoursPassed);
      if (levelsGained > 0 && levelsGained > (entry._lastLevelsGained || 0)) {
        const newLevels = levelsGained - (entry._lastLevelsGained || 0);
        for (let i = 0; i < newLevels; i++) {
          entry.mon.baseLevel++;
          entry.mon.maxHp = calculateStat(entry.mon, 'hp', false);
          entry.mon.currentHp = entry.mon.maxHp;
        }
        entry._lastLevelsGained = levelsGained;
      }
    }
  });

  // Egg check: 30% chance per hour after 2 hours
  if (state.daycareMons.length >= 2 && !state.daycareEgg) {
    const hoursPassed = Math.min(
      (now - state.daycareMons[0].depositTime) / (1000 * 60 * 60),
      (now - state.daycareMons[1].depositTime) / (1000 * 60 * 60)
    );
    if (hoursPassed >= 2 && Math.random() < 0.3) {
      const parent = state.daycareMons[0].mon;
      state.daycareEgg = {
        species: parent.apiData?.name || parent.name,
        readyTime: now + 1000 * 60 * 30, // 30 min to hatch
        parent1: state.daycareMons[0].mon,
        parent2: state.daycareMons[1].mon
      };
      appendToLog('🥚 В Питомнике появилось яйцо! Заберите его через 30 минут.', false, 'quest');
    }
  }
}

export function collectDaycareEgg() {
  if (!state.daycareEgg) return showToast('Яйца пока нет!', true);
  if (Date.now() < state.daycareEgg.readyTime) {
    const minsLeft = Math.ceil((state.daycareEgg.readyTime - Date.now()) / 60000);
    return showToast(`Яйцо ещё не готово! Осталось ~${minsLeft} мин.`, true);
  }
  state.daycareEgg = null;
  addItem('suspiciousEgg');
  showToast('Вы получили яйцо! Оно добавлено в инвентарь.', false);
  store.emit('save');
}

export function collectDaycareMons() {
  if (state.daycareMons.length === 0) return showToast('В Питомнике нет покемонов!', true);
  if (state.myTeam.length >= 6) return showToast('Команда полна! Освободите место.', true);
  checkDaycare();
  const entry = state.daycareMons.shift();
  state.myTeam.push(entry.mon);
  if (state.daycareMons.length > 0 && state.myTeam.length < 6) {
    const entry2 = state.daycareMons.shift();
    state.myTeam.push(entry2.mon);
  }
  appendToLog('Покемоны возвращены из Питомника!', false, 'quest');
  store.emit('team:render');
  store.emit('save');
}

// --- Breeding ---

const eggGroupCache = new Map<string, string[]>();

async function getMonEggGroups(mon: any): Promise<string[]> {
  const name = mon.apiData?.species?.name || mon.apiData?.name;
  if (!name) return [];
  if (eggGroupCache.has(name)) return eggGroupCache.get(name)!;
  try {
    const speciesUrl = mon.apiData?.species?.url || `https://pokeapi.co/api/v2/pokemon-species/${name}`;
    const res = await fetch(speciesUrl);
    const data = await res.json();
    const groups = (data.egg_groups || []).map((g: any) => g.name);
    eggGroupCache.set(name, groups);
    return groups;
  } catch(e) { return []; }
}

function getMonGender(mon: any) {
  return mon.gender || mon.apiData?.wildGender || null;
}

function areBreedingCompatible(mon1: any, mon2: any, groups1: string[], groups2: string[]) {
  if (mon1.uid === mon2.uid) return false;
  const g1 = getMonGender(mon1);
  const g2 = getMonGender(mon2);
  if (!g1 || !g2) return false;
  if (g1 === g2) return false;
  const shared = groups1.filter(g => groups2.includes(g));
  if (shared.length === 0 && !groups1.includes('ditto') && !groups2.includes('ditto')) return false;
  return true;
}

export async function checkBreeding() {
  if (state.hatching) return;
  state.hatching = true;
  const now = Date.now();
  try {
    for (let boxIdx = 0; boxIdx < state.pcBoxes.length; boxIdx++) {
      const box = state.pcBoxes[boxIdx];
      if (box.length < 2) continue;

      const existingPair = state.breedingPairs.find((p: any) => p.boxIdx === boxIdx);

      if (existingPair && now >= existingPair.readyTime) {
        const m1 = box.find((m: any) => m.uid === existingPair.mon1Uid);
        const m2 = box.find((m: any) => m.uid === existingPair.mon2Uid);
        if (m1 && m2) {
          const eggUid = generateUID();
          const species = m1.apiData?.species?.name || m1.apiData?.name;
          const eggTypes = m1.apiData?.types || [{ type: { name: 'normal' } }];
          const inheritIV = (parentVal: number) =>
            Math.min(31, Math.max(0, parentVal + (Math.random() < 0.5 ? 2 : -2)));
          const avgIV = (stat: string) => Math.round((m1.ivs[stat] + m2.ivs[stat]) / 2);
          const eggIvs = {
            hp: inheritIV(avgIV('hp')),
            atk: inheritIV(avgIV('atk')),
            def: inheritIV(avgIV('def')),
            spa: inheritIV(avgIV('spa')),
            spd: inheritIV(avgIV('spd')),
            spe: inheritIV(avgIV('spe'))
          };
          const egg = {
            uid: eggUid,
            species,
            types: eggTypes,
            ivs: eggIvs,
            readyTime: now + randomHatchTime(),
            boxIdx,
            parent1Uid: existingPair.mon1Uid,
            parent2Uid: existingPair.mon2Uid
          };
          state.eggs.push(egg);
          store.emit('notification:add', '🥚 Новое яйцо!', `В Боксе ${boxIdx + 1} появилось яйцо ${species}!`);
          appendToLog(`🥚 В Боксе ${boxIdx + 1} появилось яйцо! (${species})`, false, 'quest');
        }
        state.breedingPairs = state.breedingPairs.filter((p: any) => p !== existingPair);
      }

      if (!state.breedingPairs.some((p: any) => p.boxIdx === boxIdx)) {
        for (let i = 0; i < box.length; i++) {
          for (let j = i + 1; j < box.length; j++) {
            const m1 = box[i], m2 = box[j];
            if (!m1.apiData || !m2.apiData) continue;
            const groups1 = await getMonEggGroups(m1);
            const groups2 = await getMonEggGroups(m2);
            if (areBreedingCompatible(m1, m2, groups1, groups2)) {
              const sameNature = m1.natureIdx === m2.natureIdx;
              const readyTime = now + (sameNature ? EGG_BONUS_TIME : EGG_TIME);
              state.breedingPairs.push({
                boxIdx,
                mon1Uid: m1.uid,
                mon2Uid: m2.uid,
                startTime: now,
                readyTime
              });
              const natureBonus = sameNature ? ' (быстро — одинаковый характер!)' : '';
              appendToLog(`💕 ${m1.apiData.name} и ${m2.apiData.name} в Боксе ${boxIdx + 1} нашли друг друга!${natureBonus}`, false, 'quest');
              break;
            }
          }
          if (state.breedingPairs.some((p: any) => p.boxIdx === boxIdx)) break;
        }
      }
    }

    for (const egg of state.eggs) {
      if (now >= egg.readyTime) {
        await hatchEgg(egg);
      }
    }

    state.eggs = state.eggs.filter((e: any) => e.boxIdx !== undefined ? state.pcBoxes[e.boxIdx] !== undefined : true);
    store.emit('save');
  } finally {
    state.hatching = false;
  }
}

export function startBreedingCheck() {
  setInterval(() => {
    if (state.eggs.length > 0 || state.breedingPairs.length > 0) checkBreeding();
  }, BREEDING_CHECK_INTERVAL);
}

export async function hatchEgg(egg: any) {
  if (!state.eggs.some((e: any) => e.uid === egg.uid)) return;

  const eggData = { ...egg };

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${egg.species}`);
    if (!res.ok) {
      state.eggs = state.eggs.filter((e: any) => e.uid !== egg.uid);
      store.emit('save');
      showToast(`Яйцо ${egg.species || 'неизвестного вида'} повреждено и утеряно`, true);
      return;
    }
    const pokeData = await res.json();

    // Perform state mutations synchronously to avoid race conditions
    const eggIdx = state.myTeam.findIndex((m: any) => m.uid === egg.uid);
    if (eggIdx !== -1) state.myTeam.splice(eggIdx, 1);
    state.eggs = state.eggs.filter((e: any) => e.uid !== egg.uid);

    const newMon = {
      uid: generateUID(),
      originalTrainer: getTrainerId(),
      createdAt: Date.now(),
      caughtLocation: 'breeding',
      apiData: pokeData,
      maxHp: 50, currentHp: 50,
      ivs: eggData.ivs || { hp: Math.floor(Math.random()*32), atk: Math.floor(Math.random()*32), def: Math.floor(Math.random()*32), spa: Math.floor(Math.random()*32), spd: Math.floor(Math.random()*32), spe: Math.floor(Math.random()*32) },
      evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      baseLevel: 1, exp: 0, expToNext: 8,
      candiesEaten: 0, vitaminsEaten: 0,
      training: null, trainingStage: 0, trainingStat: null,
      happiness: 120,
      natureIdx: Math.floor(Math.random() * natures.length),
      breedLetter: ['A','B','C','D'][Math.floor(Math.random()*4)],
      gender: Math.random() < 0.5 ? 'male' : 'female',
      status: null, sleepTurns: 0,
      movesPP: [],
      statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
      abilityName: pokeData.abilities[0]?.ability?.name || null,
      heldItem: null,
      berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
      learnableMoves: [],
      isEgg: false,
      hasBred: false
    };

    if (eggData.parent1Uid && eggData.parent2Uid) {
      const allMons = [...state.myTeam, ...state.pcBoxes.flat()];
      const p1 = allMons.find((m: any) => m.uid === eggData.parent1Uid);
      const p2 = allMons.find((m: any) => m.uid === eggData.parent2Uid);
      if (p1) {
        const stats = ['hp','atk','def','spa','spd','spe'];
        const s1 = stats[Math.floor(Math.random()*stats.length)];
        const s2 = stats[Math.floor(Math.random()*stats.length)];
        if (p1.ivs) newMon.ivs[s1] = p1.ivs[s1];
        if (p2?.ivs) newMon.ivs[s2] = p2.ivs[s2];
      }
    }

    if (state.myTeam.length < 6) {
      state.myTeam.push(newMon);
      store.emit('notification:add', '🎉 Яйцо вылупилось!', `${pokeData.name} появился на свет!`);
      appendToLog(`🎉 Из яйца вылупился ${pokeData.name}!`, false, 'quest');
    } else {
      if (state.pcBoxes.length === 0) state.pcBoxes.push([]);
      state.pcBoxes[0].push(newMon);
      store.emit('notification:add', '🎉 Яйцо вылупилось!', `${pokeData.name} вылупился и отправлен в PC (команда полна).`);
      appendToLog(`🎉 Из яйца вылупился ${pokeData.name}! (отправлен в PC)`, false, 'quest');
    }
    store.emit('team:render');
    store.emit('save');
  } catch(e) {
    console.error('Hatch failed:', e);
    state.eggs = state.eggs.filter((e: any) => e.uid !== eggData.uid);
    store.emit('save');
    showToast('Ошибка вылупления, яйцо утеряно', true);
  }
}

export function collectEgg(eggUid: string) {
  const egg = state.eggs.find((e: any) => e.uid === eggUid);
  if (!egg) return;
  delete egg.boxIdx;
  store.emit('save');
  showToast('🥚 Яйцо перемещено в рюкзак!', false);
}
