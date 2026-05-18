import crypto from 'crypto';

// Returns raw Buffer (needed for chained HMAC per Telegram spec)
function hmacSha256Buffer(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest();
}

// Returns hex string for final comparison
function hmacSha256Hex(key, data) {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

export function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');

  const sorted = [];
  for (const [key, value] of params.entries()) {
    sorted.push(`${key}=${value}`);
  }
  sorted.sort();

  const dataCheckString = sorted.join('\n');

  // Per Telegram docs:
  // secret_key = HMAC_SHA256(key="WebAppData", data=bot_token)  → raw bytes
  // hash       = HMAC_SHA256(key=secret_key,   data=check_string) → hex
  const secretKey = hmacSha256Buffer('WebAppData', botToken);
  const computedHash = hmacSha256Hex(secretKey, dataCheckString);

  if (computedHash !== hash) return null;

  const userStr = params.get('user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function parseTestUser(raw) {
  // Support custom test users via `test_{"id":N,"username":"s","first_name":"s"}`
  if (raw && raw.startsWith('{')) {
    try {
      const custom = JSON.parse(raw);
      if (custom && custom.id) return custom;
    } catch (_) {}
  }
  return {
    id: 123456789,
    first_name: 'Test',
    username: 'test_user'
  };
}
