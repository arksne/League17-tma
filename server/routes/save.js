import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { decompressSave } from '../lib/save-utils.js';
import { fileURLToPath } from 'url';
import { asyncHandler } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_DIR = path.join(__dirname, '../../data/backups');
const MAX_BACKUPS = 5;
const COMPRESS_THRESHOLD = 50000; // 50KB
let saveCounter = 0;
const DB_BACKUP_INTERVAL = 100; // full DB backup every 100 saves

// Per-user save mutex: prevents parallel save overwrites (audit 3.1)
const saveLocks = new Map();

// Dedicated rate limiter for save/load endpoints
const saveRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // max 30 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many save/load requests. Please wait.' }
});

export async function acquireSaveLock(userId) {
  const oldPromise = saveLocks.get(userId);
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  saveLocks.set(userId, promise);  // Atomic swap: set BEFORE awaiting
  if (oldPromise) await oldPromise; // Wait for previous to finish (no TOCTOU)
  return () => {
    if (saveLocks.get(userId) === promise) saveLocks.delete(userId);
    resolve();
  };
}

const router = Router();
router.use(authMiddleware);
router.use(saveRateLimit); // apply rate limiter to all save endpoints

router.get('/', asyncHandler(async (req, res) => {
    const db = getDB();
    const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', req.userId);
    if (!save) return res.json({ saveData: null });
    let data = decompressSave(save.save_data);
    if (!data) {
      logger.error(`Corrupted save user ${req.userId}, trying recovery...`);
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
    // Server authority: merge inventory and badges from normalized tables
    try {
      const invRows = await db.all('SELECT item_id, quantity FROM player_inventory WHERE user_id = ?', req.userId);
      if (invRows.length > 0) {
        const tblInv = {};
        for (const row of invRows) tblInv[row.item_id] = row.quantity;
        data.inventory = tblInv;
      }
      const badgeRows = await db.all('SELECT badge_id FROM player_badges WHERE user_id = ?', req.userId);
      if (badgeRows.length > 0) {
        data.badges = badgeRows.map(r => r.badge_id);
      }
    } catch (_) { /* tables may not exist yet on fresh DB */ }
    if (!data.myTeam || !Array.isArray(data.myTeam)) data.myTeam = [];
    if (!data.inventory || typeof data.inventory !== 'object') data.inventory = {};
    if (!data.badges || !Array.isArray(data.badges)) data.badges = [];
    if (typeof data.money !== 'number') data.money = 500;
    res.json({ saveData: data, updatedAt: save.updated_at });
}));

router.post('/', asyncHandler(async (req, res) => {
  const unlock = await acquireSaveLock(req.userId);
  try {
    const { saveData, badgesCount = 0, teamLevelSum = 0, money = 0,
            pokemonCount = 0, legendaryCount = 0, saveVersion = 0 } = req.body;

    // Validate structure
    if (typeof saveData !== 'object' || saveData === null) {
      return res.status(400).json({ error: 'saveData must be an object' });
    }
    
    // SERVER AUTHORITY: Ignore client's money and inventory
    const db = getDB();
    const existingForAuth = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    let authMoney = 500;
    let authInventory = {};
    if (existingForAuth) {
      try {
        const oldData = decompressSave(existingForAuth.save_data);
        if (oldData) {
          if (typeof oldData.money === 'number') authMoney = oldData.money;
          if (oldData.inventory && typeof oldData.inventory === 'object') authInventory = oldData.inventory;
        }
      } catch (e) {}
    }
    saveData.money = authMoney;
    saveData.inventory = authInventory;
    const realMoney = authMoney; // For leaderboard

    if (!Array.isArray(saveData.myTeam) || saveData.myTeam.length > 6) {
      return res.status(400).json({ error: 'myTeam must be an array with at most 6 items' });
    }
    if (typeof saveData.money !== 'number') {
      return res.status(400).json({ error: 'money must be a number' });
    }
    if (!Array.isArray(saveData.badges)) {
      return res.status(400).json({ error: 'badges must be an array' });
    }

    // Deep validation of save data structure
    const validateSave = (data) => {
      const errors = [];
      const fixed = [];

      // Money bounds: clamp 0 to 1 billion
      if (data.money < 0 || data.money > 1_000_000_000) {
        const old = data.money;
        data.money = Math.max(0, Math.min(1_000_000_000, data.money));
        fixed.push(`money ${old} -> ${data.money}`);
      }

      // Inventory: only string keys, non-negative integer values
      if (data.inventory && typeof data.inventory === 'object') {
        for (const [k, v] of Object.entries(data.inventory)) {
          if (typeof k !== 'string') errors.push('inventory key not a string');
          if (!Number.isInteger(v) || v < 0) {
            if (typeof v === 'number' && v >= 0) {
              const clamped = Math.floor(v);
              data.inventory[k] = clamped;
              fixed.push(`inventory[${k}] ${v} -> ${clamped}`);
            } else {
              errors.push(`inventory[${k}] must be non-negative integer`);
            }
          }
        }
      }

      // Badges: each must be a string
      for (let i = 0; i < data.badges.length; i++) {
        if (typeof data.badges[i] !== 'string') errors.push(`badges[${i}] not a string`);
      }

      // Team members
      for (let i = 0; i < data.myTeam.length; i++) {
        const mon = data.myTeam[i];
        if (!mon || typeof mon !== 'object') { errors.push(`myTeam[${i}] not an object`); continue; }

        // apiData must exist with name and types
        if (!mon.apiData || typeof mon.apiData !== 'object') { errors.push(`myTeam[${i}] missing apiData`); continue; }
        if (typeof mon.apiData.name !== 'string') errors.push(`myTeam[${i}] apiData.name not string`);

        // currentHp: clamp >= 0
        if (typeof mon.currentHp !== 'number' || mon.currentHp < 0) {
          if (typeof mon.currentHp === 'number' && mon.currentHp < 0) {
            mon.currentHp = 0;
            fixed.push(`myTeam[${i}] currentHp clamped to 0`);
          } else {
            errors.push(`myTeam[${i}] invalid currentHp`);
          }
        }

        // maxHp: auto-clamp 1-9999
        if (typeof mon.maxHp !== 'number' || mon.maxHp < 1 || mon.maxHp > 9999) {
          if (typeof mon.maxHp === 'number') {
            const old = mon.maxHp;
            mon.maxHp = Math.max(1, Math.min(9999, mon.maxHp));
            fixed.push(`myTeam[${i}] maxHp ${old} -> ${mon.maxHp}`);
          } else {
            errors.push(`myTeam[${i}] invalid maxHp`);
          }
        }

        // Level: auto-clamp 1-100
        if (typeof mon.baseLevel !== 'number' || mon.baseLevel < 1 || mon.baseLevel > 100) {
          if (typeof mon.baseLevel === 'number') {
            const old = mon.baseLevel;
            mon.baseLevel = Math.max(1, Math.min(100, mon.baseLevel));
            fixed.push(`myTeam[${i}] baseLevel ${old} -> ${mon.baseLevel}`);
          } else {
            errors.push(`myTeam[${i}] baseLevel not a number`);
          }
        }

        // Candies eaten: auto-clamp 0-200
        if (mon.candiesEaten !== undefined) {
          if (typeof mon.candiesEaten !== 'number' || mon.candiesEaten < 0 || mon.candiesEaten > 200) {
            if (typeof mon.candiesEaten === 'number') {
              const old = mon.candiesEaten;
              mon.candiesEaten = Math.max(0, Math.min(200, mon.candiesEaten));
              fixed.push(`myTeam[${i}] candiesEaten ${old} -> ${mon.candiesEaten}`);
            } else {
              errors.push(`myTeam[${i}] candiesEaten not a number`);
            }
          }
        }

        // IVs: auto-clamp 0-31
        if (mon.wildIVs && typeof mon.wildIVs === 'object') {
          for (const s of ['hp', 'atk', 'def', 'spa', 'spd', 'spe']) {
            if (mon.wildIVs[s] !== undefined) {
              if (!Number.isInteger(mon.wildIVs[s]) || mon.wildIVs[s] < 0 || mon.wildIVs[s] > 31) {
                if (typeof mon.wildIVs[s] === 'number') {
                  const old = mon.wildIVs[s];
                  mon.wildIVs[s] = Math.max(0, Math.min(31, Math.round(mon.wildIVs[s])));
                  fixed.push(`myTeam[${i}] IV ${s} ${old} -> ${mon.wildIVs[s]}`);
                } else {
                  errors.push(`myTeam[${i}] IV ${s} not a number`);
                }
              }
            }
          }
        }

        // EXP: auto-clamp >= 0
        if (mon.exp !== undefined && (typeof mon.exp !== 'number' || mon.exp < 0)) {
          if (typeof mon.exp === 'number' && mon.exp < 0) {
            mon.exp = 0;
            fixed.push(`myTeam[${i}] exp clamped to 0`);
          } else {
            errors.push(`myTeam[${i}] invalid exp`);
          }
        }

        // Status: must be a valid status or null
        if (mon.status !== null && mon.status !== undefined) {
          const validStatuses = ['psn', 'brn', 'par', 'slp', 'frz', 'tox'];
          if (typeof mon.status !== 'string' || !validStatuses.includes(mon.status)) {
            errors.push(`myTeam[${i}] invalid status`);
          }
        }

        // Stat stages: auto-clamp -6 to +6
        if (mon.statStages && typeof mon.statStages === 'object') {
          for (const s of ['atk', 'def', 'spa', 'spd', 'spe']) {
            if (mon.statStages[s] !== undefined) {
              if (!Number.isInteger(mon.statStages[s]) || mon.statStages[s] < -6 || mon.statStages[s] > 6) {
                if (typeof mon.statStages[s] === 'number') {
                  const old = mon.statStages[s];
                  mon.statStages[s] = Math.max(-6, Math.min(6, Math.round(mon.statStages[s])));
                  fixed.push(`myTeam[${i}] statStage ${s} ${old} -> ${mon.statStages[s]}`);
                } else {
                  errors.push(`myTeam[${i}] statStage ${s} not a number`);
                }
              }
            }
          }
        }

        // Held item must be a string
        if (mon.heldItem !== undefined && mon.heldItem !== null && typeof mon.heldItem !== 'string') {
          errors.push(`myTeam[${i}] heldItem not a string`);
        }
      }

      // Validate quests structure if present
      if (data.quests && typeof data.quests === 'object') {
        for (const [qid, q] of Object.entries(data.quests)) {
          if (typeof q !== 'object') { errors.push(`quests.${qid} not an object`); continue; }
          if (q.progress !== undefined && (typeof q.progress !== 'number' || q.progress < 0)) {
            if (typeof q.progress === 'number' && q.progress < 0) {
              q.progress = 0;
              fixed.push(`quests.${qid} progress clamped to 0`);
            } else {
              errors.push(`quests.${qid} invalid progress`);
            }
          }
          if (q.completed !== undefined && typeof q.completed !== 'boolean') {
            errors.push(`quests.${qid} completed not boolean`);
          }
        }
      }

      // Current location ID should be a string
      if (data.currentLocationId !== undefined && typeof data.currentLocationId !== 'string') {
        errors.push('currentLocationId not a string');
      }

      // expShareActive should be boolean
      if (data.expShareActive !== undefined && typeof data.expShareActive !== 'boolean') {
        errors.push('expShareActive not boolean');
      }

      if (fixed.length > 0) {
        logger.warn(`Save auto-fixed for user ${req.userId}:`, fixed.join('; '));
      }

      return errors;
    };

    const validationErrors = validateSave(saveData);
    if (validationErrors.length > 0) {
      logger.warn(`Save validation failed for user ${req.userId}:`, validationErrors.join('; '));
      return res.status(400).json({ error: 'validation_failed', details: validationErrors });
    }

    // Version check: reject stale saves
    const existing = existingForAuth; // Already fetched above
    if (existing) {
      try {
        const old = decompressSave(existing.save_data);
        if (old) {
          const oldV = old._v || 0;
          if (saveVersion > 0 && saveVersion < oldV) {
            return res.json({ success: false, error: 'stale_save', serverVersion: oldV, clientVersion: saveVersion });
          }
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
      } catch (e) { logger.warn('File backup failed', e.message); }

      // Database save_backups table backup
      try {
        await db.run(
          'INSERT INTO save_backups (user_id, save_data) VALUES (?, ?)',
          req.userId, existing.save_data
        );
        // Keep only last 20 backups per user
        await db.run(
          `DELETE FROM save_backups WHERE user_id = ? AND id NOT IN (
            SELECT id FROM save_backups WHERE user_id = ? ORDER BY id DESC LIMIT 20
          )`,
          req.userId, req.userId
        );
      } catch (e) { logger.warn('DB backup failed', e.message); }
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
      } catch(e) { logger.warn('DB backup failed', e.message); }
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
        req.userId, badgesCount, teamLevelSum, realMoney, pokemonCount, legendaryCount
      );

      // Log save to action_log
      await db.run(
        `INSERT INTO action_log (user_id, action, details) VALUES (?, 'save', ?)`,
        req.userId, JSON.stringify({ money: realMoney, teamSize: saveData.myTeam?.length || 0, badges: badgesCount, location: saveData.currentLocationId || '?' })
      );

      // Clean old action_log entries (keep last 1000 per user)
      await db.run(`DELETE FROM action_log WHERE user_id = ? AND id NOT IN (SELECT id FROM action_log WHERE user_id = ? ORDER BY id DESC LIMIT 1000)`, req.userId, req.userId);

      // ── Dual-write: sync inventory to normalized table ──
      if (saveData.inventory && typeof saveData.inventory === 'object') {
        // Clear stale entries first, then re-insert current inventory
        await db.run('DELETE FROM player_inventory WHERE user_id = ?', req.userId);
        for (const [itemId, qty] of Object.entries(saveData.inventory)) {
          if (typeof qty === 'number' && qty > 0 && typeof itemId === 'string') {
            await db.run(
              'INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
              req.userId, itemId, qty
            );
          }
        }
      }

      // ── Dual-write: sync badges to normalized table ──
      if (Array.isArray(saveData.badges)) {
        await db.run('DELETE FROM player_badges WHERE user_id = ?', req.userId);
        for (const badge of saveData.badges) {
          if (typeof badge === 'string') {
            await db.run(
              'INSERT OR IGNORE INTO player_badges (user_id, badge_id) VALUES (?, ?)',
              req.userId, badge
            );
          }
        }
      }

      await db.exec('COMMIT');
    } catch (e) {
      try { await db.exec('ROLLBACK'); } catch(_) {}
      throw e;
    }

    const row = await db.get('SELECT updated_at FROM game_saves WHERE user_id = ?', req.userId);
    res.json({ success: true, updatedAt: row.updated_at, serverVersion: saveVersion });
  } finally {
    unlock();
  }
}));

export default router;
