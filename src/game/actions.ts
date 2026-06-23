import { state, getItemQty, getTrainerId } from './state.js';
import { store } from './store.js';
import { ITEMS } from '../data/items.js';

// --- Item history ---

export function logItemHistory(itemId: string, qty: number, source: string) {
  state.itemHistory.push({
    itemId, qty, source,
    timestamp: Date.now(),
    trainerId: getTrainerId()
  });
  if (state.itemHistory.length > 500) state.itemHistory = state.itemHistory.slice(-500);
}

// --- Inventory init ---

export function initInventory() {
  ITEMS.forEach((item: any) => {
    state.inventory[item.id] = 0;
  });
  // credit IS money — init as regular item
  if (!state.inventory['credit']) state.inventory['credit'] = 500;
}

// --- Item operations (delegated to store.ts as single source of truth) ---
// Side effects (itemHistory logging, saves) are handled here and by
// main.ts's store.on('inventory:changed', ...) subscriber.

export function addItem(itemId: string, qty = 1): boolean {
  const result = store.addItem(itemId, qty);
  if (result) {
    // 'inventory:changed' is emitted by store.addItem; history is logged by the event handler in init.ts
    store.emit('save');
  }
  return result;
}

export function removeItem(itemId: string, qty = 1): boolean {
  const result = store.removeItem(itemId, qty);
  if (result) {
    store.emit('save');
  }
  return result;
}
