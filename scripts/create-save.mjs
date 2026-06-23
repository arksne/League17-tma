import Database from 'better-sqlite3';
import zlib from 'zlib';

const db = new Database('data/game.db');

// Clean slate
db.prepare('DELETE FROM chat_messages').run();
db.prepare('DELETE FROM save_backups').run();
db.prepare('DELETE FROM action_log').run();
db.prepare('DELETE FROM user_locations').run();
db.prepare('DELETE FROM player_quests').run();
db.prepare('DELETE FROM achievements').run();
db.prepare('DELETE FROM pvp_ratings').run();
db.prepare('DELETE FROM leaderboard').run();
db.prepare('DELETE FROM game_saves').run();
db.prepare('DELETE FROM users').run();

// Create user
db.prepare(`INSERT INTO users (id, telegram_id, username, first_name, nickname, avatar, starter_pokemon, registered, registered_at)
VALUES (1, '123456789', 'test_user', 'Test', 'Admin', '🤖', 'pikachu', 1, datetime('now'))`).run();

// Minimal but valid save with a team
const saveData = {
  _v: 7,
  _ts: Date.now(),
  currentLocationId: 'vermilionCity',
  currentRegion: 'kanto',
  inventory: { credit: 500, pokeball: 15, potion: 5 },
  money: 500,
  badges: [],
  trainerNickname: 'Admin',
  myTeam: [{
    uid: 'pika_' + Date.now(),
    originalTrainer: 1,
    createdAt: Date.now(),
    caughtLocation: 'vermilionCity',
    apiData: {
      name: 'pikachu',
      sprites: { front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
      stats: [
        { base_stat: 35, stat: { name: 'hp' } },
        { base_stat: 55, stat: { name: 'attack' } },
        { base_stat: 40, stat: { name: 'defense' } },
        { base_stat: 50, stat: { name: 'special-attack' } },
        { base_stat: 50, stat: { name: 'special-defense' } },
        { base_stat: 90, stat: { name: 'speed' } },
      ],
      types: [{ type: { name: 'electric' } }],
      base_experience: 112,
      abilities: [{ ability: { name: 'static' }, is_hidden: false, slot: 1 }],
      moves: [{ move: { name: 'thundershock', url: 'https://pokeapi.co/api/v2/move/84/' } }],
      cries: { latest: '', legacy: '' },
    },
    maxHp: 72,
    currentHp: 72,
    ivs: { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 },
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    baseLevel: 10,
    exp: 1000,
    expToNext: 1331,
    candiesEaten: 0,
    vitaminsEaten: 0,
    training: null,
    trainingStage: 0,
    trainingStat: null,
    happiness: 70,
    natureIdx: 3,
    breedLetter: 'A',
    gender: 'male',
    status: null,
    sleepTurns: 0,
    movesPP: [
      { current: 30, max: 30 },
      { current: 0, max: 0 },
      { current: 0, max: 0 },
      { current: 0, max: 0 },
    ],
    statStages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    abilityName: 'static',
    heldItem: null,
    berries: { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 },
    learnableMoves: [],
    lastMoveCheckLevel: 10,
  }],
  currentPokemonIndex: null,
  pokedexSeen: ['pikachu'],
  pokedexCaught: ['pikachu'],
  quests: [],
  questProgress: {},
  completedQuests: [],
  npcQuestProgress: {},
  completedNPCQuests: [],
  tutorialStep: 0,
  visitedLocations: ['vermilionCity'],
  itemsUsedInBattle: 0,
  itemHistory: [],
  pcBoxes: [[]],
  daycareMons: [],
  daycareEgg: null,
  lastLocation: null,
  expShareActive: false,
  breedingPairs: [],
  eggs: [],
  notifications: [],
};

// Compress save data the same way the game does (Z: prefix + gzip + base64)
const json = JSON.stringify(saveData);
const compressed = zlib.deflateSync(Buffer.from(json, 'utf8'));
const encoded = 'Z:' + compressed.toString('base64');

console.log('Save JSON size:', json.length, 'bytes');
console.log('Compressed size:', encoded.length, 'bytes');

// Insert save
db.prepare(`INSERT INTO game_saves (user_id, save_data, updated_at)
VALUES (1, ?, datetime('now'))`).run(encoded);

// Insert leaderboard entry
db.prepare(`INSERT INTO leaderboard (user_id, badges_count, team_level_sum, money, pokemon_count, legendary_count, updated_at)
VALUES (1, 0, 10, 500, 1, 0, datetime('now'))`).run();

console.log('\n✅ User + save created!');
console.log('User: Admin (id=1) with Pikachu lv.10 in Vermilion City');
console.log('Inventory: 500 cr, 15 pokeballs, 5 potions');

// Verify
const user = db.prepare('SELECT id, nickname, starter_pokemon, registered FROM users WHERE id = 1').get();
const save = db.prepare('SELECT id, user_id, length(save_data) as save_len FROM game_saves WHERE user_id = 1').get();
console.log('\nVerification:', JSON.stringify({ user, save }));

db.close();
