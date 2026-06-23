/**
 * Shared mutable battle state object.
 * Both main.js and battle/core.js import this same object,
 * so mutations are visible across modules (ES module semantics).
 */
const battleState = {
  // Wild pokemon
  activeWild: null,
  wildLvl: 5,
  wildMaxHP: 0,
  wildCurHP: 0,
  wildStatus: null,
  wildSleepTurns: 0,
  escapeAttempts: 0,
  wildMovesDetailed: [],
  wildMovesPP: null,
  
  // Battle general
  battleRound: 0,
  activePlayerMon: null,
  playerMovesDetailed: [],
  battleType: 'wild',
  currentWeather: 'clear',
  itemsUsedInBattle: 0,
  
  // Gym/Elite
  gymLeaderKey: null,
  gymTeamIndex: 0,
  gymTeamData: null,
  gymTeamIndexInMember: 0,
  
  // Hunt
  huntActive: false,
  huntTimer: null,
};

export default battleState;
