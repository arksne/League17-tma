import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (console.warn('WARNING: JWT_SECRET not set, using insecure default!'), 'league17-dev-secret-2026');

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function generateToken(userId, telegramId) {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
