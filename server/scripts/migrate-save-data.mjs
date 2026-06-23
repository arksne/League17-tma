/**
 * One-time migration: переносит inventory и badges из save blob'ов
 * в нормализованные таблицы player_inventory и player_badges.
 *
 * Запуск: node server/scripts/migrate-save-data.mjs
 */
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../../data');
const dbPath = path.join(DATA_DIR, 'game.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function decompressSave(raw) {
  if (!raw) return null;
  if (raw.startsWith('Z:')) {
    return JSON.parse(zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString());
  }
  return JSON.parse(raw);
}

console.log('=== Migrating save data to normalized tables ===\n');

// Get all users with saves
const saves = db.prepare(`
  SELECT gs.user_id, gs.save_data
  FROM game_saves gs
  WHERE gs.save_data IS NOT NULL
`).all();

console.log(`Found ${saves.length} user saves to process`);

const insertInventory = db.prepare(`
  INSERT INTO player_inventory (user_id, item_id, quantity)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = excluded.quantity
`);

const insertBadge = db.prepare(`
  INSERT OR IGNORE INTO player_badges (user_id, badge_id)
  VALUES (?, ?)
`);

const insertMany = db.transaction((userId, inventory, badges) => {
  if (inventory && typeof inventory === 'object') {
    for (const [itemId, qty] of Object.entries(inventory)) {
      if (typeof qty === 'number' && qty > 0) {
        insertInventory.run(userId, itemId, qty);
      }
    }
  }
  if (Array.isArray(badges)) {
    for (const badge of badges) {
      if (typeof badge === 'string') {
        insertBadge.run(userId, badge);
      }
    }
  }
});

let migrated = 0;
let errors = 0;

for (const save of saves) {
  try {
    const data = decompressSave(save.save_data);
    if (!data) {
      console.warn(`  ⚠ User ${save.user_id}: could not decompress save`);
      errors++;
      continue;
    }

    const inventory = data.inventory || {};
    const badges = data.badges || [];

    if (Object.keys(inventory).length > 0 || badges.length > 0) {
      insertMany(save.user_id, inventory, badges);
      migrated++;
    }

    if (migrated % 100 === 0) {
      process.stdout.write(`  ${migrated}/${saves.length} processed\r`);
    }
  } catch (e) {
    console.error(`  ✗ User ${save.user_id}: ${e.message}`);
    errors++;
  }
}

process.stdout.write(`\n\n✅ Migrated ${migrated} users (${errors} errors)`);

// Show stats
const invCount = db.prepare('SELECT COUNT(*) as c FROM player_inventory').get();
const badgeCount = db.prepare('SELECT COUNT(*) as c FROM player_badges').get();
console.log(`\n   player_inventory: ${invCount.c} rows`);
console.log(`   player_badges:    ${badgeCount.c} rows`);

db.close();
console.log('\nDone!');
