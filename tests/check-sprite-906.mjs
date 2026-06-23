// Проверить, какой спрайт показывается для #906
import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('console', msg => {
  if (['error','warning'].includes(msg.type())) console.log(`[${msg.type()}] ${msg.text()}`);
});
page.on('pageerror', e => console.log(`[PAGE_ERROR] ${e.message}`));

await page.goto('http://localhost:5173/?dev&admin', { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
await page.waitForTimeout(5000);
await page.evaluate(() => document.getElementById('tutorial-overlay')?.remove());

await page.evaluate(async () => {
  const mod = await import('/src/ui/pokedex.ts');
  mod.openPokedex();
});
await page.waitForTimeout(1000);

const info = await page.evaluate(() => {
  const grid = document.getElementById('pokedex-grid');
  if (!grid) return 'no grid';
  const cells = Array.from(grid.children);
  const results = [];
  for (const cell of cells) {
    const nameSpan = cell.querySelector('.poke-name');
    const numSpan = cell.querySelector('.dex-num');
    const img = cell.querySelector('img');
    if (!nameSpan || !numSpan) continue;
    results.push({
      name: nameSpan.textContent,
      num: numSpan.textContent,
      src: img?.src?.substring(0, 120) || ''
    });
  }
  return results;
});

const targets = info.filter(p => ['sprigatito','quaxly','fuecoco','pikachu','charizard'].includes(p.name));
console.log('Target pokemon:');
targets.forEach(p => console.log(`  ${p.num} ${p.name} -> ${p.src}`));

const start = Math.max(0, info.findIndex(p => p.name === 'sprigatito') - 2);
const section = info.slice(start, start + 10);
console.log('\nSection around sprigatito:');
section.forEach(p => console.log(`  ${p.num} ${p.name} -> ${p.src.substring(0,100)}`));

await browser.close();
