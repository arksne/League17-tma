// Global type augmentations for legacy code
declare global {
  interface HTMLElement {
    value: string;
    disabled: boolean;
    src: string;
    files: FileList | null;
    onclick: ((e: Event) => void) | null;
    _cleanup?: () => void;
    _timeout?: ReturnType<typeof setTimeout>;
    _reorderSetup?: boolean;
  }
  interface Element {
    style: CSSStyleDeclaration;
    innerText: string;
    dataset: DOMStringMap;
  }
  interface Window {
    Telegram?: any;
    help: () => void;
    cmds: () => void;
    money: (n?: number) => void;
    items: () => void;
    items10: () => void;
    allBadges: () => void;
    heal: () => void;
    maxIV: () => void;
    lvlup: (n?: number) => void;
    legendary: () => Promise<void>;
    mew: () => Promise<void>;
    goto: (locId: string) => void;
    __devSetGameState: (data: any) => void;
    locations: () => any[];
    myId: () => number | undefined;
    adminAdd: (id: any) => void;
    adminList: () => any[];
    getItemQty: (itemId: string) => number;
    addItem: (itemId: string, qty: number) => void;
    removeItem: (itemId: string, qty: number) => void;
    itemDef: (itemId: string) => any;
    toggleExpShare: () => void;
    showGymRewardSelection: (locId: any) => void;
  }
}
console.log("MAIN.JS START");

// Bootstrap the app
import './src/game/init.js';

// Pre-existing re-export for legacy modules (pvp.js, trade.js)
import { state as _state } from './src/game/state.js';
export const socket = _state.socket;
export const state = _state;

// --- Re-exports for modules importing from main.js ---

export { ITEMS } from './src/data/items.js';
export { checkEvolution, triggerEvolution, getEvolutions, fetchEvolutionChain } from './src/ui/evolution.js';
export { checkNewMovesOnLevelUp, offerLearnMove } from './src/ui/levelup_moves.js';
export { openMoveRelearner, showSlotPicker } from './src/ui/tm.js';
export { editNickname } from './src/ui/nickname.js';
export { loadChatMessages, startChatPolling, initChatSocket, stopChatPolling, sendChatMessage } from './src/ui/chat.js';
export { loadAllTrainers, initTrainersTab, showAccountPanel } from './src/ui/trainers.js';
export { initInventoryEvents, updateDynamicEVs, applyEVs, updateInventoryDisplay, renderBattleItemSelect, updateQADisplays, renderInventory, useItem, getHeldItemName, openHeldItemPicker } from './src/ui/inventory.js';
export { evolutionCache, evolvesFromMap, saveBattleState, clearBattleState, restoreBattleState, renderBattleUI, getTypeMultiplier, calculateStat, appendToLog, getAbilityName, statStageModify, updateStatBadges, clearUsedItem, checkBerryAutoUse, giveBerryToMon, generateDailyQuests, checkQuestProgress, claimQuestReward, openQuests, renderQuests, loadPokedexData, getStatusIcon, applyStatusEffect, cureStatus, checkStatusTurn, applyStatusEndOfTurn, switchPokemon, pickWeightedEncounter, getWildLevel, getLocationEncounters, startAutoHunt, stopAutoHunt, getBestRod, startHunt, loadMoveButtons, updateMoveButtonUI, updateMoveButtonUIs, updateWildHpUI, updatePlayerHpUI, useMove, handlePlayerFaint, enemyTurn, initEncounterEvents, openGymModal, initGymEvents, startGymBattle, startGymNextPokemon, useMoveGym, enemyTurnGym, handleGymPlayerFaint, openEliteModal, startEliteBattle, startEliteNextMember, startEliteNextPokemon, championBattle, startChampionNextPokemon, getBattleVars, setBattleVars, POKEDEX_ALL, pokedexData, pokedexTotal } from './src/battle/core.js';
export { getDailyWeather, getWeatherMultiplier, WEATHER_ICONS, WEATHER_NAMES } from './src/data/weather.js';
export { escHtml, showToast, showConfirmModal, showSelectionModal, showTextInputModal } from './src/utils/dom.js';
export { getTypeColor, getTypeGradient, getSpriteUrl, getItemSpriteImg, setTypeBg, updateBattleSpriteBgs, updateBattleHeldIcons } from './src/utils/sprite.js';
export { addItem, removeItem } from './src/game/actions.js';
export { getItemQty, itemDef, lsKey } from './src/game/state.js';
export { hatchEgg } from './src/ui/daycare.js';
export { giveStarterMon } from './src/ui/starter.js';
export { openCrafting } from './src/ui/crafting.js';
export { addNotification, openNotifications } from './src/ui/notifications.js';
export { openPC } from './src/ui/pc.js';
export { checkTutorialProgress } from './src/ui/npcs.js';
export { getLocation, getRegionOfLocation, travelToRegion, healTeam, renderLocation, getLocationDropString, updateMoneyDisplay, updateBadgeDisplay, fetchDropConfig, processMonsterDrop } from './src/ui/location.js';
export { renderTeamGrid, refreshProfileUI, saveActiveMonData, updateStats, initProfileEvents, initProfileUXEvents } from './src/ui/profile.js';
export { saveGame, autoSave, cloudSave, getCloudAuthHeaders } from './src/game/save.js';

// New re-exports from extracted modules
export { API_BASE } from './src/game/config.js';
export { getTgUser, getSocket, getIsAdmin, getPokedexState, getShopState, modifyMoney, getTeamState, getSocialState, setTrainerNickname, getMapState, setCurrentLocationId, setCurrentRegion, setLastLocation, getGameState, setGameState, getInvState, toggleExpShare } from './src/game/getters.js';
export { openTrainerProfile } from './src/social/trainer-profile.js';
export { renderTrainerCard } from './src/ui/trainer-card.js';
export { showGymRewardSelection, createAndGivePokemon } from './src/ui/gym-reward.js';
export { showItemInfoModal } from './src/ui/item-info.js';
