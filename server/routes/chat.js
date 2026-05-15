import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { getIO } from '../socket.js';

const router = Router();

// Send a chat message (auth required)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Message text is required' });
    }
    if (text.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 chars)' });
    }

    const db = getDB();

    // Get user info
    const user = await db.get('SELECT username, first_name FROM users WHERE id = ?', req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await db.run(
      `INSERT INTO chat_messages (user_id, username, first_name, text) VALUES (?, ?, ?, ?)`,
      req.userId,
      user.username || '',
      user.first_name || '',
      text.trim()
    );

    // Broadcast to all connected clients via Socket.IO
    const msg = {
      id: result.lastID,
      user_id: req.userId,
      username: user.username || '',
      first_name: user.first_name || '',
      text: text.trim(),
      created_at: new Date().toISOString()
    };
    const io = getIO();
    if (io) io.emit('chat_message', msg);

    res.json({ success: true });
  } catch (err) {
    console.error('Chat send error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get chat messages (public, no auth required for reading)
router.get('/messages', async (req, res) => {
  try {
    const db = getDB();
    const since = req.query.since;

    let messages;
    if (since) {
      messages = await db.all(
        `SELECT id, user_id, username, first_name, text, created_at
         FROM chat_messages
         WHERE created_at > ?
         ORDER BY created_at ASC
         LIMIT 50`,
        since
      );
    } else {
      messages = await db.all(
        `SELECT id, user_id, username, first_name, text, created_at
         FROM chat_messages
         ORDER BY created_at DESC
         LIMIT 50`
      );
      messages.reverse();
    }

    res.json({ messages });
  } catch (err) {
    console.error('Chat messages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
