import { Router } from 'express';
import { verifyTelegramInitData, parseTestUser } from '../auth.js';
import { getDB } from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AVATARS_DIR = path.join(__dirname, '../../public/avatars');

const router = Router();

router.post('/tg', async (req, res) => {
  try {
    const { initData } = req.body;
    const botToken = process.env.BOT_TOKEN;
    const isRealInitData = initData && initData !== 'test';
    let tgUser;

    // Custom test user via JSON initData (for multi-trainer Playwright testing)
    if (initData && initData.startsWith('{')) {
      tgUser = parseTestUser(initData);
    } else if (!isRealInitData) {
      // Browser/dev access — use test user, no BOT_TOKEN needed
      if (initData === 'test') {
        tgUser = parseTestUser();
      } else {
        return res.status(403).json({ error: 'Telegram authentication required' });
      }
    } else if (!botToken) {
      console.warn('BOT_TOKEN is not set — Telegram init data verification is SKIPPED. Set BOT_TOKEN in production!');
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

    res.json({
      token,
      user: {
        id: user.id, telegram_id: user.telegram_id, username: user.username,
        registered: user.registered || 0, nickname: user.nickname || '',
        avatar: user.avatar || '👤', starter_pokemon: user.starter_pokemon || ''
      }
    });
  } catch (err) {
    console.error('Auth error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', authMiddleware, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/avatar', authMiddleware, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
