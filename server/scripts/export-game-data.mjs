/**
 * Export game data from .ts files to .json at build / first-run time.
 * Устраняет dependency на safeParseTSArray при каждом запуске сервера.
 *
 * Запуск: node server/scripts/export-game-data.mjs
 */
import { safeParseTSArray } from '../lib/safe-parse-ts.js';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../../data');

mkdirSync(DATA_DIR, { recursive: true });

const files = [
  {
    tsPath: join(__dirname, '../../src/data/items.ts'),
    arrayName: 'ITEMS',
    outFile: join(DATA_DIR, 'items.json'),
  },
  {
    tsPath: join(__dirname, '../../src/ui/crafting.ts'),
    arrayName: 'CRAFTING_RECIPES',
    outFile: join(DATA_DIR, 'crafting_recipes.json'),
  },
];

let exported = 0;
for (const { tsPath, arrayName, outFile } of files) {
  const data = safeParseTSArray(tsPath, arrayName);
  if (!data) {
    console.error(`✗ Failed to parse ${arrayName} from ${tsPath}`);
    process.exit(1);
  }
  writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log(`✓ ${arrayName} (${data.length} entries) → ${outFile}`);
  exported++;
}

console.log(`\n✅ Exported ${exported} data file(s) to ${DATA_DIR}`);
