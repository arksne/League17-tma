// Quest UI — display and claim quests (Неделя 9.3)
import { QUEST_CONFIGS } from '../data/quests.js';

type QuestState = {
  id: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
};

let questStates: QuestState[] = [];
let onClaimCallback: ((questId: string) => void) | null = null;

export function setQuestCallback(fn: (questId: string) => void) {
  onClaimCallback = fn;
}

export function setQuestStates(states: QuestState[]) {
  questStates = states;
}

export function openQuestPanel() {
  const container = document.getElementById('quest-panel');
  if (!container) return;

  // Check if container exists in DOM, if not create in world view
  if (!container.parentElement) {
    const worldView = document.getElementById('view-world');
    if (!worldView) return;
    const panel = document.createElement('div');
    panel.id = 'quest-panel';
    panel.className = 'quest-panel';
    panel.innerHTML = '<h3 style="margin:0 0 10px;font-size:0.95rem;">📋 Квесты</h3><div id="quest-list"></div>';
    // Insert after map
    const mapSection = worldView.querySelector('.map-section');
    if (mapSection) {
      mapSection.after(panel);
    } else {
      worldView.appendChild(panel);
    }
  }

  renderQuestList();
}

function renderQuestList() {
  const list = document.getElementById('quest-list');
  if (!list) return;

  if (!questStates.length) {
    list.innerHTML = '<div style="text-align:center;padding:16px;color:rgba(255,255,255,0.3);font-size:0.82rem;">Нет активных квестов</div>';
    return;
  }

  list.innerHTML = questStates.map(qs => {
    const config = QUEST_CONFIGS.find(q => q.id === qs.id);
    if (!config) return '';
    const target = config.target || 1;
    const pct = Math.min(100, Math.round((qs.progress / target) * 100));
    const isDone = qs.progress >= target;
    const canClaim = isDone && !qs.claimed;

    return `
      <div class="quest-item">
        <div class="quest-header">
          <span class="quest-title">${config.desc}</span>
          ${canClaim
            ? `<button class="quest-claim-btn" data-quest="${qs.id}">Получить</button>`
            : qs.claimed
              ? '<span style="font-size:0.7rem;color:#34c759;">✅ Выполнено</span>'
              : `<span style="font-size:0.7rem;color:#999;">${qs.progress}/${target}</span>`
          }
        </div>
        <div class="quest-progress-bar">
          <div class="quest-progress-fill ${isDone ? 'complete' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="quest-reward">
          🏆 ${config.rewardMoney ? `¥${config.rewardMoney}` : ''} ${config.rewardItem ? `+ ${config.rewardItem} x${config.rewardQty || 1}` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Attach claim handlers
  list.querySelectorAll('.quest-claim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = (btn as HTMLElement).dataset.quest;
      if (qid && onClaimCallback) onClaimCallback(qid);
    });
  });
}
