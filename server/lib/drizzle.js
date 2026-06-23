/**
 * Drizzle ORM instance — типизированный доступ к БД.
 * Использует тот же better-sqlite3 файл, что и legacy db.js.
 * Все новые роуты пишут через drizzle, старые продолжают через db.js.
 *
 * Использование:
 *   import { drizzle, schema } from '../lib/drizzle.js';
 *   const users = await drizzle.select().from(schema.users).all();
 */
import { drizzle as createDrizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import * as schema from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../../data');

let _drizzle = null;

export function initDrizzle() {
  if (_drizzle) return _drizzle;

  const sqlite = new Database(path.join(DATA_DIR, 'game.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  _drizzle = createDrizzle(sqlite, { schema, logger: process.env.NODE_ENV === 'development' });
  return _drizzle;
}

export function getDrizzle() {
  if (!_drizzle) return initDrizzle();
  return _drizzle;
}

export { schema };
