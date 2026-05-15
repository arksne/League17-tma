import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initDB() {
  // Use /app/data for Railway volume persistence (volume mount), fallback to local ../data
  const dataDir = process.env.RAILWAY_ENVIRONMENT ? '/app/data' : path.join(__dirname, '../data');
  mkdirSync(dataDir, { recursive: true });

  db = await open({
    filename: path.join(dataDir, 'game.db'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT DEFAULT '',
      first_name TEXT DEFAULT '',
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '👤',
      starter_pokemon TEXT DEFAULT '',
      registered INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      registered_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS game_saves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      save_data TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      badges_count INTEGER DEFAULT 0,
      team_level_sum INTEGER DEFAULT 0,
      money INTEGER DEFAULT 0,
      pokemon_count INTEGER DEFAULT 0,
      legendary_count INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      location_id TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS action_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      username TEXT DEFAULT '',
      first_name TEXT DEFAULT '',
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migrations — add columns that might be missing from old DB
  const migrations = [
    `ALTER TABLE users ADD COLUMN nickname TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '👤'`,
    `ALTER TABLE users ADD COLUMN starter_pokemon TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN registered INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN registered_at TEXT DEFAULT ''`,
    `ALTER TABLE leaderboard ADD COLUMN pokemon_count INTEGER DEFAULT 0`,
    `ALTER TABLE leaderboard ADD COLUMN legendary_count INTEGER DEFAULT 0`,
  ];
  for (const sql of migrations) {
    try { await db.run(sql); } catch (e) {
      // Column already exists — ignore
      if (!e.message.includes('duplicate column')) console.log('Migration skip:', e.message.slice(0,60));
    }
  }

  console.log('Database initialized');
  return db;
}

export function getDB() {
  return db;
}
