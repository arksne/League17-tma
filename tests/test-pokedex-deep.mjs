import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const allLogs = [];
page.on('console', msg => {
  if (['error','warning'].includes(msg.type())) allLogs.push(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', e => allLogs.push(`[PAGE_ERROR] ${e.message}`));
page.on('response', r => {
  if (r.status() >= 400) allLogs.push(`[HTTP ${r.status()}] ${r.url().substring(0,150)}`);
});

await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());

// Open pokedex
await page.evaluate(async () => {
  const mod = await import('/src/ui/pokedex.ts');
  mod.openPokedex();
});
await page.waitForTimeout(1000);

// Get ALL names from grid
const names = await page.evaluate(() => {
  const grid = document.getElementById('pokedex-grid');
  if (!grid) return [];
  return Array.from(grid.children).map(c => {
    const span = c.querySelector('.poke-name');
    return span ? span.textContent : null;
  }).filter(Boolean);
});
console.log(`Grid: ${names.length} pokemon`);

// Names with special chars or known PokeAPI issues
const suspicious = names.filter(n =>
  /[-]/.test(n) || /\d/.test(n) || n === 'farfetchd' ||
  n === 'wormadam' || n === 'burmy' || n === 'rotom' ||
  n === 'basculin' || n === 'darmanitan' || n === 'keldeo' ||
  n === 'meloetta' || n === 'meowstic' || n === 'aegislash'
);
// Also test every ~50th to sample broadly
const sample = names.filter((n, i) => i % 50 === 0);
const testNames = [...new Set([...suspicious, ...sample])];
console.log(`Testing ${testNames.length} names (${suspicious.length} suspicious + ${sample.length} sample)`);

// Test PokeAPI calls via proxy
const failures = [];
for (const name of testNames) {
  const result = await page.evaluate(async (n) => {
    try {
      const r = await fetch(`/api/pokeapi/pokemon/${n}`);
      if (!r.ok) return { name: n, endpoint: 'pokemon', status: r.status };
      const r2 = await fetch(`/api/pokeapi/pokemon-species/${n}`);
      if (!r2.ok) return { name: n, endpoint: 'pokemon-species', status: r2.status };
      return null;
    } catch(e) {
      return { name: n, endpoint: 'fetch', err: e.message };
    }
  }, name);
  if (result) failures.push(result);
}
console.log(`\nPokeAPI proxy failures: ${failures.length}`);
failures.forEach(f => console.log(`  ${f.name}: ${f.endpoint} — HTTP ${f.status || f.err}`));

// Click suspicious + sample pokemon, check for "Ошибка загрузки"
console.log(`\nClicking ${testNames.length} pokemon...`);
const clickFails = [];
for (const name of testNames) {
  await page.evaluate(async (n) => {
    const mod = await import('/src/ui/pokedex.ts');
    await mod.showPokedexInfo(n);
  }, name);
  await page.waitForTimeout(2000);

  const hasError = await page.evaluate(() => {
    const detail = document.getElementById('pokedex-detail');
    return detail?.innerHTML.includes('Ошибка') || false;
  });

  if (hasError) clickFails.push(name);

  // Go back
  await page.evaluate(() => {
    const back = document.getElementById('pokedex-detail-back');
    if (back) back.click();
  });
  await page.waitForTimeout(300);
}

console.log(`\nClick failures: ${clickFails.length}`);
clickFails.forEach(n => console.log(`  ❌ ${n}`));

console.log(`\nAll logs:`);
allLogs.forEach(l => console.log(l));

await browser.close();
