import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';

const router = Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', req.userId);

    if (!save) {
      return res.json({ saveData: null });
    }

    res.json({
      saveData: JSON.parse(save.save_data),
      updatedAt: save.updated_at
    });
  } catch (err) {
    console.error('Load error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { saveData, badgesCount = 0, teamLevelSum = 0, money = 0, pokemonCount = 0, legendaryCount = 0 } = req.body;

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

    await db.run(
      `INSERT INTO game_saves (user_id, save_data, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         save_data = excluded.save_data,
         updated_at = datetime('now')`,
      req.userId,
      JSON.stringify(saveData)
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
      req.userId,
      badgesCount,
      teamLevelSum,
      money,
      pokemonCount,
      legendaryCount
    );

    const row = await db.get('SELECT updated_at FROM game_saves WHERE user_id = ?', req.userId);

    res.json({ success: true, updatedAt: row.updated_at });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
