// Load env vars FIRST — before any other imports that might read them
import './load-env.js';

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDB, getDB, closeDB } from './db.js';
import { MONSTER_DROP_TABLE } from '../src/data/drops.js';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';
import leaderboardRoutes from './routes/leaderboard.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import battleRoutes from './routes/battle.js';
import questsRoutes from './routes/quests.js';
import achievementsRoutes from './routes/achievements.js';
import economyRoutes from './routes/economy.js';
import { initSocket } from './socket.js';
import { config } from './lib/config.js';
import { logger, requestLogger } from './lib/logger.js';
import { errorHandler } from './lib/errors.js';
import diagnoseRoutes from './routes/diagnose.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.PORT;

// Trust proxy for Railway/Heroku/etc.
app.set('trust proxy', 1);

// CORS
const allowedOrigin = config.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json({ limit: '10mb' }));

// Structured request logging via Pino
app.use(requestLogger);

// Serve static files FIRST — before rate limiter to avoid 429 on assets
// Assets get 1d cache, but index.html gets no-cache (forces Telegram WebView to refresh)
app.use(express.static(path.join(__dirname, '../dist'), { maxAge: '1d', immutable: true, index: false }));

// Global rate limit: 500 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Routes
app.use('/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/save', rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }), saveRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/battle', battleRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/economy', economyRoutes);
app.use('/api/diagnose', diagnoseRoutes);

// Client-side error log endpoint (forwarded to Pino)
app.post('/api/log-client-error', (req, res) => {
  const { msg, src, line, col, stack, url } = req.body || {};
  logger.warn({ msg, src, line, col, url, stack: stack?.slice(0, 500) }, 'Client error');
  res.json({ ok: true });
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const db = getDB();
    await db.get('SELECT 1');
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'disconnected', error: e.message });
  }
});

// PokeAPI proxy with SQLite cache
// Express 5 (path-to-regexp v8) does not support `{*path}` syntax.
// Use app.use with mount path so req.path is relative to mount point.
app.use('/api/pokeapi', async (req, res, next) => {
  if (req.method !== 'GET') return next();
  try {
    const apiPath = req.path.replace(/^\//, '');
    if (!apiPath) return res.status(400).json({ error: 'Missing path' });

    const db = getDB();
    const cacheKey = '/api/v2/' + apiPath;

    // Check cache (no staleness — PokeAPI data is static)
    const cached = await db.get('SELECT data FROM pokeapi_cache WHERE url = ?', cacheKey);
    if (cached) return res.json(JSON.parse(cached.data));

    // Fetch from PokeAPI
    const url = `https://pokeapi.co${cacheKey}`;
    const pokeRes = await fetch(url);

    if (!pokeRes.ok) {
      const body = await pokeRes.text().catch(() => '');
      return res.status(pokeRes.status).json({ error: `PokeAPI ${pokeRes.status}`, detail: body.substring(0, 200) });
    }

    const data = await pokeRes.json();

    // Store in cache
    await db.run(
      `INSERT INTO pokeapi_cache (url, data, cached_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(url) DO UPDATE SET data = excluded.data, cached_at = datetime('now')`,
      cacheKey, JSON.stringify(data)
    );

    res.json(data);
  } catch (e) {
    logger.error({ err: e }, 'PokeAPI proxy error');
    res.status(502).json({ error: 'PokeAPI proxy failed' });
  }
});

// Drop config endpoint (public, for clients)
app.get('/api/drops', (req, res) => {
  const dropsPath = path.join(__dirname, '../data/drop_config.json');
  if (fs.existsSync(dropsPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(dropsPath, 'utf8'));
      return res.json(config);
    } catch (e) {
      // fall through to default
    }
  }
  // Fallback: serve from MONSTER_DROP_TABLE (client uses its own UNIVERSAL_DROPS)
  res.json({ monsterDrops: MONSTER_DROP_TABLE });
});

// Avatars
app.use('/avatars', express.static(path.join(__dirname, '../public/avatars'), { maxAge: '1d' }));

// SPA fallback — must be AFTER static but BEFORE error handler
// Forces no-cache on index.html so Telegram WebView always fetches fresh frontend
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/admin')) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build not found. Run npm run build first.');
    }
  } else {
    next();
  }
});

// Global error handler — MUST be last middleware
app.use(errorHandler);

// === Periodic WAL checkpoint (every 5 min) ===
let walInterval = null;

function startWALCheckpoint() {
  walInterval = setInterval(async () => {
    try {
      const db = getDB();
      await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {
      logger.debug({ err: e }, 'WAL checkpoint skipped (busy)');
    }
  }, 300_000);
}

// === Graceful shutdown ===
async function shutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  if (walInterval) clearInterval(walInterval);

  // Force WAL checkpoint before closing
  try {
    const db = getDB();
    await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch (e) { /* ignore */ }

  await closeDB();
  logger.info('Database closed.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejections → log but don't crash
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  shutdown('UNCAUGHT');
});

// === Startup ===
try {
  await initDB();
  const db = getDB();

  // Backup key trainers on startup
  const trainers = ['kisunplay', 'DjafarAdjarov'];
  for (const username of trainers) {
    const user = await db.get('SELECT id, username, first_name FROM users WHERE username = ?', username);
    if (user) {
      const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', user.id);
      const lb = await db.get('SELECT badges_count, team_level_sum, money FROM leaderboard WHERE user_id = ?', user.id);
      logger.info(`[backup] ${user.username} (ID:${user.id}): badges=${lb?.badges_count || 0} lvl_sum=${lb?.team_level_sum || 0} money=${lb?.money || 0} saved=${save?.updated_at || 'never'}`);
      if (save) {
        const dir = path.join(__dirname, '../data/backups');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${username}_${Date.now()}.json`), save.save_data);
      }
    }
  }

  const server = app.listen(PORT, () => {
    logger.info(`PokeMatrix server running on port ${PORT}`);
  });

  initSocket(server, allowedOrigin);
  startWALCheckpoint();

  // Startup diagnostics
  try {
    const { runAll, summaryString } = await import('./lib/diagnostics.js');
    const result = await runAll({ db, baseUrl: `http://localhost:${PORT}` });
    logger.info(`[startup-check] ${summaryString(result)}`);
    for (const g of result.groups) {
      for (const c of g.checks) {
        if (c.status === 'fail') logger.warn(`[startup-check] ❌ ${c.name}: ${c.detail}`);
        else if (c.status === 'warn') logger.warn(`[startup-check] ⚠️ ${c.name}: ${c.detail}`);
      }
    }
  } catch (e) {
    logger.warn({ err: e }, '[startup-check] Диагностика не выполнена');
  }

  // Launch bot debugger
  try {
    const { startBotDebugger } = await import('./bot-debugger.js');
    startBotDebugger();
  } catch (e) {
    logger.warn({ err: e }, 'Bot debugger не запущен');
  }

  server.on('error', (err) => {
    logger.error({ err }, 'Server error');
  });
} catch (err) {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
}
