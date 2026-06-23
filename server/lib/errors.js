/**
 * Централизованная система обработки ошибок.
 * Заменяет try/catch с res.status(500) в каждом route.
 *
 * Использование:
 *   import { AppError, asyncHandler } from '../lib/errors.js';
 *
 *   router.get('/example', asyncHandler(async (req, res) => {
 *     throw new AppError('Not found', 404, 'NOT_FOUND');
 *     // или просто throw new AppError('message');
 *   }));
 */
import { logger } from './logger.js';

/**
 * Класс типизированной ошибки с HTTP статусом и кодом.
 */
export class AppError extends Error {
  /**
   * @param {string} message — человекочитаемое сообщение
   * @param {number} statusCode — HTTP статус (default 400)
   * @param {string} code — машинный код ошибки (default 'BAD_REQUEST')
   * @param {object} [details] — дополнительные детали
   */
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Обёртка для async route handlers.
 * Ловит ошибки и передаёт их в error middleware.
 *
 * @param {Function} fn — async (req, res, next) => { ... }
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Status code mapping for common error codes.
 */
const HTTP_STATUSES = {
  NOT_FOUND: 404,
  VALIDATION_FAILED: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  STALE_SAVE: 409,
  NOT_IMPLEMENTED: 501,
};

/**
 * Create an AppError from a code + message shorthand.
 */
export function createError(code, message, details = null) {
  const status = HTTP_STATUSES[code] || 500;
  return new AppError(message, status, code, details);
}

/**
 * Express error-handling middleware.
 * Должен быть зарегистрирован ПОСЛЕ всех route handler'ов.
 *
 * app.use(errorHandler);
 */
export function errorHandler(err, req, res, _next) {
  // AppError — известная ошибка, логируем по статусу
  if (err instanceof AppError) {
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel]({
      err,
      userId: req.userId,
      url: req.originalUrl,
      code: err.code,
      statusCode: err.statusCode,
    }, err.message);

    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Zod validation error
  if (err.name === 'ZodError') {
    logger.warn({
      err,
      userId: req.userId,
      url: req.originalUrl,
    }, 'Validation failed');

    return res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_FAILED',
      details: err.issues?.map(i => ({
        path: i.path.join('.'),
        message: i.message,
      })) || [],
    });
  }

  // Неизвестная ошибка — 500
  logger.error({
    err,
    userId: req.userId,
    url: req.originalUrl,
  }, 'Unhandled error');

  if (res.headersSent) return;

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL',
  });
}
