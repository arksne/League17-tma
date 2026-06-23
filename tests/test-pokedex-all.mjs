import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const allLogs = [];
page.on('console', msg => allLogs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', e => allLogs.push(`[PAGE_ERROR] ${e.message}`));
page.on('response', r => {
  if (r.status() >= 400) allLogs.push(`[HTTP ${r.status()}] ${r.url().substring(0,150)}`);
});

await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());

// Get all names from grid by evaluating the game state directly
const names = await page.evaluate(async () => {
  try {
    const mod = await import('/src/ui/pokedex.ts');
    mod.openPokedex();
    await new Promise(r => setTimeout(r, 500));
    const grid = document.getElementById('pokedex-grid');
    if (!grid) return [];
    return Array.from(grid.children).map(c => {
      const span = c.querySelector('.poke-name');
      return span ? span.textContent : null;
    }).filter(Boolean);
  } catch(e) {
    return [];
  }
});
console.log(`Total pokemon: ${names.length}`);

// Test ALL PokeAPI endpoints in parallel (batch)
const fails = [];
const batchSize = 20;

for (let start = 0; start < names.length; start += batchSize) {
  const batch = names.slice(start, start + batchSize);
  const batchResults = await Promise.all(batch.map(async (name) => {
    const result = await page.evaluate(async (n) => {
      try {
        const r = await fetch(`/api/pokeapi/pokemon/${n}`);
        if (r.ok) return null;
        // Try species endpoint
        const r2 = await fetch(`/api/pokeapi/pokemon-species/${n}`);
        if (r2.ok) return null;
        return 'both fail';
      } catch(e) {
        return e.message;
      }
    }, name);
    return { name, error: result };
  }));

  const batchFails = batchResults.filter(r => r.error !== null);
  fails.push(...batchFails);

  if (fails.length >= 20) break;

  if ((start + batchSize) % 200 === 0) {
    console.log(`Checked ${start + batchSize}/${names.length} — ${fails.length} failures`);
  }
}

console.log(`\n=== PokeAPI failures (${fails.length}) ===`);
fails.forEach(f => console.log(`  ${f.name}: ${f.error}`));

// Now do the full click test but faster (no wait)
if (fails.length === 0) {
  console.log('\n0 failures — no need to click test');
} else {
  console.log('\nClick testing failed names...');
  const clickFails = [];
  for (const f of fails.slice(0, 7)) {
    const ok = await page.evaluate(async (n) => {
      try {
        const mod = await import('/src/ui/pokedex.ts');
        await mod.showPokedexInfo(n);
        const detail = document.getElementById('pokedex-detail');
        return detail?.innerHTML.includes('Ошибка') ? 'Ошибка' : 'OK';
      } catch(e) {
        return e.message;
      }
    }, f.name);
    clickFails.push({ name: f.name, result: ok });
  }
  clickFails.forEach(f => console.log(`  ${f.name}: ${f.result}`));
}

console.log(`\n=== All HTTP errors ===`);
allLogs.filter(l => l.includes('[HTTP')).slice(-30).forEach(l => console.log(l));

await browser.close();

