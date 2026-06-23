/**
 * Per-location shop inventories.
 * If a location ID is not listed, it sells all items with price > 0 (current behavior).
 * Add only locations that should have RESTRICTED stock.
 */

export const SHOP_STOCK = {
  // ── Kanto ──
  'cerulean_pokemarket': [
    'pokeBall', 'greatBall', 'potion', 'superPotion',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry',
    'xAttack', 'xDefense', 'xSpeed',
  ],
  'vermilion_pokemarket': [
    'pokeBall', 'greatBall', 'potion', 'superPotion',
    'antidote', 'paralyzeHeal',
    'oranBerry', 'chestoBerry', 'rawstBerry',
    'xAttack', 'xDefense',
  ],
  'lavender_pokemarket': [
    'pokeBall', 'greatBall', 'ultraBall', 'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
    'ether', 'maxElixir',
  ],
  'saffron_west_pokemarket': [
    'pokeBall', 'greatBall', 'ultraBall',
    'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
    'ether', 'elixir', 'maxElixir',
    'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'sunStone',
    'hpUp', 'protein', 'iron', 'calcium', 'zinc', 'carbos', 'iodine',
  ],
  'fuchsia_pokemarket': [
    'pokeBall', 'greatBall', 'ultraBall',
    'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
    'ether', 'maxElixir',
  ],
  // ── Johto ──
  'goldenrod_supermarket': [
    'pokeBall', 'greatBall', 'ultraBall', 'quickBall', 'friendBall', 'loveBall', 'darkBall', 'superDarkBall',
    'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'aspearBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'leppaBerry',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
    'ether', 'elixir', 'maxElixir',
    'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'sunStone', 'evolutionStone',
    'hpUp', 'protein', 'iron', 'calcium', 'zinc', 'carbos', 'iodine',
    'train', 'weaken',
    'tm', 'craftersKit',
    'skiGear', 'waterSupply', 'bigWaterSupply',
  ],
  'olivine_shop': [
    'pokeBall', 'greatBall', 'potion', 'superPotion',
    'antidote', 'paralyzeHeal',
    'oranBerry', 'chestoBerry', 'rawstBerry',
    'xAttack', 'xDefense',
  ],
  'flourence_tech_shop': [
    'tm', 'craftersKit',
    'ether', 'elixir', 'maxElixir',
    'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'sunStone',
    'metalCoat', 'dragonFang', 'blackGlasses', 'softSand', 'twistedSpoon', 'spellTag',
    'sharpBeak', 'hardStone', 'whiteHerb', 'metalCoat',
  ],
  'warhall_bill_shop': [
    'pokeBall', 'greatBall', 'ultraBall',
    'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'ether', 'maxElixir',
    'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'sunStone',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
  ],
  'alston_shop': [
    'pokeBall', 'greatBall',
    'potion', 'superPotion',
    'antidote', 'paralyzeHeal',
    'oranBerry', 'chestoBerry',
    'xAttack',
  ],
  'summer_pokemarket': [
    'pokeBall', 'greatBall', 'ultraBall',
    'potion', 'superPotion', 'fullRestore',
    'antidote', 'paralyzeHeal', 'awakening', 'burnHeal', 'antiSputin',
    'oranBerry', 'chestoBerry', 'rawstBerry', 'sitrusBerry', 'persimBerry', 'lumBerry',
    'xAttack', 'xDefense', 'xSpDefense', 'xSpAttack', 'xSpeed', 'xAccuracy',
    'ether', 'maxElixir',
    'fireStone', 'waterStone', 'leafStone', 'thunderStone',
  ],
  'melen_craig_shop': [
    'pokeBall', 'greatBall',
    'potion', 'superPotion',
    'antidote', 'paralyzeHeal',
    'oranBerry', 'chestoBerry',
    'xAttack',
    'waterSupply', 'bigWaterSupply',
  ],
};
