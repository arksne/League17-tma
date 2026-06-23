import { getTeamState } from '../game/getters.js';
import { refreshProfileUI } from './profile.js';
import { autoSave } from '../game/save.js';
import { showToast, showTextInputModal } from '../utils/dom.js';

// FEATURE: NICKNAME
// ================================================================
export function editNickname() {
  if (getTeamState().currentPokemonIndex === null) return showToast('Сначала выберите покемона!', true);
  const mon = getTeamState().myTeam[getTeamState().currentPokemonIndex];
  showTextInputModal('Новое прозвище', mon.nickname || '', (newName) => {
    mon.nickname = newName;
    refreshProfileUI();
    autoSave();
  });
}

