import { Router } from 'express';
import { runAll, summaryString } from '../lib/diagnostics.js';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { asyncHandler } from '../lib/errors.js';
import { config } from '../lib/config.js';

const router = Router();

// GET /api/diagnose — полная диагностика
// Доступ: admin токен или X-Diagnose-Key совпадающий с ADMIN_PASS
router.get('/', asyncHandler(async (req, res) => {
  // Простая авторизация: admin token или diagnose key
  const authHeader = req.headers.authorization;
  const diagnoseKey = req.headers['x-diagnose-key'];
  const isAdmin = authHeader?.startsWith('Bearer ')
    ? (() => { try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(authHeader.slice(7), process.env.JWT_SECRET);
        return decoded;
      } catch (_) { return null; }})()
    : null;
  const isAuthorized = isAdmin || (diagnoseKey && diagnoseKey === process.env.ADMIN_PASS);

  const baseUrl = req.protocol + '://' + req.get('host');
  const db = getDB();

  const result = await runAll({ db, baseUrl });

  res.json({
    success: result.summary.fail === 0,
    summary: result.summary,
    summaryText: summaryString(result),
    groups: result.groups,
    timestamp: new Date().toISOString(),
    authorized: !!isAuthorized,
  });
}));

export default router;
