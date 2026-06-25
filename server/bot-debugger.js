/**
 * bot-debugger.js — Telegram бот-дебагер для диагностики сервера
 *
 * Слушает команды в Telegram и отвечает результатами диагностики.
 * Запускается в фоне, доступ только для ADMIN_IDS и ADMIN_USERNAMES.
 *
 * Команды:
 *   /health   — краткий статус сервера
 *   /diagnose — полная диагностика всех систем
 *   /check    — сквозной тест (auth → save → load)
 *   /logs     — последние N записей из action_log
 *   /status   — дашборд (users, saves, online)
 *
 * Использование в start.mjs:
 *   import { startBotDebugger } from './bot-debugger.js';
 *   startBotDebugger();
 */

import { logger } from './lib/logger.js';
import { runAll, summaryString } from './lib/diagnostics.js';
import { getDB } from './db.js';

// ── Admin access (same as auth.js) ──
const ADMIN_IDS = (process.env.ADMIN_IDS || '1394113078').split(',').map(Number).filter(n => !isNaN(n));
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'nineinchkn5atmythroat').split(',');

function isAuthorized(from) {
  if (!from) return false;
  return ADMIN_IDS.includes(from.id) || ADMIN_USERNAMES.includes(from.username);
}

// ── Telegram API helpers ──
const API_BASE = `https://api.telegram.org/bot${process.env.BOT_TOKEN}`;

async function tgApi(method, payload = {}) {
  if (!process.env.BOT_TOKEN) return null;
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data;
  } catch (e) {
    logger.error({ err: e }, 'Bot debugger: Telegram API error');
    return { ok: false, error: e.message };
  }
}

async function sendMessage(chatId, text, parseMode = 'Markdown') {
  // Telegram has a 4096 char limit per message — split if needed
  const maxLen = 4000;
  if (text.length > maxLen) {
    // Try to split by sections
    let remaining = text;
    while (remaining.length > 0) {
      const chunk = remaining.slice(0, maxLen);
      const lastNewline = chunk.lastIndexOf('\n');
      const splitAt = lastNewline > 0 ? lastNewline : maxLen;
      await tgApi('sendMessage', { chat_id: chatId, text: remaining.slice(0, splitAt), parse_mode: parseMode });
      remaining = remaining.slice(splitAt);
      // Small delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 300));
    }
  } else {
    await tgApi('sendMessage', { chat_id: chatId, text, parse_mode: parseMode });
  }
}

// ── Command Handlers ──

async function cmdHealth(chatId) {
  const lines = ['🏥 *PokeMatrix — Health Check*\n'];

  // DB check
  try {
    const db = getDB();
    await db.get('SELECT 1');
    lines.push('✅ Database: connected');

    const userCount = await db.get('SELECT COUNT(*) as c FROM users');
    lines.push(`👤 Users: ${userCount?.c || 0}`);

    const onlineCount = await db.get(
      "SELECT COUNT(*) as c FROM user_locations WHERE updated_at > datetime('now', '-1 hour')"
    );
    lines.push(`🟢 Online (1h): ${onlineCount?.c || 0}`);
  } catch (e) {
    lines.push(`❌ Database: ${e.message}`);
  }

  // Server info
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  lines.push(`⏱ Uptime: ${hours}h ${mins}m`);
  lines.push(`🌍 Node: ${process.version}`);
  lines.push(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  lines.push(`🔑 BOT_TOKEN: ${process.env.BOT_TOKEN ? '✅' : '❌'}`);
  lines.push(`🔐 JWT_SECRET: ${process.env.JWT_SECRET ? '✅' : '❌'}`);

  await sendMessage(chatId, lines.join('\n'));
}

async function cmdDiagnose(chatId) {
  await sendMessage(chatId, '🔍 Running full diagnostics... (may take 10-15s)');

  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  const db = getDB();
  const result = await runAll({ db, baseUrl });

  const s = result.summary;
  const icon = s.fail > 0 ? '❌' : s.warn > 0 ? '⚠️' : '✅';
  const header = `🔍 *PokeMatrix — Full Diagnose*\n${icon} ${s.pass} ✅ · ${s.fail} ❌ · ${s.warn} ⚠️  (${s.elapsed}ms)\n`;

  let sections = [];
  for (const group of result.groups) {
    const items = group.checks
      .map(c => {
        const i = c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⚠️';
        return `${i} ${c.name}${c.detail ? ' — ' + c.detail : ''}`;
      })
      .join('\n');
    if (items) sections.push(`*${group.group}*\n${items}`);
  }

  await sendMessage(chatId, header + sections.join('\n\n'));
}

async function cmdCheck(chatId) {
  await sendMessage(chatId, '🧪 Running end-to-end test... (may take 15-20s)');

  const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
  const db = getDB();

  // Only run E2E checks
  const partial = await runAll({ db, baseUrl });
  const e2eGroup = partial.groups.find(g => g.group.includes('Сквозной') || g.group.includes('e2e'));
  const apiGroup = partial.groups.find(g => g.group.includes('API') || g.group.includes('Статика'));

  const all = [...(apiGroup?.checks || []), ...(e2eGroup?.checks || [])];
  const report = ['🧪 *E2E Test Results*\n'];
  for (const c of all) {
    const i = c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⚠️';
    report.push(`${i} ${c.name}${c.detail ? ': ' + c.detail : ''}`);
  }

  const fails = all.filter(c => c.status === 'fail');
  if (fails.length > 0) {
    report.push('\n❌ *FAILURES:*');
    for (const f of fails) report.push(`• ${f.name}: ${f.detail || 'no detail'}`);
  } else {
    report.push('\n✅ All checks passed!');
  }

  await sendMessage(chatId, report.join('\n'));
}

async function cmdLogs(chatId) {
  const db = getDB();
  if (!db) return sendMessage(chatId, '❌ No database connection');

  try {
    const rows = await db.all(
      'SELECT id, user_id, action, details, created_at FROM action_log ORDER BY id DESC LIMIT 10'
    );
    if (!rows || rows.length === 0) {
      return sendMessage(chatId, '📋 *Action Log*\n\n(empty — no actions logged yet)');
    }
    const lines = ['📋 *Last 10 actions*\n'];
    for (const r of rows) {
      const det = r.details ? r.details.slice(0, 80) : '';
      lines.push(`• \`#${r.id}\` user:${r.user_id} — ${r.action}${det ? ' | ' + det : ''} (${r.created_at})`);
    }
    await sendMessage(chatId, lines.join('\n'));
  } catch (e) {
    await sendMessage(chatId, `❌ Error reading log: ${e.message}`);
  }
}

async function cmdStatus(chatId) {
  const db = getDB();
  if (!db) return sendMessage(chatId, '❌ No database connection');

  try {
    const dashboard = [];
    dashboard.push('📊 *PokeMatrix — Dashboard*\n');

    const userCount = await db.get('SELECT COUNT(*) as c FROM users');
    dashboard.push(`👤 Total users: ${userCount?.c || 0}`);

    const regCount = await db.get('SELECT COUNT(*) as c FROM users WHERE registered = 1');
    dashboard.push(`🎮 Registered: ${regCount?.c || 0}`);

    const saveCount = await db.get('SELECT COUNT(*) as c FROM game_saves');
    dashboard.push(`💾 Saves: ${saveCount?.c || 0}`);

    const online = await db.get(
      "SELECT COUNT(*) as c FROM user_locations WHERE updated_at > datetime('now', '-1 hour')"
    );
    dashboard.push(`🟢 Online (1h): ${online?.c || 0}`);

    const leaderboard = await db.get('SELECT COUNT(*) as c FROM leaderboard');
    dashboard.push(`🏆 Leaderboard entries: ${leaderboard?.c || 0}`);

    const chatMsgs = await db.get('SELECT COUNT(*) as c FROM chat_messages');
    dashboard.push(`💬 Chat messages: ${chatMsgs?.c || 0}`);

    const recentReg = await db.get(
      "SELECT nickname, username, created_at FROM users WHERE registered = 1 ORDER BY created_at DESC LIMIT 1"
    );
    if (recentReg && (recentReg.nickname || recentReg.username)) {
      dashboard.push(`\n🆕 Last registered: ${recentReg.nickname || recentReg.username} (${recentReg.created_at})`);
    }

    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    dashboard.push(`\n⏱ Server uptime: ${h}h ${m}m`);

    await sendMessage(chatId, dashboard.join('\n'));
  } catch (e) {
    await sendMessage(chatId, `❌ Dashboard error: ${e.message}`);
  }
}

// ── Help ──

async function cmdHelp(chatId) {
  const text = [
    '🤖 *PokeMatrix Bot Debugger*\n',
    '*/health* — Краткий статус (DB, users, uptime)',
    '*/diagnose* — Полная диагностика всех систем',
    '*/check* — Сквозной E2E тест (auth → save → load)',
    '*/logs* — Последние 10 действий из action_log',
    '*/status* — Дашборд (users, saves, online)',
    '*/help* — Эта справка\n',
    '_Доступ только для администраторов._',
  ].join('\n');
  await sendMessage(chatId, text);
}

// ── Polling ──

let pollingActive = false;
let lastUpdateId = 0;
let pollTimer = null;

function startPolling() {
  if (pollingActive) return;
  pollingActive = true;
  logger.info('Bot debugger: polling started');

  const poll = async () => {
    if (!pollingActive) return;
    try {
      const result = await tgApi('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message'],
      });

      if (result && result.ok && result.result) {
        for (const update of result.result) {
          lastUpdateId = update.update_id;

          const msg = update.message;
          if (!msg || !msg.text) continue;

          const from = msg.from;
          if (!isAuthorized(from)) {
            logger.warn({ userId: from?.id, username: from?.username }, 'Bot debugger: unauthorized access attempt');
            continue;
          }

          const chatId = msg.chat.id;
          const text = msg.text.trim();
          const cmd = text.includes('@')
            ? text.split(' ')[0].split('@')[0]
            : text.split(' ')[0];

          logger.info({ cmd, userId: from.id, username: from.username }, 'Bot debugger: command');

          try {
            switch (cmd) {
              case '/health':  await cmdHealth(chatId); break;
              case '/diagnose': await cmdDiagnose(chatId); break;
              case '/check':   await cmdCheck(chatId); break;
              case '/logs':    await cmdLogs(chatId); break;
              case '/status':  await cmdStatus(chatId); break;
              case '/start':
              case '/help':    await cmdHelp(chatId); break;
              default:
                await sendMessage(chatId, `Unknown command: ${cmd}\nUse /help for available commands.`);
            }
          } catch (cmdErr) {
            logger.error({ err: cmdErr, cmd }, 'Bot debugger: command error');
            try {
              await sendMessage(chatId, `❌ Error executing ${cmd}: ${cmdErr.message}`);
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      // Timeout is expected for long polling — don't log it as error
      if (e.name !== 'AbortError' && !e.message?.includes('timeout')) {
        logger.error({ err: e }, 'Bot debugger: polling error');
      }
    }

    if (pollingActive) {
      pollTimer = setTimeout(poll, 1000);
    }
  };

  // Start first poll after a short delay
  pollTimer = setTimeout(poll, 2000);
}

function stopPolling() {
  pollingActive = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  logger.info('Bot debugger: polling stopped');
}

// ── Public API ──

export function startBotDebugger() {
  if (!process.env.BOT_TOKEN) {
    logger.warn('Bot debugger: BOT_TOKEN not set — skipped');
    return;
  }
  if (pollingActive) {
    logger.info('Bot debugger: already running');
    return;
  }
  startPolling();
}

export function stopBotDebugger() {
  stopPolling();
}
