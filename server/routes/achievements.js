import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { asyncHandler } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();
router.use(authMiddleware);

// Predefined achievements list
const ACHIEVEMENTS = [
  { id: 'first_catch', name: 'Первая поимка', desc: 'Поймайте своего первого покемона' },
  { id: 'team_6', name: 'Полная команда', desc: 'Соберите команду из 6 покемонов' },
  { id: 'beat_gym', name: 'Первая победа над лидером', desc: 'Победите первого лидера стадиона' },
  { id: 'beat_elite', name: 'Победа над Элитной Четверкой', desc: 'Одолейте Элитную Четверку' },
  { id: 'beat_champion', name: 'Победа над Чемпионом', desc: 'Станьте Чемпионом региона' },
  { id: 'money_100k', name: 'Заработано ¥100,000', desc: 'Накопите ¥100,000' },
  { id: 'dex_50', name: '50 видов в Покедексе', desc: 'Запишите 50 видов в Покедекс' },
  { id: 'dex_100', name: '100 видов в Покедексе', desc: 'Запишите 100 видов в Покедекс' },
  { id: 'dex_all', name: 'Полный Покедекс', desc: 'Завершите Покедекс' },
  { id: 'explorer', name: 'Исследователь', desc: 'Посетите 20 локаций' },
  { id: 'breeder', name: 'Заводчик', desc: 'Вылупите своего первого покемона из яйца' },
  { id: 'trainer_100', name: '100 побед в битвах', desc: 'Одержите 100 побед в битвах' },
  { id: 'pvp_win', name: 'Первая победа в PvP', desc: 'Одержите победу в PvP-битве' },
  { id: 'shiny_catch', name: 'Охотник за блеском', desc: 'Поймайте шайни покемона' },
];

// GET /api/achievements - returns all achievements with player's unlocked status
router.get('/', asyncHandler(async (req, res) => {
    const db = getDB();
    const rows = await db.all('SELECT achievement_id, unlocked_at FROM achievements WHERE user_id = ?', req.userId);

    const achievements = ACHIEVEMENTS.map(a => {
      const unlocked = rows.find(r => r.achievement_id === a.id);
      return {
        ...a,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlocked_at || null,
      };
    });

    res.json({ achievements });
}));

// POST /api/achievements/unlock - unlock an achievement
router.post('/unlock', asyncHandler(async (req, res) => {
    const { achievementId } = req.body;
    if (!achievementId) {
      return res.status(400).json({ error: 'Missing achievementId' });
    }

    // Validate achievement exists
    const config = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!config) {
      return res.status(400).json({ error: 'Achievement not found' });
    }

    const db = getDB();

    // Check if already unlocked
    const existing = await db.get(
      'SELECT id FROM achievements WHERE user_id = ? AND achievement_id = ?',
      req.userId, achievementId
    );

    if (existing) {
      return res.json({ success: true, alreadyUnlocked: true, achievement: config });
    }

    // Unlock it
    await db.run(
      'INSERT INTO achievements (user_id, achievement_id) VALUES (?, ?)',
      req.userId, achievementId
    );

    // Log the action
    await db.run(
      'INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)',
      req.userId, 'achievement_unlock', achievementId
    );

    res.json({
      success: true,
      alreadyUnlocked: false,
      achievement: {
        ...config,
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      },
    });
}));

export default router;
