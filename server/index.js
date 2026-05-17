import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDB, getDB, closeDB } from './db.js';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';
import leaderboardRoutes from './routes/leaderboard.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';
import adminRoutes from './routes/admin.js';
import { initSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Railway/Heroku/etc.
app.set('trust proxy', 1);

// CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors(allowedOrigin ? { origin: allowedOrigin } : {}));
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} → ${res.statusCode}`);
  });
  next();
});

// Global rate limit: 100 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100,
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

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/avatars', express.static(path.join(__dirname, '../public/avatars')));

// SPA fallback — must be AFTER static but BEFORE error handler
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/admin')) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build not found. Run npm run build first.');
    }
  } else {
    next();
  }
});

// Global error handler — MUST be last middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// === Periodic WAL checkpoint (every 5 min) ===
let walInterval = null;

function startWALCheckpoint() {
  walInterval = setInterval(async () => {
    try {
      const db = getDB();
      await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
    } catch (e) {
      /* DB might be busy, skip */
    }
  }, 300_000);
}

// === Graceful shutdown ===
async function shutdown(signal) {
  console.log(`\n${signal} received, shutting down gracefully...`);

  if (walInterval) clearInterval(walInterval);

  // Force WAL checkpoint before closing
  try {
    const db = getDB();
    await db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  } catch (e) { /* ignore */ }

  await closeDB();
  console.log('Database closed.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Unhandled rejections → log but don't crash
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason instanceof Error ? reason.message : reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Don't exit — let the process try to recover
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
      console.log(`[backup] ${user.username} (ID:${user.id}): badges=${lb?.badges_count || 0} lvl_sum=${lb?.team_level_sum || 0} money=${lb?.money || 0} saved=${save?.updated_at || 'never'}`);
      if (save) {
        const dir = path.join(__dirname, '../data/backups');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${username}_${Date.now()}.json`), save.save_data);
      }
    }
  }

  const server = app.listen(PORT, () => {
    console.log(`PokeMatrix server running on port ${PORT}`);
  });

  initSocket(server, allowedOrigin);
  startWALCheckpoint();

  server.on('error', (err) => {
    console.error('Server error:', err.message);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
