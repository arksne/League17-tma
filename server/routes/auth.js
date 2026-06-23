import { Router } from 'express';
import { verifyTelegramInitData, parseTestUser } from '../auth.js';
import { getDB } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { asyncHandler, AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATARS_DIR = path.join(__dirname, '../../public/avatars');

// Admin access config from env vars (shared with admin.js)
const ADMIN_IDS = (process.env.ADMIN_IDS || '1394113078').split(',').map(Number).filter(n => !isNaN(n));
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'nineinchkn5atmythroat').split(',');

// Refresh token helpers
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

async function issueRefreshToken(db, userId) {
  const token = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000).toISOString();
  await db.run('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', userId, token, expiresAt);
  return token;
}

const router = Router();

router.post('/tg', asyncHandler(async (req, res) => {
    const { initData } = req.body;
    const botToken = process.env.BOT_TOKEN;
    const isProduction = process.env.NODE_ENV === 'production';
    const isRealInitData = initData && initData !== 'test';
    let tgUser;

    // Custom test user via JSON initData (for multi-trainer Playwright testing)
    if (initData && initData.startsWith('{') && !isProduction) {
      tgUser = parseTestUser(initData);
    } else if (!isRealInitData) {
      if (initData === 'test' && !isProduction) {
        // Dev mode: bypass Telegram auth
        tgUser = parseTestUser();
      } else if (isProduction) {
        return res.status(403).json({ error: 'Telegram authentication required in production' });
      } else {
        return res.status(403).json({ error: 'Telegram authentication required' });
      }
    } else if (!botToken) {
      if (isProduction) {
        return res.status(500).json({ error: 'BOT_TOKEN not configured' });
      }
      logger.warn('BOT_TOKEN is not set — Telegram init data verification is SKIPPED. Set BOT_TOKEN in production!');
      tgUser = parseTestUser(initData);
    } else {
      tgUser = verifyTelegramInitData(initData, botToken);
    }

    if (!tgUser) {
      return res.status(403).json({ error: 'Invalid Telegram init data' });
    }

    const db = getDB();
    const telegramId = String(tgUser.id);

    let user = await db.get('SELECT * FROM users WHERE telegram_id = ?', telegramId);

    if (!user) {
      // Use INSERT OR IGNORE to prevent race condition on concurrent registration
      const result = await db.run(
        'INSERT OR IGNORE INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)',
        telegramId, tgUser.username || '', tgUser.first_name || ''
      );
      if (result.lastID) {
        user = { id: result.lastID, telegram_id: telegramId, username: tgUser.username || '', registered: 0 };
      } else {
        // Another concurrent request already inserted — re-fetch
        user = await db.get('SELECT * FROM users WHERE telegram_id = ?', telegramId);
      }
    }
    if (user) {
      await db.run(
        'UPDATE users SET username = ?, first_name = ? WHERE id = ?',
        tgUser.username || '', tgUser.first_name || '', user.id
      );
    }

    const token = generateToken(user.id, telegramId);
    const refreshToken = await issueRefreshToken(db, user.id);

    res.json({
      token,
      refreshToken,
      user: {
        id: user.id, telegram_id: user.telegram_id, username: user.username,
        registered: user.registered || 0, nickname: user.nickname || '',
        avatar: user.avatar || '👤', starter_pokemon: user.starter_pokemon || ''
      }
    });
}));

// POST /api/auth/refresh — exchange a refresh token for a new access+refresh token pair
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

  const db = getDB();
  const row = await db.get(
    "SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > datetime('now')",
    refreshToken
  );
  if (!row) return res.status(401).json({ error: 'Invalid or expired refresh token' });

  // Delete used token (rotation)
  await db.run('DELETE FROM refresh_tokens WHERE id = ?', row.id);

  const user = await db.get('SELECT id, telegram_id FROM users WHERE id = ?', row.user_id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const token = generateToken(user.id, user.telegram_id);
  const newRefreshToken = await issueRefreshToken(db, user.id);

  res.json({ token, refreshToken: newRefreshToken });
}));

router.post('/register', authMiddleware, asyncHandler(async (req, res) => {
    const { nickname, avatar, starterPokemon } = req.body;
    const db = getDB();
    const user = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Partial update: only set provided fields, don't overwrite existing
    const sets = [];
    const params = [];
    if (nickname !== undefined) { sets.push('nickname = ?'); params.push(nickname); }
    if (avatar !== undefined) { sets.push('avatar = ?'); params.push(avatar); }
    if (starterPokemon !== undefined) { sets.push('starter_pokemon = ?'); params.push(starterPokemon); }
    // Always ensure registered=1 and registered_at on first registration
    if (!user.registered) {
      sets.push('registered = 1');
      sets.push("registered_at = datetime('now')");
    }
    if (sets.length > 0) {
      params.push(req.userId);
      await db.run(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, ...params);
    }

    const updated = await db.get('SELECT * FROM users WHERE id = ?', req.userId);
    res.json({ success: true, user: updated });
}));

router.get('/is-admin', authMiddleware, asyncHandler(async (req, res) => {
    const db = getDB();
    const user = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
    const isAdmin = user && (ADMIN_IDS.includes(Number(req.userId)) || ADMIN_USERNAMES.includes(user.username));
    res.json({ isAdmin: !!isAdmin });
}));

router.post('/avatar', authMiddleware, asyncHandler(async (req, res) => {
    const { image } = req.body;
    if (!image || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'No valid image provided' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buf = Buffer.from(base64Data, 'base64');

    if (buf.length > 500 * 1024) {
      return res.status(400).json({ error: 'Image too large (max 500KB)' });
    }

    fs.mkdirSync(AVATARS_DIR, { recursive: true });
    const filename = `user_${req.userId}.jpg`;
    fs.writeFileSync(path.join(AVATARS_DIR, filename), buf);

    const avatarUrl = `/avatars/${filename}?t=${Date.now()}`;
    const db = getDB();
    await db.run('UPDATE users SET avatar = ? WHERE id = ?', avatarUrl, req.userId);

    res.json({ success: true, avatarUrl });
}));

// POST /api/auth/logout — invalidate refresh token
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await getDB().run('DELETE FROM refresh_tokens WHERE token = ?', refreshToken);
  }
  res.json({ success: true });
}));

export default router;
