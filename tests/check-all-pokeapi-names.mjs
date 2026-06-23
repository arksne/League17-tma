// Check ALL 721 pokemon names against PokeAPI /pokemon/ endpoint
// One at a time — avoids rate limiting
import { readFileSync } from 'fs';

const json = JSON.parse(readFileSync('public/pokedex_data.json', 'utf8'));
const names = Object.keys(json);
console.log(`Total: ${names.length}`);

const failures = [];

for (let i = 0; i < names.length; i++) {
  const name = names[i];
  try {
    const r = await fetch('https://pokeapi.co/api/v2/pokemon/' + name);
    if (!r.ok) {
      failures.push({ index: i + 1, name, status: r.status });
    }
  } catch(e) {
    failures.push({ index: i + 1, name, err: e.message });
  }
  if (failures.length > 20) {
    console.log('Stopped early — 20 failures found');
    break;
  }
  // Small delay to be nice to PokeAPI
  if (i % 50 === 49) await new Promise(r => setTimeout(r, 1000));
}

console.log(`\n=== FAILURES (${failures.length}) ===`);
failures.forEach(f => console.log(`  #${f.index} ${f.name}: HTTP ${f.status || f.err}`));
