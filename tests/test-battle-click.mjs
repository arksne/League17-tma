// Test battle system: start encounter, use a move, verify it works
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
let errors = [];

page.on('console', msg => {
  const t = msg.text();
  if (msg.type() === 'error' && !t.includes('favicon')) errors.push(`[${msg.type()}] ${t.substring(0,200)}`);
  if (t.includes('битва ещё не готова') || t.includes('restore') || t.includes('transition')) console.log(`  ⚠️  ${t}`);
});
page.on('pageerror', e => errors.push(`[PAGE_ERROR] ${e.message}`));

console.log('1. Loading game...');
await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());

// Give a starter pokemon if team is empty
const teamSize = await page.evaluate(async () => {
  const { state } = await import('/src/game/state.js');
  return state.myTeam?.length || 0;
});
console.log(`   Team size: ${teamSize}`);

if (teamSize === 0) {
  console.log('2. Giving starter pokemon...');
  await page.evaluate(async () => {
    const { state } = await import('/src/game/state.js');
    const { autoSave } = await import('/src/game/save.js');
    const r = await fetch('/api/pokeapi/pokemon/charmander');
    const data = await r.json();
    data.ivs = { hp: 20, atk: 20, def: 20, spa: 20, spd: 20, spe: 20 };
    data.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    data.baseLevel = 10;
    data.currentExp = 0;
    data.expToNext = 1000;
    data.currentHp = 100;
    data.maxHp = 100;
    data.movesPP = [
      { current: 35, max: 35 },
      { current: 10, max: 10 },
    ];
    data.status = null;
    data.statStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    data.isShiny = false;
    data.heldItem = null;
    data.berries = { sitrusBerry: 0, oranBerry: 0, lumBerry: 0, chestoBerry: 0, rawstBerry: 0 };
    state.myTeam.push(data);
    const sav = await import('/src/game/save.js');
    sav.autoSave();
  });
  await page.waitForTimeout(1000);
  console.log('   Starter added');
}

// Go to a location with encounters (route 1 - Viridian Forest)
console.log('3. Navigating to route 1...');
await page.evaluate(() => {
  const mod = document.getElementById('encounter-modal');
  if (mod) mod.style.display = 'none';
});
// Set location via state import (use underscore IDs matching regions.ts)
await page.evaluate(async () => {
  const { state } = await import('/src/game/state.js');
  state.currentLocationId = 'route_1';
  state.currentLocationName = 'Маршрут 1';
});
await page.waitForTimeout(500);

// Start wild encounter via hunt toggle (auto-hunt system)
console.log('4. Starting wild encounter (clicking hunt toggle)...');
await page.evaluate(() => {
  const btn = document.getElementById('btn-hunt-toggle');
  if (btn) btn.click();
});
console.log('   Waiting for encounter modal to appear...');

// Poll for encounter modal to appear (auto-hunt has random delay)
let modalFound = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const visible = await page.evaluate(() => {
    const modal = document.getElementById('encounter-modal');
    if (!modal) return false;
    return window.getComputedStyle(modal).display === 'flex';
  });
  if (visible) { modalFound = true; break; }
}
console.log(`   Encounter modal appeared: ${modalFound}`);

// Check for errors so far
console.log(`   Errors so far: ${errors.length}`);

// Wait for move buttons to load (async fetch from PokeAPI)
console.log('5. Waiting for move buttons to load...');
let moveFound = false;
for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(1000);
  const hasMove = await page.evaluate(() => {
    const btn = document.getElementById('move-btn-0');
    if (!btn) return false;
    const text = btn.textContent.trim();
    return text !== '-' && text !== '...' && !btn.classList.contains('disabled') && text.length > 0;
  });
  if (hasMove) { moveFound = true; break; }
}
console.log(`   Move button loaded: ${moveFound}`);

// Read move buttons info
const movesInfo = await page.evaluate(() => {
  const moves = [];
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`move-btn-${i}`);
    if (btn) {
      moves.push({
        text: btn.textContent.trim(),
        display: window.getComputedStyle(btn).display,
        disabled: btn.classList.contains('disabled'),
      });
    }
  }
  return moves;
});
console.log(`   Move buttons: ${JSON.stringify(movesInfo)}`);

// Click first move
if (movesInfo.length > 0 && movesInfo[0].display !== 'none' && moveFound) {
  console.log('6. Clicking first move...');
  await page.evaluate(() => {
    document.getElementById('move-btn-0')?.click();
  });
  await page.waitForTimeout(4000);

  const logsAfter = await page.evaluate(() => {
    const log = document.getElementById('battle-log');
    return log ? log.innerText.substring(0, 500) : 'no log';
  });
  console.log(`   Battle log: ${logsAfter}`);

  // Check enemy HP changed (means attack worked)
  const enemyHp = await page.evaluate(() => {
    const hpText = document.getElementById('wild-hp-text');
    return hpText ? hpText.innerText : 'no hp';
  });
  console.log(`   Enemy HP: ${enemyHp}`);

  // Check if enemy HP is different from max (= damage was dealt)
  const hpBefore = await page.evaluate(() => {
    const wildMaxHpEl = document.getElementById('wild-hp-max');
    return wildMaxHpEl ? wildMaxHpEl.textContent : null;
  });
  console.log(`   Enemy max HP (for comparison): ${hpBefore}`);
}

console.log('\n--- RESULTS ---');

// Check for "битва ещё не готова" error in any form (both URL-encoded and raw)
const battleNotReady = errors.some(e => e.includes('битва') && e.includes('не готова'));
console.log(`"битва ещё не готова" shown: ${battleNotReady}`);

// Check for page errors
const pageErrors = errors.filter(e => e.includes('[PAGE_ERROR]'));
console.log(`Page errors: ${pageErrors.length}`);

// Check for any console errors (excluding irrelevant ones)
if (errors.length > 0) {
  console.log(`All errors (${errors.length}):`);
  errors.forEach(e => console.log(`  ${e}`));
}

console.log(`\nTotal errors: ${errors.length}`);
console.log(battleNotReady ? '❌ BATTLE STILL BROKEN ("битва ещё не готова")' : '✅ BATTLE PHASE TRANSITIONS WORK!');

await browser.close();
