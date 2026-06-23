#!/usr/bin/env node
/**
 * Balance encounters — remove legendaries/pseudos from early routes,
 * keep them only in appropriate late-game locations.
 */
const fs = require('fs');
const path = require('path');

const regionsPath = path.join(__dirname, '..', 'src', 'data', 'regions.ts');
let content = fs.readFileSync(regionsPath, 'utf-8');

// === CONFIGURATION ===

// Pokemon to restrict to late-game only
const LATE_GAME_ONLY = [
  // Legendary birds
  'articuno', 'zapdos', 'moltres',
  // Mew/Mewtwo
  'mewtwo', 'mew',
  // Legendary beasts
  'raikou', 'entei', 'suicune',
  // Tower duo
  'lugia', 'ho-oh',
  // Hoenn legends
  'latias', 'latios', 'kyogre', 'groudon', 'rayquaza', 'jirachi', 'deoxys-normal',
  // Sinnoh legends
  'azelf', 'mesprit', 'uxie', 'dialga', 'palkia', 'giratina-altered', 'manaphy', 'darkrai', 'shaymin-land',
  // Pseudo-legendaries fully evolved
  'dragonite', 'tyranitar', 'salamence', 'metagross', 'garchomp', 'hydreigon',
  // Starters fully evolved
  'charizard', 'blastoise', 'venusaur',
  'typhlosion', 'meganium', 'feraligatr',
  'sceptile', 'blaziken', 'swampert',
  'torterra', 'infernape', 'empoleon',
  'serperior', 'emboar', 'samurott',
  'delphox', 'chesnaught', 'greninja',
  'decidueye', 'incineroar', 'primarina',
];

// Locations allowed to keep LATE_GAME_ONLY Pokemon (end-game areas)
const ALLOWED_LOCATIONS = [
  // Kanto end-game
  'victoryRoad1', 'victoryRoad2', 'victoryRoad3',
  'ceruleanCave',
  'seafoamIslands',
  'powerPlant',
  'mtEmber',
  'route23',
  'route26', 'route27', 'route28',
  'indigoPlateau',
  // Sevii Islands (post-game)
  'icefallCave', 'lostCave', 'tanobyRuins',
  'sevaultCanyon', 'canyonEntrance',
  'ruinValley', 'trainerTower',
  'navelRock', 'birthIsland',
  // Johto end-game
  'mtSilver',
  'tohjoFalls',
  'whirlIslands',
  'dragonsDen',
  'bellTower', 'burnedTower',
  'embeddedTower',
  'sinjohRuins',
  'teamRocketHq',
  'route44', 'route45', 'route46',
  'darkCave',
  'mtMortar',
  'icePath',
  'unionCave',
  // Special
  'roamingKanto', 'roamingJohto',
  'mysteryZone',
];

// Pre-evolved forms that SHOULD stay (remove them from the restrict list further below)
const KEEP_EVOLVED_FORMS = [
  'dragonair', 'pupitar', 'shelgon',
  'charmeleon', 'wartortle', 'ivysaur',
  'quilava', 'bayleef', 'croconaw',
  'grovyle', 'combusken', 'marshtomp',
  // Actually dragonair is in the data as separate, check if it's listed
];

// === Main ===

function getLocationNames(content) {
  // Find all location blocks in regions.ts
  const locMatches = content.matchAll(/(\w+):\s*\{\s*\n\s*name:/g);
  const locs = [];
  for (const m of locMatches) {
    const name = m[1];
    // Skip non-location blocks
    if (['name', 'desc', 'color', 'locations', 'metadata', 'kanto', 'johto'].includes(name)) continue;
    locs.push(name);
  }
  return locs;
}

function removeFromEncounterList(content, locName, monNames) {
  const escLoc = locName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match encounters: [...] array inside this location block
  // Use a more targeted approach: find the full location block and fix its encounters
  const patterns = ['encounters', 'dayEncounters', 'nightEncounters'];
  let changed = false;

  for (const key of patterns) {
    // Build a regex to find this location's encounter array
    // We look for the pattern inside the location's block
    const regex = new RegExp(
      `(${escLoc}:\\s*\\{[^}]*?${key}:\\s*\\[)([^\\]]+)(\\])`,
      's'
    );

    if (content.match(regex)) {
      content = content.replace(regex, (match, prefix, list, suffix) => {
        // Parse the list items
        let items = list.split(',').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
        const before = items.length;
        items = items.filter(item => {
          const clean = item.replace(/^"|"$/g, '').trim();
          return !monNames.includes(clean);
        });
        const after = items.length;
        if (before !== after) changed = true;
        return prefix + items.map(i => `"${i}"`).join(',') + suffix;
      });
    }
  }

  return { content, changed };
}

// Get all location names
const allLocs = getLocationNames(content);
console.log(`Found ${allLocs.length} locations in regions.ts`);

// Process each location
let totalRemoved = 0;
let changedLocs = [];

for (const loc of allLocs) {
  const isAllowed = ALLOWED_LOCATIONS.includes(loc);
  const isEarlyRoute = /^route\d+$/.test(loc) && !isAllowed;

  if (isAllowed) {
    // Keep LATE_GAME_ONLY Pokemon here — skip
    continue;
  }

  // For early routes and other disallowed locations, remove LATE_GAME_ONLY Pokemon
  const result = removeFromEncounterList(content, loc, LATE_GAME_ONLY);
  if (result.changed) {
    content = result.content;
    changedLocs.push(loc);

    // Count how many were removed (approximate)
    const beforeLines = fs.readFileSync(regionsPath, 'utf-8');
    totalRemoved += LATE_GAME_ONLY.length;
  }
}

// Write changes
fs.writeFileSync(regionsPath, content);
console.log(`\n✅ Cleaned up ${changedLocs.length} locations`);
console.log(`Removed legendary/pseudo/evolved-starters from early/mid-game routes`);
console.log(`Preserved in ${ALLOWED_LOCATIONS.length} end-game locations`);
console.log(`\nChanged locations: ${changedLocs.sort().join(', ')}`);
console.log(`\nDone! Review the changes before committing.`);
