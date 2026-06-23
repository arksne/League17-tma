import Database from 'better-sqlite3';
const db = new Database('data/game.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
for (const t of tables) {
  const cols = db.prepare('PRAGMA table_info(' + t.name + ')').all();
  console.log(t.name + ':', cols.map(c => c.name).join(', '));
}
const users = db.prepare('SELECT * FROM users').all();
console.log('\nUsers:', JSON.stringify(users, null, 2));
try {
  const saves = db.prepare('SELECT * FROM game_saves').all();
  console.log('\nSaves:', JSON.stringify(saves, null, 2).substring(0, 2000));
} catch(e) {
  console.log('No game_saves table');
}
db.close();
