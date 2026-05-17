import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../data/backups');
const MAX_BACKUPS = 5;
const COMPRESS_THRESHOLD = 50000; // 50KB
let saveCounter = 0;
const DB_BACKUP_INTERVAL = 100; // full DB backup every 100 saves

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', req.userId);
    if (!save) return res.json({ saveData: null });
    let raw = save.save_data;
    if (raw.startsWith('Z:')) raw = zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString();
    let data;
    try { data = JSON.parse(raw); } catch (e) {
      console.error(`Corrupted save user ${req.userId}, trying recovery...`);
      if (!fs.existsSync(BACKUP_DIR)) return res.status(500).json({ error: 'Save corrupted, no backups available' });
      const backups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith(`user_${req.userId}_`)).sort().reverse();
      if (backups.length > 0) {
        data = JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, backups[0]), 'utf8'));
        await db.run(`INSERT INTO game_saves (user_id, save_data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET save_data = excluded.save_data, updated_at = datetime('now')`, req.userId, JSON.stringify(data));
        await db.run(`INSERT INTO action_log (user_id, action, details) VALUES (?, 'recovery', ?)`, req.userId, backups[0]);
        return res.json({ saveData: data, updatedAt: new Date().toISOString(), recovered: true });
      }
      return res.status(500).json({ error: 'Save corrupted, recovery failed' });
    }
    if (!data.myTeam || !Array.isArray(data.myTeam)) data.myTeam = [];
    if (!data.inventory || typeof data.inventory !== 'object') data.inventory = {};
    if (!data.badges || !Array.isArray(data.badges)) data.badges = [];
    if (typeof data.money !== 'number') data.money = 500;
    res.json({ saveData: data, updatedAt: save.updated_at });
  } catch (err) {
    console.error('Load error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { saveData, badgesCount = 0, teamLevelSum = 0, money = 0,
            pokemonCount = 0, legendaryCount = 0, saveVersion = 0 } = req.body;

    // Validate structure
    if (typeof saveData !== 'object' || saveData === null) {
      return res.status(400).json({ error: 'saveData must be an object' });
    }
    if (!Array.isArray(saveData.myTeam) || saveData.myTeam.length > 6) {
      return res.status(400).json({ error: 'myTeam must be an array with at most 6 items' });
    }
    if (typeof saveData.money !== 'number') {
      return res.status(400).json({ error: 'money must be a number' });
    }
    if (!Array.isArray(saveData.badges)) {
      return res.status(400).json({ error: 'badges must be an array' });
    }

    const db = getDB();

    // Version check: reject stale saves
    const existing = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    if (existing) {
      try {
        const old = JSON.parse(existing.save_data);
        const oldV = old._v || 0;
        if (saveVersion > 0 && saveVersion < oldV) {
          return res.json({ success: false, error: 'stale_save', serverVersion: oldV, clientVersion: saveVersion });
        }
      } catch (_) { /* old save might be corrupted, overwrite it */ }
    }

    // Backup old save before overwriting
    if (existing) {
      try {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
        const backupFile = path.join(BACKUP_DIR, `user_${req.userId}_${Date.now()}.json`);
        fs.writeFileSync(backupFile, existing.save_data);
        // Rotate: keep only last MAX_BACKUPS
        const backups = fs.readdirSync(BACKUP_DIR)
          .filter(f => f.startsWith(`user_${req.userId}_`))
          .sort()
          .reverse();
        for (const f of backups.slice(MAX_BACKUPS)) {
          fs.unlinkSync(path.join(BACKUP_DIR, f));
        }
      } catch (e) { console.warn('Backup failed', e.message); }
    }

    let dataStr = JSON.stringify(saveData);
    // Compress large saves
    if (dataStr.length > COMPRESS_THRESHOLD) {
      dataStr = 'Z:' + zlib.deflateSync(dataStr).toString('base64');
    }

    // Full DB backup every N saves
    saveCounter++;
    if (saveCounter % DB_BACKUP_INTERVAL === 0) {
      try {
        const dbPath = path.join(__dirname, '../../data/game.db');
        const dbBackup = path.join(BACKUP_DIR, `db_${new Date().toISOString().slice(0,10)}.db`);
        fs.copyFileSync(dbPath, dbBackup);
        // Keep last 3 DB backups
        const dbBackups = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('db_')).sort().reverse();
        for (const f of dbBackups.slice(3)) fs.unlinkSync(path.join(BACKUP_DIR, f));
      } catch(e) { console.warn('DB backup failed', e.message); }
    }

    // Wrap in transaction to prevent data corruption on crash
    await db.exec('BEGIN');
    try {
      await db.run(
        `INSERT INTO game_saves (user_id, save_data, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           save_data = excluded.save_data,
           updated_at = datetime('now')`,
        req.userId, dataStr
      );

      await db.run(
        `INSERT INTO leaderboard (user_id, badges_count, team_level_sum, money, pokemon_count, legendary_count, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(user_id) DO UPDATE SET
           badges_count = excluded.badges_count,
           team_level_sum = excluded.team_level_sum,
           money = excluded.money,
           pokemon_count = excluded.pokemon_count,
           legendary_count = excluded.legendary_count,
           updated_at = datetime('now')`,
        req.userId, badgesCount, teamLevelSum, money, pokemonCount, legendaryCount
      );

      // Log save to action_log
      await db.run(
        `INSERT INTO action_log (user_id, action, details) VALUES (?, 'save', ?)`,
        req.userId, JSON.stringify({ money, teamSize: saveData.myTeam?.length || 0, badges: badgesCount, location: saveData.currentLocationId || '?' })
      );

      // Clean old action_log entries (keep last 1000 per user)
      await db.run(`DELETE FROM action_log WHERE user_id = ? AND id NOT IN (SELECT id FROM action_log WHERE user_id = ? ORDER BY id DESC LIMIT 1000)`, req.userId, req.userId);

      await db.exec('COMMIT');
    } catch (e) {
      try { await db.exec('ROLLBACK'); } catch(_) {}
      throw e;
    }

    const row = await db.get('SELECT updated_at FROM game_saves WHERE user_id = ?', req.userId);
    res.json({ success: true, updatedAt: row.updated_at, serverVersion: saveVersion });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
