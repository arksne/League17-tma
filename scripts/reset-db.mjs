import Database from 'better-sqlite3';
const db = new Database('data/game.db');

// Delete in order to avoid FK constraints
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

console.log('All user data deleted');

const users = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
const saves = db.prepare('SELECT COUNT(*) as cnt FROM game_saves').get();
console.log('Users remaining:', users.cnt);
console.log('Saves remaining:', saves.cnt);

db.close();
