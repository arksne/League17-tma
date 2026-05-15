import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../data/backups');
const MAX_BACKUPS = 5;

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', req.userId);
    if (!save) return res.json({ saveData: null });
    res.json({ saveData: JSON.parse(save.save_data), updatedAt: save.updated_at });
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

    const dataStr = JSON.stringify(saveData);
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

    const row = await db.get('SELECT updated_at FROM game_saves WHERE user_id = ?', req.userId);
    res.json({ success: true, updatedAt: row.updated_at, serverVersion: saveVersion });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
