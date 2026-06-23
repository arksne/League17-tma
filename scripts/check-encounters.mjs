// Cross-reference encounter names vs drops.js
import { readFileSync } from 'fs';

// Load drops.js
const dropsContent = readFileSync('src/data/drops.js', 'utf-8');
const dropsMatch = dropsContent.match(/export const MONSTER_DROP_TABLE\s*=\s*(\{[\s\S]*\})/);
const MONSTER_DROP_TABLE = eval('(' + dropsMatch[1] + ')');
const dropSpecies = new Set(Object.keys(MONSTER_DROP_TABLE));

// Load regions.ts and extract ALL encounter names
const regionsContent = readFileSync('src/data/regions.ts', 'utf-8');
const encounterRegex = /encounters:\s*\[([^\]]+)\]/g;
const dayEncRegex = /dayEncounters:\s*\[([^\]]+)\]/g;
const nightEncRegex = /nightEncounters:\s*\[([^\]]+)\]/g;

const encounterNames = new Set();
let match;

while ((match = encounterRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}
while ((match = dayEncRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}
while ((match = nightEncRegex.exec(regionsContent)) !== null) {
  const items = match[1].match(/"(\w+)"/g);
  if (items) items.forEach(i => encounterNames.add(i.replace(/"/g, '')));
}

console.log('Encounter names in regions.ts:', encounterNames.size);

// Find encounters without drops
const noDrops = [...encounterNames].filter(name => !dropSpecies.has(name));
if (noDrops.length > 0) {
  console.log('\n❌ ENCOUNTERS НЕТ В DROPS.JS:');
  noDrops.forEach(n => console.log('  - ' + n));
} else {
  console.log('\n✅ All encounter names exist in drops.js');
}

// Find drops not encountered anywhere
const notInEncounters = [...dropSpecies].filter(name => !encounterNames.has(name));
if (notInEncounters.length > 0) {
  console.log('\n⚠️ DROPS.JS НЕТ В ENCOUNTERS (не встречаются):');
  notInEncounters.forEach(n => console.log('  - ' + n));
} else {
  console.log('\n✅ All drop species appear in encounters');
}
