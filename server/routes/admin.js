import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { MONSTER_DROP_TABLE } from '../../src/data/drops.js';
import { decompressSave } from '../lib/save-utils.js';
import { getIO, notifyUser } from '../socket.js';
import { asyncHandler, AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const ADMIN_IDS = (process.env.ADMIN_IDS || '1394113078').split(',').map(Number).filter(n => !isNaN(n));
const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES || 'nineinchkn5atmythroat').split(',');
const ADMIN_PASS = process.env.ADMIN_PASS;

// Load admin HTML template once
let ADMIN_HTML = '';
try { ADMIN_HTML = readFileSync(join(__dirname, 'admin.html'), 'utf8'); } catch(e) { ADMIN_HTML = '<h1>admin.html not found</h1>'; }

function parseCookies(req) {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(c => {
      const idx = c.indexOf('=');
      if (idx > -1) cookies[c.slice(0, idx).trim()] = decodeURIComponent(c.slice(idx + 1).trim());
    });
  }
  return cookies;
}

function adminAuth(req, res, next) {
  const cookies = parseCookies(req);
  const token = req.headers['x-admin-token'] || req.query.token || cookies.admin_token;

  // If ADMIN_PASS is set, use password auth
  if (ADMIN_PASS) {
    if (token === ADMIN_PASS) {
      // Set httpOnly cookie on first auth so subsequent requests don't need ?token=
      if (!cookies.admin_token && req.method === 'GET') {
        res.setHeader('Set-Cookie', `admin_token=${encodeURIComponent(ADMIN_PASS)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=86400`);
      }
      return next();
    }
    // Show login page for GET /admin without token
    if (req.path === '/' && req.method === 'GET' && !token) return res.send(loginPage());
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // No ADMIN_PASS — use Telegram-based auth
  return authMiddleware(req, res, async () => {
    const db = getDB();
    const user = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
    if (user && (ADMIN_IDS.includes(Number(req.userId)) || ADMIN_USERNAMES.includes(user.username))) {
      req.adminUsername = user.username;
      return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
  });
}

function loginPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title>
<style>body{font-family:monospace;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
input{padding:10px;font-size:1.2rem;border:2px solid #333;border-radius:6px;background:#111;color:#fff;width:200px}
button{padding:10px 20px;font-size:1.2rem;border:none;border-radius:6px;background:#af52de;color:#fff;cursor:pointer}
#error{color:#ff4444;display:none;margin-top:10px}
</style></head><body>
<form id="loginForm"><input id="p" type="password" placeholder="Password" autofocus><button type="submit">Login</button></form>
<div id="error"></div>
<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pwd = document.getElementById('p').value;
  try {
    const r = await fetch('login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({token: pwd})
    });
    if (r.ok) { location.href = location.pathname; }
    else { const d = await r.json(); document.getElementById('error').textContent = d.error || 'Login failed'; document.getElementById('error').style.display = 'block'; }
  } catch(e) { document.getElementById('error').textContent = 'Network error'; document.getElementById('error').style.display = 'block'; }
});
</script>
</body></html>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// POST login endpoint — accepts token in body, sets httpOnly cookie
router.post('/login', asyncHandler(async (req, res) => {
  try {
    logger.info('Login attempt from IP:', req.ip || req.socket.remoteAddress);
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token is required' });
    if (ADMIN_PASS && token === ADMIN_PASS) {
      res.setHeader('Set-Cookie', `admin_token=${encodeURIComponent(ADMIN_PASS)}; Path=/admin; HttpOnly; SameSite=Lax; Max-Age=86400`);
      return res.json({ ok: true });
    }
    return res.status(401).json({ error: 'Invalid password' });
  } catch (e) {
    logger.error('Login error:', e);
    return res.status(500).json({ error: e.message });
  }
}));

// --- Dashboard ---
router.get('/', adminAuth, asyncHandler(async (req, res) => {
  const db = getDB();
  const users = await db.all('SELECT id, telegram_id, username, first_name FROM users ORDER BY id');
  const lb = await db.all('SELECT u.username, u.first_name, l.* FROM leaderboard l JOIN users u ON u.id=l.user_id ORDER BY l.badges_count DESC LIMIT 30');
  const cookies = parseCookies(req);
  const token = req.query.token || cookies.admin_token || '';

  const userOptions = users.map(u =>
    `<option value="${u.id}">#${u.id} ${esc(u.username||'?')} (${esc(u.first_name||'')})</option>`
  ).join('');

  const lbTable = `<table><tr><th>Игрок</th><th>Значки</th><th>Покемонов</th><th>¥</th></tr>
    ${lb.map(e => `<tr><td>${esc(e.first_name||e.username||'?')}</td><td>${e.badges_count}</td><td>${e.pokemon_count||0}</td><td>${e.money||0}</td></tr>`).join('')}</table>`;

  let html = ADMIN_HTML
    .replace('__USER_OPTIONS__', userOptions)
    .replace('__LEADERBOARD_TABLE__', lbTable)
    .replace('__TOKEN__', token)
    .replace('__ADMIN_USERNAME__', esc(req.adminUsername || ''));

  res.send(html);
}));

// --- Admin API ---
// Shared helpers for admin API handlers
async function resolveUser(idOrName) {
  const db = getDB();
  const byId = await db.get('SELECT id FROM users WHERE id = ?', parseInt(idOrName, 10));
  if (byId) return byId;
  return await db.get('SELECT id FROM users WHERE username = ?', idOrName);
}

async function getSave(u) {
  const db = getDB();
  const row = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
  if (!row) return null;
  return decompressSave(row.save_data);
}

async function putSave(u, data) {
  const db = getDB();
  data._v = Date.now();
  await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
  try {
    notifyUser(u.id, 'save_updated', {});
  } catch(e) {}
}

router.get('/api', adminAuth, asyncHandler(async (req, res) => {
  const { cmd, user, val } = req.query;
  const db = getDB();
  let result = { cmd, user };

  try {
    if (!user) { result.error = 'Missing user parameter'; return res.json(result); }
    const u = await resolveUser(user);

    if (cmd === 'get_save') {
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await getSave(u);
      if (!save) { result.error = 'No save data for this user'; return res.json(result); }
      let POKEDEX_ALL = [];
      try {
        const pdata = JSON.parse(readFileSync(join(process.cwd(), 'public/pokedex_data.json'), 'utf8'));
        POKEDEX_ALL = Object.keys(pdata);
      } catch(e) {}
      result = { status: 'ok', userId: u.id, username: user, save, pokedexAll: POKEDEX_ALL };
      return res.json(result);
    }

    if (cmd === 'set_save') {
      return res.status(400).json({ error: 'Use POST for set_save' });
    }

    // Drops config is global — no user/save needed
    if (cmd === 'get_drops') {
      const dropsDir = join(__dirname, '../../data');
      const dropsPath = join(dropsDir, 'drop_config.json');
      const UNIVERSAL_DROPS_DEFAULT = [
        { item: 'prettyWing', chance: 0.04, qty: 1 },
        { item: 'nugget', chance: 0.02, qty: 1 },
        { item: 'starPiece', chance: 0.01, qty: 1 },
      ];
      let config;
      try {
        config = JSON.parse(readFileSync(dropsPath, 'utf8'));
      } catch (e) {
        config = { monsterDrops: MONSTER_DROP_TABLE, universalDrops: UNIVERSAL_DROPS_DEFAULT };
      }
      result = { status: 'ok', config };
      return res.json(result);
    }

    if (!u) { result.error = 'User not found'; return res.json(result); }

    let save = await getSave(u);
    if (!save) { result.error = 'No save data'; return res.json(result); }

    if (cmd === 'give_items') {
      if (!save.inventory) save.inventory = {};
      const ALL_ITEMS = ['pokeball','greatBall','ultraBall','masterBall','quickBall','friendBall','loveBall','duskBall','timerBall','darkBall','potion','superPotion','fullRestore','candy','vitamin','train','weaken','evolutionStone','fireStone','waterStone','leafStone','thunderStone','moonStone','sunStone','shinyStone','duskStone','iceStone','dawnStone','tm','ppUp','sitrusBerry','oranBerry','lumBerry','chestoBerry','rawstBerry','antidote','antiparalyze','energyDrink','fireExtinguisher','healingHerb','weakElixir','elixir','strongElixir','xAttack','xDefense','xSpDefense','xSpAttack','xSpeed','protein','iron','calcium','zinc','carbos','luckyEgg','expShare','oldRod','goodRod','superRod'];
      ALL_ITEMS.forEach(id => { save.inventory[id] = 999; });
      save.money = (save.money || 0) + 500000;
      await putSave(u, save);
      result = { status: 'ok', items: ALL_ITEMS.length, money: save.money };

    } else if (cmd === 'give_money') {
      save.money = (save.money || 0) + parseInt(val || 100000);
      await putSave(u, save);
      result = { status: 'ok', money: save.money };

    } else if (cmd === 'give_badges') {
      save.badges = ['Boulder Badge','Cascade Badge','Thunder Badge','Rainbow Badge','Marsh Badge','Soul Badge','Volcano Badge','Earth Badge'];
      await putSave(u, save);
      result = { status: 'ok', badges: 8 };

    } else if (cmd === 'give_legendary') {
      const legends = ['mewtwo','mew','lugia','ho-oh','rayquaza','groudon','kyogre','dialga','palkia','giratina','zekrom','reshiram'];
      const pick = legends[Math.floor(Math.random()*legends.length)];
      try {
        const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon/'+pick);
        const pokeData = await pokeRes.json();
        const newMon = makeMon(pokeData, u.id, 70);
        save.myTeam = save.myTeam || [];
        if (save.myTeam.length >= 6) save.myTeam[0] = newMon;
        else save.myTeam.push(newMon);
        await putSave(u, save);
        result = { status: 'ok', pokemon: pick };
      } catch(e) { result.error = 'PokeAPI failed: '+e.message; }

    } else if (cmd === 'give_egg') {
      let speciesList;
      const readyHatch = req.query.ready === '1';
      if (val) {
        speciesList = val.split(',');
      } else {
        try {
          const pdata = JSON.parse(readFileSync(join(process.cwd(), 'public/pokedex_data.json'), 'utf8'));
          // Только первая эволюция: исключаем тех, у кого method === 'Эволюция'
          speciesList = Object.entries(pdata)
            .filter(([_, v]) => v.method !== 'Эволюция')
            .map(([k]) => k);
        } catch(e) {
          speciesList = ['bulbasaur','charmander','squirtle','pikachu','eevee'];
        }
      }
      const pick = speciesList[Math.floor(Math.random()*speciesList.length)];
      // Нормализуем имя покемона для PokeAPI (alolan rattata → rattata-alola и т.д.)
      const pokeName = pick.toLowerCase()
        .replace(/^alolan /, '')
        .replace(/ /g, '-')
        .replace(/[♀]/g, '-f')
        .replace(/[♂]/g, '-m')
        .replace(/[^a-z0-9-]/g, '');
      let eggTypes;
      try {
        const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon/'+pokeName);
        if (pokeRes.ok) {
          const pokeData = await pokeRes.json();
          eggTypes = pokeData.types || [{ type: { name: 'normal' } }];
        } else {
          eggTypes = [{ type: { name: 'normal' } }];
        }
      } catch(e) {
        eggTypes = [{ type: { name: 'normal' } }];
      }
      const ivs = { hp: Math.floor(Math.random()*32), atk: Math.floor(Math.random()*32), def: Math.floor(Math.random()*32), spa: Math.floor(Math.random()*32), spd: Math.floor(Math.random()*32), spe: Math.floor(Math.random()*32) };
      const egg = {
        uid: Date.now().toString(36)+Math.random().toString(36).substr(2,6),
        species: pick,
        types: eggTypes,
        ivs,
        boxIdx: 0,
        parent1Uid: 'admin',
        parent2Uid: 'admin',
        inTeam: readyHatch ? true : false,
        readyTime: readyHatch ? Date.now() - 60000 : Date.now() + Math.floor(Math.random()*3+1)*86400000,
      };
      if (!save.eggs) save.eggs = [];
      save.eggs.push(egg);
      await putSave(u, save);
      result = { status: 'ok', pokemon: pick, ivs, hatchIn: readyHatch ? 'ready' : Math.ceil((egg.readyTime-Date.now())/86400000)+'d' };

    } else if (cmd === 'heal_team') {
      (save.myTeam||[]).forEach(m => { m.currentHp = m.maxHp; m.status = null; m.sleepTurns = 0; });
      await putSave(u, save);
      result = { status: 'ok', healed: (save.myTeam||[]).length };

    } else if (cmd === 'max_iv') {
      (save.myTeam||[]).forEach(m => { m.ivs = {hp:31,atk:31,def:31,spa:31,spd:31,spe:31}; });
      await putSave(u, save);
      result = { status: 'ok', mons: (save.myTeam||[]).length };

    } else if (cmd === 'fix_levels') {
      (save.myTeam||[]).forEach(m => { if(m.baseLevel < 50) m.baseLevel = 50; m.maxHp = Math.floor(m.maxHp*1.5); m.currentHp = m.maxHp; });
      await putSave(u, save);
      result = { status: 'ok', mons: (save.myTeam||[]).length };

    } else if (cmd === 'teleport') {
      save.currentLocationId = val;
      await putSave(u, save);
      result = { status: 'ok', location: val };

    } else if (cmd === 'reset_save') {
      save = { _v: Date.now(), myTeam:[], pcBoxes:[[]], inventory:{}, money:500, badges:[], pokedexSeen:[], pokedexCaught:[], quests:[], questProgress:{}, completedQuests:[], npcQuestProgress:{}, completedNPCQuests:[], tutorialStep:0, currentLocationId:'goldenrod', currentRegion:'johto' };
      await putSave(u, save);
      result = { status: 'ok', reset: true };

    } else if (cmd === 'edit_mon') {
      const params = JSON.parse(val || '{}');
      const { pos, baseLevel, species, shiny, heal, maxIV } = params;
      const parts = (pos||'').split(':');
      let mon;
      if (parts[0] === 'team') mon = (save.myTeam||[])[parseInt(parts[1])];
      else if (parts[0] === 'pc') mon = (save.pcBoxes||[])[parseInt(parts[1])]?.[parseInt(parts[2])];

      if (!mon) { result.error = 'Mon not found at '+pos; return res.json(result); }
      if (heal) { mon.currentHp = mon.maxHp; mon.status = null; mon.sleepTurns = 0; }
      if (maxIV) { mon.ivs = {hp:31,atk:31,def:31,spa:31,spd:31,spe:31}; }
      if (baseLevel !== undefined) {
        mon.baseLevel = baseLevel;
        const baseHp = mon.apiData?.stats?.[0]?.base_stat || 50;
        mon.maxHp = Math.floor(0.01 * (2 * baseHp + (mon.ivs?.hp||0) + Math.floor(0.25 * (mon.evs?.hp||0))) * baseLevel) + baseLevel + 10;
        mon.currentHp = Math.min(mon.currentHp, mon.maxHp);
      }
      if (species && species !== mon.apiData?.name) {
        try {
          const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon/'+species);
          mon.apiData = await pokeRes.json();
          mon.abilityName = mon.apiData.abilities[0]?.ability?.name || null;
        } catch(e) { result.warn = 'Species fetch failed'; }
      }
      if (shiny !== undefined) mon.isShiny = shiny;
      await putSave(u, save);
      result = { status: 'ok', mon: mon.apiData?.name };

    } else if (cmd === 'find_mon_by_uid') {
      const uid = val || '';
      let found = null, foundPos = null;
      for (let i = 0; i < (save.myTeam||[]).length; i++) {
        if (save.myTeam[i]?.uid === uid) { found = save.myTeam[i]; foundPos = 'team:'+i; break; }
      }
      if (!found) {
        for (let b = 0; b < (save.pcBoxes||[]).length; b++) {
          for (let i = 0; i < (save.pcBoxes[b]||[]).length; i++) {
            if (save.pcBoxes[b][i]?.uid === uid) { found = save.pcBoxes[b][i]; foundPos = 'pc:'+b+':'+i; break; }
          }
          if (found) break;
        }
      }
      if (!found) { result.error = 'Mon not found'; return res.json(result); }
      result = { status: 'ok', mon: found, position: foundPos };

    } else if (cmd === 'update_mon') {
      const params = JSON.parse(val || '{}');
      const { pos, data } = params;
      const parts = (pos||'').split(':');
      let mon;
      if (parts[0] === 'team') mon = (save.myTeam||[])[parseInt(parts[1])];
      else if (parts[0] === 'pc') mon = (save.pcBoxes||[])[parseInt(parts[1])]?.[parseInt(parts[2])];
      if (!mon) { result.error = 'Mon not found at '+pos; return res.json(result); }
      // Merge allowed fields
      if (data.baseLevel !== undefined) mon.baseLevel = data.baseLevel;
      if (data.natureIdx !== undefined) mon.natureIdx = data.natureIdx;
      if (data.isShiny !== undefined) mon.isShiny = data.isShiny;
      if (data.gender !== undefined) mon.gender = data.gender;
      if (data.heldItem !== undefined) mon.heldItem = data.heldItem;
      if (data.ivs) { mon.ivs = { ...mon.ivs, ...data.ivs }; }
      if (data.evs) { mon.evs = { ...mon.evs, ...data.evs }; }
      if (data.currentHp !== undefined) mon.currentHp = data.currentHp;
      if (data.maxHp !== undefined) mon.maxHp = data.maxHp;
      if (data.candiesEaten !== undefined) mon.candiesEaten = data.candiesEaten;
      if (data.vitaminsEaten !== undefined) mon.vitaminsEaten = data.vitaminsEaten;
      if (data.happiness !== undefined) mon.happiness = data.happiness;
      if (data.trainingStage !== undefined) mon.trainingStage = data.trainingStage;
      if (data.trainingStat !== undefined) mon.trainingStat = data.trainingStat;
      if (data.status !== undefined) mon.status = data.status;
      if (data.breedLetter !== undefined) mon.breedLetter = data.breedLetter;
      if (data.hasBred !== undefined) mon.hasBred = data.hasBred;
      // Recalc HP if baseLevel changed or ivs changed
      if (data.baseLevel !== undefined || data.ivs) {
        const baseHp = mon.apiData?.stats?.[0]?.base_stat || 50;
        const lvl = (mon.baseLevel || 5) + (mon.candiesEaten || 0);
        mon.maxHp = Math.floor(0.01 * (2 * baseHp + (mon.ivs?.hp||0) + Math.floor(0.25 * (mon.evs?.hp||0))) * lvl) + lvl + 10;
        if (mon.currentHp > mon.maxHp) mon.currentHp = mon.maxHp;
      }
      await putSave(u, save);
      result = { status: 'ok', mon: mon.apiData?.name };

    } else if (cmd === 'delete_mon') {
      const parts = (val||'').split(':');
      if (parts[0] === 'team') save.myTeam.splice(parseInt(parts[1]), 1);
      else if (parts[0] === 'pc') { const box = save.pcBoxes[parseInt(parts[1])]; if (box) box.splice(parseInt(parts[2]), 1); }
      await putSave(u, save);
      result = { status: 'ok', deleted: true };

    } else if (cmd === 'add_mon') {
      const params = JSON.parse(val || '{}');
      const { species, level, shiny, maxIV, target } = params;
      try {
        const pokeRes = await fetch('https://pokeapi.co/api/v2/pokemon/'+(species||'bulbasaur'));
        const mon = makeMon(await pokeRes.json(), u.id, level||50);
        if (maxIV) mon.ivs = {hp:31,atk:31,def:31,spa:31,spd:31,spe:31};
        if (shiny) mon.isShiny = true;
        mon.hasBred = false;
        if (target === 'pc') {
          if (!save.pcBoxes || save.pcBoxes.length === 0) save.pcBoxes = [[]];
          save.pcBoxes[0].push(mon);
        } else {
          save.myTeam = save.myTeam || [];
          if (save.myTeam.length >= 6) save.myTeam[0] = mon;
          else save.myTeam.push(mon);
        }
        await putSave(u, save);
        result = { status: 'ok', pokemon: species, target };
      } catch(e) { result.error = 'PokeAPI failed: '+e.message; }

    } else if (cmd === 'toggle_pokedex') {
      save.pokedexSeen = save.pokedexSeen || [];
      save.pokedexCaught = save.pokedexCaught || [];
      const seenIdx = save.pokedexSeen.indexOf(val);
      const caughtIdx = save.pokedexCaught.indexOf(val);
      if (caughtIdx >= 0) { save.pokedexCaught.splice(caughtIdx, 1); }
      else if (seenIdx >= 0) { save.pokedexSeen.splice(seenIdx, 1); save.pokedexCaught.push(val); }
      else { save.pokedexSeen.push(val); }
      await putSave(u, save);
      result = { status: 'ok', seen: save.pokedexSeen.length, caught: save.pokedexCaught.length };

    } else if (cmd === 'pokedex_all') {
      save.pokedexSeen = []; save.pokedexCaught = [];
      if (val === 'caught') {
        try {
          save.pokedexCaught = Object.keys(JSON.parse(readFileSync(join(process.cwd(), 'public/pokedex_data.json'), 'utf8')));
        } catch(e) {}
      }
      await putSave(u, save);
      result = { status: 'ok', caught: save.pokedexCaught.length };

    } else if (cmd === 'set_inventory') {
      if (!save.inventory) save.inventory = {};
      Object.assign(save.inventory, JSON.parse(val || '{}'));
      await putSave(u, save);
      result = { status: 'ok' };

    } else if (cmd === 'set_money') {
      save.money = parseInt(val) || 0;
      await putSave(u, save);
      result = { status: 'ok', money: save.money };

    } else if (cmd === 'reset_quests') {
      if (val === 'daily') { save.quests = []; save.questProgress = {}; save.completedQuests = []; }
      else if (val === 'npc') { save.npcQuestProgress = {}; save.completedNPCQuests = []; }
      await putSave(u, save);
      result = { status: 'ok' };

    } else if (cmd === 'complete_all_quests') {
      if (val === 'npc') {
        save.npcQuestProgress = {};
        save.completedNPCQuests = ['professor_elm_quest','mr_pokemon_quest','kurt_quest','radio_tower_quest','lake_of_rage_quest','dragon_den_quest'];
      }
      await putSave(u, save);
      result = { status: 'ok' };

    } else if (cmd === 'set_level') {
      const lvl = parseInt(val) || 50;
      (save.myTeam||[]).forEach(m => { m.baseLevel = lvl; const baseHp = m.apiData?.stats?.[0]?.base_stat || 50; m.maxHp = Math.floor(0.01 * (2 * baseHp + (m.ivs?.hp||0) + Math.floor(0.25 * (m.evs?.hp||0))) * lvl) + lvl + 10; m.currentHp = m.maxHp; });
      await putSave(u, save);
      result = { status: 'ok', level: lvl, mons: (save.myTeam||[]).length };

    } else if (cmd === 'fix_save') {
      if (!save.myTeam || !Array.isArray(save.myTeam)) save.myTeam = [];
      if (!save.inventory || typeof save.inventory !== 'object') save.inventory = {};
      if (!save.badges || !Array.isArray(save.badges)) save.badges = [];
      if (!save.pokedexSeen || !Array.isArray(save.pokedexSeen)) save.pokedexSeen = [];
      if (!save.pokedexCaught || !Array.isArray(save.pokedexCaught)) save.pokedexCaught = [];
      if (!save.quests || !Array.isArray(save.quests)) save.quests = [];
      if (!save.questProgress || typeof save.questProgress !== 'object') save.questProgress = {};
      if (!save.completedQuests || !Array.isArray(save.completedQuests)) save.completedQuests = [];
      save.myTeam.forEach((m, i) => { if (!m.uid) m.uid = u.id + '-' + i + '-' + Date.now(); if (!m.currentHp) m.currentHp = m.maxHp; });
      await putSave(u, save);
      result = { status: 'ok', fixed: true, team: save.myTeam.length };

    } else if (cmd === 'toggle_feature') {
      if (!save.flags) save.flags = {};
      const feature = val || 'unknown';
      if (save.flags[feature]) { delete save.flags[feature]; result.enabled = false; }
      else { save.flags[feature] = true; result.enabled = true; }
      await putSave(u, save);
      result.status = 'ok'; result.feature = feature;

    } else if (cmd === 'broadcast') {
      try {
        const io = getIO();
        if (io) { io.emit('broadcast', { message: val || 'Сообщение от админа' }); result.sent = true; }
        else result.sent = false;
      } catch(e) { result.error = 'Broadcast failed: '+e.message; }
      result.status = 'ok';

    } else {
      result.error = 'Unknown command: '+cmd;
    }
  } catch(e) { result.error = e.message; }
  res.json(result);
}));

// POST for raw JSON save (admin only)
router.post('/api', adminAuth, asyncHandler(async (req, res) => {
  const { cmd, user } = req.query;
  const db = getDB();
  if (cmd !== 'set_save') return res.status(400).json({ error: 'POST only for set_save' });

  const u = await resolveUser(user);
  if (!u) return res.json({ error: 'User not found' });
  // Validate that body is a non-null object with required save fields
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Body must be a JSON object' });
  }
  if (data.myTeam && !Array.isArray(data.myTeam)) {
    return res.status(400).json({ error: 'myTeam must be an array' });
  }
  if (data.money !== undefined && typeof data.money !== 'number') {
    return res.status(400).json({ error: 'money must be a number' });
  }
  // Size limit: 10MB
  const raw = JSON.stringify(data);
  if (raw.length > 10 * 1024 * 1024) {
    return res.status(400).json({ error: 'Save data too large' });
  }
  await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', raw, u.id);
  res.json({ status: 'ok', saved: true });
}));

router.get('/health', (req, res) => res.json({ ok: true }));

// Backward compat: redirect to /api
router.get('/jwt-api', adminAuth, (req, res) => {
  const { cmd, user, val } = req.query;
  const params = new URLSearchParams({ cmd, user, val });
  res.redirect(`/admin/api?${params}`);
});

function makeMon(pokeData, trainerId, level) {
  const baseHp = pokeData.stats[0].base_stat;
  const ivs = {hp:Math.floor(Math.random()*32),atk:Math.floor(Math.random()*32),def:Math.floor(Math.random()*32),spa:Math.floor(Math.random()*32),spd:Math.floor(Math.random()*32),spe:Math.floor(Math.random()*32)};
  const maxHp = Math.floor(0.01 * (2 * baseHp + ivs.hp) * level) + level + 10;
  return {
    uid: Date.now().toString(36)+Math.random().toString(36).substr(2,6),
    originalTrainer: String(trainerId), createdAt: Date.now(), caughtLocation: 'admin',
    apiData: pokeData, maxHp, currentHp: maxHp, ivs,
    evs: {hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
    baseLevel: level, exp: 0, expToNext: 8,
    candiesEaten:0, vitaminsEaten:0, training:null, trainingStage:0, trainingStat:null,
    happiness:120, natureIdx: Math.floor(Math.random()*25), breedLetter: 'S',
    gender: Math.random() < 0.5 ? 'male' : 'female',
    status: null, sleepTurns: 0, movesPP:[], statStages:{atk:0,def:0,spa:0,spd:0,spe:0},
    abilityName: pokeData.abilities[0]?.ability?.name||null,
    heldItem:null, berries:{sitrusBerry:0,oranBerry:0,lumBerry:0,chestoBerry:0,rawstBerry:0},
    learnableMoves:[], isEgg:false, hasBred: false, isShiny: false
  };
}

// Items catalog endpoint (for admin drops UI, loaded from static JSON)
let _cachedItemsCatalog = null;
const ITEMS_JSON_PATH = join(__dirname, '../../data/items.json');
router.get('/api/items', adminAuth, (req, res) => {
  if (_cachedItemsCatalog) {
    return res.json({ status: 'ok', items: _cachedItemsCatalog });
  }
  try {
    const items = JSON.parse(readFileSync(ITEMS_JSON_PATH, 'utf8'));
    _cachedItemsCatalog = items
      .filter(item => item.implemented !== false)
      .map(item => ({
        id: item.id,
        nameRu: item.nameRu || item.id,
        category: item.category || 'other',
      }));
    return res.json({ status: 'ok', items: _cachedItemsCatalog });
  } catch (e) {
    return res.json({ error: e.message });
  }
});

// Species catalog endpoint (for admin drops UI)
router.get('/api/species', adminAuth, (req, res) => {
  const pdataPath = join(process.cwd(), 'public/pokedex_data.json');
  const pdata = JSON.parse(readFileSync(pdataPath, 'utf8'));
  const species = Object.keys(pdata).sort();
  return res.json({ status: 'ok', species });
});

// POST endpoint for drops (avoids URL length limits of GET)
router.post('/api/drops', adminAuth, (req, res) => {
  const dropsDir = join(__dirname, '../../data');
  mkdirSync(dropsDir, { recursive: true });
  const dropsPath = join(dropsDir, 'drop_config.json');
  const newConfig = req.body;
  if (!newConfig || typeof newConfig !== 'object') {
    return res.json({ error: 'Invalid JSON body' });
  }
  writeFileSync(dropsPath, JSON.stringify(newConfig, null, 2));
  return res.json({ status: 'ok', saved: true });
});

export default router;
