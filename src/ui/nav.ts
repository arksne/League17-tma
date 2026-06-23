import { REGIONS } from '../data/regions.js';
import { state } from '../game/state.js';
import { renderTeamGrid } from './profile.js';
import { renderInventory } from './inventory.js';
import { loadAllTrainers } from './trainers.js';
import { loadChatMessages, startChatPolling, stopChatPolling } from './chat.js';
import { resetGame } from '../game/save.js';
import { initTradeSocket } from '../network/socket.js';
import { renderTrainerCard } from './trainer-card.js';

export function initAppNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.app-view');
  const headerTitle = document.getElementById('header-title');

  const titles = {
    'view-world': 'Мир',
    'view-backpack': 'Рюкзак',
    'view-team': 'Команда Покемонов',
    'view-chat': 'Чат',
    'view-trainers': 'Тренеры'
  };

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      views.forEach(v => v.classList.remove('active-view'));

      item.classList.add('active');
      const targetId = item.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active-view');
      headerTitle.innerText = titles[targetId];
      if (targetId === 'view-world') {
        headerTitle.innerText = `Мир (${REGIONS[state.currentRegion]?.name || ''})`;
      }

      if (targetId === 'view-backpack') {
        renderInventory();
      }

      if (targetId === 'view-team') {
        renderTeamGrid();
        document.getElementById('team-roster').style.display = 'block';
        document.getElementById('pokedex-display').style.display = 'none';
      }

      if (targetId === 'view-trainers') {
        loadAllTrainers();
      }

      if (targetId === 'view-chat') {
        loadChatMessages();
        renderTrainerCard();
        startChatPolling();
        initTradeSocket();
      } else {
        stopChatPolling();
      }
    });
  });

  document.getElementById('btn-info').addEventListener('click', () => {
    document.getElementById('info-modal').style.display = 'flex';
  });

  document.getElementById('btn-close-info').addEventListener('click', () => {
    document.getElementById('info-modal').style.display = 'none';
  });

  document.getElementById('info-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('info-modal')) {
      document.getElementById('info-modal').style.display = 'none';
    }
  });

  document.getElementById('btn-back-team').addEventListener('click', () => {
    document.getElementById('pokedex-display').style.display = 'none';
    document.getElementById('team-roster').style.display = 'block';
    renderTeamGrid();
  });

  document.getElementById('btn-reset-game').addEventListener('click', resetGame);

  document.getElementById('btn-close-npc').addEventListener('click', () => {
    document.getElementById('npc-modal').style.display = 'none';
  });
}
