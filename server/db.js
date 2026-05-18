import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

// Wrap better-sqlite3's sync API to match sqlite's async interface so
// all existing route code (await db.get/all/run/exec) works unchanged.
function wrap(db) {
  return {
    get: (sql, ...params) => {
      try { return Promise.resolve(db.prepare(sql).get(...params)); }
      catch (e) { return Promise.reject(e); }
    },
    all: (sql, ...params) => {
      try { return Promise.resolve(db.prepare(sql).all(...params)); }
      catch (e) { return Promise.reject(e); }
    },
    run: (sql, ...params) => {
      try {
        const info = db.prepare(sql).run(...params);
        return Promise.resolve({ changes: info.changes, lastID: Number(info.lastInsertRowid) });
      } catch (e) { return Promise.reject(e); }
    },
    exec: (sql) => {
      try { return Promise.resolve(db.exec(sql)); }
      catch (e) { return Promise.reject(e); }
    },
    close: () => {
      try { db.close(); return Promise.resolve(); }
      catch (e) { return Promise.reject(e); }
    }
  };
}

export async function initDB(retries = 3) {
  const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../data');
  mkdirSync(dataDir, { recursive: true });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const raw = new Database(path.join(dataDir, 'game.db'));
      // Enable WAL mode for concurrent reads/writes
      raw.pragma('journal_mode = WAL');
      raw.pragma('foreign_keys = ON');
      db = wrap(raw);
      break;
    } catch (e) {
      console.error(`DB connection attempt ${attempt}/${retries} failed:`, e.message);
      if (attempt === retries) throw e;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT DEFAULT '',
      first_name TEXT DEFAULT '',
      nickname TEXT DEFAULT '',
      avatar TEXT DEFAULT '\u{1F464}',
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
    `ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '\u{1F464}'`,
    `ALTER TABLE users ADD COLUMN starter_pokemon TEXT DEFAULT ''`,
    `ALTER TABLE users ADD COLUMN registered INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN registered_at TEXT DEFAULT ''`,
    `ALTER TABLE leaderboard ADD COLUMN pokemon_count INTEGER DEFAULT 0`,
    `ALTER TABLE leaderboard ADD COLUMN legendary_count INTEGER DEFAULT 0`,
  ];
  for (const sql of migrations) {
    try { await db.run(sql); } catch (e) {
      if (!e.message.includes('duplicate column')) console.log('Migration skip:', e.message.slice(0, 60));
    }
  }

  console.log('Database initialized');
  return db;
}

export function getDB() {
  return db;
}

export async function closeDB() {
  if (db) {
    try {
      await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) { /* ignore */ }
    await db.close();
    db = null;
  }
}
