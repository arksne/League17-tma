import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('public/pokedex_data.json', 'utf8'));
const keys = Object.keys(data);

// Legit pokemon with hyphens (keep them)
const legitHyphenated = new Set([
  'nidoran-f', 'nidoran-m', 'porygon2', 'pichu', 'cleffa', 'igglybuff',
  'togepi', 'tyrogue', 'smoochum', 'elekid', 'magby', 'wynaut', 'azurill',
  'budew', 'bonsly', 'happiny', 'chingling', 'munchlax', 'riolu', 'mantyke',
  'mr-mime', 'ho-oh', 'mime-jr', 'porygon-z',
]);

// For each name with a hyphen, check if the base already exists as an entry
const toRemove = [];
for (const name of keys) {
  if (legitHyphenated.has(name)) continue;
  if (!name.includes('-')) continue;

  // Check if removing the suffix gives us a base that exists
  // e.g. 'maushold-family-of-four' → try 'maushold'
  const base = name.split('-')[0];
  if (keys.includes(base)) {
    toRemove.push({ name, base });
  }
}

console.log('Form variants to remove:', toRemove.length);
toRemove.forEach(f => console.log(`  ${f.name} → base: ${f.base}`));

// Remove them
for (const f of toRemove) {
  delete data[f];
}

writeFileSync('public/pokedex_data.json', JSON.stringify(data, null, 2));
console.log(`\nRemaining entries: ${Object.keys(data).length}`);
