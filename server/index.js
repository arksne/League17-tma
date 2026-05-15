import { initDB, getDB } from './db.js';
import authRoutes from './routes/auth.js';
import saveRoutes from './routes/save.js';
import leaderboardRoutes from './routes/leaderboard.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profile.js';

const express = (await import('express')).default;
const cors = (await import('cors')).default;
const rateLimit = (await import('express-rate-limit')).default;

const app = express();

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

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/save', saveRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the Vite build output directory
app.use(express.static(path.join(__dirname, '../dist')));

// SPA fallback for all other non-API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

const PORT = process.env.PORT || 3000;

import { initSocket } from './socket.js';

try {
  await initDB();
  const server = app.listen(PORT, () => {
    console.log(`League-17 TMA server running on port ${PORT}`);
  });
  initSocket(server, allowedOrigin);

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
    });
    const db = getDB();
    if (db) {
      await db.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
