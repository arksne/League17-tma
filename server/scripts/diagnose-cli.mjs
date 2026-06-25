#!/usr/bin/env node
/**
 * diagnose-cli.mjs — Запуск диагностики из терминала
 *
 * Использование:
 *   node server/scripts/diagnose-cli.mjs           # локальный запуск
 *   node server/scripts/diagnose-cli.mjs --url     # с указанием URL
 *   node server/scripts/diagnose-cli.mjs --json    # вывод в JSON
 *
 * Для полного сквозного теста нужен запущенный сервер.
 * Файловые и env проверки работают без сервера.
 */

import { runAll, summaryString } from '../lib/diagnostics.js';
import { initDB, getDB } from '../db.js';
import '../load-env.js';

const args = process.argv.slice(2);
const isJson = args.includes('--json');
const urlIdx = args.indexOf('--url');
const baseUrl = urlIdx >= 0 ? args[urlIdx + 1] : undefined;

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     PokeMatrix — Full System Diagnostics    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');

  let db = null;
  try {
    await initDB();
    db = getDB();
  } catch (e) {
    if (!isJson) console.warn('⚠️  DB init skipped:', e.message);
  }

  const result = await runAll({ db, baseUrl });

  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.summary.fail > 0 ? 1 : 0);
  }

  const groupColors = {
    '📁': '\x1b[36m',
    '🔧': '\x1b[33m',
    '🗄️': '\x1b[35m',
    '🔐': '\x1b[34m',
    '🌐': '\x1b[32m',
    '🧪': '\x1b[37m',
  };

  for (const group of result.groups) {
    if (group.checks.length === 0) continue;
    const prefix = group.group.slice(0, 2);
    const color = groupColors[prefix] || '\x1b[37m';
    console.log(`\n${color}${group.group}\x1b[0m`);
    for (const c of group.checks) {
      const icon = c.status === 'pass' ? '  ✅' : c.status === 'fail' ? '  ❌' : '  ⚠️';
      const detail = c.detail ? ` — ${c.detail}` : '';
      console.log(`${icon} ${c.name}${detail}`);
    }
  }

  const s = result.summary;
  console.log('');
  console.log('─'.repeat(50));
  const totalIcon = s.fail > 0 ? '❌' : s.warn > 0 ? '⚠️' : '✅';
  console.log(`${totalIcon}  ${s.pass} passed  ·  ${s.fail} failed  ·  ${s.warn} warnings  (${s.elapsed}ms)`);
  console.log('');

  if (s.fail > 0 && baseUrl) {
    console.log('💡 Совет: проверьте сервер — возможно он не запущен или конфиг неверный.');
  }
  if (s.warn > 0 && !baseUrl) {
    console.log('💡 Совет: для полной проверки укажите --url http://localhost:3000');
  }

  process.exit(s.fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
