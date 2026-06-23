// Item/Inventory utilities — no dependency on main.js or core.js

import { ITEMS } from '../data/items.js';

export function itemDef(itemId) {
  if (!itemId) return { id: null, nameRu: '???', category: 'other', desc: 'Неизвестный предмет' };
  return ITEMS.find(i => i.id === itemId) || { id: null, nameRu: '???', category: 'other', desc: 'Неизвестный предмет' };
}

export function itemCategory(itemId) {
  if (!itemId) return 'other';
  return (ITEMS.find(i => i.id === itemId) || {}).category || 'other';
}
