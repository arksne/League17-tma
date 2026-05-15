import { Router } from 'express';
import { verifyTelegramInitData } from '../auth.js';
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

    if (!isRealInitData) {
      return res.status(403).json({ error: 'Telegram authentication required' });
    }
    if (!botToken) {
      console.error('BOT_TOKEN is not set in environment variables!');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    tgUser = verifyTelegramInitData(initData, botToken);
    if (!tgUser) {
      return res.status(403).json({ error: 'Invalid Telegram init data' });
    }

    const db = getDB();
    const telegramId = String(tgUser.id);

    let user = await db.get('SELECT * FROM users WHERE telegram_id = ?', telegramId);

    if (!user) {
      const result = await db.run(
        'INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)',
        telegramId, tgUser.username || '', tgUser.first_name || ''
      );
      user = { id: result.lastID, telegram_id: telegramId, username: tgUser.username || '', registered: 0 };
    } else {
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

    await db.run(
      `UPDATE users SET nickname = ?, avatar = ?, starter_pokemon = ?, registered = 1, registered_at = datetime('now') WHERE id = ?`,
      nickname || user.first_name || '', avatar || '👤', starterPokemon || '', req.userId
    );

    res.json({ success: true, user: { ...user, nickname: nickname || user.first_name, avatar: avatar || '👤', registered: 1 } });
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
