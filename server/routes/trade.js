import { getDB } from '../db.js';

// In-memory active trades
const activeTrades = new Map(); // tradeId -> { p1: {...}, p2: {...}, p1Offers: [], p2Offers: [], p1Confirm: false, p2Confirm: false }

// Helper to find a user's socket from userSockets map
// userSockets is passed in from socket.js as a Map<userId, Set<socketId>>
function findUserSocket(io, userSockets, userId) {
  const sockets = userSockets.get(String(userId));
  if (sockets && sockets.size > 0) {
    return [...sockets][0]; // Return first socket
  }
  return null;
}

export function initTradeSocket(io, socket, userSockets) {
  // trade:request - send trade request to specific user
  socket.on('trade:request', (data) => {
    if (!data || !data.targetUserId) {
      socket.emit('trade:error', { message: 'Не указан целевой пользователь.' });
      return;
    }

    const targetSocketId = findUserSocket(io, userSockets, data.targetUserId);
    if (!targetSocketId) {
      socket.emit('trade:error', { message: 'Пользователь не в сети.' });
      return;
    }

    if (targetSocketId === socket.id) {
      socket.emit('trade:error', { message: 'Нельзя торговать с собой.' });
      return;
    }

    io.to(targetSocketId).emit('trade:request_received', {
      fromId: socket.userId || data.fromUserId,
      fromUsername: socket.username || data.fromUsername || 'Тренер',
      fromSocketId: socket.id,
    });
  });

  // trade:accept - accept trade request
  socket.on('trade:accept', (data) => {
    if (!data || !data.fromSocketId) return;

    const p1 = data.fromSocketId;
    const p2 = socket.id;
    const tradeId = `trade-${p1}-${p2}-${Date.now()}`;

    activeTrades.set(tradeId, {
      p1,
      p2,
      p1Offers: [],
      p2Offers: [],
      p1Confirm: false,
      p2Confirm: false,
    });

    const p1Info = data.fromUsername || 'Тренер';
    const p2Info = socket.username || 'Тренер';

    io.to(p1).emit('trade:started', {
      tradeId,
      partnerUsername: p2Info,
      partnerSocketId: p2,
      youAreP1: true,
    });

    io.to(p2).emit('trade:started', {
      tradeId,
      partnerUsername: p1Info,
      partnerSocketId: p1,
      youAreP1: false,
    });
  });

  // trade:decline - decline trade request
  socket.on('trade:decline', (data) => {
    if (!data || !data.fromSocketId) return;
    io.to(data.fromSocketId).emit('trade:declined', {
      message: 'Тренер отклонил предложение обмена.',
    });
  });

  // trade:update - update offered items/pokemon
  socket.on('trade:update', (data) => {
    if (!data || !data.tradeId || !data.offers) return;

    const trade = activeTrades.get(data.tradeId);
    if (!trade) {
      socket.emit('trade:error', { message: 'Обмен не найден.' });
      return;
    }

    const isP1 = trade.p1 === socket.id;
    const partner = isP1 ? trade.p2 : trade.p1;

    if (isP1) {
      trade.p1Offers = Array.isArray(data.offers) ? data.offers : [];
    } else {
      trade.p2Offers = Array.isArray(data.offers) ? data.offers : [];
    }

    // Reset confirmation on both sides when offers change
    trade.p1Confirm = false;
    trade.p2Confirm = false;

    io.to(partner).emit('trade:partner_offers', data.offers);
    io.to(trade.p1).emit('trade:confirm_status', { p1: false, p2: false });
    io.to(trade.p2).emit('trade:confirm_status', { p1: false, p2: false });
  });

  // trade:confirm - lock in your side
  socket.on('trade:confirm', (data) => {
    if (!data || !data.tradeId) return;

    const trade = activeTrades.get(data.tradeId);
    if (!trade) {
      socket.emit('trade:error', { message: 'Обмен не найден.' });
      return;
    }

    if (trade.p1 === socket.id) trade.p1Confirm = true;
    if (trade.p2 === socket.id) trade.p2Confirm = true;

    io.to(trade.p1).emit('trade:confirm_status', { p1: trade.p1Confirm, p2: trade.p2Confirm });
    io.to(trade.p2).emit('trade:confirm_status', { p1: trade.p1Confirm, p2: trade.p2Confirm });

    // If both confirmed, execute the trade
    if (trade.p1Confirm && trade.p2Confirm) {
      io.to(trade.p1).emit('trade:complete', { offers: trade.p2Offers });
      io.to(trade.p2).emit('trade:complete', { offers: trade.p1Offers });

      // Log trade in action_log
      try {
        const db = getDB();
        // We don't have userIds directly in the trade object, need to look up
        // But trade offers contain the data the client needs
        db.run(
          'INSERT INTO action_log (user_id, action, details) VALUES (?, ?, ?)',
          0, 'trade_complete', JSON.stringify({ tradeId: data.tradeId })
        ).catch(() => {});
      } catch (e) { /* log best-effort */ }

      activeTrades.delete(data.tradeId);
    }
  });

  // trade:cancel - cancel trade
  socket.on('trade:cancel', (data) => {
    const tradeId = data?.tradeId;
    const trade = activeTrades.get(tradeId);
    if (!trade) return;

    io.to(trade.p1).emit('trade:cancelled', { message: 'Обмен отменён.' });
    io.to(trade.p2).emit('trade:cancelled', { message: 'Обмен отменён.' });
    activeTrades.delete(tradeId);
  });

  // Clean up on disconnect
  // (We also handle this in socket.js disconnect handler, but this is a safety net)
  const originalDisconnect = socket._events?.disconnect;
  socket.on('disconnect', () => {
    for (const [tradeId, trade] of activeTrades.entries()) {
      if (trade.p1 === socket.id || trade.p2 === socket.id) {
        const partner = trade.p1 === socket.id ? trade.p2 : trade.p1;
        io.to(partner).emit('trade:cancelled', { message: 'Партнёр отключился.' });
        activeTrades.delete(tradeId);
      }
    }
  });
}

// Export for cleanup from socket.js
export function cleanupTradeOnDisconnect(io, socketId) {
  for (const [tradeId, trade] of activeTrades.entries()) {
    if (trade.p1 === socketId || trade.p2 === socketId) {
      const partner = trade.p1 === socketId ? trade.p2 : trade.p1;
      io.to(partner).emit('trade:cancelled', { message: 'Партнёр отключился.' });
      activeTrades.delete(tradeId);
    }
  }
}
