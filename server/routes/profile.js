import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { getIO } from '../socket.js';

const router = Router();

// Update user's current location (auth required)
router.post('/location', authMiddleware, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Location update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainers at a location (public)
router.get('/trainers', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('Trainers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public profile for a trainer (public)
router.get('/profile/:userId', async (req, res) => {
  try {
    const db = getDB();
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

    const user = await db.get('SELECT id, username, first_name FROM users WHERE id = ?', userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', userId);
    const lb = await db.get('SELECT badges_count, money FROM leaderboard WHERE user_id = ?', userId);

    let profile = {
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      badges: lb?.badges_count || 0,
      money: lb?.money || 0,
      team: []
    };

    if (save && save.save_data) {
      try {
        const data = JSON.parse(save.save_data);
        profile.team = (data.myTeam || []).map(m => ({
          name: m.apiData?.name || 'Unknown',
          nickname: m.nickname || null,
          level: (m.baseLevel || 1) + (m.candiesEaten || 0),
          sprite: m.apiData?.sprites?.front_default || ''
        }));
        profile.badges = data.badges?.length || profile.badges;
        profile.money = data.money ?? profile.money;
      } catch (e) {
        // ignore parse errors
      }
    }

    res.json({ profile });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
