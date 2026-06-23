import { ITEMS } from '../data/items.js';

/**
 * GameStore — singleton that holds all game state.
 * Uses an event system for side-effect decoupling.
 *
 * State mutations go through methods here. Side effects (UI updates, saves)
 * are triggered by emitting events that subscribers handle.
 *
 * Queries (getLocation, lsKey, processMonsterDrop) use direct callbacks
 * since they return values — cannot be event-based.
 */
class GameStore {
  _state: Record<string, any>;
  _dirty: Set<string>;
  _listeners: Map<string, Set<Function>>;
  _queries: Record<string, Function>;

  constructor() {
    this._state = {};
    this._dirty = new Set();
    this._listeners = new Map();
    this._queries = {};
  }

  /** Get full mutable state object (same ref as main.js uses) */
  getState() { return this._state; }

  /** Replace entire state (e.g. after loading a save) */
  setState(s) { this._state = s; this._dirty.clear(); }

  // ── Event system ───────────────────────────────

  /** Subscribe to an event. Returns unsubscribe function. */
  on(event: string, fn: Function): () => void {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event)!.add(fn);
    return () => { this._listeners.get(event)?.delete(fn); };
  }

  /** Emit an event to all subscribers. */
  emit(event: string, ...args: any[]) {
    this._listeners.get(event)?.forEach(fn => fn(...args));
  }

  // ── Query callbacks (return values, not events) ──

  /** Register a query handler (e.g. getLocation, lsKey, processMonsterDrop). Only one per key. */
  setQuery(key: string, fn: Function) { this._queries[key] = fn; }

  query(key: string, ...args: any[]) {
    return this._queries[key]?.(...args);
  }

  // ── Item helpers ──────────────────────────────

  /** Общий лимит рюкзака: не больше 1000 предметов (кроме credit) */
  static MAX_BAG = 1000;

  /** Per-category max stack. Items not listed default to 999. */
  static CATEGORY_LIMITS = {
    balls: 99,
    healing: 20,
    statusCure: 20,
    ppRecovery: 20,
    vitamins: 99,
    evolutionStones: 5,
    berries: 20,
    training: 10,
    battle: 10,
    crafting: 99,
    tickets: 10,
  };

  /** Max stack for a given item. Reads item.maxStack, then category default, then 999. */
  getMaxStack(itemId) {
    const def = ITEMS.find(i => i.id === itemId);
    if (!def) return 999;
    if (def.maxStack) return def.maxStack;
    return GameStore.CATEGORY_LIMITS[def.category] || 999;
  }

  /** Сумма всех предметов в рюкзаке (кроме credit) */
  getTotalItems() {
    const inv: Record<string, number> = this._state.inventory || {};
    let total = 0;
    for (const [id, qty] of Object.entries(inv)) {
      if (id !== 'credit') total += qty;
    }
    return total;
  }

  getItemQty(itemId) {
    return this._state.inventory?.[itemId] || 0;
  }

  hasItem(itemId) {
    return this.getItemQty(itemId) > 0;
  }

  addItem(itemId, qty = 1) {
    if (!this._state.inventory) this._state.inventory = {};
    if (!(itemId in this._state.inventory)) {
      if (!ITEMS.find(i => i.id === itemId)) {
        console.warn('Unknown item:', itemId);
        return false;
      }
      this._state.inventory[itemId] = 0;
    }
    const current = this._state.inventory[itemId];
    const totalBefore = this.getTotalItems();
    const bagLimit = GameStore.MAX_BAG;
    const bagRoom = bagLimit - totalBefore;
    const slotLimit = this.getMaxStack(itemId);
    // 🔧 DEBUG: drop100 — игнорируем лимиты рюкзака
    const drop100 = typeof localStorage !== 'undefined' && localStorage.getItem('pokematrix_drop_100') === '1';
    const effectiveBagRoom = drop100 ? 9999 : bagRoom;
    const effectiveSlotLimit = drop100 ? 9999 : slotLimit;
    const limit = Math.min(effectiveSlotLimit, current + effectiveBagRoom);
    const actualAdd = Math.min(qty, limit - current);
    if (actualAdd <= 0) {
      this.emit('toast', `Рюкзак полон (${totalBefore}/${bagLimit})`, true);
      return false;
    }
    this._state.inventory[itemId] = current + actualAdd;
    if (actualAdd < qty) {
      this.emit('toast', `Рюкзак: ${totalBefore + actualAdd}/${bagLimit}`, true);
    }
    this._markDirty('inventory');
    this.emit('inventory:changed', itemId, actualAdd);
    return true;
  }

  removeItem(itemId, qty = 1) {
    if (!this._state.inventory || !(itemId in this._state.inventory)) return false;
    if (this._state.inventory[itemId] < qty) return false;
    this._state.inventory[itemId] -= qty;
    this._markDirty('inventory');
    this.emit('inventory:changed', itemId, -qty);
    return true;
  }

  // ── Money ─────────────────────────────────────

  modifyMoney(delta) {
    if (!this._state.inventory) this._state.inventory = {};
    const cur = this._state.inventory['credit'] || 0;
    this._state.inventory['credit'] = Math.max(0, cur + delta);
    this._markDirty('inventory');
    this.emit('money:changed');
  }

  async giveReward(money: number, items: Array<{id: string, qty: number}> = []) {
    // Local optimistic update
    if (money) this.modifyMoney(money);
    for (const item of items) {
      if (item.id && item.qty > 0) this.addItem(item.id, item.qty);
    }

    // Server sync
    try {
      const { API_BASE } = await import('./config.js');
      const { getCloudAuthHeaders } = await import('./save.js');
      const res = await fetch(`${API_BASE}/economy/reward`, {
        method: 'POST',
        headers: { ...getCloudAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ money, items })
      });
      const data = await res.json();
      if (!data.error) {
        this._state.inventory['credit'] = data.money;
        // Merge server inventory with local: keep max of each item
        // (prevents losing items used/added between optimistic update and server response)
        if (data.inventory) {
          for (const [id, qty] of Object.entries(data.inventory)) {
            if (id !== 'credit') {
              this._state.inventory[id] = Math.max(this._state.inventory[id] || 0, qty as number);
            }
          }
        }
        this.updateMoneyDisplay();
        this.updateInventoryDisplay();
      }
    } catch (e) {
      console.error('Reward sync failed', e);
    }
  }

  // ── Dirty-flag tracking (for incremental saves) ─

  _markDirty(section) { this._dirty.add(section); }
  clearDirty() { this._dirty.clear(); }
  getDirty() { return new Set(this._dirty); }
  isDirty(section) { return this._dirty.has(section); }

  // ── Legacy query shorthands (used by core.ts) ──

  lsKey(name) { return this.query('lsKey', name) ?? `league17_${name}`; }
  getLocation(locId) { return this.query('getLocation', locId) ?? null; }
  processMonsterDrop(name) { return this.query('processMonsterDrop', name) ?? []; }

  // ── Legacy convenience methods (emit events) ──
  // These are called from core.ts and other modules.
  // They emit events that main.ts subscribes to.

  updateMoneyDisplay() { this.emit('money:changed'); }
  updateInventoryDisplay() { this.emit('inventory:changed'); }
  autoSave() { this.emit('save'); }
  checkTutorialProgress(type, amount, itemId) { this.emit('tutorial:progress', type, amount, itemId); }
  showGymRewardSelection(locId) { this.emit('gym:reward', locId); }
}

export const store = new GameStore();
