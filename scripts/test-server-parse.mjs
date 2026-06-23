// Test server-side items.ts parsing
import { readFileSync } from 'fs';

const src = readFileSync('src/data/items.ts', 'utf-8');
const escapedName = 'ITEMS'.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const regex = new RegExp('(?:export\\s+)?(?:const|let|var)\\s+' + escapedName + '\\s*(?::\\s*\\w+(?:<[^>]*>)?\\[\\])?\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;');
const match = src.match(regex);
if (match) {
  const raw = match[1];
  console.log('Found ITEMS array: length=' + raw.length);
  try {
    const jsonStr = raw
      .replace(/:\s*\w+(?:<[^>]*>)?\[\]|\s*as\s+const\b/g, '')
      .replace(/^\s*\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*([}\]])/g, '$1');
    const parsed = JSON.parse(jsonStr);
    console.log('SUCCESS: Parsed ' + parsed.length + ' items');
    console.log('First: id=' + parsed[0].id + ' category=' + parsed[0].category);
    // Check a drop item
    const oran = parsed.find(i => i.id === 'oranBerry');
    console.log('oranBerry: ' + (oran ? 'found, category=' + oran.category : 'NOT FOUND'));
    const spellTag = parsed.find(i => i.id === 'spellTag');
    console.log('spellTag: ' + (spellTag ? 'found, category=' + spellTag.category : 'NOT FOUND'));
  } catch (e) {
    console.log('PARSE ERROR: ' + e.message);
    // Show problematic area
    const jsonStr = raw
      .replace(/:\s*\w+(?:<[^>]*>)?\[\]|\s*as\s+const\b/g, '')
      .replace(/^\s*\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      .replace(/'/g, '"');
    console.log('Around error: ...' + jsonStr.substring(e.message.match(/\d+/)?.[0] ? Math.max(0, parseInt(e.message.match(/\d+/)[0]) - 50) : 0, (e.message.match(/\d+/)?.[0] ? parseInt(e.message.match(/\d+/)[0]) : 0) + 50) + '...');
  }
}
