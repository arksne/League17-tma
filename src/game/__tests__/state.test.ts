import { describe, it, expect, vi, beforeEach } from 'vitest';
import { state, generateUID, getTrainerId, lsKey, getItemQty, hasItem, itemDef, itemCategory } from '../state.js';

const storage = new Map<string, string>();

vi.mock('../../data/items.js', () => ({
  ITEMS: [
    { id: 'pokeball', nameRu: 'Монстробол', category: 'balls' },
    { id: 'potion', nameRu: 'Зелье', category: 'healing' },
    { id: 'credit', nameRu: 'Кредиты', category: 'currency' },
  ],
}));

beforeEach(() => {
  state.inventory = { pokeball: 10, potion: 0, credit: 500 };
  state.tgUser = null;
  state.myTeam = [];
  storage.clear();
  // Mock localStorage for node environment
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, val: string) => storage.set(key, val),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
    get length() { return storage.size; },
    key: (i: number) => [...storage.keys()][i] ?? null,
  });
});

describe('generateUID', () => {
  it('returns a string', () => {
    const uid = generateUID();
    expect(typeof uid).toBe('string');
    expect(uid.length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const uids = new Set(Array.from({ length: 100 }, () => generateUID()));
    expect(uids.size).toBe(100);
  });
});

describe('getTrainerId', () => {
  it('returns tgUser id when set', () => {
    state.tgUser = { id: '12345' } as any;
    expect(getTrainerId()).toBe('12345');
  });

  it('falls back to localStorage when no tgUser', () => {
    state.tgUser = null;
    localStorage.setItem('league17_trainer_id', 'saved-id');
    expect(getTrainerId()).toBe('saved-id');
  });

  it('returns 0 as last resort', () => {
    state.tgUser = null;
    localStorage.removeItem('league17_trainer_id');
    expect(getTrainerId()).toBe('0');
  });
});

describe('lsKey', () => {
  it('creates namespaced key with trainer id', () => {
    state.tgUser = { id: 'test123' } as any;
    expect(lsKey('save')).toBe('league17_save_test123');
    expect(lsKey('theme')).toBe('league17_theme_test123');
  });
});

describe('getItemQty / hasItem', () => {
  it('getItemQty returns correct count', () => {
    expect(getItemQty('pokeball')).toBe(10);
    expect(getItemQty('potion')).toBe(0);
  });

  it('getItemQty returns 0 for unknown item', () => {
    expect(getItemQty('nonexistent')).toBe(0);
  });

  it('hasItem returns true when qty > 0', () => {
    expect(hasItem('pokeball')).toBe(true);
  });

  it('hasItem returns false when qty === 0', () => {
    expect(hasItem('potion')).toBe(false);
  });

  it('hasItem returns false for unknown item', () => {
    expect(hasItem('nothing')).toBe(false);
  });
});

describe('itemDef', () => {
  it('returns item definition for known item', () => {
    const def = itemDef('pokeball');
    expect(def.id).toBe('pokeball');
    expect(def.nameRu).toBe('Монстробол');
    expect(def.category).toBe('balls');
  });

  it('returns fallback for null id', () => {
    const def = itemDef(null as any);
    expect(def.id).toBeNull();
    expect(def.nameRu).toBe('???');
  });

  it('returns fallback for unknown item', () => {
    const def = itemDef('fake_item');
    expect(def.id).toBeNull();
    expect(def.nameRu).toBe('???');
  });
});

describe('itemCategory', () => {
  it('returns category for known item', () => {
    expect(itemCategory('pokeball')).toBe('balls');
  });

  it('returns "other" for unknown item', () => {
    expect(itemCategory('nothing')).toBe('other');
  });

  it('returns "other" for null', () => {
    expect(itemCategory(null as any)).toBe('other');
  });
});
