import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../store.js';

// Mock items so addItem() recognizes the test item IDs and their categories
vi.mock('../../data/items.js', () => ({
  ITEMS: [
    { id: 'pokeball', category: 'balls' },
    { id: 'stimulator', category: 'healing' },
    { id: 'superStimulator', category: 'healing' },
    { id: 'fireStone', category: 'evolutionStones' },
    { id: 'waterStone', category: 'evolutionStones' },
    { id: 'leafStone', category: 'evolutionStones' },
    { id: 'thunderStone', category: 'evolutionStones' },
    { id: 'moonStone', category: 'evolutionStones' },
    { id: 'sunStone', category: 'evolutionStones' },
    { id: 'shinyStone', category: 'evolutionStones' },
    { id: 'everstone', category: 'evolutionStones' },
    { id: 'amurit', category: 'evolutionStones' },
    { id: 'deepSeaTooth', category: 'evolutionStones' },
    { id: 'deepSeaScale', category: 'evolutionStones' },
    { id: 'antiparalyze', category: 'statusCure' },
    { id: 'energyDrink', category: 'statusCure' },
    { id: 'fireExtinguisher', category: 'statusCure' },
    { id: 'healingHerb', category: 'statusCure' },
    { id: 'weakElixir', category: 'ppRecovery' },
    { id: 'elixir', category: 'ppRecovery' },
    { id: 'strongElixir', category: 'ppRecovery' },
    { id: 'sparkles', category: 'battle' },
    { id: 'patienceBand', category: 'battle' },
    { id: 'crown', category: 'battle' },
    { id: 'xAttack', category: 'battle' },
    { id: 'xDefense', category: 'battle' },
    { id: 'leftovers', category: 'battle' },
    { id: 'airBalloon', category: 'battle' },
    { id: 'rageOrb', category: 'battle' },
    { id: 'glowingGlue', category: 'battle' },
    { id: 'blackSludge', category: 'battle' },
    { id: 'redCard', category: 'battle' },
    { id: 'heatRock', category: 'battle' },
    { id: 'train', category: 'training' },
    { id: 'bandage', category: 'training' },
    { id: 'whiteHerb', category: 'training' },
    { id: 'luckyAmulet', category: 'training' },
    { id: 'ticketBoatJK', category: 'tickets' },
    { id: 'ticketTrainJK', category: 'tickets' },
    { id: 'ticketBoatJS', category: 'tickets' },
    { id: 'ticketBusJ', category: 'tickets' },
    { id: 'ticketPlaneEJS', category: 'tickets' },
    { id: 'ticketPlaneKS', category: 'tickets' },
    { id: 'ticketPlaneJ', category: 'tickets' },
    { id: 'ore', category: 'crafting' },
    { id: 'cotton', category: 'crafting' },
    { id: 'craftBranch', category: 'crafting' },
    { id: 'metalIngot', category: 'crafting' },
    { id: 'glass', category: 'crafting' },
    { id: 'greatBall', category: 'balls' },
    { id: 'ultraBall', category: 'balls' },
    { id: 'masterBall', category: 'balls' },
    { id: 'friendBall', category: 'balls' },
    { id: 'loveBall', category: 'balls' },
    { id: 'darkBall', category: 'balls' },
    { id: 'superDarkBall', category: 'balls' },
  ],
}));

beforeEach(() => {
  store.setState({});
  store.clearDirty();
});

describe('event system', () => {
  it('on() subscribes and emit() fires', () => {
    const fn = vi.fn();
    store.on('test:event', fn);
    store.emit('test:event', 'a', 'b');
    expect(fn).toHaveBeenCalledWith('a', 'b');
  });

  it('unsubscribe works', () => {
    const fn = vi.fn();
    const unsub = store.on('test:event', fn);
    unsub();
    store.emit('test:event');
    expect(fn).not.toHaveBeenCalled();
  });

  it('multiple subscribers all fire', () => {
    const a = vi.fn();
    const b = vi.fn();
    store.on('ev', a);
    store.on('ev', b);
    store.emit('ev', 1);
    expect(a).toHaveBeenCalledWith(1);
    expect(b).toHaveBeenCalledWith(1);
  });
});

describe('query system', () => {
  it('setQuery and query', () => {
    store.setQuery('getLocation', (id: string) => ({ name: id.toUpperCase() }));
    expect(store.query('getLocation', 'pallet')).toEqual({ name: 'PALLET' });
  });

  it('query returns undefined for unset key', () => {
    expect(store.query('nonexistent')).toBeUndefined();
  });

  it('setQuery replaces previous handler', () => {
    store.setQuery('x', () => 1);
    store.setQuery('x', () => 2);
    expect(store.query('x')).toBe(2);
  });
});

describe('addItem / removeItem', () => {
  it('addItem adds to empty inventory', () => {
    expect(store.addItem('pokeball', 5)).toBe(true);
    expect(store.getItemQty('pokeball')).toBe(5);
  });

  it('addItem returns false for unknown item', () => {
    expect(store.addItem('nonexistent_item', 1)).toBe(false);
  });

  it('addItem warns on unknown item', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    store.addItem('unknown_item');
    expect(warn).toHaveBeenCalledWith('Unknown item:', 'unknown_item');
    warn.mockRestore();
  });

  it('addItem increments existing quantity', () => {
    store.addItem('stimulator', 5);
    store.addItem('stimulator', 3);
    expect(store.getItemQty('stimulator')).toBe(8);
  });

  it('removeItem deducts correctly', () => {
    store.addItem('stimulator', 5);
    expect(store.removeItem('stimulator', 2)).toBe(true);
    expect(store.getItemQty('stimulator')).toBe(3);
  });

  it('removeItem returns false if insufficient', () => {
    store.addItem('stimulator', 1);
    expect(store.removeItem('stimulator', 5)).toBe(false);
    expect(store.getItemQty('stimulator')).toBe(1);
  });

  it('removeItem returns false if item missing', () => {
    expect(store.removeItem('stimulator')).toBe(false);
  });

  it('addItem enforces category limits', () => {
    // healing max stack = 20
    for (let i = 0; i < 4; i++) store.addItem('superStimulator', 5);
    expect(store.getItemQty('superStimulator')).toBe(20);
    store.addItem('superStimulator', 1);
    expect(store.getItemQty('superStimulator')).toBe(20);
  });

  it('addItem enforces bag limit of 1000 (excl credit)', () => {
    // Fill using existing items with max per-slot limits
    // Evolution stones (max 5) — 11 items × 5 = 55
    const stoneIds = ['fireStone', 'waterStone', 'leafStone', 'thunderStone',
      'moonStone', 'sunStone', 'shinyStone', 'everstone', 'amurit',
      'deepSeaTooth', 'deepSeaScale'];
    for (const id of stoneIds) store.addItem(id, 5);
    // 55

    // Status cure (max 20) — 4 items × 20 = 80
    const statusIds = ['antiparalyze', 'energyDrink', 'fireExtinguisher', 'healingHerb'];
    for (const id of statusIds) store.addItem(id, 20);
    // 55 + 80 = 135

    // PP recovery (max 20) — 3 items × 20 = 60
    const ppIds = ['weakElixir', 'elixir', 'strongElixir'];
    for (const id of ppIds) store.addItem(id, 20);
    // 135 + 60 = 195

    // Battle items (max 10) — 12 items × 10 = 120
    const battleIds = ['sparkles', 'patienceBand', 'crown', 'xAttack', 'xDefense',
      'leftovers', 'airBalloon', 'rageOrb', 'glowingGlue', 'blackSludge',
      'redCard', 'heatRock'];
    for (const id of battleIds) store.addItem(id, 10);
    // 195 + 120 = 315

    // Training (max 10) — 4 items × 10 = 40
    store.addItem('train', 10);
    store.addItem('bandage', 10);
    store.addItem('whiteHerb', 10);
    store.addItem('luckyAmulet', 10);
    // 315 + 40 = 355

    // Tickets (max 10) — 7 items × 10 = 70
    const ticketIds = ['ticketBoatJK', 'ticketTrainJK', 'ticketBoatJS', 'ticketBusJ',
      'ticketPlaneEJS', 'ticketPlaneKS', 'ticketPlaneJ'];
    for (const id of ticketIds) store.addItem(id, 10);
    // 355 + 70 = 425

    // Crafting (max 99) — 5 items × 99 = 495. 425 + 495 = 920
    const craftIds = ['ore', 'cotton', 'craftBranch', 'metalIngot', 'glass'];
    for (const id of craftIds) store.addItem(id, 99);
    // 425 + 495 = 920

    // Balls (max 99). 8 balls × 99 = 792. 920 + 792 = 1712, but bag caps at 1000.
    // Only the first ball item will fill the remaining 80 slots.
    store.addItem('pokeball', 99);
    store.addItem('greatBall', 99);
    store.addItem('ultraBall', 99);
    store.addItem('masterBall', 99);
    store.addItem('friendBall', 99);
    store.addItem('loveBall', 99);
    store.addItem('darkBall', 99);
    store.addItem('superDarkBall', 99);
    // Bag should be at or very near capacity
    expect(store.getTotalItems()).toBeLessThanOrEqual(1000);
    expect(store.getTotalItems()).toBeGreaterThanOrEqual(990);
  });
});

describe('addItem emits events', () => {
  it('emits inventory:changed on addItem', () => {
    const fn = vi.fn();
    store.on('inventory:changed', fn);
    store.addItem('pokeball', 3);
    expect(fn).toHaveBeenCalledWith('pokeball', 3);
  });

  it('emits inventory:changed on removeItem', () => {
    store.addItem('pokeball', 5);
    const fn = vi.fn();
    store.on('inventory:changed', fn);
    store.removeItem('pokeball', 2);
    expect(fn).toHaveBeenCalledWith('pokeball', -2);
  });
});

describe('modifyMoney', () => {
  it('adds money', () => {
    store.modifyMoney(500);
    expect(store.getState().inventory['credit']).toBe(500);
  });

  it('subtracts money', () => {
    if (!store.getState().inventory) store.getState().inventory = {};
    store.getState().inventory['credit'] = 1000;
    store.modifyMoney(-300);
    expect(store.getState().inventory['credit']).toBe(700);
  });

  it('clamps to 0', () => {
    if (!store.getState().inventory) store.getState().inventory = {};
    store.getState().inventory['credit'] = 100;
    store.modifyMoney(-500);
    expect(store.getState().inventory['credit']).toBe(0);
  });

  it('emits money:changed', () => {
    const fn = vi.fn();
    store.on('money:changed', fn);
    store.modifyMoney(100);
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe('dirty flag tracking', () => {
  it('marks dirty on addItem', () => {
    store.addItem('pokeball', 1);
    expect(store.isDirty('inventory')).toBe(true);
  });

  it('marks dirty on modifyMoney', () => {
    store.modifyMoney(100);
    expect(store.isDirty('inventory')).toBe(true);
  });

  it('clearDirty resets', () => {
    store.modifyMoney(100);
    store.clearDirty();
    expect(store.isDirty('inventory')).toBe(false);
  });

  it('getDirty returns snapshot', () => {
    store.addItem('pokeball', 1);
    store.modifyMoney(100);
    const dirty = store.getDirty();
    expect(dirty.has('inventory')).toBe(true);
  });
});

describe('item queries', () => {
  it('hasItem', () => {
    expect(store.hasItem('pokeball')).toBe(false);
    store.addItem('pokeball', 1);
    expect(store.hasItem('pokeball')).toBe(true);
  });

  it('getTotalItems counts excluding credit', () => {
    store.getState().inventory = { credit: 100, pokeball: 5, potion: 3 };
    expect(store.getTotalItems()).toBe(8);
  });
});

describe('getMaxStack', () => {
  it('returns item.maxStack when defined', () => {
    const max = store.getMaxStack('pokeball');
    expect(max).toBeGreaterThanOrEqual(99);
  });

  it('returns 999 for items without category limit', () => {
    const max = store.getMaxStack('credit');
    expect(max).toBe(999);
  });
});

describe('legacy convenience methods', () => {
  it('updateMoneyDisplay emits money:changed', () => {
    const fn = vi.fn();
    store.on('money:changed', fn);
    store.updateMoneyDisplay();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('updateInventoryDisplay emits inventory:changed', () => {
    const fn = vi.fn();
    store.on('inventory:changed', fn);
    store.updateInventoryDisplay();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('autoSave emits save', () => {
    const fn = vi.fn();
    store.on('save', fn);
    store.autoSave();
    expect(fn).toHaveBeenCalledOnce();
  });

  it('showGymRewardSelection emits gym:reward', () => {
    const fn = vi.fn();
    store.on('gym:reward', fn);
    store.showGymRewardSelection('pewter');
    expect(fn).toHaveBeenCalledWith('pewter');
  });

  it('checkTutorialProgress emits tutorial:progress', () => {
    const fn = vi.fn();
    store.on('tutorial:progress', fn);
    store.checkTutorialProgress('catch', 1, 'pokeball');
    expect(fn).toHaveBeenCalledWith('catch', 1, 'pokeball');
  });
});

describe('legacy query shorthands', () => {
  it('lsKey delegates to query', () => {
    store.setQuery('lsKey', (name: string) => `custom_${name}`);
    expect(store.lsKey('save')).toBe('custom_save');
  });

  it('getLocation delegates to query', () => {
    store.setQuery('getLocation', (id: string) => ({ id, name: 'Test' }));
    expect(store.getLocation('loc1')).toEqual({ id: 'loc1', name: 'Test' });
  });

  it('processMonsterDrop delegates to query', () => {
    store.setQuery('processMonsterDrop', (name: string) => [{ item: 'stimulator', qty: 1 }]);
    expect(store.processMonsterDrop('bulbasaur')).toEqual([{ item: 'stimulator', qty: 1 }]);
  });
});
