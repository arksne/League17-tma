#!/usr/bin/env node
/**
 * Startup script for Railway/Nixpacks deploy.
 * Запускает миграции, экспорт данных и сервер с логированием ошибок.
 * Используется вместо chained && команд, чтобы точно видеть что упало.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(script, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n=== [${label}] Starting ===`);
    const proc = spawn('node', [script], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'inherit', 'inherit'],
      env: { ...process.env },
    });
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`=== [${label}] OK ===`);
        resolve();
      } else {
        console.error(`=== [${label}] FAILED (exit code ${code}) ===`);
        reject(new Error(`${label} failed with exit code ${code}`));
      }
    });
    proc.on('error', (err) => {
      console.error(`=== [${label}] ERROR: ${err.message} ===`);
      reject(err);
    });
  });
}

async function main() {
  try {
    // Step 1: Apply database migrations
    await run('server/migrate.js', 'migrate');
  } catch (e) {
    console.error('Migration step failed, continuing anyway:', e.message);
  }

  try {
    // Step 2: Export game data from TS to JSON
    await run('server/scripts/export-game-data.mjs', 'export-data');
  } catch (e) {
    console.error('Data export failed, continuing anyway:', e.message);
  }

  try {
    // Step 3: Start the Express server
    await run('server/index.js', 'server');
  } catch (e) {
    console.error('FATAL: Server failed to start:', e.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('FATAL startup error:', err);
  process.exit(1);
});
