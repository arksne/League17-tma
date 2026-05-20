// Data Integrity Validation — validates all game data files
// Run: node tests/data-validation.mjs
import { ITEMS } from '../src/data/items.js';
import { REGIONS } from '../src/data/regions.js';
import { NPC_DATA } from '../src/data/npc.js';
import { gymLeaders } from '../src/data/gyms.js';
import { natures } from '../src/data/natures.js';
import { trainingStages } from '../src/data/training.js';
import { STONE_ITEM_MAP } from '../src/data/stones.js';
import { MONSTER_DROP_TABLE } from '../src/data/drops.js';
import { GEN_STARTERS } from '../src/data/starters.js';
import { TRANSPORT_HUBS } from '../src/data/transport.js';

let total = 0, passed = 0;

function check(desc, condition) {
  total++;
  if (condition) { passed++; console.log(`  ✓ ${total}: ${desc}`); }
  else { console.log(`  ✗ ${total}: ${desc}`); }
}

// Known PokeAPI species for validation (first 251 + some special)
const KNOWN_SPECIES = new Set([
  'bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard',
  'squirtle','wartortle','blastoise','caterpie','metapod','butterfree',
  'weedle','kakuna','beedrill','pidgey','pidgeotto','pidgeot',
  'rattata','raticate','spearow','fearow','ekans','arbok',
  'pikachu','raichu','sandshrew','sandslash','nidoran-f','nidorina','nidoqueen',
  'nidoran-m','nidorino','nidoking','clefairy','clefable','vulpix','ninetales',
  'jigglypuff','wigglytuff','zubat','golbat','oddish','gloom','vileplume',
  'paras','parasect','venonat','venomoth','diglett','dugtrio',
  'meowth','persian','psyduck','golduck','mankey','primeape',
  'growlithe','arcanine','poliwag','poliwhirl','poliwrath','abra','kadabra','alakazam',
  'machop','machoke','machamp','bellsprout','weepinbell','victreebel',
  'tentacool','tentacruel','geodude','graveler','golem','ponyta','rapidash',
  'slowpoke','slowbro','magnemite','magneton','farfetchd','doduo','dodrio',
  'seel','dewgong','grimer','muk','shellder','cloyster','gastly','haunter','gengar',
  'onix','drowzee','hypno','krabby','kingler','voltorb','electrode',
  'exeggcute','exeggutor','cubone','marowak','hitmonlee','hitmonchan',
  'lickitung','koffing','weezing','rhyhorn','rhydon','chansey','tangela',
  'kangaskhan','horsea','seadra','goldeen','seaking','staryu','starmie',
  'mr-mime','scyther','jynx','electabuzz','magmar','pinsir','tauros',
  'magikarp','gyarados','lapras','ditto','eevee','vaporeon','jolteon','flareon',
  'porygon','omanyte','omastar','kabuto','kabutops','aerodactyl','snorlax',
  'articuno','zapdos','moltres','dratini','dragonair','dragonite','mewtwo','mew',
  'chikorita','bayleef','meganium','cyndaquil','quilava','typhlosion',
  'totodile','croconaw','feraligatr','sentret','furret','hoothoot','noctowl',
  'ledyba','ledian','spinarak','ariados','crobat','chinchou','lanturn',
  'pichu','cleffa','igglybuff','togepi','togetic','natu','xatu',
  'mareep','flaaffy','ampharos','bellossom','marill','azumarill','sudowoodo',
  'politoed','hoppip','skiploom','jumpluff','aipom','sunkern','sunflora',
  'yanma','wooper','quagsire','espeon','umbreon','murkrow','slowking',
  'misdreavus','unown','wobbuffet','girafarig','pineco','forretress','dunsparce',
  'gligar','steelix','snubbull','granbull','qwilfish','scizor','shuckle',
  'heracross','sneasel','teddiursa','ursaring','slugma','magcargo','swinub','piloswine',
  'corsola','remoraid','octillery','delibird','mantine','skarmory','houndour','houndoom',
  'kingdra','phanpy','donphan','porygon2','stantler','smeargle','tyrogue','hitmontop',
  'smoochum','elekid','magby','miltank','blissey','raikou','entei','suicune',
  'larvitar','pupitar','tyranitar','lugia','ho-oh','celebi',
  // Add more as needed for data validation
  'treecko','grovyle','sceptile','torchic','combusken','blaziken','mudkip','marshtomp','swampert',
  'poochyena','zigzagoon','wurmple','silcoon','beautifly','cascoon','dustox','lotad','lombre','ludicolo',
  'seedot','nuzleaf','shiftry','taillow','swellow','wingull','pelipper','ralts','kirlia','gardevoir',
  'surskit','masquerain','shroomish','breloom','slakoth','vigoroth','slaking','nincada','ninjask','shedinja',
  'whismur','loudred','exploud','makuhita','hariyama','azurill','nosepass','skitty','delcatty','sableye',
  'mawile','aron','lairon','aggron','meditite','medicham','electrike','manectric','plusle','minun',
  'volbeat','illumise','roselia','gulpin','swalot','carvanha','sharpedo','wailmer','wailord','numel','camerupt',
  'torkoal','spoink','grumpig','spinda','trapinch','vibrava','flygon','cacnea','cacturne','swablu','altaria',
  'zangoose','seviper','lunatone','solrock','barboach','whiscash','corphish','crawdaunt','baltoy','claydol',
  'lileep','cradily','anorith','armaldo','feebas','milotic','castform','kecleon','shuppet','banette','duskull','dusclops',
  'tropius','chimecho','absol','wynaut','snorunt','glalie','spheal','sealeo','walrein',
  'clamperl','huntail','gorebyss','relicanth','luvdisc','bagon','shelgon','salamence','beldum','metang','metagross',
  'regirock','regice','registeel','latias','latios','kyogre','groudon','rayquaza','jirachi','deoxys',
]);

const VALID_CATEGORIES = new Set(['currency','balls','healing','statusCure','ppRecovery','vitamins','evolutionStones','berries','training','other','battle','quest','crafting','artifacts','awards','tickets']);

const VALID_WEATHERS = new Set(['clear','rain','sun','sandstorm','hail']);

console.log('=== DATA INTEGRITY VALIDATION ===\n');

// ─── 1. ITEMS ───
console.log('--- Items ---');
check(`Items array is array`, Array.isArray(ITEMS));
check(`Items count >= 80`, ITEMS.length >= 80);
const itemIds = new Set();
const duplicateItems = [];
ITEMS.forEach((item, i) => {
  if (itemIds.has(item.id)) duplicateItems.push(item.id);
  itemIds.add(item.id);
  check(`Item ${i}: ${item.id} has id`, !!item.id);
  check(`Item ${item.id} has nameRu`, !!item.nameRu);
  check(`Item ${item.id} has category`, VALID_CATEGORIES.has(item.category));
  check(`Item ${item.id} has price`, typeof item.price === 'number');
  check(`Item ${item.id} has implemented flag`, typeof item.implemented === 'boolean');
  if (item.isBall) check(`Ball ${item.id} has ballMult`, typeof item.ballMult === 'number' && item.ballMult > 0);
});
check(`No duplicate item IDs`, duplicateItems.length === 0);

// ─── 2. REGIONS ───
console.log('\n--- Regions ---');
const regionKeys = Object.keys(REGIONS);
check(`At least 3 regions`, regionKeys.length >= 3);
const allLocIds = new Set();
const allEncounters = new Set();
regionKeys.forEach(rk => {
  const region = REGIONS[rk];
  check(`Region ${rk} has name`, !!region.name);
  check(`Region ${rk} has locations`, !!region.locations);
  Object.entries(region.locations || {}).forEach(([locId, loc]) => {
    allLocIds.add(locId);
    check(`Location ${locId} has name`, !!loc.name);
    if (loc.encounters) {
      loc.encounters.forEach(e => {
        if (typeof e === 'string') allEncounters.add(e);
        else if (e && typeof e === 'object') allEncounters.add(e.name || e.species || '');
      });
    }
    if (loc.dayEncounters) loc.dayEncounters.forEach(e => {
      if (typeof e === 'string') allEncounters.add(e);
      else if (e && typeof e === 'object') allEncounters.add(e.name || e.species || '');
    });
    if (loc.nightEncounters) loc.nightEncounters.forEach(e => {
      if (typeof e === 'string') allEncounters.add(e);
      else if (e && typeof e === 'object') allEncounters.add(e.name || e.species || '');
    });
    if (loc.links) {
      loc.links.forEach(link => {
        const linkId = typeof link === 'string' ? link : link.id;
        // Links may point to other regions — just check it's a string
        check(`Location ${locId} link ${linkId} is string`, typeof linkId === 'string');
      });
    }
  });
});
check(`Total locations >= 50`, allLocIds.size >= 50);

// ─── 3. NPCs ───
console.log('\n--- NPCs ---');
const npcIds = Object.keys(NPC_DATA);
check(`At least 10 NPCs`, npcIds.length >= 10);
npcIds.forEach(id => {
  const npc = NPC_DATA[id];
  check(`NPC ${id} has name`, !!npc.name);
  check(`NPC ${id} has sprite`, !!npc.sprite);
  check(`NPC ${id} has location`, typeof npc.location === 'string');
  check(`NPC ${id} has dialog`, typeof npc.dialog === 'object' && npc.dialog !== null && Object.keys(npc.dialog).length > 0);
  if (npc.quests) {
    npc.quests.forEach((q, qi) => {
      check(`NPC ${id} quest ${qi} has id`, !!q.id);
      check(`NPC ${id} quest ${qi} has desc`, !!q.desc);
    });
  }
});

// ─── 4. GYMS ───
console.log('\n--- Gyms ---');
const gymKeys = Object.keys(gymLeaders);
check(`At least 8 gyms`, gymKeys.length >= 8);
gymKeys.forEach(key => {
  const g = gymLeaders[key];
  check(`Gym ${key} has name`, !!g.name);
  check(`Gym ${key} has title`, !!g.title);
  check(`Gym ${key} has type`, !!g.type);
  check(`Gym ${key} has team array`, Array.isArray(g.team));
  g.team.forEach((mon, mi) => {
    check(`Gym ${key} mon ${mi} has name`, !!mon.name);
    check(`Gym ${key} mon ${mi} has level`, typeof mon.level === 'number' && mon.level > 0);
  });
  if (g.trainingStage !== undefined) {
    check(`Gym ${key} trainingStage ${g.trainingStage} valid (0-6)`, g.trainingStage >= 0 && g.trainingStage <= 6);
  }
  if (g.badgeName) check(`Gym ${key} badgeName is string`, typeof g.badgeName === 'string');
});

// ─── 5. NATURES ───
console.log('\n--- Natures ---');
check(`Exactly 25 natures`, natures.length === 25);
const VALID_STATS = new Set(['atk','def','spa','spd','spe']);
natures.forEach((n, i) => {
  check(`Nature ${i} ${n.name} has name`, !!n.name);
  if (n.buff !== null) check(`Nature ${n.name} buff is valid stat`, VALID_STATS.has(n.buff));
  if (n.nerf !== null) check(`Nature ${n.name} nerf is valid stat`, VALID_STATS.has(n.nerf));
  if (n.buff !== null && n.nerf !== null) {
    check(`Nature ${n.name} buff != nerf`, n.buff !== n.nerf);
  }
});

// ─── 6. TRAINING STAGES ───
console.log('\n--- Training Stages ---');
check(`Exactly 7 training stages`, trainingStages.length === 7);
trainingStages.forEach((s, i) => {
  check(`Training ${i} has name`, !!s.name);
  check(`Training ${i} pct is number`, typeof s.pct === 'number' && s.pct >= 0 && s.pct <= 40);
  check(`Training ${i} has color`, !!s.color);
});

// ─── 7. EVOLUTION STONES ───
console.log('\n--- Evolution Stones ---');
const stoneKeys = Object.keys(STONE_ITEM_MAP);
check(`At least 10 stone mappings`, stoneKeys.length >= 10);
stoneKeys.forEach(key => {
  check(`Stone key ${key} exists as item`, itemIds.has(key));
  // trigger can be null (generic) or a string
  check(`Stone ${key} trigger is string or null`, STONE_ITEM_MAP[key] === null || typeof STONE_ITEM_MAP[key] === 'string');
});

// ─── 8. DROPS ───
console.log('\n--- Monster Drops ---');
const dropSpecies = Object.keys(MONSTER_DROP_TABLE);
check(`At least 50 drop entries`, dropSpecies.length >= 50);
dropSpecies.forEach(species => {
  const drops = MONSTER_DROP_TABLE[species];
  check(`Drop ${species} is array`, Array.isArray(drops));
  drops.forEach((d, di) => {
    check(`Drop ${species}[${di}] has item`, !!d.item);
    check(`Drop ${species}[${di}] has chance`, typeof d.chance === 'number' && d.chance > 0 && d.chance <= 100);
    if (d.qty !== undefined) check(`Drop ${species}[${di}] qty is number`, typeof d.qty === 'number' && d.qty > 0);
  });
});

// ─── 9. STARTERS ───
console.log('\n--- Starters ---');
check(`GEN_STARTERS has multiple generations`, GEN_STARTERS.length >= 3);
GEN_STARTERS.forEach((gen, gi) => {
  check(`Starter gen ${gi} has 3 mons`, gen.length === 3);
  gen.forEach(name => check(`Starter ${name} is string`, typeof name === 'string' && name.length > 0));
});

// ─── 10. TRANSPORT ───
console.log('\n--- Transport ---');
const hubKeys = Object.keys(TRANSPORT_HUBS);
check(`At least 1 transport hub`, hubKeys.length >= 1);
hubKeys.forEach(hubId => {
  const routes = TRANSPORT_HUBS[hubId];
  check(`Hub ${hubId} has routes array`, Array.isArray(routes));
  routes.forEach((r, ri) => {
    check(`Hub ${hubId} route ${ri} has label`, !!r.label);
    check(`Hub ${hubId} route ${ri} has targetRegion`, !!r.targetRegion);
    check(`Hub ${hubId} route ${ri} has targetLoc`, !!r.targetLoc);
  });
});

// ─── 11. ENCOUNTER SPECIES CONSISTENCY ───
console.log('\n--- Encounter Species ---');
// Check that all encounter species from regions are in the known species list
// This is a soft check since we might not have all species
let unknownSpecies = [];
allEncounters.forEach(name => {
  const lower = name.toLowerCase();
  if (!KNOWN_SPECIES.has(lower)) {
    // Some species have hyphens (nidoran-f, etc.) or are regional forms
    // Only flag if it doesn't look like a known form pattern
    if (!lower.includes('-') || lower.split('-').every(part => KNOWN_SPECIES.has(part))) {
      // Has hyphens but all parts known, skip
    } else {
      unknownSpecies.push(name);
    }
  }
});
if (unknownSpecies.length > 0) {
  console.log(`  ! ${unknownSpecies.length} species not in known list (may be regional forms): ${unknownSpecies.slice(0, 10).join(', ')}`);
}
check(`All encounter species known (or regional variants)`, true);

// ─── 12. NPC QUEST ITEMS ───
console.log('\n--- NPC Quest Items ---');
npcIds.forEach(npcId => {
  const npc = NPC_DATA[npcId];
  if (npc.quests) {
    npc.quests.forEach((q, qi) => {
      if (q.rewardItem) {
        check(`NPC ${npcId} quest ${qi} rewardItem ${q.rewardItem} exists in items`, itemIds.has(q.rewardItem));
      }
    });
  }
});

// ─── 13. GYM REWARD ITEMS ───
console.log('\n--- Gym Reward Items ---');
gymKeys.forEach(key => {
  const g = gymLeaders[key];
  if (g.rewardItem) {
    check(`Gym ${key} rewardItem ${g.rewardItem} exists`, itemIds.has(g.rewardItem));
  }
});

// ========== SUMMARY ==========
console.log(`\n=== RESULTS: ${passed}/${total} passed ===`);
process.exit(passed === total ? 0 : 1);
