import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
router.use(authMiddleware);

// Predefined quest configs (mirrors src/data/quests.ts for server-side validation)
const QUEST_CONFIGS = [
  { id: 'catch_5', type: 'catch_x', target: 5, desc: 'Поймайте 5 покемонов', rewardMoney: 500, rewardItem: 'pokeBall', rewardQty: 3 },
  { id: 'defeat_10', type: 'defeat_x', target: 10, desc: 'Победите 10 диких покемонов', rewardMoney: 800, rewardItem: 'potion', rewardQty: 2 },
  { id: 'earn_1000', type: 'earn_money', target: 1000, desc: 'Заработайте $1000', rewardMoney: 300, rewardItem: 'rareCandy', rewardQty: 2 },
  { id: 'explore_5', type: 'explore', target: 5, desc: 'Посетите 5 разных локаций', rewardMoney: 400, rewardItem: 'superPotion', rewardQty: 1 },
  { id: 'use_3', type: 'use_item', target: 3, desc: 'Используйте 3 предмета в бою', rewardMoney: 200, rewardItem: 'rareCandy', rewardQty: 1 },
  { id: 'collect_hair', type: 'collect_items', targetItem: 'venonatHair', target: 3, desc: 'Соберите 3 Волоска Веноната', rewardMoney: 300, rewardItem: 'rareCandy', rewardQty: 1 },
  { id: 'collect_bone', type: 'collect_items', targetItem: 'cuboneBone', target: 2, desc: 'Соберите 2 Кости Кьюбона', rewardMoney: 400, rewardItem: 'greatBall', rewardQty: 2 },
  { id: 'collect_coals', type: 'collect_items', targetItem: 'coals', target: 4, desc: 'Соберите 4 Уголька', rewardMoney: 350, rewardItem: 'potion', rewardQty: 3 },
  { id: 'catch_10', type: 'catch_x', target: 10, desc: 'Поймайте 10 покемонов', rewardMoney: 1200, rewardItem: 'greatBall', rewardQty: 5 },
  { id: 'catch_15', type: 'catch_x', target: 15, desc: 'Поймайте 15 покемонов', rewardMoney: 2000, rewardItem: 'ultraBall', rewardQty: 3 },
  { id: 'defeat_20', type: 'defeat_x', target: 20, desc: 'Победите 20 диких покемонов', rewardMoney: 1500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'defeat_5', type: 'defeat_x', target: 5, desc: 'Победите 5 диких покемонов', rewardMoney: 400, rewardItem: 'pokeBall', rewardQty: 3 },
  { id: 'earn_5000', type: 'earn_money', target: 5000, desc: 'Заработайте $5000', rewardMoney: 1000, rewardItem: 'hpUp', rewardQty: 2 },
  { id: 'earn_10000', type: 'earn_money', target: 10000, desc: 'Заработайте $10000', rewardMoney: 2000, rewardItem: 'everstone', rewardQty: 1 },
  { id: 'explore_10', type: 'explore', target: 10, desc: 'Посетите 10 разных локаций', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 1 },
  { id: 'use_8', type: 'use_item', target: 8, desc: 'Используйте 8 предметов в бою', rewardMoney: 500, rewardItem: 'superPotion', rewardQty: 3 },
  { id: 'collect_fire', type: 'collect_items', targetItem: 'lavaCore', target: 3, desc: 'Соберите 3 Лавовых Ядра', rewardMoney: 900, rewardItem: 'fireStone', rewardQty: 1 },
  { id: 'collect_water', type: 'collect_items', targetItem: 'crystalShard', target: 3, desc: 'Соберите 3 Кристалла', rewardMoney: 600, rewardItem: 'waterStone', rewardQty: 1 },
  { id: 'collect_plant', type: 'collect_items', targetItem: 'plantSample', target: 4, desc: 'Соберите 4 Образца Растений', rewardMoney: 700, rewardItem: 'leafStone', rewardQty: 1 },
  { id: 'collect_venom', type: 'collect_items', targetItem: 'seviperVenom', target: 2, desc: 'Соберите 2 Яда Севайпера', rewardMoney: 800, rewardItem: 'fullRestore', rewardQty: 2 },
];

// GET /api/quests - returns active quests for player with progress
router.get('/', asyncHandler(async (req, res) => {
    const db = getDB();
    const rows = await db.all('SELECT quest_id, progress, completed, claimed FROM player_quests WHERE user_id = ?', req.userId);

    // Merge quest configs with player progress
    const quests = QUEST_CONFIGS.map(config => {
      const playerQuest = rows.find(r => r.quest_id === config.id);
      return {
        ...config,
        progress: playerQuest?.progress || 0,
        completed: !!(playerQuest?.completed),
        claimed: !!(playerQuest?.claimed),
        active: !!playerQuest,
      };
    });

    res.json({ quests });
  }));

// POST /api/quests/progress - updates quest progress
router.post('/progress', asyncHandler(async (req, res) => {
    const { questId, amount } = req.body;
    if (!questId || typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ error: 'Invalid questId or amount' });
    }

    // Validate quest exists
    const config = QUEST_CONFIGS.find(q => q.id === questId);
    if (!config) {
      return res.status(400).json({ error: 'Quest not found' });
    }

    const db = getDB();

    // Get or create player quest
    let playerQuest = await db.get(
      'SELECT id, progress, completed, claimed FROM player_quests WHERE user_id = ? AND quest_id = ?',
      req.userId, questId
    );

    if (!playerQuest) {
      await db.run(
        'INSERT INTO player_quests (user_id, quest_id, progress, completed, claimed) VALUES (?, ?, 0, 0, 0)',
        req.userId, questId
      );
      playerQuest = { progress: 0, completed: false, claimed: false };
    }

    // Don't update if already completed
    if (playerQuest.completed) {
      return res.json({ questId, progress: playerQuest.progress, completed: true, claimed: !!playerQuest.claimed });
    }

    const newProgress = Math.min(playerQuest.progress + amount, config.target);
    const completed = newProgress >= config.target;

    await db.run(
      'UPDATE player_quests SET progress = ?, completed = ? WHERE user_id = ? AND quest_id = ?',
      newProgress, completed ? 1 : 0, req.userId, questId
    );

    res.json({
      questId,
      progress: newProgress,
      completed,
      claimed: false,
      target: config.target,
    });
  }));

// POST /api/quests/claim - claim reward
router.post('/claim', asyncHandler(async (req, res) => {
    const { questId } = req.body;
    if (!questId) {
      return res.status(400).json({ error: 'Missing questId' });
    }

    const config = QUEST_CONFIGS.find(q => q.id === questId);
    if (!config) {
      return res.status(400).json({ error: 'Quest not found' });
    }

    const db = getDB();

    const playerQuest = await db.get(
      'SELECT id, progress, completed, claimed FROM player_quests WHERE user_id = ? AND quest_id = ?',
      req.userId, questId
    );

    if (!playerQuest) {
      return res.status(400).json({ error: 'Quest not started' });
    }

    if (!playerQuest.completed) {
      return res.status(400).json({ error: 'Quest not completed yet' });
    }

    if (playerQuest.claimed) {
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    // Mark as claimed
    await db.run(
      'UPDATE player_quests SET claimed = 1 WHERE user_id = ? AND quest_id = ?',
      req.userId, questId
    );

    // Build the reward payload for the client to apply
    res.json({
      success: true,
      questId,
      reward: {
        money: config.rewardMoney || 0,
        item: config.rewardItem || null,
        qty: config.rewardQty || 1,
      },
    });
  }));

export default router;
