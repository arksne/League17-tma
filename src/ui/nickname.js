import { 
  getTeamState, showToast, showTextInputModal, refreshProfileUI, autoSave 
} from '../../main.js';

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

