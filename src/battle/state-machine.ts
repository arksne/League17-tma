import {
  BattlePhase,
  BATTLE_TRANSITIONS,
  INITIAL_BATTLE_STATE,
  BattleStateData,
} from './types.js';
export type { BattleStateData };
export { BattlePhase, BATTLE_TRANSITIONS, INITIAL_BATTLE_STATE };

type Listener = (...args: any[]) => void;

/**
 * BattleStateMachine — инстанциируемый класс состояния боя.
 * - Фазовые переходы с валидацией
 * - Ивент-система (emit/on/off)
 * - Изолированное состояние (можно создавать для тестов)
 */
export class BattleStateMachine {
  private _phase: BattlePhase = BattlePhase.IDLE;
  private _state: BattleStateData = { ...INITIAL_BATTLE_STATE };
  private _listeners = new Map<string, Set<Listener>>();
  private _transitionLog: string[] = [];

  // ── Геттеры ──

  get phase(): BattlePhase { return this._phase; }
  get state(): BattleStateData { return this._state; }

  /** Только для legacy-совместимости — прямое чтение/запись полей */
  get s(): BattleStateData { return this._state; }

  // ── Фазовые переходы ──

  /** Перейти в фазу `to`. Возвращает false если переход запрещён. */
  transition(to: BattlePhase): boolean {
    if (this._phase === to) return true; // Same phase is always allowed (re-entry)
    const allowed = BATTLE_TRANSITIONS[this._phase];
    if (!allowed?.includes(to)) {
      console.warn(
        `[BattleSM] Invalid transition: ${this._phase} → ${to}. ` +
        `Allowed: ${allowed?.join(', ') || 'none'}`
      );
      return false;
    }
    const from = this._phase;
    this._phase = to;
    this._transitionLog.push(`${from} → ${to}`);
    this.emit('phase:change', { from, to });
    this.emit(`phase:${to}`, { from });
    return true;
  }

  /** Проверить возможен ли переход (без выполнения) */
  canTransition(to: BattlePhase): boolean {
    if (this._phase === to) return true;
    return BATTLE_TRANSITIONS[this._phase]?.includes(to) ?? false;
  }

  /** Принудительно установить фазу (без валидации — для restore) */
  forcePhase(phase: BattlePhase): void {
    const from = this._phase;
    this._phase = phase;
    this.emit('phase:change', { from, to: phase });
  }

  // ── Управление состоянием ──

  /** Частичное обновление полей состояния */
  patch(partial: Partial<BattleStateData>): void {
    Object.assign(this._state, partial);
  }

  /** Сброс в начальное состояние + IDLE */
  reset(): void {
    this._state = { ...INITIAL_BATTLE_STATE };
    const from = this._phase;
    this._phase = BattlePhase.IDLE;
    this._transitionLog = [];
    this.emit('phase:change', { from, to: BattlePhase.IDLE });
  }

  /** Полный снимок состояния */
  snapshot(): BattleStateData {
    return { ...this._state };
  }

  // ── Ивент-система ──

  on(event: string, fn: Listener): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(fn);
    return () => { this._listeners.get(event)?.delete(fn); };
  }

  off(event: string, fn: Listener): void {
    this._listeners.get(event)?.delete(fn);
  }

  emit(event: string, ...args: any[]): void {
    const set = this._listeners.get(event);
    if (set) set.forEach(fn => fn(...args));
  }

  /** Удалить все подписки */
  clearListeners(): void {
    this._listeners.clear();
  }

  // ── Диагностика ──

  getTransitionLog(): string[] {
    return [...this._transitionLog];
  }

  /** Фабрика для тестов — чистый экземпляр */
  static create(): BattleStateMachine {
    return new BattleStateMachine();
  }
}
