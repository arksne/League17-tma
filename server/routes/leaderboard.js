import { Router } from 'express';
import { getDB } from '../db.js';
import { asyncHandler } from '../lib/errors.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const db = getDB();
  const entries = await db.all(
    `SELECT u.username, u.first_name,
            l.badges_count, l.team_level_sum,
            l.pokemon_count, l.legendary_count, l.updated_at
     FROM leaderboard l
     JOIN users u ON u.id = l.user_id
     ORDER BY l.badges_count DESC, l.team_level_sum DESC
     LIMIT 50`
  );

  res.json({ entries });
}));

export default router;
