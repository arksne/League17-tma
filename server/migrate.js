/**
 * Migration runner.
 * Применяет drizzle-generated SQL миграции к SQLite базе.
 *
 * Использование:
 *   node server/migrate.js           — apply pending migrations
 *   node server/migrate.js --fresh   — пересоздать все таблицы (осторожно!)
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '../data');

const dbPath = path.join(DATA_DIR, 'game.db');
const isFresh = process.argv.includes('--fresh');

console.log(`📦 Database: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Migration tracking table ──────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`);

// ── Get already applied migrations ────────────────────
const applied = new Set(
  db.prepare('SELECT name FROM __drizzle_migrations').all().map(r => r.name)
);

// ── Get all migration files ───────────────────────────
if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.log('No migrations directory found. Exiting.');
  db.close();
  process.exit(0);
}

const migrations = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

if (migrations.length === 0) {
  console.log('No migration files found.');
  db.close();
  process.exit(0);
}

console.log(`\nMigrations found: ${migrations.length}`);
console.log(`Already applied: ${applied.size}`);

// ── Apply pending migrations ──────────────────────────
let appliedCount = 0;

for (const file of migrations) {
  if (applied.has(file)) {
    console.log(`  ✓ ${file} (already applied)`);
    continue;
  }

  const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  const statements = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

  console.log(`  → ${file} (${statements.length} statements)`);

  try {
    for (const stmt of statements) {
      try {
        db.exec(stmt);
      } catch (err) {
        // For existing databases, skip "already exists" errors
        if (isFresh) throw err;
        const msg = err.message.toLowerCase();
        if (msg.includes('already exists') || msg.includes('duplicate column')) {
          console.log(`    ⚠ skipped: ${err.message.slice(0, 80)}`);
        } else {
          throw err;
        }
      }
    }

    db.prepare('INSERT INTO __drizzle_migrations (name) VALUES (?)').run(file);
    appliedCount++;
    console.log(`    ✓ applied`);
  } catch (err) {
    console.error(`    ✗ FAILED: ${err.message}`);
    process.exit(1);
  }
}

console.log(`\n✅ ${appliedCount} migration(s) applied`);
db.close();
