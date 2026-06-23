import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { acquireSaveLock } from './save.js';
import zlib from 'zlib';
import { asyncHandler, AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function decompressSave(raw) {
  if (raw && raw.startsWith('Z:')) {
    return JSON.parse(zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString());
  }
  return JSON.parse(raw);
}

const DATA_DIR = path.join(__dirname, '../../data');
let ITEMS = [];
let CRAFTING_RECIPES = [];
try {
  ITEMS = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'items.json'), 'utf8'));
  CRAFTING_RECIPES = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'crafting_recipes.json'), 'utf8'));
  logger.info(`Loaded ${ITEMS.length} items and ${CRAFTING_RECIPES.length} crafting recipes from JSON`);
} catch (e) {
  logger.error('Failed to load game data from JSON:', e);
}

// Read full inventory from normalized table
async function getInventory(db, userId) {
  const rows = await db.all('SELECT item_id, quantity FROM player_inventory WHERE user_id = ?', userId);
  const inv = {};
  for (const row of rows) inv[row.item_id] = row.quantity;
  return inv;
}

const router = Router();
router.use(authMiddleware);

router.post('/buy', asyncHandler(async (req, res) => {
  const { itemId, qty = 1 } = req.body;
  if (!itemId || qty <= 0 || !Number.isInteger(qty)) return res.status(400).json({ error: 'invalid_request' });

  const item = ITEMS.find(i => i.id === itemId);
  if (!item || !item.price) return res.status(400).json({ error: 'item_not_buyable' });

  const totalCost = item.price * qty;
  const db = getDB();
  const unlock = await acquireSaveLock(req.userId);
  try {
    const row = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    if (!row) { return res.status(400).json({ error: 'no_save' }); }

    let data = decompressSave(row.save_data);
    if (typeof data.money !== 'number') data.money = 500;
    if (data.money < totalCost) { return res.status(400).json({ error: 'not_enough_money' }); }

    data.money -= totalCost;

    // Server-authoritative inventory: write to normalized table
    await db.run(
      'INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?',
      req.userId, itemId, qty, qty
    );
    // Update money in blob
    await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime("now") WHERE user_id = ?', JSON.stringify(data), req.userId);
    await db.run('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)', req.userId, 'buy_item', JSON.stringify({ itemId, qty, cost: totalCost }));

    const inventory = await getInventory(db, req.userId);
    res.json({ success: true, money: data.money, inventory });
  } finally {
    unlock();
  }
}));

router.post('/sell', asyncHandler(async (req, res) => {
  const { itemId, qty = 1 } = req.body;
  if (!itemId || qty <= 0 || !Number.isInteger(qty)) return res.status(400).json({ error: 'invalid_request' });

  const item = ITEMS.find(i => i.id === itemId);
  if (!item) return res.status(400).json({ error: 'invalid_item' });
  const sellPrice = item.sellPrice || 0;

  const db = getDB();
  const unlock = await acquireSaveLock(req.userId);
  try {
    // Check inventory from normalized table
    const invRow = await db.get('SELECT quantity FROM player_inventory WHERE user_id = ? AND item_id = ?', req.userId, itemId);
    const currentQty = invRow?.quantity || 0;
    if (currentQty < qty) { return res.status(400).json({ error: 'not_enough_items' }); }

    const saveRow = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    if (!saveRow) { return res.status(400).json({ error: 'no_save' }); }

    let data = decompressSave(saveRow.save_data);
    if (typeof data.money !== 'number') data.money = 500;
    data.money += sellPrice * qty;

    // Deduct from normalized table
    await db.run('UPDATE player_inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?', qty, req.userId, itemId);
    // Update money in blob
    await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime("now") WHERE user_id = ?', JSON.stringify(data), req.userId);
    await db.run('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)', req.userId, 'sell_item', JSON.stringify({ itemId, qty, gained: sellPrice * qty }));

    const inventory = await getInventory(db, req.userId);
    res.json({ success: true, money: data.money, inventory });
  } finally {
    unlock();
  }
}));

router.post('/craft', asyncHandler(async (req, res) => {
  const { recipeId } = req.body;
  const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return res.status(400).json({ error: 'invalid_recipe' });

  const db = getDB();
  const unlock = await acquireSaveLock(req.userId);
  try {
    const saveRow = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    if (!saveRow) { return res.status(400).json({ error: 'no_save' }); }

    // Check ingredients from normalized table
    for (const [id, qty] of Object.entries(recipe.ingredients)) {
      const invRow = await db.get('SELECT quantity FROM player_inventory WHERE user_id = ? AND item_id = ?', req.userId, id);
      if ((invRow?.quantity || 0) < qty) {
        return res.status(400).json({ error: 'missing_ingredients' });
      }
    }

    // Deduct ingredients from normalized table
    for (const [id, qty] of Object.entries(recipe.ingredients)) {
      await db.run('UPDATE player_inventory SET quantity = quantity - ? WHERE user_id = ? AND item_id = ?', qty, req.userId, id);
    }
    // Add result to normalized table
    await db.run(
      'INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?',
      req.userId, recipe.result, recipe.qty, recipe.qty
    );

    await db.run('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)', req.userId, 'craft', JSON.stringify({ recipeId }));

    const inventory = await getInventory(db, req.userId);
    res.json({ success: true, inventory });
  } finally {
    unlock();
  }
}));

router.post('/reward', asyncHandler(async (req, res) => {
  const { money = 0, items = [] } = req.body;
  if (typeof money !== 'number' || money < 0 || money > 1000000) return res.status(400).json({ error: 'invalid_money' });
  if (!Array.isArray(items)) return res.status(400).json({ error: 'invalid_items' });

  const db = getDB();
  const unlock = await acquireSaveLock(req.userId);
  try {
    const saveRow = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', req.userId);
    if (!saveRow) { return res.status(400).json({ error: 'no_save' }); }

    let data = decompressSave(saveRow.save_data);
    if (typeof data.money !== 'number') data.money = 500;
    data.money += money;

    // Add items to normalized table
    for (const item of items) {
      if (item && item.id && typeof item.qty === 'number' && item.qty > 0 && ITEMS.some(i => i.id === item.id)) {
        await db.run(
          'INSERT INTO player_inventory (user_id, item_id, quantity) VALUES (?, ?, ?) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + ?',
          req.userId, item.id, item.qty, item.qty
        );
      }
    }

    await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime("now") WHERE user_id = ?', JSON.stringify(data), req.userId);
    if (money > 0 || items.length > 0) {
      await db.run('INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)', req.userId, 'battle_reward', JSON.stringify({ money, items }));
    }

    const inventory = await getInventory(db, req.userId);
    res.json({ success: true, money: data.money, inventory });
  } finally {
    unlock();
  }
}));

export default router;
