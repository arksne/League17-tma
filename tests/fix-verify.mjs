// Verify last 3 fixes: egg duplication, lastMoveCheckLevel, offerLearnMove reserve

import { readFileSync } from 'fs';

const mainJs = readFileSync('main.js', 'utf8');
const levelupJs = readFileSync('src/ui/levelup_moves.js', 'utf8');

let total = 0, passed = 0;
function check(desc, ok) {
  total++;
  if (ok) { passed++; console.log(`  ✓ ${total}: ${desc}`); }
  else { console.log(`  ✗ ${total}: ${desc}`); }
}

console.log('--- Fix 1: Egg hatching duplication ---\n');

check('hatchEgg removes egg from myTeam',
  mainJs.includes("myTeam.findIndex(m => m.uid === egg.uid)") &&
  mainJs.includes("myTeam.splice(eggIdx, 1)")
);

check('Removal happens before push (prevent duplicate slot)',
  mainJs.indexOf('myTeam.splice(eggIdx, 1)') < mainJs.indexOf('myTeam.push(newMon)')
);

check('hatchEgg still pushes newMon after removal',
  mainJs.includes('myTeam.push(newMon)')
);

console.log('\n--- Fix 2: lastMoveCheckLevel save/load ---\n');

check('lastMoveCheckLevel saved in getFullSaveData for myTeam',
  mainJs.includes('lastMoveCheckLevel: m.lastMoveCheckLevel')
);

check('lastMoveCheckLevel saved in getFullSaveData for pcBoxes',
  mainJs.match(/lastMoveCheckLevel: m\.lastMoveCheckLevel/g)?.length >= 2
);

check('lastMoveCheckLevel initialized on load',
  mainJs.includes("lastMoveCheckLevel = m.baseLevel")
);

console.log('\n--- Fix 3: Move learning auto-reserve ---\n');

check('offerLearnMove no longer imports showSelectionModal',
  !levelupJs.includes('showSelectionModal')
);

check('offerLearnMove pushes to learnableMoves when slots full',
  levelupJs.includes('learnableMoves.push') &&
  levelupJs.includes('все слоты заняты')
);

check('Empty slot still auto-learns (no modal)',
  levelupJs.includes('emptySlot >= 0') &&
  levelupJs.includes('resolve(true)')
);

check('No showSelectionModal call remains',
  !levelupJs.includes('showSelectionModal')
);

console.log(`\n=== RESULT: ${passed}/${total} passed ===`);
process.exit(passed === total ? 0 : 1);
