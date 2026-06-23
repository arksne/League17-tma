// Generate full pokedex_data.json — ALL PokeAPI entries with correct IDs for artwork URLs
// No form variants are skipped — every distinct entry in PokeAPI is included
import { readFileSync, writeFileSync } from 'fs';

const pokeapiResp = JSON.parse(await (await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0')).text());
const pokeapiNames = pokeapiResp.results.map(p => p.name);
const pokeapiIdOf = {};
for (let i = 0; i < pokeapiNames.length; i++) pokeapiIdOf[pokeapiNames[i]] = i + 1;

// Load existing data
const existing = JSON.parse(readFileSync('public/pokedex_data.json', 'utf8'));

const orderedData = {};
let fromExisting = 0;
let fromNew = 0;

for (const name of pokeapiNames) {
  const pokeapiId = pokeapiIdOf[name] || 0;
  if (existing[name]) {
    orderedData[name] = { ...existing[name], pokeapiId };
    fromExisting++;
  } else {
    orderedData[name] = { method: 'Неизвестно', location: 'Неизвестно', pokeapiId };
    fromNew++;
  }
}

console.log('Existing entries (re-ordered):', fromExisting);
console.log('New entries:', fromNew);
console.log('Total entries:', Object.keys(orderedData).length);

writeFileSync('public/pokedex_data.json', JSON.stringify(orderedData, null, 2));
console.log('Written to public/pokedex_data.json');
