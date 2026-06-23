import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { getIO } from '../socket.js';
import { decompressSave } from '../lib/save-utils.js';
import { asyncHandler } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

// Rate limiter for public unauthenticated endpoints
const publicRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait.' }
});

const router = Router();

// Update user's current location (auth required)
router.post('/location', authMiddleware, asyncHandler(async (req, res) => {
    const { locationId } = req.body;
    if (!locationId || typeof locationId !== 'string') {
      return res.status(400).json({ error: 'locationId is required' });
    }
    const db = getDB();
    await db.run(
      `INSERT INTO user_locations (user_id, location_id, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         location_id = excluded.location_id,
         updated_at = datetime('now')`,
      req.userId,
      locationId
    );
    // Broadcast location change via socket for real-time trainer list updates
    const io = getIO();
    if (io) {
      const user = await db.get('SELECT username, first_name FROM users WHERE id = ?', req.userId);
      io.emit('location_update', {
        userId: req.userId,
        username: user?.username || '',
        firstName: user?.first_name || '',
        locationId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true });
}));

// Get trainers at a location (public)
router.get('/trainers', publicRateLimit, asyncHandler(async (req, res) => {
    const { locationId } = req.query;
    if (!locationId) return res.json({ trainers: [] });

    const db = getDB();
    const trainers = await db.all(
      `SELECT u.id, u.username, u.first_name, ul.location_id
       FROM user_locations ul
       JOIN users u ON u.id = ul.user_id
       WHERE ul.location_id = ?
         AND ul.updated_at > datetime('now', '-1 hour')
       LIMIT 20`,
      locationId
    );

    res.json({ trainers });
}));

// Public: list all trainers — MUST be before /:userId to avoid matching 'trainers' as a userId
router.get('/trainers/all', publicRateLimit, asyncHandler(async (req, res) => {
    const db = getDB();
    const users = await db.all('SELECT id, username, first_name, nickname, avatar, registered, created_at, registered_at FROM users ORDER BY id DESC');

    // Batch fetch saves and locations — fixes N+1 query issue
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
      const ph = userIds.map(() => '?').join(',');
      const saves = await db.all(`SELECT user_id, save_data, updated_at FROM game_saves WHERE user_id IN (${ph})`, ...userIds);
      const locations = await db.all(`SELECT user_id, location_id, updated_at FROM user_locations WHERE user_id IN (${ph})`, ...userIds);

      const saveMap = {};
      for (const s of saves) saveMap[s.user_id] = s;
      const locMap = {};
      for (const l of locations) locMap[l.user_id] = l;

      for (const u of users) {
        const save = saveMap[u.id];
        const loc = locMap[u.id];
        if (save) {
          const data = decompressSave(save.save_data);
          if (data) {
            u.badges = data.badges?.length || 0;
            u.teamSize = (data.myTeam || []).length;
            u.lastSave = save.updated_at;
          } else {
            u.badges = 0; u.teamSize = 0;
          }
        }
        u.lastLocation = loc?.location_id || null;
        u.lastSeen = loc?.updated_at || u.lastSave || u.created_at;
        u.region = u.lastLocation ? (u.lastLocation.includes('johto') ? 'Джото' : u.lastLocation.includes('selen') ? 'Селен' : 'Канто') : null;
      }
    }
    res.json({ users });
}));

// Get public profile for a trainer (public) — MUST be after /trainers routes
router.get('/:userId', publicRateLimit, asyncHandler(async (req, res) => {
    const db = getDB();
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const user = await db.get('SELECT id, username, first_name FROM users WHERE id = ?', userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', userId);
    const lb = await db.get('SELECT badges_count FROM leaderboard WHERE user_id = ?', userId);

    let profile = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      badges: lb?.badges_count || 0,
      team: []
    };

    if (save && save.save_data) {
      try {
        const data = decompressSave(save.save_data);
        if (!data) throw new Error('decompress failed');
        profile.team = (data.myTeam || []).map(m => ({
          name: m.apiData?.name || 'Unknown',
          nickname: m.nickname || null,
          level: (m.baseLevel || 1) + (m.candiesEaten || 0),
          sprite: m.apiData?.sprites?.front_default || ''
        }));
        profile.badges = data.badges?.length || profile.badges;
      } catch (e) {
        // ignore parse errors
      }
    }

    res.json({ profile });
}));

export default router;
