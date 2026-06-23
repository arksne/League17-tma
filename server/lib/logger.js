/**
 * Структурированное логирование через Pino.
 * Заменяет ручные fs.createWriteStream логгеры.
 *
 * Использование:
 *   import { logger, requestLogger } from '../lib/logger.js';
 *   logger.info({ userId: 1 }, 'User logged in');
 *   logger.error({ err }, 'Failed to process save');
 */
import pino from 'pino';
import pinoHttp from 'pino-http';

// Уровень логирования: debug в dev, info в production
const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

export const logger = pino({
  level,
  // В dev — читаемый вывод, в prod — JSON для log aggregators
  transport: process.env.NODE_ENV !== 'production' || process.env.PINO_PRETTY === '1'
    ? { target: 'pino/file', options: { destination: 1 } }
    : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.query.token', 'req.body.token'],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Express middleware для автоматического логирования HTTP запросов.
 * Использование: app.use(requestLogger)
 *
 * Автоматически:
 * - Логирует метод, URL, статус, длительность
 * - Redact'ит токены из URL
 * - Добавляет req.log для ручного логирования в route handler
 */
export const requestLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === '/api/health',
  },
  customLogLevel: (res, err) => {
    if (res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Redact sensitive query params
  customProps: (req) => ({
    url: req.originalUrl?.replace(/\?token=[^&]*($|&)/, '?token=REDACTED$1'),
  }),
});

/**
 * Log stream for legacy code that writes to file streams.
 * Writes everything at 'info' level.
 */
export const logStream = {
  write: (msg) => {
    logger.info(msg.trim());
  },
};
