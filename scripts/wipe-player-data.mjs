// Wipe all player data from game.db
// Preserves: pokeapi_cache (not player data)
// Resets: everything else

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'game.db');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found:', dbPath);
  process.exit(1);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Disable foreign keys temporarily for clean wipe
db.pragma('foreign_keys = OFF');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT IN ('pokeapi_cache')").all();
const tableNames = tables.map(t => t.name);

console.log('Tables to wipe:', tableNames.join(', '));

// Delete all rows from each table
for (const name of tableNames) {
  const result = db.prepare(`DELETE FROM ${name}`).run();
  console.log(`  ${name}: ${result.changes} rows deleted`);
}

// Reset autoincrement sequences
db.prepare("DELETE FROM sqlite_sequence").run();

db.pragma('foreign_keys = ON');

db.close();
console.log('\n✅ All player data wiped. Database is clean.');
