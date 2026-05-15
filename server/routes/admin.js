import { Router } from 'express';
import { getDB } from '../db.js';

const router = Router();

// Admin password
const ADMIN_PASS = 'league17admin2026';

// Middleware: check admin token
function adminAuth(req, res, next) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token === ADMIN_PASS) return next();
  if (req.path === '/' && !token) {
    return res.send(loginPage());
  }
  return res.status(401).json({ error: 'Unauthorized. Use ?token=PASSWORD' });
}

function loginPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title>
<style>body{font-family:monospace;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
input{padding:10px;font-size:1.2rem;border:2px solid #333;border-radius:6px;background:#111;color:#fff;width:200px}
button{padding:10px 20px;font-size:1.2rem;border:none;border-radius:6px;background:#af52de;color:#fff;cursor:pointer}
</style></head><body><form onsubmit="location.href='?token='+encodeURIComponent(document.getElementById('p').value)"><input id="p" type="password" placeholder="Password" autofocus><button>Login</button></form></body></html>`;
}

// --- Admin Dashboard ---
router.get('/', adminAuth, async (req, res) => {
  const db = getDB();
  const users = await db.all('SELECT id, telegram_id, username, first_name, created_at FROM users ORDER BY id DESC LIMIT 20');
  const saves = await db.all('SELECT user_id, save_data, updated_at FROM game_saves ORDER BY updated_at DESC LIMIT 20');
  const lb = await db.all(`SELECT u.username, u.first_name, l.* FROM leaderboard l JOIN users u ON u.id=l.user_id ORDER BY l.badges_count DESC LIMIT 20`);
  const chat = await db.all('SELECT * FROM chat_messages ORDER BY id DESC LIMIT 20');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>League-17 Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:monospace;background:#0a0a0a;color:#e0e0e0;padding:12px}
h1{color:#af52de;margin-bottom:12px}
h2{color:#5af;margin:16px 0 8px;font-size:1rem}
table{width:100%;border-collapse:collapse;font-size:0.75rem;margin-bottom:12px}
th,td{border:1px solid #222;padding:4px 6px;text-align:left;max-width:200px;overflow:hidden;white-space:nowrap}
th{background:#111;color:#af52de}
tr:hover{background:#111}
.section{display:flex;gap:12px;flex-wrap:wrap}
.col{flex:1;min-width:300px}
.btn{padding:6px 14px;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;margin:2px}
.btn-on{background:#34c759;color:#fff}
.btn-off{background:#ff3b30;color:#fff}
.btn-act{background:#007aff;color:#fff}
.btn-purp{background:#af52de;color:#fff}
input,select{padding:6px;border:1px solid #333;border-radius:4px;background:#111;color:#fff;font-size:0.8rem;margin:2px}
pre{background:#111;padding:8px;border-radius:4px;font-size:0.7rem;max-height:300px;overflow:auto}
.result{color:#5af;margin-top:4px;font-size:0.8rem}
</style></head><body>
<h1>🛠 League-17 Admin</h1>

<div class="section">
<div class="col">
<h2>🔧 Actions</h2>
<button class="btn btn-act" onclick="action('give_items','DjafarAdjarov')">🎒 Дать предметы DjafarAdjarov</button>
<button class="btn btn-act" onclick="action('give_items','nineinchkn5atmythroat')">🎒 Дать предметы nineinch</button>
<button class="btn btn-act" onclick="action('give_money','DjafarAdjarov','1000000')">💰 Дать 1M DjafarAdjarov</button>
<button class="btn btn-act" onclick="action('give_money','nineinchkn5atmythroat','1000000')">💰 Дать 1M nineinch</button>
<button class="btn btn-act" onclick="action('give_badges','DjafarAdjarov')">🏅 Дать значки DjafarAdjarov</button>
<button class="btn btn-act" onclick="action('give_badges','nineinchkn5atmythroat')">🏅 Дать значки nineinch</button>
<button class="btn btn-purp" onclick="action('give_legendary','DjafarAdjarov')">🦄 Легендарный DjafarAdjarov</button>
<button class="btn btn-purp" onclick="action('give_legendary','nineinchkn5atmythroat')">🦄 Легендарный nineinch</button>
<button class="btn btn-purp" onclick="action('heal_team','DjafarAdjarov')">🏥 Лечить DjafarAdjarov</button>
<button class="btn btn-purp" onclick="action('heal_team','nineinchkn5atmythroat')">🏥 Лечить nineinch</button>
<button class="btn btn-purp" onclick="action('max_iv','DjafarAdjarov')">⭐ Макс IV DjafarAdjarov</button>
<button class="btn btn-purp" onclick="action('max_iv','nineinchkn5atmythroat')">⭐ Макс IV nineinch</button>
<button class="btn btn-purp" onclick="action('fix_levels','DjafarAdjarov')">📈 Fix уровни DjafarAdjarov</button>
<button class="btn btn-purp" onclick="action('fix_levels','nineinchkn5atmythroat')">📈 Fix уровни nineinch</button>
<h2>💬 Chat as Claude</h2>
<input id="claude-msg" placeholder="Сообщение в чат..." style="width:100%;margin:4px 0;" onkeydown="if(event.key==='Enter')claudeChat()">
<button class="btn btn-purp" onclick="claudeChat()">Отправить как Claude AI</button>
<div class="result" id="chat-result"></div>
<br>
<div class="result" id="result"></div>
</div>

<div class="col">
<h2>📋 Leaderboard (${lb.length})</h2>
<table>${lb.map(e => `<tr><td>${e.first_name||e.username||'?'}</td><td>🏅${e.badges_count}</td><td>🐾${e.pokemon_count||0}</td><td>✨${e.legendary_count||0}</td><td>¥${e.money||0}</td></tr>`).join('')}</table>
</div></div>

<div class="section">
<div class="col">
<h2>👤 Users (${users.length})</h2>
<table><tr><th>ID</th><th>Telegram</th><th>Username</th><th>Name</th><th>Created</th></tr>
${users.map(u => `<tr><td>${u.id}</td><td>${u.telegram_id}</td><td>${u.username}</td><td>${u.first_name}</td><td>${u.created_at}</td></tr>`).join('')}</table>
</div>
<div class="col">
<h2>💾 Recent Saves</h2>
<table><tr><th>User</th><th>Updated</th><th>Size</th></tr>
${saves.map(s => `<tr><td>${s.user_id}</td><td>${s.updated_at}</td><td>${(s.save_data?.length||0)}b</td></tr>`).join('')}</table>
</div></div>

<script>
const TOKEN = '${req.query.token || ''}';
async function action(cmd, user, val) {
  const res = await fetch('/admin/api?token='+TOKEN+'&cmd='+cmd+'&user='+user+(val?'&val='+val:''));
  const json = await res.json();
  document.getElementById('result').innerText = JSON.stringify(json, null, 2);
}
async function claudeChat() {
  const inp = document.getElementById('claude-msg');
  const text = inp.value.trim();
  if(!text) return;
  const res = await fetch('/api/chat/bot', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({text, token:'claude-admin-2026'})
  });
  const json = await res.json();
  document.getElementById('chat-result').innerText = json.success ? '✅ Отправлено: '+text : '❌ Ошибка';
  inp.value = '';
}
</script>
</body></html>`;
  res.send(html);
});

// --- Admin API ---
router.get('/api', adminAuth, async (req, res) => {
  const { cmd, user, val } = req.query;
  const db = getDB();
  let result = { cmd, user };

  // Helper: resolve user by numeric ID or username
  async function resolveUser(idOrName) {
    const byId = await db.get('SELECT id FROM users WHERE id = ?', parseInt(idOrName));
    if (byId) return byId;
    return await db.get('SELECT id FROM users WHERE username = ?', idOrName);
  }

  try {
    const u = await resolveUser(user);
    if (!u && cmd !== 'give_items') {} // handled per-command

    if (cmd === 'give_items') {
      if (!u) { result.error = 'User not found'; return res.json(result); }
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save data'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      if (!data.inventory) data.inventory = {};
      const ALL_ITEMS = ['pokeball','greatBall','ultraBall','masterBall','quickBall','friendBall','loveBall','duskBall','timerBall','darkBall','potion','superPotion','fullRestore','candy','vitamin','train','weaken','evolutionStone','fireStone','waterStone','leafStone','thunderStone','moonStone','sunStone','shinyStone','duskStone','iceStone','dawnStone','tm','ppUp','sitrusBerry','oranBerry','lumBerry','chestoBerry','rawstBerry','antidote','antiparalyze','energyDrink','fireExtinguisher','healingHerb','weakElixir','elixir','strongElixir','xAttack','xDefense','xSpDefense','xSpAttack','xSpeed','protein','iron','calcium','zinc','carbos','luckyEgg','expShare','oldRod','goodRod','superRod','darkBall'];
      ALL_ITEMS.forEach(id => { data.inventory[id] = 999; });
      data.money = (data.money || 0) + 500000;
      data._v = (data._v || 0) + 10000; // bump version past any client
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      result = { status: 'ok', items: ALL_ITEMS.length, money: data.money };
    } else if (cmd === 'give_money') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      data.money = (data.money || 0) + parseInt(val || 100000);
      data._v = (data._v || 0) + 10000;
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      result = { status: 'ok', money: data.money };
    } else if (cmd === 'give_badges') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      data.badges = ['Boulder Badge','Cascade Badge','Thunder Badge','Rainbow Badge','Marsh Badge','Soul Badge','Volcano Badge','Earth Badge'];
      data._v = (data._v || 0) + 10000;
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      await db.run(`INSERT INTO leaderboard (user_id, badges_count, team_level_sum, money, updated_at) VALUES (?,8,50,?,datetime('now')) ON CONFLICT(user_id) DO UPDATE SET badges_count=8,updated_at=datetime('now')`, u.id, data.money||0);
      result = { status: 'ok', badges: 8 };
    } else if (cmd === 'give_legendary') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      const legends = ['mewtwo','mew','lugia','ho-oh','rayquaza','groudon','kyogre','dialga','palkia','giratina','zekrom','reshiram'];
      const pick = legends[Math.floor(Math.random()*legends.length)];
      try {
        const pokeRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pick}`);
        const pokeData = await pokeRes.json();
        const newMon = {
          uid: Date.now().toString(36)+Math.random().toString(36).substr(2,6),
          originalTrainer: String(u.id), createdAt: Date.now(), caughtLocation: 'admin',
          apiData: pokeData, maxHp: 200, currentHp: 200,
          ivs: {hp:31,atk:31,def:31,spa:31,spd:31,spe:31},
          evs: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
          baseLevel: 70, exp: 343000, expToNext: 357911,
          candiesEaten:0, vitaminsEaten:0, training:null, trainingStage:0, trainingStat:null,
          happiness:70, natureIdx:0, breedLetter:'S', status:null, sleepTurns:0,
          movesPP:[], statStages:{atk:0,def:0,spa:0,spd:0,spe:0},
          abilityName: pokeData.abilities[0]?.ability?.name||null,
          heldItem:null, berries:{sitrusBerry:0,oranBerry:0,lumBerry:0,chestoBerry:0,rawstBerry:0},
          learnableMoves:[]
        };
        data.myTeam = data.myTeam || [];
        data._v = (data._v || 0) + 10000;
        if (data.myTeam.length >= 6) data.myTeam[0] = newMon;
        else data.myTeam.push(newMon);
        await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
        result = { status: 'ok', pokemon: pick, teamSize: data.myTeam.length };
      } catch(e) { result.error = 'PokeAPI failed: '+e.message; }
    } else if (cmd === 'heal_team') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      data._v = (data._v || 0) + 10000;
      (data.myTeam||[]).forEach(m => { m.currentHp = m.maxHp; m.status = null; m.sleepTurns = 0; });
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      result = { status: 'ok', healed: data.myTeam.length };
    } else if (cmd === 'max_iv') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      data._v = (data._v || 0) + 10000;
      (data.myTeam||[]).forEach(m => { m.ivs = {hp:31,atk:31,def:31,spa:31,spd:31,spe:31}; });
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      result = { status: 'ok', mons: data.myTeam.length };
    } else if (cmd === 'fix_levels') {
      const u = await resolveUser(user);
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
      if (!save) { result.error = 'No save'; return res.json(result); }
      let data = JSON.parse(save.save_data);
      data._v = (data._v || 0) + 10000;
      (data.myTeam||[]).forEach(m => { if(m.baseLevel < 50) m.baseLevel = 50; m.maxHp = Math.floor(m.maxHp*1.5); m.currentHp = m.maxHp; });
      await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
      result = { status: 'ok', mons: data.myTeam.length };
    } else {
      result.error = 'Unknown command: '+cmd;
    }
  } catch(e) { result.error = e.message; }
  res.json(result);
});

// List all users for admin dropdown + trainers tab
router.get('/users', adminAuth, async (req, res) => {
  const db = getDB();
  const users = await db.all('SELECT id, telegram_id, username, first_name, nickname, avatar, registered, created_at, registered_at FROM users ORDER BY id DESC');
  for (const u of users) {
    const save = await db.get('SELECT save_data, updated_at FROM game_saves WHERE user_id = ?', u.id);
    const loc = await db.get('SELECT location_id, updated_at FROM user_locations WHERE user_id = ?', u.id);
    if (save) {
      try {
        const data = JSON.parse(save.save_data);
        u.badges = data.badges?.length || 0;
        u.money = data.money || 0;
        u.teamSize = (data.myTeam || []).length;
        u.lastSave = save.updated_at;
      } catch(e) { u.badges = 0; u.money = 0; u.teamSize = 0; }
    }
    u.lastLocation = loc?.location_id || null;
    u.lastSeen = loc?.updated_at || u.lastSave || u.created_at;
    u.region = u.lastLocation ? (u.lastLocation.includes('johto') ? 'Джото' : u.lastLocation.includes('selen') ? 'Селен' : 'Канто') : null;
  }
  res.json({ users });
});

// Health
router.get('/health', (req, res) => res.json({ ok: true }));

export default router;
