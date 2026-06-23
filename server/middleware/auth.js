import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SECRET_FILE = path.join(__dirname, '../../data/jwt_secret');

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  try {
    JWT_SECRET = fs.readFileSync(SECRET_FILE, 'utf8').trim();
    if (process.env.NODE_ENV === 'production') {
      console.error('SECURITY: JWT_SECRET loaded from file. Set JWT_SECRET env var in production!');
    }
  } catch {
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
    try {
      fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true });
      fs.writeFileSync(SECRET_FILE, JWT_SECRET);
      console.warn('Generated and saved JWT_SECRET to disk. Set JWT_SECRET env var for production.');
    } catch (e) {
      console.warn('Could not persist JWT_SECRET to disk:', e.message);
      console.warn('Sessions will be invalidated on next restart.');
    }
  }
}

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

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function generateToken(userId, telegramId) {
  return jwt.sign({ userId, telegramId }, JWT_SECRET, { expiresIn: '7d' });
}

export { JWT_SECRET };
