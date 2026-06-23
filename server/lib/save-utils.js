// Shared utilities for save data handling
import zlib from 'zlib';

/**
 * Decompress save_data if stored compressed (Z: prefix).
 * Returns parsed object or null on failure.
 */
export function decompressSave(raw) {
  if (!raw) return null;
  if (raw.startsWith('Z:')) {
    try { return JSON.parse(zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString()); } catch (e) { return null; }
  }
  try { return JSON.parse(raw); } catch (e) { return null; }
}
