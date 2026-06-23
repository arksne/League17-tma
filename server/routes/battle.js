import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getDB } from '../db.js';
import { getIO, notifyUser } from '../socket.js';
import { asyncHandler } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

const router = Router();
router.use(authMiddleware);

// --- In-memory PvP queue and matches ---
const pvpQueue = [];      // [{ socketId, userId, username }]
const pvpMatches = new Map(); // battleId -> { p1: {...}, p2: {...}, turn, turnMoves, state }

// --- ELO calculation ---
function calcElo(rating1, rating2, winner) {
  // winner: 1 = player1 wins, 2 = player2 wins, 0 = draw
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const k = 32;
  const score1 = winner === 1 ? 1 : winner === 2 ? 0 : 0.5;
  const newRating1 = Math.round(rating1 + k * (score1 - expected1));
  const newRating2 = Math.round(rating2 + k * ((1 - score1) - (1 - expected1)));
  return {
    newRating1: Math.max(0, newRating1),
    newRating2: Math.max(0, newRating2)
  };
}

// --- Simplified damage calculation for server-side validation ---
function calcDamage(attacker, defender, move) {
  if (!move || move.category === 'status' || !move.power || move.power <= 0) {
    return { damage: 0, crit: false, effectiveness: 1 };
  }

  const atkStat = move.category === 'physical'
    ? (attacker.stats?.attack || 50)
    : (attacker.stats?.spAttack || 50);
  const defStat = move.category === 'physical'
    ? (defender.stats?.defense || 50)
    : (defender.stats?.spDefense || 50);

  const level = attacker.level || 50;
  const power = move.power;

  // Base damage formula
  let damage = Math.floor(Math.floor(Math.floor(2 * level / 5 + 2) * power * atkStat / defStat) / 50 + 2);

  // Random factor (0.85-1.0)
  damage = Math.floor(damage * (0.85 + Math.random() * 0.15));

  // Critical hit (6.25% chance)
  const crit = Math.random() < 0.0625;
  if (crit) damage = Math.floor(damage * 1.5);

  // STAB
  const attackerTypes = attacker.type || attacker.types || [];
  if (attackerTypes.includes(move.type)) {
    damage = Math.floor(damage * 1.5);
  }

  const effectiveness = 1;
  damage = Math.floor(damage * effectiveness);

  return { damage: Math.max(1, damage), crit, effectiveness };
}

// --- Matchmaking ---
function tryMatchPlayers(io) {
  while (pvpQueue.length >= 2) {
    const p1 = pvpQueue.shift();
    const p2 = pvpQueue.shift();

    const battleId = `pvp-${p1.socketId}-${p2.socketId}-${Date.now()}`;

    const match = {
      p1: { ...p1 },
      p2: { ...p2 },
      turn: 0,
      turnMoves: {},
      state: 'matched', // matched -> active -> finished
      createdAt: Date.now(),
    };

    pvpMatches.set(battleId, match);

    io.to(p1.socketId).emit('pvp:matched', {
      battleId,
      opponent: { username: p2.username },
      first: true,
    });

    io.to(p2.socketId).emit('pvp:matched', {
      battleId,
      opponent: { username: p1.username },
      first: false,
    });

    // Set state to active after a short delay
    setTimeout(() => {
      const m = pvpMatches.get(battleId);
      if (m && m.state === 'matched') {
        m.state = 'active';
      }
    }, 2000);
  }
}

// --- Resolve a turn ---
function resolveTurn(io, battleId) {
  const match = pvpMatches.get(battleId);
  if (!match) return;

  const p1Move = match.turnMoves.p1;
  const p2Move = match.turnMoves.p2;
  if (!p1Move || !p2Move) return;

  match.turn++;

  // Determine turn order by speed
  const p1Speed = p1Move.pokemon?.stats?.speed || 0;
  const p2Speed = p2Move.pokemon?.stats?.speed || 0;

  let firstKey, secondKey, firstMove, secondMove;
  if (p1Speed >= p2Speed) {
    firstKey = 'p1'; secondKey = 'p2';
    firstMove = p1Move; secondMove = p2Move;
  } else {
    firstKey = 'p2'; secondKey = 'p1';
    firstMove = p2Move; secondMove = p1Move;
  }

  // Resolve first move
  const firstResult = calcDamage(firstMove.pokemon, secondMove.pokemon, firstMove.move);
  if (secondMove.pokemon) {
    secondMove.pokemon.currentHp = (secondMove.pokemon.currentHp || 0) - firstResult.damage;
  }
  const firstFainted = secondMove.pokemon && secondMove.pokemon.currentHp <= 0;

  // Resolve second move (if target still alive)
  let secondResult = null;
  let secondFainted = false;
  if (!firstFainted) {
    secondResult = calcDamage(secondMove.pokemon, firstMove.pokemon, secondMove.move);
    if (firstMove.pokemon) {
      firstMove.pokemon.currentHp = (firstMove.pokemon.currentHp || 0) - secondResult.damage;
    }
    secondFainted = firstMove.pokemon && firstMove.pokemon.currentHp <= 0;
  }

  // Build turn result
  const actions = [];

  if (firstKey === 'p1') {
    actions.push({
      by: 'p1',
      move: { name: p1Move.move?.name || 'Атака' },
      damage: firstResult.damage,
      crit: firstResult.crit,
      effectiveness: firstResult.effectiveness,
      opponentHp: Math.max(0, secondMove.pokemon?.currentHp || 0),
      opponentMaxHp: secondMove.pokemon?.stats?.hp || 100,
      fainted: firstFainted,
    });
  } else {
    actions.push({
      by: 'p2',
      move: { name: p2Move.move?.name || 'Атака' },
      damage: firstResult.damage,
      crit: firstResult.crit,
      effectiveness: firstResult.effectiveness,
      opponentHp: Math.max(0, secondMove.pokemon?.currentHp || 0),
      opponentMaxHp: secondMove.pokemon?.stats?.hp || 100,
      fainted: firstFainted,
    });
  }

  if (secondResult) {
    if (secondKey === 'p1') {
      actions.push({
        by: 'p1',
        move: { name: p1Move.move?.name || 'Атака' },
        damage: secondResult.damage,
        crit: secondResult.crit,
        effectiveness: secondResult.effectiveness,
        opponentHp: Math.max(0, firstMove.pokemon?.currentHp || 0),
        opponentMaxHp: firstMove.pokemon?.stats?.hp || 100,
        fainted: secondFainted,
      });
    } else {
      actions.push({
        by: 'p2',
        move: { name: p2Move.move?.name || 'Атака' },
        damage: secondResult.damage,
        crit: secondResult.crit,
        effectiveness: secondResult.effectiveness,
        opponentHp: Math.max(0, firstMove.pokemon?.currentHp || 0),
        opponentMaxHp: firstMove.pokemon?.stats?.hp || 100,
        fainted: secondFainted,
      });
    }
  }

  // Check if battle is over
  const p1Alive = firstMove.pokemon && firstMove.pokemon.currentHp > 0;
  const p2Alive = secondMove.pokemon && secondMove.pokemon.currentHp > 0;

  let battleOver = false;
  let winner = null;

  if (!p1Alive && !p2Alive) {
    battleOver = true;
    winner = 'draw';
  } else if (!p1Alive) {
    battleOver = true;
    winner = 'p2';
  } else if (!p2Alive) {
    battleOver = true;
    winner = 'p1';
  }

  // Clear turn moves
  match.turnMoves = {};

  // Send result to both players
  const result = {
    turn: match.turn,
    actions,
    battleOver,
    winner,
    yourHp: null, // filled per-player below
    opponentHp: null,
  };

  // p1 perspective: p1's HP is in the pokemon that attacked (or was attacked)
  const p1Hp = Math.max(0, p1Move.pokemon?.currentHp || 0);
  const p2Hp = Math.max(0, p2Move.pokemon?.currentHp || 0);

  const p1Result = {
    ...result,
    yourHp: p1Hp,
    yourMaxHp: p1Move.pokemon?.stats?.hp || 100,
    opponentHp: p2Hp,
    opponentMaxHp: p2Move.pokemon?.stats?.hp || 100,
  };

  const p2Result = {
    ...result,
    yourHp: p2Hp,
    yourMaxHp: p2Move.pokemon?.stats?.hp || 100,
    opponentHp: p1Hp,
    opponentMaxHp: p1Move.pokemon?.stats?.hp || 100,
  };

  io.to(match.p1.socketId).emit('pvp:turn_result', p1Result);
  io.to(match.p2.socketId).emit('pvp:turn_result', p2Result);

  if (battleOver) {
    endBattle(io, battleId, winner, { reason: 'all_fainted' });
  }
}

// --- End a battle and update ELO ---
async function endBattle(io, battleId, winner, metadata = {}) {
  const match = pvpMatches.get(battleId);
  if (!match) return;

  match.state = 'finished';

  // Build extra data from metadata
  const extra = {};
  if (metadata.reason === 'surrender') {
    extra.surrender = metadata.by;
  } else if (metadata.reason === 'disconnect') {
    extra.disconnect = true;
  }

  try {
    const db = getDB();

    // Get current ratings
    const p1Rating = await db.get('SELECT rating, wins, losses FROM pvp_ratings WHERE user_id = ?', match.p1.userId);
    const p2Rating = await db.get('SELECT rating, wins, losses FROM pvp_ratings WHERE user_id = ?', match.p2.userId);

    const r1 = p1Rating?.rating || 1000;
    const r2 = p2Rating?.rating || 1000;
    const w1 = p1Rating?.wins || 0;
    const l1 = p1Rating?.losses || 0;
    const w2 = p2Rating?.wins || 0;
    const l2 = p2Rating?.losses || 0;

    let winnerCode;
    if (winner === 'p1') winnerCode = 1;
    else if (winner === 'p2') winnerCode = 2;
    else winnerCode = 0;

    const { newRating1, newRating2 } = calcElo(r1, r2, winnerCode);

    // Update p1
    await db.run(
      `INSERT INTO pvp_ratings (user_id, rating, wins, losses)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         rating = excluded.rating,
         wins = excluded.wins,
         losses = excluded.losses`,
      match.p1.userId,
      newRating1,
      winnerCode === 1 ? w1 + 1 : w1,
      winnerCode === 2 ? l1 + 1 : l1
    );

    // Update p2
    await db.run(
      `INSERT INTO pvp_ratings (user_id, rating, wins, losses)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         rating = excluded.rating,
         wins = excluded.wins,
         losses = excluded.losses`,
      match.p2.userId,
      newRating2,
      winnerCode === 2 ? w2 + 1 : w2,
      winnerCode === 1 ? l2 + 1 : l2
    );

    io.to(match.p1.socketId).emit('pvp:battle_end', {
      battleId,
      winner,
      ...extra,
      yourRatingChange: { old: r1, new: newRating1 },
      opponentRatingChange: { old: r2, new: newRating2 },
    });

    io.to(match.p2.socketId).emit('pvp:battle_end', {
      battleId,
      winner,
      ...extra,
      yourRatingChange: { old: r2, new: newRating2 },
      opponentRatingChange: { old: r1, new: newRating1 },
    });
  } catch (err) {
    logger.error('Error ending PvP battle:', err.message);
    io.to(match.p1.socketId).emit('pvp:error', { message: 'Ошибка сохранения результатов битвы.' });
    io.to(match.p2.socketId).emit('pvp:error', { message: 'Ошибка сохранения результатов битвы.' });
  }

  pvpMatches.delete(battleId);
}

// --- Socket event initializer ---
export function initBattleSocket(io, socket) {
  // Player joins the queue
  socket.on('pvp:join_queue', () => {
    if (!socket.userId || !socket.username) {
      socket.emit('pvp:error', { message: 'Вы не в лобби. Присоединитесь к игре.' });
      return;
    }

    // Check if already in queue
    if (pvpQueue.some(p => p.socketId === socket.id)) {
      socket.emit('pvp:error', { message: 'Вы уже в очереди.' });
      return;
    }

    // Check if already in a battle
    for (const [bid, m] of pvpMatches) {
      if ((m.p1.socketId === socket.id || m.p2.socketId === socket.id) && m.state !== 'finished') {
        socket.emit('pvp:error', { message: 'Вы уже в битве.' });
        return;
      }
    }

    pvpQueue.push({
      socketId: socket.id,
      userId: socket.userId,
      username: socket.username,
    });

    socket.emit('pvp:queue_status', { position: pvpQueue.length, inQueue: true });
    tryMatchPlayers(io);
  });

  // Player leaves the queue
  socket.on('pvp:leave_queue', () => {
    const idx = pvpQueue.findIndex(p => p.socketId === socket.id);
    if (idx !== -1) {
      pvpQueue.splice(idx, 1);
    }
    socket.emit('pvp:queue_status', { position: -1, inQueue: false });
  });

  // Player submits a move
  socket.on('pvp:submit_move', (data) => {
    if (!data || !data.battleId) {
      socket.emit('pvp:error', { message: 'Неверные данные хода.' });
      return;
    }

    const match = pvpMatches.get(data.battleId);
    if (!match) {
      socket.emit('pvp:error', { message: 'Битва не найдена.' });
      return;
    }
    if (match.state !== 'active' && match.state !== 'matched') {
      socket.emit('pvp:error', { message: 'Битва не активна.' });
      return;
    }

    // Determine which player this is
    let playerKey;
    if (match.p1.socketId === socket.id) {
      playerKey = 'p1';
    } else if (match.p2.socketId === socket.id) {
      playerKey = 'p2';
    } else {
      socket.emit('pvp:error', { message: 'Вы не участник этой битвы.' });
      return;
    }

    // Validate move data
    if (!data.move || typeof data.move !== 'object') {
      socket.emit('pvp:error', { message: 'Неверные данные атаки.' });
      return;
    }
    if (!data.pokemon || typeof data.pokemon !== 'object') {
      socket.emit('pvp:error', { message: 'Неверные данные покемона.' });
      return;
    }

    // If state is 'matched', transition to active on first move submission
    if (match.state === 'matched') {
      match.state = 'active';
    }

    match.turnMoves[playerKey] = { move: data.move, pokemon: data.pokemon };

    // If both submitted, resolve the turn
    if (match.turnMoves.p1 && match.turnMoves.p2) {
      resolveTurn(io, data.battleId);
    }
  });

  // Player surrenders
  socket.on('pvp:surrender', (data) => {
    const battleId = data?.battleId;
    const match = pvpMatches.get(battleId);
    if (!match) return;

    let loser, winner;
    if (match.p1.socketId === socket.id) {
      loser = 'p1';
      winner = 'p2';
    } else if (match.p2.socketId === socket.id) {
      loser = 'p2';
      winner = 'p1';
    } else {
      return;
    }

    endBattle(io, battleId, winner, { reason: 'surrender', by: loser });
  });
}

// --- Cleanup on disconnect ---
export function removePlayerFromQueue(socketId) {
  const idx = pvpQueue.findIndex(p => p.socketId === socketId);
  if (idx !== -1) {
    pvpQueue.splice(idx, 1);
  }
}

export function handlePvpDisconnect(io, socketId) {
  removePlayerFromQueue(socketId);

  // End any active battles for this player
  for (const [battleId, match] of pvpMatches.entries()) {
    if (match.state === 'finished') continue;

    let opponent, winner;
    if (match.p1.socketId === socketId) {
      opponent = match.p2.socketId;
      winner = 'p2';
    } else if (match.p2.socketId === socketId) {
      opponent = match.p1.socketId;
      winner = 'p1';
    } else {
      continue;
    }

    endBattle(io, battleId, winner, { reason: 'disconnect' });
  }
}

// --- REST endpoints ---

// GET /api/battle/rating
router.get('/rating', asyncHandler(async (req, res) => {
    const db = getDB();
    const row = await db.get('SELECT rating, wins, losses FROM pvp_ratings WHERE user_id = ?', req.userId);
    res.json(row || { rating: 1000, wins: 0, losses: 0 });
}));

// GET /api/battle/stats
router.get('/stats', asyncHandler(async (req, res) => {
    const db = getDB();
    const row = await db.get('SELECT rating, wins, losses FROM pvp_ratings WHERE user_id = ?', req.userId);
    const total = (row?.wins || 0) + (row?.losses || 0);
    res.json({
      rating: row?.rating || 1000,
      wins: row?.wins || 0,
      losses: row?.losses || 0,
      total,
    });
}));

export default router;
