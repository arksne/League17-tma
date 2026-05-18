import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { getIO } from '../socket.js';
import zlib from 'zlib';

const router = Router();

// Claude AI bot helpers
const CLAUDE_ID = 0;
const CLAUDE_USERNAME = 'Claude_AI';
const CLAUDE_NAME = 'Claude AI';
const ADMIN_USERNAMES = new Set(['DjafarAdjarov', 'nineinchkn5atmythroat']);

function decompressSave(raw) {
  if (!raw) return null;
  if (raw.startsWith('Z:')) {
    try { return JSON.parse(zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString()); } catch(e) { return null; }
  }
  try { return JSON.parse(raw); } catch(e) { return null; }
}

async function sendClaudeMessage(text, io, db) {
  const msg = {
    id: Date.now(),
    user_id: CLAUDE_ID,
    username: CLAUDE_USERNAME,
    first_name: CLAUDE_NAME,
    text,
    created_at: new Date().toISOString()
  };
  try {
    await db.run('INSERT INTO chat_messages (user_id, username, first_name, text) VALUES (?, ?, ?, ?)',
      CLAUDE_ID, CLAUDE_USERNAME, CLAUDE_NAME, text);
  } catch(e) { /* ignore */ }
  if (io) io.emit('chat_message', msg);
  return msg;
}

async function claudeAutoReply(userText, io, db, username) {
  // Only respond to admin usernames
  if (!ADMIN_USERNAMES.has(username)) return;

  const t = userText.trim();

  // /claude — прямой канал в Claude Code (до проверки !)
  if (t.startsWith('/claude') || t.startsWith('/клод')) {
    const msg = t.replace(/^\/claude\s*|^\/клод\s*/i, '');
    const text = msg
      ? `🤖 Принято! Claude обрабатывает: "${msg.slice(0,60)}${msg.length>60?'...':''}"`
      : 'ℹ️ Формат: /claude <сообщение>. Claude Code увидит и ответит.';
    if (msg) console.log('[CLAUDE_CMD] from', username, ':', msg);
    setTimeout(() => sendClaudeMessage(text, io, db), 300);
    return;
  }

  if (!t.startsWith('!')) return; // Only commands

  const parts = t.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  let reply = null;

  if (cmd === '!help' || cmd === '!помощь' || cmd === '!хелп' || cmd === '!команды') {
    reply = `🤖 Команды Claude:
/claude ТЕКСТ — передать сообщение Claude Code (отвечу позже)
!статус — статистика сервера
!игроки — список игроков
!лог — последние сообщения чата
!дай предметы USERNAME — дать предметы x99
!дай деньги USERNAME N — дать N кредитов
!дай значки USERNAME — все 8 значков
!хил USERNAME — лечить команду
!ив USERNAME — макс IV
!лега USERNAME — легендарный покемон
!фикс USERNAME — уровни до 50`;
  } else if (cmd === '!status' || cmd === '!статус' || cmd === '!server' || cmd === '!сервер') {
    const users = await db.all('SELECT COUNT(*) as c FROM users');
    const saves = await db.all('SELECT COUNT(*) as c FROM game_saves');
    const msgs = await db.all('SELECT COUNT(*) as c FROM chat_messages');
    const lb = await db.all('SELECT u.username, u.first_name, l.badges_count, l.money FROM leaderboard l JOIN users u ON u.id=l.user_id ORDER BY l.badges_count DESC LIMIT 5');
    const top = lb.map((e,i) => `${i+1}. ${e.first_name||e.username}: 🏅${e.badges_count} ¥${e.money}`).join(', ');
    reply = `📊 Сервер: ${users[0].c} игроков, ${saves[0].c} сохранений, ${msgs[0].c} сообщений. Топ: ${top}`;
  } else if (cmd === '!игроки' || cmd === '!players' || cmd === '!users') {
    const users = await db.all('SELECT username, first_name, created_at FROM users ORDER BY id DESC LIMIT 10');
    reply = '👤 Игроки: ' + users.map(u => u.first_name||u.username).join(', ');
  } else if (cmd === '!лог' || cmd === '!log' || cmd === '!chat') {
    const msgs = await db.all('SELECT username, first_name, text, created_at FROM chat_messages ORDER BY id DESC LIMIT 5');
    reply = '💬 Чат: ' + msgs.map(m => `[${m.first_name||m.username}]: ${m.text.slice(0,40)}`).join(' | ');
  } else if (cmd === '!дай' && parts[1] === 'предметы' && parts[2]) {
    const target = parts[2];
    const u = await db.get('SELECT id FROM users WHERE username = ?', target);
    if (!u) { reply = 'Игрок не найден: ' + target; }
    else {
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { reply = 'Нет сохранения у ' + target; }
      else {
        let data = decompressSave(save.save_data);
        if (!data) { reply = 'Ошибка чтения сейва ' + target; }
        else {
          if (!data.inventory) data.inventory = {};
          ['pokeball','greatBall','ultraBall','masterBall','potion','superPotion','fullRestore','candy','vitamin','train','weaken','evolutionStone','fireStone','waterStone','leafStone','thunderStone','moonStone','tm','ppUp','antidote','antiparalyze','energyDrink','fireExtinguisher','elixir','strongElixir','luckyEgg','expShare','oldRod','goodRod','superRod','darkBall'].forEach(id => { data.inventory[id] = 99; });
          data.money = (data.money||0) + 100000;
          await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
          reply = `✅ ${target}: предметы x99 + 100к¥`;
        }
      }
    }
  } else if (cmd === '!дай' && parts[1] === 'деньги' && parts[2]) {
    const target = parts[2]; const amount = parseInt(parts[3]) || 100000;
    const u = await db.get('SELECT id FROM users WHERE username = ?', target);
    if (!u) { reply = 'Игрок не найден: ' + target; }
    else {
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { reply = 'Нет сохранения'; }
      else {
        let data = decompressSave(save.save_data); data.money = (data.money||0) + amount;
        await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
        reply = `💰 ${target}: +${amount}¥ (теперь ${data.money}¥)`;
      }
    }
  } else if (cmd === '!дай' && parts[1] === 'значки' && parts[2]) {
    const target = parts[2];
    const u = await db.get('SELECT id FROM users WHERE username = ?', target);
    if (!u) { reply = 'Игрок не найден'; }
    else {
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { reply = 'Нет сохранения'; }
      else {
        let data = decompressSave(save.save_data);
        data.badges = ['Boulder Badge','Cascade Badge','Thunder Badge','Rainbow Badge','Marsh Badge','Soul Badge','Volcano Badge','Earth Badge'];
        await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
        reply = `🏅 ${target}: 8 значков!`;
      }
    }
  } else if (cmd === '!хил' && parts[1]) {
    const target = parts[1];
    const u = await db.get('SELECT id FROM users WHERE username = ?', target);
    if (!u) { reply = 'Игрок не найден'; }
    else {
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { reply = 'Нет сохранения'; }
      else {
        let data = decompressSave(save.save_data); (data.myTeam||[]).forEach(m => { m.currentHp=m.maxHp; m.status=null; m.sleepTurns=0; });
        await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
        reply = `🏥 ${target}: команда вылечена`;
      }
    }
  } else if (cmd === '!ив' && parts[1]) {
    reply = await fixPlayer(parts[1], db, (m) => { m.ivs = {hp:31,atk:31,def:31,spa:31,spd:31,spe:31}; }, '⭐ макс IV');
  } else if (cmd === '!лега' && parts[1]) {
    const target = parts[1];
    const u = await db.get('SELECT id FROM users WHERE username = ?', target);
    if (!u) { reply = 'Игрок не найден'; }
    else {
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { reply = 'Нет сохранения'; }
      else {
        const legends = ['mewtwo','mew','lugia','ho-oh','rayquaza','groudon','kyogre','dialga','palkia','zekrom','reshiram'];
        const pick = legends[Math.floor(Math.random()*legends.length)];
        let data = decompressSave(save.save_data);
        try {
          const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pick}`);
          const pokeData = await pokeRes.json();
          const newMon = {
            uid: Date.now().toString(36)+Math.random().toString(36).substr(2,6),
            originalTrainer: String(u.id), createdAt: Date.now(), caughtLocation: 'claude_bot',
            apiData: pokeData, maxHp: 200, currentHp: 200,
            ivs: {hp:31,atk:31,def:31,spa:31,spd:31,spe:31},
            evs: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
            baseLevel: 70, exp: 343000, expToNext: 357911,
            candiesEaten:0, vitaminsEaten:0, training:null, trainingStage:0, trainingStat:null,
            happiness:70, natureIdx:Math.floor(Math.random()*25), breedLetter:'S', status:null, sleepTurns:0,
            movesPP:[], statStages:{atk:0,def:0,spa:0,spd:0,spe:0},
            abilityName: pokeData.abilities[0]?.ability?.name||null,
            heldItem:null, berries:{sitrusBerry:0,oranBerry:0,lumBerry:0,chestoBerry:0,rawstBerry:0},
            learnableMoves:[]
          };
          data.myTeam = data.myTeam || [];
          if (data.myTeam.length >= 6) data.myTeam[0] = newMon;
          else data.myTeam.push(newMon);
          await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
          reply = `🦄 ${target}: ${pick} добавлен!`;
        } catch(e) { reply = 'Ошибка PokeAPI'; }
      }
    }
  } else if (cmd === '!фикс' && parts[1]) {
    reply = await fixPlayer(parts[1], db, (m) => { if(m.baseLevel<50) m.baseLevel=50; m.maxHp=Math.floor(m.maxHp*1.5); m.currentHp=m.maxHp; }, '📈 уровни до 50');
  } else if (cmd === '!test' || cmd === '!тест') {
    reply = '✅ Claude online. Жду команд.';
  }

  if (reply) {
    setTimeout(() => sendClaudeMessage(reply, io, db), 300 + Math.random() * 500);
  }
}

async function fixPlayer(username, db, fn, label) {
  const u = await db.get('SELECT id FROM users WHERE username = ?', username);
  if (!u) return 'Игрок не найден: ' + username;
  const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
  if (!save) return 'Нет сохранения у ' + username;
  let data = decompressSave(save.save_data);
  (data.myTeam||[]).forEach(fn);
  await db.run('UPDATE game_saves SET save_data=?, updated_at=datetime(\'now\') WHERE user_id=?', JSON.stringify(data), u.id);
  return `${label}: ${username} (${data.myTeam.length} покемонов)`;
}

// In-memory rate limit for chat (5 msg/min per user)
const chatRateMap = new Map();
setInterval(() => chatRateMap.clear(), 60_000);

// Send a chat message (auth required)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    // Per-user rate limit
    const now = Date.now();
    const userTimestamps = chatRateMap.get(req.userId) || [];
    const recent = userTimestamps.filter(t => now - t < 60_000);
    if (recent.length >= 5) {
      return res.status(429).json({ error: 'Слишком часто! Подождите минуту.' });
    }
    recent.push(now);
    chatRateMap.set(req.userId, recent);

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

    // Claude AI auto-reply (admin commands only)
    claudeAutoReply(text.trim(), io, db, user.username);

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

// Bot endpoint — Claude can send messages
router.post('/bot', async (req, res) => {
  const { text, token } = req.body;
  if (token !== (process.env.BOT_TOKEN || 'claude-admin-2026')) return res.status(401).json({ error: 'Unauthorized' });
  if (!text) return res.status(400).json({ error: 'Text required' });
  const db = getDB();
  const io = getIO();
  const msg = await sendClaudeMessage(text, io, db);
  res.json({ success: true, msg });
});

export { sendClaudeMessage, CLAUDE_USERNAME, CLAUDE_NAME, CLAUDE_ID };
export default router;
