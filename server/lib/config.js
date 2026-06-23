/**
 * Конфигурация сервера с Zod-валидацией env vars.
 * Заменяет ручной load-env.js и размазанные process.env чтения.
 *
 * Использование:
 *   import { config } from '../lib/config.js';
 *   console.log(config.port);
 *   console.log(config.jwtSecret);
 */
import { z } from 'zod';
import dotenv from 'dotenv';

// Загружаем .env если есть
dotenv.config();

const envSchema = z.object({
  // Сервер
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  ALLOWED_ORIGIN: z.string().default(''),

  // База данных
  DATA_DIR: z.string().default(''),
  RAILWAY_VOLUME_MOUNT_PATH: z.string().default(''),

  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required').default(''),

  // Админ (опционально)
  ADMIN_PASS: z.string().default(''),
  ADMIN_TOKEN: z.string().default(''),

  // Telegram
  BOT_TOKEN: z.string().default(''),

  // Логирование
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default(''),
  PINO_PRETTY: z.string().default(''),

  // Rate limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(60),
  RATE_LIMIT_MAX: z.coerce.number().default(500),
  SAVE_RATE_LIMIT_MAX: z.coerce.number().default(30),

  // PokeAPI
  POKEAPI_BASE_URL: z.string().default('https://pokeapi.co'),
});

function parseConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    // В production — падаем, иначе предупреждаем
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return result.data ?? envSchema.parse({});
}

export const config = parseConfig();

/**
 * Валидация обязательных env vars при старте.
 * JWT_SECRET критичен в production.
 */
if (config.NODE_ENV === 'production' && !config.JWT_SECRET) {
  console.error('❌ JWT_SECRET must be set in production!');
  process.exit(1);
}
