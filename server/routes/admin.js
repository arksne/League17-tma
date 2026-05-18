import { Router } from 'express';
import { getDB } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { readFileSync } from 'fs';
import zlib from 'zlib';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

const ADMIN_USERNAMES = new Set(['DjafarAdjarov', 'nineinchkn5atmythroat']);
const ADMIN_PASS = process.env.ADMIN_PASS || 'league17admin2026';

function decompressSave(raw) {
  if (!raw) return null;
  if (raw.startsWith('Z:')) {
    try { return JSON.parse(zlib.inflateSync(Buffer.from(raw.slice(2), 'base64')).toString()); } catch(e) { console.error('decompressSave zlib err:', e.message); }
  }
  try { return JSON.parse(raw); } catch(e) { console.error('decompressSave JSON err:', e.message); return null; }
}

// Load admin HTML template once
let ADMIN_HTML = '';
try { ADMIN_HTML = readFileSync(join(__dirname, 'admin.html'), 'utf8'); } catch(e) { ADMIN_HTML = '<h1>admin.html not found</h1>'; }

function adminAuth(req, res, next) {
  const token = req.query.token || req.headers['x-admin-token'];
  if (token === ADMIN_PASS) return next();
  if (req.path === '/' && !token) return res.send(loginPage());
  if (!token) {
    return authMiddleware(req, res, async () => {
      const db = getDB();
      const user = await db.get('SELECT username FROM users WHERE id = ?', req.userId);
      if (user && ADMIN_USERNAMES.has(user.username)) { req.adminUsername = user.username; return next(); }
      return res.status(403).json({ error: 'Admin access required' });
    });
  }
  return res.status(401).json({ error: 'Unauthorized' });
}

function loginPage() {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Login</title>
<style>body{font-family:monospace;background:#0a0a0a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
input{padding:10px;font-size:1.2rem;border:2px solid #333;border-radius:6px;background:#111;color:#fff;width:200px}
button{padding:10px 20px;font-size:1.2rem;border:none;border-radius:6px;background:#af52de;color:#fff;cursor:pointer}
</style></head><body><form onsubmit="event.preventDefault(); location.href='?token='+encodeURIComponent(document.getElementById('p').value)"><input id="p" type="password" placeholder="Password" autofocus><button>Login</button></form></body></html>`;
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// --- Dashboard ---
router.get('/', adminAuth, async (req, res) => {
  const db = getDB();
  const users = await db.all('SELECT id, telegram_id, username, first_name FROM users ORDER BY id');
  const lb = await db.all('SELECT u.username, u.first_name, l.* FROM leaderboard l JOIN users u ON u.id=l.user_id ORDER BY l.badges_count DESC LIMIT 30');
  const token = req.query.token || '';

  const userOptions = users.map(u =>
    `<option value="${u.id}">#${u.id} ${esc(u.username||'?')} (${esc(u.first_name||'')})</option>`
  ).join('');

  const lbTable = `<table><tr><th>Игрок</th><th>Значки</th><th>Покемонов</th><th>¥</th></tr>
    ${lb.map(e => `<tr><td>${esc(e.first_name||e.username||'?')}</td><td>${e.badges_count}</td><td>${e.pokemon_count||0}</td><td>${e.money||0}</td></tr>`).join('')}</table>`;

  let html = ADMIN_HTML
    .replace('__USER_OPTIONS__', userOptions)
    .replace('__LEADERBOARD_TABLE__', lbTable)
    .replace('__TOKEN__', token);

  res.send(html);
});

// --- Admin API ---
router.get('/api', adminAuth, async (req, res) => {
  const { cmd, user, val } = req.query;
  const db = getDB();
  let result = { cmd, user };

  async function resolveUser(idOrName) {
    const byId = await db.get('SELECT id FROM users WHERE id = ?', parseInt(idOrName, 10));
    if (byId) return byId;
    return await db.get('SELECT id FROM users WHERE username = ?', idOrName);
  }

  async function getSave(u) {
    const row = await db.get('SELECT save_data FROM game_saves WHERE user_id = ?', u.id);
    if (!row) return null;
    return decompressSave(row.save_data);
  }

  async function putSave(u, data) {
    await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(data), u.id);
    try {
      const { notifyUser } = await import('../socket.js');
      notifyUser(u.id, 'save_updated', {});
    } catch(e) {}
  }

  try {
    if (!user) { result.error = 'Missing user parameter'; return res.json(result); }
    const u = await resolveUser(user);

    if (cmd === 'get_save') {
      if (!u) { result.error = 'User not found'; return res.json(result); }
      const save = await getSave(u);
      let POKEDEX_ALL = [];
      try {
        const fs = await import('fs'); const path = await import('path');
        const pdata = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/pokedex_data.json'), 'utf8'));
        POKEDEX_ALL = Object.keys(pdata);
      } catch(e) {}
      result = { status: 'ok', userId: u.id, username: user, save, pokedexAll: POKEDEX_ALL };
      return res.json(result);
    }

    if (cmd === 'set_save') {
      return res.status(400).json({ error: 'Use POST for set_save' });
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
      save = { _v: Date.now(), myTeam:[], pcBoxes:[[]], inventory:{}, money:500, badges:[], pokedexSeen:[], pokedexCaught:[], quests:[], questProgress:{}, completedQuests:[], npcQuestProgress:{}, completedNPCQuests:[], tutorialStep:0, currentLocationId:'goldenrod', currentRegion:'east_johto' };
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
          const fs = await import('fs'); const path = await import('path');
          save.pokedexCaught = Object.keys(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/pokedex_data.json'), 'utf8')));
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
        const io = (await import('../socket.js')).getIO();
        if (io) { io.emit('broadcast', { message: val || 'Сообщение от админа' }); result.sent = true; }
        else result.sent = false;
      } catch(e) { result.error = 'Broadcast failed: '+e.message; }
      result.status = 'ok';

    } else {
      result.error = 'Unknown command: '+cmd;
    }
  } catch(e) { result.error = e.message; }
  res.json(result);
});

// POST for raw JSON save
router.post('/api', adminAuth, async (req, res) => {
  const { cmd, user } = req.query;
  const db = getDB();
  if (cmd !== 'set_save') return res.status(400).json({ error: 'POST only for set_save' });

  async function resolveUser(idOrName) {
    const byId = await db.get('SELECT id FROM users WHERE id = ?', parseInt(idOrName));
    if (byId) return byId;
    return await db.get('SELECT id FROM users WHERE username = ?', idOrName);
  }

  try {
    const u = await resolveUser(user);
    if (!u) return res.json({ error: 'User not found' });
    await db.run('UPDATE game_saves SET save_data = ?, updated_at = datetime(\'now\') WHERE user_id = ?', JSON.stringify(req.body), u.id);
    res.json({ status: 'ok', saved: true });
  } catch(e) { res.json({ error: e.message }); }
});

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

export default router;
