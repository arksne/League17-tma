import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const entries = await db.all(
      `SELECT u.username, u.first_name,
              l.badges_count, l.team_level_sum, l.money,
              l.pokemon_count, l.legendary_count, l.updated_at
       FROM leaderboard l
       JOIN users u ON u.id = l.user_id
       ORDER BY l.badges_count DESC, l.team_level_sum DESC, l.money DESC
       LIMIT 50`
    );

    res.json({ entries });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
