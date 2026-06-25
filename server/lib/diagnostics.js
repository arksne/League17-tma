/**
 * diagnostics.js — Full system diagnostic module for PokeMatrix
 *
 * Проверяет каждый слой проекта:
 *  - Файловая система
 *  - Статика (что отдаётся не HTML вместо JS)
 *  - База данных (таблицы, индексы, WAL)
 *  - Auth (BOT_TOKEN, JWT, dev bypass)
 *  - API (health, drops, profile)
 *  - Сквозной тест (auth → register → save → load)
 *
 * Используется:
 *   import { runAll } from '../lib/diagnostics.js';
 *   const results = await runAll();
 *
 * Каждый чек возвращает { name, status: 'pass'|'fail'|'warn', detail?: string }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const DIST = path.join(ROOT, 'dist');
const DATA = path.join(ROOT, 'data');

// ── Helpers ──

const status = (name, s, detail) => ({ name, status: s, ...(detail ? { detail } : {}) });
const pass = (name, detail) => status(name, 'pass', detail);
const fail = (name, detail) => status(name, 'fail', detail);
const warn = (name, detail) => status(name, 'warn', detail);

// ── Checks ──

async function checkDist() {
  const checks = [];
  // index.html
  if (fs.existsSync(path.join(DIST, 'index.html'))) {
    const size = fs.statSync(path.join(DIST, 'index.html')).size;
    checks.push(pass('dist/index.html exists', `${(size / 1024).toFixed(1)} KB`));
  } else {
    checks.push(fail('dist/index.html', 'NOT FOUND — фронтенд не собран (npm run build)'));
  }
  // assets JS
  const assetsDir = path.join(DIST, 'assets');
  if (fs.existsSync(assetsDir)) {
    const jsFiles = fs.readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    if (jsFiles.length > 0) {
      checks.push(pass('dist/assets/*.js', `${jsFiles.length} файлов: ${jsFiles.join(', ')}`));
      for (const f of jsFiles) {
        const size = fs.statSync(path.join(assetsDir, f)).size;
        if (size < 100) checks.push(warn(`${f}`, `только ${size} bytes — выглядит подозрительно`));
      }
    } else {
      checks.push(fail('dist/assets/*.js', 'Нет JS файлов — Vite build не сработал?'));
    }
  } else {
    checks.push(fail('dist/assets/', 'Директория assets не найдена'));
  }
  // favicon
  if (fs.existsSync(path.join(DIST, 'favicon.svg'))) {
    checks.push(pass('dist/favicon.svg', `${fs.statSync(path.join(DIST, 'favicon.svg')).size} bytes`));
  } else {
    checks.push(fail('dist/favicon.svg', 'NOT FOUND'));
  }
  return checks;
}

async function checkDataDir() {
  const results = [];
  if (fs.existsSync(DATA)) {
    const items = fs.readdirSync(DATA).filter(f => !f.startsWith('.'));
    results.push(pass('data/ directory', `${items.length} файлов`));
  } else {
    results.push(fail('data/ directory', 'NOT FOUND'));
  }
  return results;
}

async function checkEnv() {
  const checks = [];
  const required = ['BOT_TOKEN', 'JWT_SECRET'];
  const optional = ['ALLOW_DEV_LOGIN', 'ADMIN_PASS', 'ADMIN_IDS', 'NODE_ENV'];
  for (const key of required) {
    if (process.env[key]) {
      const val = process.env[key];
      const masked = key === 'BOT_TOKEN'
        ? val.slice(0, 10) + '…' + val.slice(-6)
        : val.slice(0, 8) + '…' + val.slice(-4);
      checks.push(pass(`env: ${key}`, `установлен (${masked})`));
    } else {
      checks.push(fail(`env: ${key}`, `НЕ УСТАНОВЛЕН`));
    }
  }
  for (const key of optional) {
    if (process.env[key]) {
      checks.push(pass(`env: ${key}`, process.env[key]));
    }
  }
  checks.push(pass('env: NODE_ENV', process.env.NODE_ENV || 'не задан (default: development)'));
  return checks;
}

async function checkDatabase(db) {
  if (!db) return [fail('database', 'Нет доступа к БД (db === null)')];
  const checks = [];
  try {
    await db.get('SELECT 1');
    checks.push(pass('db: ping', 'SELECT 1 OK'));
  } catch (e) {
    checks.push(fail('db: ping', e.message));
    return checks; // дальше нет смысла
  }
  // Все таблицы
  const expectedTables = [
    'users', 'game_saves', 'leaderboard', 'user_locations', 'action_log',
    'chat_messages', 'pokeapi_cache', 'pvp_ratings', 'player_quests',
    'refresh_tokens', 'achievements', 'save_backups', 'player_inventory', 'player_badges'
  ];
  try {
    const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableNames = tables.map(r => r.name);
    for (const t of expectedTables) {
      if (tableNames.includes(t)) {
        // Check row count
        try {
          const cnt = await db.get(`SELECT COUNT(*) as c FROM "${t}"`);
          checks.push(pass(`db: table ${t}`, `${cnt?.c || 0} rows`));
        } catch (_) {
          checks.push(pass(`db: table ${t}`, 'exists (count error — пустая?)'));
        }
      } else {
        checks.push(warn(`db: table ${t}`, 'NOT FOUND — может быть создана при первом использовании'));
      }
    }
  } catch (e) {
    checks.push(fail('db: tables', e.message));
  }
  // WAL mode
  try {
    const wal = await db.get('PRAGMA journal_mode');
    if (wal && wal.journal_mode === 'wal') {
      checks.push(pass('db: WAL mode', 'ON'));
    } else {
      checks.push(warn('db: WAL mode', `OFF (${wal?.journal_mode || 'unknown'})`));
    }
  } catch (e) {
    checks.push(warn('db: WAL mode', e.message));
  }
  return checks;
}

async function checkAuth() {
  const checks = [];
  const botToken = process.env.BOT_TOKEN;

  if (botToken) {
    // Проверяем через Telegram API
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.result) {
          checks.push(pass('auth: BOT_TOKEN', `@${data.result.username} (id:${data.result.id})`));
          if (!data.result.has_main_web_app) {
            checks.push(warn('auth: has_main_web_app', 'false — Mini App не настроен в BotFather'));
          }
        } else {
          checks.push(fail('auth: BOT_TOKEN', 'Telegram API вернул ошибку'));
        }
      } else {
        checks.push(fail('auth: BOT_TOKEN', `HTTP ${res.status} от Telegram API`));
      }
    } catch (e) {
      checks.push(fail('auth: BOT_TOKEN', `Не могу подключиться к Telegram API: ${e.message}`));
    }
  }

  if (process.env.JWT_SECRET) {
    const len = process.env.JWT_SECRET.length;
    if (len >= 32) {
      checks.push(pass('auth: JWT_SECRET', `${len} символов`));
    } else {
      checks.push(warn('auth: JWT_SECRET', `только ${len} символов — минимум 32 для HS256`));
    }
  }

  if (process.env.ALLOW_DEV_LOGIN === 'true') {
    checks.push(pass('auth: ALLOW_DEV_LOGIN', 'true — dev bypass включён'));
  } else {
    checks.push(pass('auth: ALLOW_DEV_LOGIN', 'не установлен (dev bypass только в dev mode)'));
  }

  return checks;
}

async function checkApi(baseUrl) {
  const checks = [];
  const testUrl = baseUrl || `http://localhost:${process.env.PORT || 3000}`;

  // Health
  try {
    const res = await fetch(`${testUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      checks.push(pass('api: /api/health', `status=${data.status} db=${data.db}`));
    } else {
      checks.push(fail('api: /api/health', `HTTP ${res.status}`));
    }
  } catch (e) {
    checks.push(warn('api: /api/health', e.message));
  }

  // Static serving — проверяем что favicon отдаётся как image, не как HTML
  try {
    const res = await fetch(`${testUrl}/favicon.svg`, { signal: AbortSignal.timeout(5000) });
    const ct = res.headers.get('content-type') || '';
    if (ct.startsWith('image/')) {
      checks.push(pass('api: static /favicon.svg', `content-type: ${ct}`));
    } else if (ct.startsWith('text/html')) {
      checks.push(fail('api: static /favicon.svg', `SPA FALLBACK — отдаётся как HTML (${ct}). Статика не работает!`));
    } else {
      checks.push(warn('api: static /favicon.svg', `странный content-type: ${ct}`));
    }
  } catch (e) {
    checks.push(warn('api: static /favicon.svg', e.message));
  }

  // Drops
  try {
    const res = await fetch(`${testUrl}/api/drops`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      checks.push(pass('api: /api/drops', `HTTP ${res.status}`));
    } else {
      checks.push(fail('api: /api/drops', `HTTP ${res.status}`));
    }
  } catch (e) {
    checks.push(warn('api: /api/drops', e.message));
  }

  return checks;
}

async function checkE2e(baseUrl, db) {
  const checks = [];
  const testUrl = baseUrl || `http://localhost:${process.env.PORT || 3000}`;
  const isProduction = process.env.NODE_ENV === 'production';
  const devAllowed = process.env.ALLOW_DEV_LOGIN === 'true';

  // Пропускаем сквозной тест если production и нет dev bypass
  if (isProduction && !devAllowed) {
    checks.push(warn('e2e: auth', 'Пропущен — production без ALLOW_DEV_LOGIN'));
    return checks;
  }

  // 1. Test login
  let token, refreshToken, userId, telegramId;
  try {
    const res = await fetch(`${testUrl}/api/auth/tg`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData: 'test' }),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      const data = await res.json();
      token = data.token;
      refreshToken = data.refreshToken;
      userId = data.user?.id;
      telegramId = data.user?.telegram_id;
      checks.push(pass('e2e: auth/tg login', `userId=${userId} token=${token?.slice(0, 20)}…`));
    } else {
      const err = await res.json().catch(() => ({}));
      checks.push(fail('e2e: auth/tg login', `HTTP ${res.status}: ${err.error || 'unknown'}`));
      return checks; // без токена дальше не пойдём
    }
  } catch (e) {
    checks.push(fail('e2e: auth/tg login', e.message));
    return checks;
  }

  // 2. Token format check
  if (token) {
    const parts = token.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
        const expDate = new Date(payload.exp * 1000);
        checks.push(pass('e2e: JWT format', `userId=${payload.userId} exp=${expDate.toISOString()}`));
      } catch (e) {
        checks.push(warn('e2e: JWT format', `Не удалось декодировать: ${e.message}`));
      }
    } else {
      checks.push(fail('e2e: JWT format', `Невалидный токен (${parts.length} частей)`));
    }
  }

  // 3. Refresh token
  if (refreshToken && token) {
    try {
      const res = await fetch(`${testUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) {
        const data = await res.json();
        checks.push(pass('e2e: token refresh', `новый токен получен`));
        token = data.token; // обновляем
      } else {
        checks.push(fail('e2e: token refresh', `HTTP ${res.status}`));
      }
    } catch (e) {
      checks.push(warn('e2e: token refresh', e.message));
    }
  }

  // 4. is-admin
  try {
    const res = await fetch(`${testUrl}/api/auth/is-admin`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      checks.push(pass('e2e: is-admin', `isAdmin=${data.isAdmin}`));
    } else {
      checks.push(warn('e2e: is-admin', `HTTP ${res.status}`));
    }
  } catch (e) {
    checks.push(warn('e2e: is-admin', e.message));
  }

  // 5. Save
  try {
    const saveData = {
      _v: Date.now(),
      currentLocationId: 'goldenrod',
      currentRegion: 'johto',
      inventory: { credit: 500, pokeBall: 5 },
      money: 500,
      badges: [],
      myTeam: []
    };
    const res = await fetch(`${testUrl}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        saveData,
        badgesCount: 0, teamLevelSum: 0, money: 500,
        pokemonCount: 0, legendaryCount: 0, saveVersion: 1
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) {
      checks.push(pass('e2e: save', 'save сохранён'));
    } else {
      const err = await res.json().catch(() => ({}));
      checks.push(fail('e2e: save', `HTTP ${res.status}: ${err.error || err.details?.join(',') || 'unknown'}`));
    }
  } catch (e) {
    checks.push(fail('e2e: save', e.message));
  }

  // 6. Load
  try {
    const res = await fetch(`${testUrl}/api/save`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.saveData && data.saveData.inventory) {
        checks.push(pass('e2e: load', `loaded: money=${data.saveData.money} badges=${data.saveData.badges?.length || 0}`));
      } else {
        checks.push(warn('e2e: load', 'saveData пустой'));
      }
    } else {
      checks.push(fail('e2e: load', `HTTP ${res.status}`));
    }
  } catch (e) {
    checks.push(fail('e2e: load', e.message));
  }

  return checks;
}

// ── Run all ──

export async function runAll({ db, baseUrl } = {}) {
  const startTime = Date.now();
  const allChecks = [];

  const runners = [
    { name: '📁 Файловая система', fn: () => checkDist() },
    { name: '📁 data/ директория', fn: () => checkDataDir() },
    { name: '🔧 Переменные окружения', fn: () => checkEnv() },
    { name: '🗄️ База данных', fn: () => checkDatabase(db) },
    { name: '🔐 Авторизация', fn: () => checkAuth() },
    { name: '🌐 API / Статика', fn: () => checkApi(baseUrl) },
    { name: '🧪 Сквозной тест', fn: () => checkE2e(baseUrl, db) },
  ];

  for (const group of runners) {
    try {
      allChecks.push({ group: group.name, checks: await group.fn() });
    } catch (e) {
      allChecks.push({ group: group.name, checks: [fail('unexpected error', e.message)] });
    }
  }

  const elapsed = Date.now() - startTime;
  const flat = allChecks.flatMap(g => g.checks);
  const summary = {
    total: flat.length,
    pass: flat.filter(c => c.status === 'pass').length,
    fail: flat.filter(c => c.status === 'fail').length,
    warn: flat.filter(c => c.status === 'warn').length,
    elapsed,
  };

  return { groups: allChecks, summary };
}

// ── Summary string ──

export function summaryString(result) {
  const s = result.summary;
  const icon = s.fail > 0 ? '❌' : s.warn > 0 ? '⚠️' : '✅';
  return `${icon} ${s.pass} pass, ${s.fail} fail, ${s.warn} warn (${s.elapsed}ms)`;
}
