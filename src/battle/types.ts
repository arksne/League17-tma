/** Фаза боя */
export enum BattlePhase {
  IDLE = 'idle',
  WILD_START = 'wild_start',
  GYM_START = 'gym_start',
  ELITE_START = 'elite_start',
  CHAMPION_START = 'champion_start',
  PVP_START = 'pvp_start',
  PLAYER_TURN = 'player_turn',
  ENEMY_TURN = 'enemy_turn',
  ANIMATING = 'animating',
  SWITCHING = 'switching',
  ITEM_USE = 'item_use',
  FAINTED = 'fainted',
  CAPTURE = 'capture',
  VICTORY = 'victory',
  DEFEAT = 'defeat',
  PVP_OPPONENT_TURN = 'pvp_opponent_turn',
}

/** Карта разрешённых переходов между фазами */
export const BATTLE_TRANSITIONS: Record<BattlePhase, BattlePhase[]> = {
  [BattlePhase.IDLE]: [
    BattlePhase.WILD_START, BattlePhase.GYM_START,
    BattlePhase.ELITE_START, BattlePhase.CHAMPION_START,
    BattlePhase.PVP_START,
  ],
  [BattlePhase.WILD_START]: [BattlePhase.PLAYER_TURN, BattlePhase.ANIMATING],
  [BattlePhase.GYM_START]: [BattlePhase.PLAYER_TURN],
  [BattlePhase.ELITE_START]: [BattlePhase.PLAYER_TURN],
  [BattlePhase.CHAMPION_START]: [BattlePhase.PLAYER_TURN],
  [BattlePhase.PVP_START]: [BattlePhase.PVP_OPPONENT_TURN, BattlePhase.PLAYER_TURN],
  [BattlePhase.PLAYER_TURN]: [
    BattlePhase.ENEMY_TURN, BattlePhase.SWITCHING,
    BattlePhase.ITEM_USE, BattlePhase.CAPTURE,
    BattlePhase.FAINTED, BattlePhase.DEFEAT,
    BattlePhase.VICTORY,
  ],
  [BattlePhase.ENEMY_TURN]: [
    BattlePhase.PLAYER_TURN, BattlePhase.FAINTED,
    BattlePhase.DEFEAT, BattlePhase.VICTORY,
    BattlePhase.SWITCHING, BattlePhase.ANIMATING,
  ],
  [BattlePhase.ANIMATING]: [
    BattlePhase.PLAYER_TURN, BattlePhase.FAINTED,
    BattlePhase.DEFEAT, BattlePhase.SWITCHING,
  ],
  [BattlePhase.SWITCHING]: [BattlePhase.PLAYER_TURN, BattlePhase.ENEMY_TURN, BattlePhase.DEFEAT],
  [BattlePhase.ITEM_USE]: [BattlePhase.ENEMY_TURN, BattlePhase.PLAYER_TURN],
  [BattlePhase.FAINTED]: [
    BattlePhase.SWITCHING, BattlePhase.DEFEAT,
    BattlePhase.PLAYER_TURN, BattlePhase.VICTORY,
  ],
  [BattlePhase.CAPTURE]: [BattlePhase.VICTORY, BattlePhase.PLAYER_TURN],
  [BattlePhase.VICTORY]: [BattlePhase.IDLE],
  [BattlePhase.DEFEAT]: [BattlePhase.IDLE],
  [BattlePhase.PVP_OPPONENT_TURN]: [
    BattlePhase.PLAYER_TURN, BattlePhase.FAINTED,
    BattlePhase.DEFEAT, BattlePhase.VICTORY,
  ],
};

/** Начальное состояние боя */
export const INITIAL_BATTLE_STATE: BattleStateData = {
  activeWild: null,
  wildLvl: 5,
  wildMaxHP: 0,
  wildCurHP: 0,
  wildStatus: null,
  wildSleepTurns: 0,
  escapeAttempts: 0,
  wildMovesDetailed: [],
  wildMovesPP: null,

  battleRound: 0,
  activePlayerMon: null,
  playerMovesDetailed: [],
  battleType: 'wild',
  currentWeather: 'clear',
  itemsUsedInBattle: 0,

  gymLeaderKey: null,
  gymTeamIndex: 0,
  gymTeamData: null,
  gymTeamIndexInMember: 0,

  playerReflectTurns: 0,
  playerLightScreenTurns: 0,
  enemyReflectTurns: 0,
  enemyLightScreenTurns: 0,
  protectActive: false,
  substituteHP: 0,
  enemyProtectActive: false,
  enemySubstituteHP: 0,

  huntActive: false,
  huntTimer: null,
  enemyChosenMove: null,
};

/** PokeAPI move data (subset used by battle system) */
export interface MoveData {
  name: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  type: { name: string };
  damage_class: { name: 'physical' | 'special' | 'status' };
  meta?: {
    healing?: number;
    drain?: number;
    ailment?: { name: string };
    ailment_chance?: number;
    category?: { name: string };
  };
  stat_changes?: Array<{
    change: number;
    stat: { name: string };
  }>;
  target?: { name: string };
}

/** Wild pokemon state (subset tracked during battle) */
export interface WildMonState {
  name: string;
  currentHp?: number;
  maxHp?: number;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  types: Array<{ type: { name: string } }>;
  moves: Array<{ move: { url: string; name?: string } }>;
  abilities?: Array<{ ability: { name: string } }>;
  sprites?: Record<string, any>;
  base_experience?: number;
  status?: string | null;
  isShiny?: boolean;
  heldItem?: string | null;
  berries?: Record<string, number>;
  statStages?: { atk: number; def: number; spa: number; spd: number; spe: number };
  wildIVs?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  captureRate?: number;
  speciesData?: any;
  wildGender?: string | null;
  sleepTurns?: number;
  trainingStage?: number;
  trainingStat?: string;
  species?: { url: string; name?: string };
}

/** Player pokemon battle state (subset) */
export interface PlayerMonState {
  uid?: string;
  name?: string;
  nickname?: string;
  apiData: any;
  maxHp: number;
  currentHp: number;
  baseLevel: number;
  candiesEaten?: number;
  heldItem?: string | null;
  status?: string | null;
  sleepTurns?: number;
  statStages?: { atk: number; def: number; spa: number; spd: number; spe: number } | null;
  movesPP?: PPData[] | null;
  choiceLockedMove?: number;
  exp?: number;
  expToNext?: number;
  abilityName?: string | null;
  berries?: Record<string, number>;
}

export interface PPData {
  current: number;
  max: number;
}

export interface BattleStateData {
  activeWild: any | null; // PokeAPI pokemon object — complex shape from PokeAPI
  wildLvl: number;
  wildMaxHP: number;
  wildCurHP: number;
  wildStatus: string | null;
  wildSleepTurns: number;
  escapeAttempts: number;
  wildMovesDetailed: MoveData[];
  wildMovesPP: PPData[] | null;

  battleRound: number;
  activePlayerMon: any | null; // Player's team monster object
  playerMovesDetailed: (MoveData | null)[];
  battleType: string;
  currentWeather: string;
  itemsUsedInBattle: number;

  gymLeaderKey: string | null;
  gymTeamIndex: number;
  gymTeamData: any[] | null;
  gymTeamIndexInMember: number;

  playerReflectTurns: number;
  playerLightScreenTurns: number;
  enemyReflectTurns: number;
  enemyLightScreenTurns: number;
  protectActive: boolean;
  substituteHP: number;
  enemyProtectActive: boolean;
  enemySubstituteHP: number;

  huntActive: boolean;
  huntTimer: any;
  enemyChosenMove: MoveData | null;
}
