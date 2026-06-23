import { state } from '../game/state.js';
import { showTextInputModal } from '../utils/dom.js';
import { autoSave } from '../game/save.js';
import { pokedexTotal } from '../battle/core.js';
import { loadLocationTrainers, renderOnlinePlayers } from '../social/trainer-profile.js';

export function renderTrainerCard() {
  const nameEl = document.getElementById('trainer-name');
  const badgesEl = document.getElementById('trainer-badges');
  const caughtEl = document.getElementById('trainer-caught');
  if (!nameEl || !badgesEl || !caughtEl) return;

  if (state.trainerNickname) {
    nameEl.textContent = state.trainerNickname;
  } else if (state.tgUser) {
    nameEl.textContent = state.tgUser.first_name || state.tgUser.username || `ID:${state.tgUser.id}`;
  } else {
    nameEl.textContent = '---';
  }
  nameEl.style.cursor = 'pointer';
  nameEl.title = 'Нажмите чтобы изменить прозвище';
  nameEl.onclick = () => {
    showTextInputModal('Прозвище тренера', state.trainerNickname || state.tgUser?.first_name || '', (newName) => {
      state.trainerNickname = newName;
      renderTrainerCard();
      autoSave();
    });
  };

  badgesEl.textContent = String(state.badges.length);
  caughtEl.textContent = `${state.pokedexCaught.size}/${pokedexTotal || 151}`;

  loadLocationTrainers();
  renderOnlinePlayers();
}
