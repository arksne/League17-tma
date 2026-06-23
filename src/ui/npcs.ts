import { state } from '../game/state.js';
import { store } from '../game/store.js';
import { itemDef } from '../game/state.js';
import { addItem, removeItem } from '../game/actions.js';
import { showToast } from '../utils/dom.js';
import { addNotification } from './notifications.js';
import { appendToLog } from '../battle/core.js';
import { openPC } from './pc.js';
import { openDaycareDeposit } from './daycare.js';
import { NPC_DATA } from '../data/npc.js';

function renderNPCQuests(npc: any) {
  const container = document.getElementById('npc-quests')!;
  container.innerHTML = '';

  npc.quests.forEach((q: any) => {
    if (state.completedNPCQuests.includes(q.id)) {
      const el = document.createElement('div');
      el.className = 'npc-quest-item';
      el.innerHTML = `<div class="npc-quest-info"><div class="npc-quest-name">✅ ${q.desc}</div></div>`;
      container.appendChild(el);
      return;
    }

    const prereqMet = !q.prereqQuest || state.completedNPCQuests.includes(q.prereqQuest);
    if (!prereqMet) return;

    const progress = state.npcQuestProgress[q.id] || 0;
    const isActive = q.id in state.npcQuestProgress;
    const isReady = progress >= q.targetQty;
    const pct = Math.min(100, Math.round((progress / q.targetQty) * 100));

    const el = document.createElement('div');
    el.className = 'npc-quest-item';
    el.innerHTML = `
      <div class="npc-quest-info">
        <div class="npc-quest-name">${q.desc}</div>
        <div class="npc-quest-reward">Награда: ${q.rewardMoney}💰 + ${q.rewardQty}x ${itemDef(q.rewardItem).nameRu}</div>
        ${isActive ? `<div class="npc-quest-progress">${progress}/${q.targetQty}</div><div class="npc-quest-bar"><div class="npc-quest-bar-fill" style="width:${pct}%"></div></div>` : ''}
      </div>`;

    const btn = document.createElement('button');
    btn.className = 'tma-btn';
    btn.style.padding = '4px 8px'; btn.style.fontSize = '0.8rem';

    if (!isActive) {
      btn.innerText = 'Взять';
      btn.onclick = () => {
        state.npcQuestProgress[q.id] = 0;
        document.getElementById('npc-dialog')!.innerText = npc.dialog.quest_incomplete;
        renderNPCQuests(npc);
        store.emit('save');
      };
    } else if (isReady) {
      btn.innerText = 'Сдать';
      btn.onclick = () => {
        if (q.id.startsWith('tutorial_')) {
          const step = parseInt(q.id.split('_')[1]);
          if (step === state.tutorialStep) {
            state.tutorialStep++;
            state.completedNPCQuests.push(q.id);
            delete state.npcQuestProgress[q.id];
            state.inventory['credit'] = (state.inventory['credit'] || 0) + q.rewardMoney;
            addItem(q.rewardItem, q.rewardQty);
            addNotification('🎓 Обучение', `Шаг ${step} завершён! Награда: ${q.rewardMoney}💰 + ${q.rewardQty}x ${itemDef(q.rewardItem).nameRu}`);
            appendToLog(`Обучающий квест (шаг ${step}) выполнен!`, false, 'quest');
          }
        } else {
          for (let i = 0; i < q.targetQty; i++) removeItem(q.targetItem, 1);
          state.completedNPCQuests.push(q.id);
          delete state.npcQuestProgress[q.id];
          state.inventory['credit'] = (state.inventory['credit'] || 0) + q.rewardMoney;
          addItem(q.rewardItem, q.rewardQty);
          appendToLog(`Квест "${q.desc}" выполнен!`, false, 'quest');
        }
        document.getElementById('npc-dialog')!.innerText = npc.dialog.quest_complete;
        store.emit('money:changed');
        renderNPCQuests(npc);
        store.emit('save');
      };
    } else {
      btn.innerText = '...';
      btn.disabled = true;
    }

    el.appendChild(btn);
    container.appendChild(el);
  });
}

export function openNPCDialog(npcId: string) {
  const npc = NPC_DATA[npcId];
  if (!npc) return;
  const modal = document.getElementById('npc-modal')!;
  document.getElementById('npc-sprite')!.innerText = npc.sprite;
  document.getElementById('npc-name')!.innerText = npc.name;

  const availableQuests = npc.quests.filter((q: any) =>
    !state.completedNPCQuests.includes(q.id) &&
    (!q.prereqQuest || state.completedNPCQuests.includes(q.prereqQuest))
  );
  const allDone = npc.quests.every((q: any) => state.completedNPCQuests.includes(q.id));
  const activeQuest = npc.quests.find((q: any) =>
    !state.completedNPCQuests.includes(q.id) && q.id in state.npcQuestProgress
  );

  let dialogText = npc.dialog.greet;
  if (allDone && npc.quests.length > 0) {
    dialogText = npc.dialog.default;
  } else if (activeQuest) {
    const progress = state.npcQuestProgress[activeQuest.id] || 0;
    dialogText = progress >= activeQuest.targetQty
      ? npc.dialog.quest_complete
      : npc.dialog.quest_incomplete;
  } else if (availableQuests.length > 0) {
    const q = availableQuests[0];
    if (npc.dialog.quest_offer) {
      dialogText = npc.dialog.quest_offer
        .replace('{target}', q.targetQty);
      if (q.targetItem) {
        dialogText = dialogText.replace('{item}', itemDef(q.targetItem).nameRu);
      } else {
        dialogText = dialogText.replace('{item}', '').replace('  ', ' ').trim();
      }
    } else {
      dialogText = `${npc.dialog.greet} Есть задание: ${q.desc}`;
    }
  }

  document.getElementById('npc-dialog')!.innerText = dialogText;
  renderNPCQuests(npc);
  modal.style.display = 'flex';

  const actionsContainer = document.getElementById('npc-actions')!;
  actionsContainer.querySelectorAll('.npc-action-extra').forEach(b => b.remove());

  if (npcId === 'joy_pokecenter') {
    const btnHeal = document.createElement('button');
    btnHeal.className = 'tma-btn npc-action-extra';
    btnHeal.style.backgroundColor = '#34c759';
    btnHeal.innerText = '🏥 Вылечить команду';
    btnHeal.onclick = () => {
      state.myTeam.forEach((mon: any) => {
        const baseHp = mon.apiData.stats[0].base_stat;
        const curLvl = mon.baseLevel + mon.candiesEaten;
        mon.maxHp = Math.floor(0.01 * (2 * baseHp + mon.ivs.hp + Math.floor(0.25 * mon.evs.hp)) * curLvl) + curLvl + 10;
        mon.currentHp = mon.maxHp;
        mon.status = null;
        mon.sleepTurns = 0;
        mon.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
        if (mon.movesPP) mon.movesPP.forEach((pp: any) => { if (pp) pp.current = pp.max; });
      });
      showToast('Ваша команда полностью вылечена!', false);
      modal.style.display = 'none';
      store.emit('save');
    };
    actionsContainer.insertBefore(btnHeal, document.getElementById('btn-close-npc'));
  }

  if (npcId === 'daycare_pokecenter') {
    const btnDeposit = document.createElement('button');
    btnDeposit.className = 'tma-btn npc-action-extra';
    btnDeposit.style.backgroundColor = '#5856d6';
    btnDeposit.innerText = '💻 Открыть PC';
    btnDeposit.onclick = () => {
      modal.style.display = 'none';
      openPC();
    };
    actionsContainer.insertBefore(btnDeposit, document.getElementById('btn-close-npc'));

    const btnDaycare = document.createElement('button');
    btnDaycare.className = 'tma-btn npc-action-extra';
    btnDaycare.style.backgroundColor = '#ff9500';
    btnDaycare.innerText = '🥚 Оставить в Питомнике';
    btnDaycare.onclick = () => {
      if (state.myTeam.length < 2) { showToast('Нужно минимум 2 покемона в команде!', true); return; }
      openDaycareDeposit();
      modal.style.display = 'none';
    };
    actionsContainer.insertBefore(btnDaycare, document.getElementById('btn-close-npc'));
  }
}

export function checkTutorialProgress(type: string, amount: number, itemId?: string) {
  if (state.tutorialStep < 1 || state.tutorialStep > 5) return;
  const questId = `tutorial_${state.tutorialStep}`;
  if (state.completedNPCQuests.includes(questId)) return;
  const quest = NPC_DATA['professor_tutorial']?.quests?.find((q: any) => q.id === questId);
  if (!quest || quest.type !== type) return;
  if (!(questId in state.npcQuestProgress)) state.npcQuestProgress[questId] = 0;
  state.npcQuestProgress[questId] += amount;
  if (state.npcQuestProgress[questId] >= quest.targetQty) {
    state.npcQuestProgress[questId] = quest.targetQty;
    addNotification('📋 Квест!', `Обучающий квест (шаг ${state.tutorialStep}): задание выполнено! Вернитесь к Профессору Оуку.`);
  }
  store.emit('save');
}

export function checkNPCQuestProgress(itemId: string, qty: number) {
  for (const [, npc] of Object.entries(NPC_DATA)) {
    for (const q of (npc as any).quests) {
      if (q.type === 'collect_items' && q.targetItem === itemId) {
        if (!state.completedNPCQuests.includes(q.id) && q.id in state.npcQuestProgress) {
          state.npcQuestProgress[q.id] += qty;
        }
      }
    }
  }
}
