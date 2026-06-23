import { describe, it, expect, beforeEach } from 'vitest';
import { BattleStateMachine } from '../state-machine.js';
import { BattlePhase, BATTLE_TRANSITIONS } from '../types.js';

describe('BattleStateMachine — базовые переходы', () => {
  let sm: BattleStateMachine;

  beforeEach(() => {
    sm = BattleStateMachine.create();
  });

  it('начинается в IDLE', () => {
    expect(sm.phase).toBe(BattlePhase.IDLE);
  });

  it('IDLE → WILD_START разрешён', () => {
    expect(sm.transition(BattlePhase.WILD_START)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.WILD_START);
  });

  it('WILD_START → PLAYER_TURN', () => {
    sm.transition(BattlePhase.WILD_START);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.PLAYER_TURN);
  });

  it('PLAYER_TURN → ENEMY_TURN', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    expect(sm.transition(BattlePhase.ENEMY_TURN)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.ENEMY_TURN);
  });

  it('ENEMY_TURN → PLAYER_TURN', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    sm.transition(BattlePhase.ENEMY_TURN);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.PLAYER_TURN);
  });

  it('через весь цикл: IDLE → WILD → PLAYER → ENEMY → FAINTED → SWITCH → PLAYER', () => {
    expect(sm.transition(BattlePhase.WILD_START)).toBe(true);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.transition(BattlePhase.ENEMY_TURN)).toBe(true);
    expect(sm.transition(BattlePhase.FAINTED)).toBe(true);
    expect(sm.transition(BattlePhase.SWITCHING)).toBe(true);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.PLAYER_TURN);
  });

  it('через PVP_START', () => {
    expect(sm.transition(BattlePhase.PVP_START)).toBe(true);
    expect(sm.phase).toBe(BattlePhase.PVP_START);
    expect(sm.transition(BattlePhase.PVP_OPPONENT_TURN)).toBe(true);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.transition(BattlePhase.ENEMY_TURN)).toBe(true);
    expect(sm.transition(BattlePhase.VICTORY)).toBe(true);
    expect(sm.transition(BattlePhase.IDLE)).toBe(true);
  });

  it('GYM → PLAYER → ENEMY → VICTORY → IDLE', () => {
    sm.transition(BattlePhase.GYM_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    sm.transition(BattlePhase.ENEMY_TURN);
    sm.transition(BattlePhase.VICTORY);
    expect(sm.phase).toBe(BattlePhase.VICTORY);
    sm.transition(BattlePhase.IDLE);
    expect(sm.phase).toBe(BattlePhase.IDLE);
  });
});

describe('BattleStateMachine — невалидные переходы', () => {
  let sm: BattleStateMachine;

  beforeEach(() => { sm = BattleStateMachine.create(); });

  it('IDLE → ENEMY_TURN запрещён', () => {
    expect(sm.transition(BattlePhase.ENEMY_TURN)).toBe(false);
    expect(sm.phase).toBe(BattlePhase.IDLE);
  });

  it('IDLE → FAINTED запрещён', () => {
    expect(sm.transition(BattlePhase.FAINTED)).toBe(false);
  });

  it('IDLE → VICTORY запрещён', () => {
    expect(sm.transition(BattlePhase.VICTORY)).toBe(false);
  });

  it('IDLE → CAPTURE запрещён', () => {
    expect(sm.transition(BattlePhase.CAPTURE)).toBe(false);
  });

  it('WILD_START → VICTORY запрещён', () => {
    sm.transition(BattlePhase.WILD_START);
    expect(sm.transition(BattlePhase.VICTORY)).toBe(false);
  });

  it('PLAYER_TURN → IDLE запрещён', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    expect(sm.transition(BattlePhase.IDLE)).toBe(false);
  });

  it('canTransition проверяет без выполнения', () => {
    sm.transition(BattlePhase.WILD_START);
    expect(sm.canTransition(BattlePhase.PLAYER_TURN)).toBe(true);
    expect(sm.canTransition(BattlePhase.VICTORY)).toBe(false);
    expect(sm.phase).toBe(BattlePhase.WILD_START); // unchanged
  });
});

describe('BattleStateMachine — событийная система', () => {
  let sm: BattleStateMachine;

  beforeEach(() => { sm = BattleStateMachine.create(); });

  it('emit вызывает подписчиков', () => {
    let called = false;
    sm.on('test', () => { called = true; });
    sm.emit('test');
    expect(called).toBe(true);
  });

  it('on с аргументами', () => {
    const args: any[] = [];
    sm.on('test', (...a: any[]) => args.push(...a));
    sm.emit('test', 'a', 1, true);
    expect(args).toEqual(['a', 1, true]);
  });

  it('unsubscribe работает', () => {
    let count = 0;
    const unsub = sm.on('test', () => count++);
    sm.emit('test');
    expect(count).toBe(1);
    unsub();
    sm.emit('test');
    expect(count).toBe(1); // не увеличился
  });

  it('phase:change событие при переходе', () => {
    const events: any[] = [];
    sm.on('phase:change', (e: any) => events.push(e));
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({ from: BattlePhase.IDLE, to: BattlePhase.WILD_START });
    expect(events[1]).toEqual({ from: BattlePhase.WILD_START, to: BattlePhase.PLAYER_TURN });
  });

  it('phase:wild_start событие', () => {
    const events: any[] = [];
    sm.on('phase:wild_start', (e: any) => events.push(e));
    sm.transition(BattlePhase.WILD_START);
    expect(events).toHaveLength(1);
    expect(events[0].from).toBe(BattlePhase.IDLE);
  });

  it('clearListeners удаляет все подписки', () => {
    let count = 0;
    sm.on('test', () => count++);
    sm.clearListeners();
    sm.emit('test');
    expect(count).toBe(0);
  });
});

describe('BattleStateMachine — управление состоянием', () => {
  let sm: BattleStateMachine;

  beforeEach(() => { sm = BattleStateMachine.create(); });

  it('patch обновляет поля', () => {
    sm.patch({ battleRound: 5, wildCurHP: 80 });
    expect(sm.state.battleRound).toBe(5);
    expect(sm.state.wildCurHP).toBe(80);
  });

  it('snapshot копирует состояние', () => {
    sm.patch({ battleRound: 3 });
    const snap = sm.snapshot();
    expect(snap.battleRound).toBe(3);
    snap.battleRound = 99;
    expect(sm.state.battleRound).toBe(3); // не изменился
  });

  it('reset возвращает в IDLE', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    sm.patch({ battleRound: 10 });
    sm.reset();
    expect(sm.phase).toBe(BattlePhase.IDLE);
    expect(sm.state.battleRound).toBe(0);
  });

  it('forcePhase без валидации', () => {
    sm.forcePhase(BattlePhase.VICTORY);
    expect(sm.phase).toBe(BattlePhase.VICTORY);
  });

  it('forcePhase генерирует phase:change', () => {
    const events: any[] = [];
    sm.on('phase:change', (e: any) => events.push(e));
    sm.forcePhase(BattlePhase.VICTORY);
    expect(events).toHaveLength(1);
    expect(events[0].to).toBe(BattlePhase.VICTORY);
  });
});

describe('BattleStateMachine — переход из VICTORY и DEFEAT', () => {
  let sm: BattleStateMachine;

  beforeEach(() => { sm = BattleStateMachine.create(); });

  it('VICTORY → IDLE', () => {
    sm.forcePhase(BattlePhase.VICTORY);
    expect(sm.transition(BattlePhase.IDLE)).toBe(true);
  });

  it('DEFEAT → IDLE', () => {
    sm.forcePhase(BattlePhase.DEFEAT);
    expect(sm.transition(BattlePhase.IDLE)).toBe(true);
  });

  it('VICTORY → PLAYER_TURN запрещён', () => {
    sm.forcePhase(BattlePhase.VICTORY);
    expect(sm.transition(BattlePhase.PLAYER_TURN)).toBe(false);
  });
});

describe('BattleStateMachine — transitionLog', () => {
  let sm: BattleStateMachine;

  beforeEach(() => { sm = BattleStateMachine.create(); });

  it('логирует переходы', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.transition(BattlePhase.PLAYER_TURN);
    const log = sm.getTransitionLog();
    expect(log).toHaveLength(2);
    expect(log[0]).toBe('idle → wild_start');
    expect(log[1]).toBe('wild_start → player_turn');
  });

  it('reset очищает лог', () => {
    sm.transition(BattlePhase.WILD_START);
    sm.reset();
    expect(sm.getTransitionLog()).toHaveLength(0);
  });
});

describe('BattleStateMachine — BATTLE_TRANSITIONS конфигурация', () => {
  it('все фазы имеют список разрешённых переходов', () => {
    const allPhases = Object.values(BattlePhase);
    for (const phase of allPhases) {
      expect(BATTLE_TRANSITIONS[phase]).toBeDefined();
      expect(Array.isArray(BATTLE_TRANSITIONS[phase])).toBe(true);
    }
  });

  it('все target фазы существуют в enum', () => {
    const allPhases = new Set(Object.values(BattlePhase));
    for (const [, targets] of Object.entries(BATTLE_TRANSITIONS)) {
      for (const target of targets) {
        expect(allPhases.has(target)).toBe(true);
      }
    }
  });

  it('IDLE достижим только из VICTORY и DEFEAT', () => {
    const canReachIdle = Object.entries(BATTLE_TRANSITIONS)
      .filter(([, targets]) => targets.includes(BattlePhase.IDLE))
      .map(([phase]) => phase);
    expect(canReachIdle.sort()).toEqual([BattlePhase.DEFEAT, BattlePhase.VICTORY].sort());
  });
});
