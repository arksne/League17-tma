import fs from 'fs';

/**
 * Безопасно парсит массив данных из TypeScript файла.
 * Извлекает `const ARRAY_NAME = [...]` и конвертирует в JSON без выполнения кода.
 * Работает с TS (unquoted keys, trailing commas, single quotes, type annotations).
 *
 * Этот файл используется ТОЛЬКО скриптом export-game-data.mjs при сборке.
 * Само приложение загружает данные из data/items.json и data/crafting_recipes.json.
 *
 * @param {string} filePath - Путь к .ts файлу
 * @param {string} arrayName - Имя переменной массива (ITEMS, CRAFTING_RECIPES, etc.)
 * @returns {Array|null} - Распарсенный массив или null при ошибке
 */
export function safeParseTSArray(filePath, arrayName) {
  try {
    const src = fs.readFileSync(filePath, 'utf8');
    return extractArrayFromTS(src, arrayName);
  } catch (e) {
    console.error(`safeParseTSArray: error reading ${filePath}:`, e.message);
    return null;
  }
}

/**
 * Внутренняя функция: безопасно парсит массив из TS-строки.
 */
function extractArrayFromTS(src, arrayName) {
  const escapedName = arrayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${escapedName}\\s*(?::\\s*\\w+(?:<[^>]*>)?\\[\\])?\\s*=\\s*(\\[[\\s\\S]*?\\])\\s*;`);
  const match = src.match(regex);
  if (!match) {
    console.warn(`safeParseTSArray: could not find "${arrayName}" array`);
    return null;
  }

  return JSON.parse(
    match[1]
      // 1. Remove TypeScript type annotations (`: ItemDef[]`, `as const`)
      .replace(/:\s*\w+(?:<[^>]*>)?\[\]|\s*as\s+const\b/g, '')
      // 2. Remove comments (// at line start + /* */)
      .replace(/^\s*\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      // 3. Quote unquoted property keys: { key: value } → { "key": value }
      .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      // 4. Convert single quotes to double (items.ts uses single-quoted strings)
      .replace(/'/g, '"')
      // 5. Remove trailing commas before closing brackets
      .replace(/,\s*([}\]])/g, '$1'),
  );
}
